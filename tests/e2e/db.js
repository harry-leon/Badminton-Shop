/**
 * PostgreSQL Database Helper for E2E Tests
 * Supports direct queries across all 6 isolated databases
 */

const path = require('path');
const { execSync } = require('child_process');

let pgClientClass = null;
try {
  pgClientClass = require(path.resolve(__dirname, '../../frontend/node_modules/pg')).Client;
} catch (_) {
  try {
    pgClientClass = require('pg').Client;
  } catch (_) {}
}

const DB_PORT = process.env.DB_PORT || 5432;
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

async function query(database, sql, params = []) {
  if (pgClientClass) {
    const client = new pgClientClass({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database,
    });
    await client.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows;
    } finally {
      await client.end();
    }
  }

  // Fallback to psql command line
  const psqlPath = process.env.PSQL_PATH || 'C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe';
  const cleanSql = sql.replace(/"/g, '\"');
  const cmd = `"${psqlPath}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${database} -t -A -c "${cleanSql}"`;
  const output = execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
  return output ? output.split('\n') : [];
}

module.exports = {
  query,
};
