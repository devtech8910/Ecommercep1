import pool from '../../../db.js';

export default async function migrate() {
  try {
    console.log('Altering orders table to add status, items, and address fields...');
    
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Delivered',
      ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL;
    `);

    console.log('✅ Alterations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}
