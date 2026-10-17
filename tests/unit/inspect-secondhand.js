const path = require('path');
const { Pool } = require(path.join(__dirname, '../frontend/node_modules/pg'));

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'secondhand_db'
});

async function main() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const units = await pool.query('SELECT * FROM secondhand_units ORDER BY id');
    console.log('Units count:', units.rows.length);
    console.log('Units:', units.rows.map(u => ({ id: u.id, model: u.model_name, grade: u.grade, status: u.status })));

    const cases = await pool.query('SELECT id, case_status, unit_id, seller_name, model_name FROM buyback_cases ORDER BY id');
    console.log('Buyback cases count:', cases.rows.length);
    console.log('Buyback cases:', cases.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
