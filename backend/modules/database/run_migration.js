import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Client } = pg;

async function executeMigration() {
  const client = new Client({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'fashion_store',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  });

  try {
    console.log(`Connecting to database: "${client.database}" on "${client.host}:${client.port}"...`);
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read migration files
    const migrationsDir = path.join(process.cwd(), 'modules', 'database', 'migrations');
    const v1Path = path.join(migrationsDir, 'v1_core_schema.sql');
    const v2Path = path.join(migrationsDir, 'v2_indexing_triggers.sql');
    const v3Path = path.join(migrationsDir, 'v3_seed_data.sql');

    const v1Sql = fs.readFileSync(v1Path, 'utf8');
    const v2Sql = fs.readFileSync(v2Path, 'utf8');
    const v3Sql = fs.readFileSync(v3Path, 'utf8');

    console.log('Starting migration transaction block...');
    await client.query('BEGIN');

    console.log('Executing V1: Core Schema Table Definitions...');
    await client.query(v1Sql);

    console.log('Executing V2: Indexes & Automated Update Triggers...');
    await client.query(v2Sql);

    console.log('Executing V3: Seeding default roles, products, categories, admin users...');
    await client.query(v3Sql);

    console.log('Committing migration transaction...');
    await client.query('COMMIT');
    console.log('✅ Migration committed successfully!');

    // Verification step
    console.log('\n--- VERIFICATION OF CREATED TABLES ---');
    const verifySql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const result = await client.query(verifySql);
    const tables = result.rows.map(row => row.table_name);
    
    console.log(`Total Tables Created: ${tables.length}`);
    console.log('------------------------------------');
    
    // Print in rows of 3 for readability
    for (let i = 0; i < tables.length; i += 3) {
      console.log(tables.slice(i, i + 3).map(name => name.padEnd(28)).join(' '));
    }
    console.log('------------------------------------');

  } catch (error) {
    console.error('❌ Migration failed!');
    console.error('Rolling back transaction...');
    try {
      await client.query('ROLLBACK');
    } catch (rbError) {
      console.error('Rollback query failed:', rbError.message);
    }
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();
