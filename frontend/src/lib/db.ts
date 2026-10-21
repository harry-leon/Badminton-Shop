import { Pool, PoolClient, PoolConfig } from 'pg';

function getCloudflareStream(ssl: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pgCf = require('pg-cloudflare');
    const SocketClass = pgCf.CloudflareSocket || pgCf.default || pgCf;
    if (typeof SocketClass === 'function') {
      return new SocketClass(ssl);
    }
  } catch (err) {
    console.error('[pg-cloudflare] Failed to initialize socket stream:', err);
  }
  return undefined;
}

function getEnvVal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext({ async: false });
    if (ctx?.env?.[key]) return ctx.env[key];
  } catch {}
  return undefined;
}

function getDbConfig() {
  const host = getEnvVal('PG_HOST');
  const isLocal = !host || host === '127.0.0.1' || host === 'localhost';
  let port = parseInt(getEnvVal('PG_PORT') || '5432', 10);
  if (!isLocal && port === 6543) {
    // Port 6543 là PgBouncer Transaction Mode không hỗ trợ prepared statements của node-postgres
    // Port 5432 là Session Mode của Supabase Pooler, hỗ trợ đầy đủ prepared statements
    port = 5432;
  }
  return {
    host: host || '127.0.0.1',
    port,
    user: getEnvVal('PG_USER') || 'postgres',
    password: getEnvVal('PG_PASSWORD') || '',
    ssl: isLocal ? false : { rejectUnauthorized: false },
    isLocal,
  };
}

function isCloudflareRuntime(): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') ||
    typeof (globalThis as any).WebSocketPair !== 'undefined'
  );
}

const pools: Record<string, Pool> = {};

export function getDbPool(databaseName: string): Pool {
  const config = getDbConfig();
  // Trên Supabase cloud, tất cả bảng nằm chung trong database PG_DATABASE (ví dụ: 'postgres')
  const targetDb = config.isLocal ? databaseName : (getEnvVal('PG_DATABASE') || 'postgres');
  const poolKey = `${config.host}:${config.port}:${config.user}:${targetDb}`;

  if (!pools[poolKey]) {
    const isCf = isCloudflareRuntime();
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: targetDb,
      ssl: config.ssl,
      max: isCf ? 1 : 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: isCf ? 0 : 30000,
    };

    pools[poolKey] = new Pool(poolConfig);
  }
  return pools[poolKey];
}

export async function queryDb<T = any>(databaseName: string, text: string, params: any[] = []): Promise<T[]> {
  const config = getDbConfig();
  if (config.isLocal && process.env.NODE_ENV === 'production') {
    // Không cố kết nối tới 127.0.0.1 trên Cloudflare Workers Edge nếu chưa có PG_HOST từ xa
    return [];
  }
  if (!config.isLocal && !config.password) {
    console.error(`[DB CONFIG ERROR] PG_PASSWORD is not set. Cannot connect to ${config.host}:${config.port}`);
    return [];
  }

  // Trên Cloudflare Workers Edge: dùng Client độc lập per-request và đóng ngay lập tức
  // để tránh lỗi stale socket khi isolate bị freeze giữa các request
  if (isCloudflareRuntime()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Client } = require('pg');
    const targetDb = config.isLocal ? databaseName : (getEnvVal('PG_DATABASE') || 'postgres');
    const clientConfig: any = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: targetDb,
      ssl: config.ssl,
      connectionTimeoutMillis: 3000,
      stream: getCloudflareStream(config.ssl),
    };
    const client = new Client(clientConfig);
    try {
      await client.connect();
      const res = await client.query(text, params);
      return res.rows as T[];
    } catch (err) {
      console.error(`[DB ERROR] Failed to query ${databaseName}:`, err);
      return [];
    } finally {
      await client.end().catch(() => {});
    }
  }

  // Môi trường Node.js local: dùng Connection Pool bình thường
  try {
    const pool = getDbPool(databaseName);
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`[DB ERROR] Failed to query ${databaseName}:`, err);
    return [];
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
