import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(filename) {
    const filePath = path.join(__dirname, 'modules', 'database', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${filename}...`);
    await pool.query(sql);
    console.log(`Success: ${filename}`);
}

async function run() {
    try {
        await runMigration('v1_core_schema.sql');
        await runMigration('v3_seed_data.sql');
        await runMigration('v4_location_hierarchy.sql');
        await runMigration('v5_seed_locations.sql');
        console.log('✅ All migrations ran successfully!');
    } catch(err) {
        console.error('❌ Migration failed:', err);
    } finally {
        pool.end();
    }
}
run();
