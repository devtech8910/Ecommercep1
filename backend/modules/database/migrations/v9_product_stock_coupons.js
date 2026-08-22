import pool from '../../../db.js';

export default async function migrate() {
  try {
    console.log('Altering products table to add size_stock and coupon_applicable columns...');
    
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS size_stock VARCHAR(255) DEFAULT 'S:10, M:10, L:10',
      ADD COLUMN IF NOT EXISTS coupon_applicable BOOLEAN DEFAULT TRUE;
    `);

    console.log('✅ Alterations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}
