import pool from './db.js';

async function checkCount() {
  const res = await pool.query('SELECT COUNT(*) FROM user_addresses');
  console.log('📊 Count in user_addresses database table:', res.rows[0].count);
  await pool.end();
  process.exit(0);
}

checkCount();
