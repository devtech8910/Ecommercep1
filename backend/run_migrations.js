import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'modules', 'database', 'migrations');

const migrations = [
  'v1_core_schema.sql',
  'v3_seed_data.sql',
  'v4_location_hierarchy.sql',
  'v5_seed_locations.sql',
  'v6_products_orders.js',
  'v7_expand_products.js',
  'v8_order_details.js',
  'v9_product_stock_coupons.js',
  'v10_final_schemas.js',
  'v11_stock_movements.js'
];

async function ensureMigrationHistory() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function hasRun(filename) {
  const result = await pool.query('SELECT 1 FROM migration_history WHERE filename = $1;', [filename]);
  return result.rows.length > 0;
}

async function markRun(filename) {
  await pool.query(
    'INSERT INTO migration_history (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING;',
    [filename]
  );
}

async function runSqlMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

async function runJsMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const module = await import(pathToFileURL(filePath).href + `?t=${Date.now()}`);
  if (typeof module.default !== 'function') {
    throw new Error(`${filename} must export a default migration function.`);
  }
  await module.default();
}

async function runMigration(filename) {
  if (await hasRun(filename)) {
    console.log(`Skipping ${filename} (already recorded).`);
    return;
  }

  console.log(`Executing ${filename}...`);
  if (filename.endsWith('.sql')) {
    await runSqlMigration(filename);
  } else if (filename.endsWith('.js')) {
    await runJsMigration(filename);
  } else {
    throw new Error(`Unsupported migration type: ${filename}`);
  }

  await markRun(filename);
  console.log(`Success: ${filename}`);
}

async function run() {
  try {
    await ensureMigrationHistory();
    for (const filename of migrations) {
      await runMigration(filename);
    }
    console.log('All required migrations ran successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
