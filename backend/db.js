import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'fashion_store',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Purna@2007',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
});

export const query = (text, params) => pool.query(text, params);
export default pool;
