import pool from './db.js';

async function clearLocationTables() {
  console.log('🔍 Checking database tables for saved addresses...');
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name);
    console.log('📋 Database Tables:', tables);

    for (const t of tables) {
      if (t.includes('address') || t.includes('location')) {
        const del = await pool.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE;`);
        console.log(`✅ Cleared table "${t}"`);
      }
    }
  } catch (err) {
    console.error('Error clearing address tables:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

clearLocationTables();
