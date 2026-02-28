import pg from 'pg';
import pino from 'pino';

const { Pool } = pg;
const logger = pino({ name: 'postgres' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://clickwin:clickwin_dev_password@localhost:5432/clickwin';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('connect', () => {
  logger.debug('PG: new client connected');
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'PG pool error');
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ text: text.substring(0, 80), duration, rows: result.rowCount }, 'PG query');
    return result;
  } catch (err) {
    logger.error({ err, text: text.substring(0, 80) }, 'PG query error');
    throw err;
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('PG pool closed');
}
