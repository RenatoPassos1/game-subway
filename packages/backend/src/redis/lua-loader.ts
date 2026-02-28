/**
 * lua-loader.ts
 * Utility to load, cache, and execute Redis Lua scripts via EVALSHA.
 *
 * Uses SCRIPT LOAD to register scripts once, then EVALSHA for all
 * subsequent calls (avoids re-sending full script text on every invocation).
 * Falls back to EVAL if EVALSHA returns NOSCRIPT (server restart / flush).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { Redis } from 'ioredis';

// ============================================================
// Types
// ============================================================

export interface LuaScript {
  /** Script name (identifier) */
  name: string;
  /** Raw Lua source code */
  source: string;
  /** SHA1 hash registered in Redis */
  sha: string;
  /** Number of KEYS expected */
  numberOfKeys: number;
}

export interface LuaScriptDefinition {
  /** Filename of the .lua script (relative to scripts directory) */
  filename: string;
  /** Number of KEYS this script expects */
  numberOfKeys: number;
}

// ============================================================
// Script Definitions
// ============================================================

/**
 * Registry of all Lua scripts used by the platform.
 * Add new scripts here when created.
 */
export const SCRIPT_DEFINITIONS: Record<string, LuaScriptDefinition> = {
  processClick: {
    filename: 'process-click.lua',
    numberOfKeys: 4,
  },
  creditReferralBonus: {
    filename: 'credit-referral-bonus.lua',
    numberOfKeys: 2,
  },
} as const;

// ============================================================
// Lua Loader Class
// ============================================================

export class LuaLoader {
  private redis: Redis;
  private scripts: Map<string, LuaScript> = new Map();
  private scriptsDir: string;
  private loaded = false;

  constructor(redis: Redis, scriptsDir?: string) {
    this.redis = redis;
    this.scriptsDir = scriptsDir || join(__dirname, 'scripts');
  }

  /**
   * Load all registered Lua scripts from disk and register with Redis.
   * Call this once during application startup.
   */
  async loadAll(): Promise<void> {
    const entries = Object.entries(SCRIPT_DEFINITIONS);

    for (const [name, def] of entries) {
      await this.loadScript(name, def);
    }

    this.loaded = true;
    console.log(`[LuaLoader] Loaded ${entries.length} scripts`);
  }

  /**
   * Load a single script from disk and register via SCRIPT LOAD.
   */
  private async loadScript(
    name: string,
    def: LuaScriptDefinition,
  ): Promise<LuaScript> {
    const filePath = join(this.scriptsDir, def.filename);
    const source = readFileSync(filePath, 'utf-8');

    // Compute SHA1 locally for verification
    const localSha = createHash('sha1').update(source).digest('hex');

    // Register in Redis (returns SHA1 hash)
    const redisSha = await this.redis.script('LOAD', source) as string;

    // Sanity check: local and Redis SHA should match
    if (localSha !== redisSha) {
      console.warn(
        `[LuaLoader] SHA mismatch for ${name}: local=${localSha} redis=${redisSha}`,
      );
    }

    const script: LuaScript = {
      name,
      source,
      sha: redisSha,
      numberOfKeys: def.numberOfKeys,
    };

    this.scripts.set(name, script);
    console.log(`[LuaLoader] Registered script: ${name} (SHA: ${redisSha.slice(0, 8)}...)`);

    return script;
  }

  /**
   * Execute a loaded Lua script by name using EVALSHA.
   * Falls back to EVAL if NOSCRIPT error occurs (auto-reloads).
   *
   * @param name - Script name from SCRIPT_DEFINITIONS
   * @param keys - Redis KEYS array
   * @param args - Redis ARGV array
   * @returns Parsed JSON result from the script
   */
  async exec<T = unknown>(
    name: string,
    keys: string[],
    args: (string | number)[],
  ): Promise<T> {
    const script = this.scripts.get(name);

    if (!script) {
      throw new Error(
        `[LuaLoader] Script "${name}" not found. Did you call loadAll()?`,
      );
    }

    // Validate key count
    if (keys.length !== script.numberOfKeys) {
      throw new Error(
        `[LuaLoader] Script "${name}" expects ${script.numberOfKeys} keys, got ${keys.length}`,
      );
    }

    const stringArgs = args.map(String);

    try {
      // Primary path: EVALSHA (script already loaded in Redis)
      const result = await this.redis.evalsha(
        script.sha,
        script.numberOfKeys,
        ...keys,
        ...stringArgs,
      );

      return this.parseResult<T>(result);
    } catch (err: unknown) {
      // Handle NOSCRIPT: script was flushed from Redis (restart, SCRIPT FLUSH)
      if (err instanceof Error && err.message.includes('NOSCRIPT')) {
        console.warn(
          `[LuaLoader] NOSCRIPT for "${name}", reloading...`,
        );

        // Reload the script and retry
        const def = SCRIPT_DEFINITIONS[name];
        if (def) {
          await this.loadScript(name, def);
          const reloaded = this.scripts.get(name)!;

          const result = await this.redis.evalsha(
            reloaded.sha,
            reloaded.numberOfKeys,
            ...keys,
            ...stringArgs,
          );

          return this.parseResult<T>(result);
        }
      }

      throw err;
    }
  }

  /**
   * Parse the raw Redis result. Lua scripts return JSON strings.
   */
  private parseResult<T>(result: unknown): T {
    if (result === null || result === undefined) {
      return null as T;
    }

    if (typeof result === 'string') {
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    }

    // Numbers and other types pass through
    return result as T;
  }

  /**
   * Get a loaded script by name (for inspection / debugging).
   */
  getScript(name: string): LuaScript | undefined {
    return this.scripts.get(name);
  }

  /**
   * Check if all scripts have been loaded.
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Reload all scripts (useful after Redis restart).
   */
  async reloadAll(): Promise<void> {
    this.scripts.clear();
    this.loaded = false;
    await this.loadAll();
  }
}

// ============================================================
// Factory function for convenience
// ============================================================

/**
 * Create and initialize a LuaLoader instance.
 * Loads all scripts immediately.
 *
 * @example
 * ```ts
 * import { createLuaLoader } from './redis/lua-loader';
 * import Redis from 'ioredis';
 *
 * const redis = new Redis(process.env.REDIS_URL);
 * const lua = await createLuaLoader(redis);
 *
 * // Execute a script
 * const result = await lua.exec('processClick', keys, args);
 * ```
 */
export async function createLuaLoader(
  redis: Redis,
  scriptsDir?: string,
): Promise<LuaLoader> {
  const loader = new LuaLoader(redis, scriptsDir);
  await loader.loadAll();
  return loader;
}
