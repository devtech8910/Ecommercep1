import pool from '../../../db.js';

export default async function setupTables() {
  try {
    console.log('Creating products and orders tables...');
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
          pid SERIAL PRIMARY KEY,
          title VARCHAR(150) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image_url VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          total_amount DECIMAL(10,2) NOT NULL,
          placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Products and orders tables are ready. Dummy catalog and analytics seed data are disabled.');

    console.log('✅ Schema setup complete.');
  } catch (err) {
    console.error('Error setting up tables:', err);
    throw err;
  }
}
