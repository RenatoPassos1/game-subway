// ============================================================
// Auto-Migration Runner
// Executes pending SQL migrations on server startup.
// Uses a _migrations table to track which files have run.
// All migration files already contain BEGIN/COMMIT.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import { pool } from './client';

const logger = pino({ name: 'migrator' });

/**
 * Run all pending migrations from the migrations directory.
 * Called during server startup. Does NOT exit the process.
 * Each .sql file is expected to handle its own transaction (BEGIN/COMMIT).
 */
export async function runMigrations(): Promise<void> {
  // Resolve migrations directory
  // In Docker production: /app/packages/backend/migrations/
  // __dirname in dist: .../dist/db/ → ../../migrations = .../migrations/
  const possibleDirs = [
    path.resolve(__dirname, '../../migrations'),
    path.resolve(process.cwd(), 'packages/backend/migrations'),
    path.resolve(process.cwd(), 'migrations'),
  ];

  let migrationsDir = '';
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      migrationsDir = dir;
      break;
    }
  }

  if (!migrationsDir) {
    logger.warn('No migrations directory found, skipping auto-migration');
    return;
  }

  logger.info({ dir: migrationsDir }, 'Auto-migration: checking for pending migrations...');

  const client = await pool.connect();

  try {
    // Ensure _migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already applied migrations
    const { rows: applied } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations ORDER BY id ASC',
    );
    const appliedSet = new Set(applied.map((r) => r.name));

    // Read migration files sorted lexicographically
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.info('No migration files found');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue; // Already applied
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Applying migration: ${file}`);

      try {
        // Execute the SQL file as-is (files already contain BEGIN/COMMIT)
        await client.query(sql);

        // Record migration as applied
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [file],
        );

        appliedCount++;
        logger.info(`Migration applied: ${file}`);
      } catch (err) {
        logger.error({ err, file }, `Migration FAILED: ${file}`);
        // Stop processing - later migrations may depend on this one
        logger.warn('Stopping migration runner. Remaining migrations will retry on next startup.');
        return;
      }
    }

    if (appliedCount === 0) {
      logger.info(`All ${files.length} migrations already applied`);
    } else {
      logger.info(`Applied ${appliedCount} new migration(s) out of ${files.length} total`);
    }
  } finally {
    client.release();
  }
}

// Allow running as standalone script: npx tsx src/db/migrate.ts
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      logger.info('Migration runner completed');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Migration runner failed');
      process.exit(1);
    });
}
