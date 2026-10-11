import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Client } = pg;

async function rollbackMigration() {
  const client = new Client({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'fashion_store',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  });

  try {
    console.log(`Connecting to database: "${client.database}" to perform rollback...`);
    await client.connect();

    console.log('Fetching all tables in public schema...');
    const fetchSql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;
    const result = await client.query(fetchSql);
    const tables = result.rows.map(row => row.table_name);

    if (tables.length === 0) {
      console.log('No tables found in the database. Nothing to roll back.');
      return;
    }

    console.log(`Found ${tables.length} tables. Dropping all tables recursively...`);
    
    // Construct drop query
    const dropSql = `DROP TABLE IF EXISTS ${tables.map(name => `"${name}"`).join(', ')} CASCADE;`;
    
    await client.query('BEGIN');
    await client.query(dropSql);
    await client.query('COMMIT');
    
    console.log('✅ Rollback completed. All tables have been dropped.');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

rollbackMigration();
