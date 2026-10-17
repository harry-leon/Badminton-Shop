import { Pool, PoolClient } from 'pg';

// Connection pools for isolated PostgreSQL databases
const isLocal = !process.env.PG_HOST || process.env.PG_HOST === '127.0.0.1' || process.env.PG_HOST === 'localhost';

const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  ssl: isLocal ? false : { rejectUnauthorized: false },
};

const pools: Record<string, Pool> = {};

export function getDbPool(databaseName: string): Pool {
  const targetDb = process.env.PG_DATABASE || databaseName;
  if (!pools[targetDb]) {
    pools[targetDb] = new Pool({
      ...dbConfig,
      database: targetDb,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pools[targetDb];
}

export async function queryDb<T = any>(databaseName: string, text: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool(databaseName);
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  databaseName: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getDbPool(databaseName);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
