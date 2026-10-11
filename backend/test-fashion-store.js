import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function check() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'fashion_store',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to database fashion_store!');
    const res = await client.query('SELECT current_database();');
    console.log('Connected to database:', res.rows[0].current_database);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

check();
