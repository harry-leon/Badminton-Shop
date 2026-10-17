const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
};

async function check() {
  const c = new Client(dbConfig);
  await c.connect();
  const tables = ['banners', 'categories', 'products'];
  for (const t of tables) {
    const res = await c.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`=== Table: ${t} ===`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await c.end();
}

check().catch(console.error);
