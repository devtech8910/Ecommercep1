import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Client } = pg;

async function queryTable(tableName) {
  if (!tableName) {
    console.error('❌ Please specify a table name. Example: node query.js products');
    process.exit(1);
  }

  const client = new Client({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'fashion_store',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  });

  try {
    await client.connect();

    // Verify table exists
    const checkSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      );
    `;
    const checkRes = await client.query(checkSql, [tableName]);
    if (!checkRes.rows[0].exists) {
      console.error(`❌ Table "${tableName}" does not exist in the database.`);
      process.exit(1);
    }

    // Query rows
    const querySql = `SELECT * FROM "${tableName}" LIMIT 50;`;
    const res = await client.query(querySql);

    console.log(`\n=== Rows in "${tableName}" (Showing up to 50) ===`);
    if (res.rows.length === 0) {
      console.log('No data rows found in this table.');
    } else {
      console.table(res.rows);
    }
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    await client.end();
  }
}

queryTable(process.argv[2]);
