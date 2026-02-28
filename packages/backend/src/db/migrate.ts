import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import pino from 'pino';

const { Pool } = pg;
const logger = pino({ name: 'migrator' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://clickwin:clickwin_dev_password@localhost:5432/clickwin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Ensure _migrations table exists
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

    // Read migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.info('No migration files found');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info(`Skipping already applied migration: ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Applying migration: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        logger.info(`Migration applied successfully: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err, file }, `Migration failed: ${file}`);
        throw err;
      }
    }

    if (appliedCount === 0) {
      logger.info('All migrations already applied');
    } else {
      logger.info(`Applied ${appliedCount} migration(s)`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run()
  .then(() => {
    logger.info('Migration runner completed');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, 'Migration runner failed');
    process.exit(1);
  });
