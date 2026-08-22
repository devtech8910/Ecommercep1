import pool from '../../../db.js';

export default async function migrate() {
  try {
    console.log('Starting final schema adjustments for categories, orders, and coupons...');

    // 1. Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        display_settings TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Categories table created.');

    // Seed categories
    await pool.query(`
      INSERT INTO categories (name, slug, display_settings) VALUES
      ('Men''s Wear', 'mens', '{\"theme\": \"dark\", \"banner\": \"/images/banners/mens.jpg\"}'),
      ('Women''s Wear', 'womens', '{\"theme\": \"light\", \"banner\": \"/images/banners/womens.jpg\"}'),
      ('Kids'' Wear', 'kids', '{\"theme\": \"playful\", \"banner\": \"/images/banners/kids.jpg\"}')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Categories seeded.');

    // 2. Alter orders table to add payment_status
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
    `);
    console.log('✅ Orders table altered.');

    // 3. Create coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'flat'
        discount_value DECIMAL(10,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        applicable_products TEXT DEFAULT '[]', -- JSON stringified array of product IDs
        applicable_categories TEXT DEFAULT '[]', -- JSON stringified array of category IDs
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Coupons table created successfully.');

    // Seed a default coupon
    await pool.query(`
      INSERT INTO coupons (code, discount_type, discount_value, start_date, end_date, applicable_products, applicable_categories)
      VALUES ('FASHIONCOMPANY30', 'percentage', 30.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', '[]', '[]')
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ Default coupon seeded.');

    console.log('🏁 All final schema migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}
