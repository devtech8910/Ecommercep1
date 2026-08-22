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

    console.log('Updating seeded products with custom specifications...');

    // Update Midnight Blue Tuxedo
    await pool.query(`
      UPDATE products SET
        brand = 'Fashion Company Premium',
        title_description = 'Slim fit designer cut with premium wool blend finish. Satin peak lapels.',
        mrp = 35712.00,
        sizes = 'S, M, L',
        replacement_allowed = TRUE,
        replacement_days = 7,
        cod_available = TRUE,
        fabric = 'Wool Blend',
        pattern = 'Solid',
        fit = 'Slim Fit',
        suitable_for = 'Formal Wear'
      WHERE title = 'Midnight Blue Tuxedo';
    `);

    // Update Oxford Classic Shirt
    await pool.query(`
      UPDATE products SET
        brand = 'Fashion Company Casuals',
        title_description = 'Pure organic cotton build. Classic button-down collar.',
        mrp = 4999.00,
        sizes = 'S, M, L',
        replacement_allowed = TRUE,
        replacement_days = 7,
        cod_available = TRUE,
        fabric = '100% Cotton',
        pattern = 'Solid Plain',
        fit = 'Regular Fit',
        suitable_for = 'Semi-Formal'
      WHERE title = 'Oxford Classic Shirt';
    `);

    console.log('✅ Alterations and updates completed successfully.');
  } catch (err) {
    console.error('Alterations failed:', err);
    throw err;
  }
}
