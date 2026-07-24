const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/Purna/OneDrive/Desktop/Ecom/backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'fashion_store',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
});

async function clearAddresses() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name);
    console.log('Database tables:', tables);

    for (const t of tables) {
      if (t.includes('address') || t.includes('location')) {
        const delRes = await pool.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE;`);
        console.log(`✅ Cleared all saved records from table: "${t}"`);
      }
    }
  } catch (err) {
    console.error('Error clearing tables:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

clearAddresses();
