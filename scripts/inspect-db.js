const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
};

async function inspect() {
  const dbs = [
    'identity_db',
    'catalog_db',
    'inventory_db',
    'order_db',
    'secondhand_db',
    'warranty_db',
  ];
  for (const db of dbs) {
    const client = new Client({ ...dbConfig, database: db });
    try {
      await client.connect();
      const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      console.log(`=== DB: ${db} ===`);
      console.log(res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
      console.error(`Error querying ${db}:`, err.message);
    } finally {
      await client.end();
    }
  }
}

inspect();
