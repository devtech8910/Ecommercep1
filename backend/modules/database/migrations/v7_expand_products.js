import pool from '../../../db.js';

export default async function expand() {
  try {
    console.log('Altering products table to add extended attributes...');
    
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand VARCHAR(100) DEFAULT 'Fashion Company',
      ADD COLUMN IF NOT EXISTS title_description TEXT NULL,
      ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sizes VARCHAR(100) DEFAULT 'S, M, L',
      ADD COLUMN IF NOT EXISTS replacement_allowed BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS replacement_days INTEGER DEFAULT 7,
      ADD COLUMN IF NOT EXISTS cod_available BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS fabric VARCHAR(100) DEFAULT 'Cotton',
      ADD COLUMN IF NOT EXISTS pattern VARCHAR(100) DEFAULT 'Solid',
      ADD COLUMN IF NOT EXISTS fit VARCHAR(100) DEFAULT 'Regular Fit',
      ADD COLUMN IF NOT EXISTS suitable_for VARCHAR(100) DEFAULT 'Casual';
    `);

    console.log('✅ Alterations completed successfully. Dummy seeded product updates are disabled.');
  } catch (err) {
    console.error('Alterations failed:', err);
    throw err;
  }
}
