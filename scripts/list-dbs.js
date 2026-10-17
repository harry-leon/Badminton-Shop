const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: 'postgres',
};

async function listDbs() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    console.log("Databases in PostgreSQL:", res.rows.map(r => r.datname));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

listDbs();
