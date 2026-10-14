const { Client } = require('../frontend/node_modules/pg');

async function fix() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'warranty_db',
  });

  await client.connect();
  const res = await client.query('SELECT id, status, assigned_technician FROM warranty_claims;');
  console.log('Current warranty claims:', res.rows);

  // If CLM-20261013-0001 status is not INSPECTING, restore it to INSPECTING
  await client.query("UPDATE warranty_claims SET status = 'INSPECTING', assigned_technician = 'ktv_tran_minh' WHERE id = 'CLM-20261013-0001';");
  console.log('Restored CLM-20261013-0001 to INSPECTING / ktv_tran_minh');

  await client.end();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
