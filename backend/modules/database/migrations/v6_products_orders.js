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

    console.value = 'Seeding products and orders...';

    // Seed products
    const productsCheck = await pool.query('SELECT count(*) FROM products;');
    if (parseInt(productsCheck.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO products (title, price, image_url, category, description) VALUES
        ('Midnight Blue Tuxedo', 24999.00, 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80&fit=crop', 'mens', 'Premium wool blend dinner suit with satin lapels.'),
        ('Oxford Classic Shirt', 3499.00, 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80&fit=crop', 'mens', 'Button-down collar formal casual shirt.'),
        ('Premium Leather Jacket', 12999.00, 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80&fit=crop', 'mens', '100% genuine lambskin leather motor jacket.'),
        ('Chronograph Watch', 8999.00, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&fit=crop', 'mens', 'Water resistant stainless steel wristwatch.'),
        ('Silk Floral Dress', 6999.00, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80&fit=crop', 'womens', 'Lightweight pure silk dress with elegant summer print.'),
        ('Denim Skirt Classic', 2999.00, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80&fit=crop', 'womens', 'High-waisted cotton denim pencil skirt.'),
        ('Kids Hooded Jacket', 1999.00, 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80&fit=crop', 'kids', 'Cozy fleece lined weather-proof coat.'),
        ('Cotton Play Suit', 1499.00, 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80&fit=crop', 'kids', 'Breathable organic cotton romper for toddlers.');
      `);
      console.log('✅ Products seeded successfully.');
    }

    // Seed periodic orders for analytics
    const ordersCheck = await pool.query('SELECT count(*) FROM orders;');
    if (parseInt(ordersCheck.rows[0].count, 10) === 0) {
      console.log('Generating dummy order history for analytics...');
      
      const now = new Date();
      const insertQueries = [];

      // Day wise (last 7 days)
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        // Add 2-5 orders per day
        const numOrders = Math.floor(2 + Math.random() * 4);
        for (let j = 0; j < numOrders; j++) {
          const amt = Math.round(500 + Math.random() * 15000);
          insertQueries.push(pool.query('INSERT INTO orders (user_id, total_amount, placed_at) VALUES ($1, $2, $3);', [2, amt, d]));
        }
      }

      // Week wise (last 4 weeks)
      for (let i = 1; i <= 4; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - (i * 7));
        const numOrders = Math.floor(10 + Math.random() * 15);
        for (let j = 0; j < numOrders; j++) {
          const amt = Math.round(1000 + Math.random() * 20000);
          insertQueries.push(pool.query('INSERT INTO orders (user_id, total_amount, placed_at) VALUES ($1, $2, $3);', [2, amt, d]));
        }
      }

      // Month wise (last 12 months)
      for (let i = 1; i <= 12; i++) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const numOrders = Math.floor(25 + Math.random() * 30);
        for (let j = 0; j < numOrders; j++) {
          const amt = Math.round(2000 + Math.random() * 25000);
          insertQueries.push(pool.query('INSERT INTO orders (user_id, total_amount, placed_at) VALUES ($1, $2, $3);', [2, amt, d]));
        }
      }

      // Annual wise (last 3 years)
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now);
        d.setFullYear(now.getFullYear() - i);
        const numOrders = Math.floor(100 + Math.random() * 150);
        for (let j = 0; j < numOrders; j++) {
          const amt = Math.round(5000 + Math.random() * 30000);
          insertQueries.push(pool.query('INSERT INTO orders (user_id, total_amount, placed_at) VALUES ($1, $2, $3);', [2, amt, d]));
        }
      }

      await Promise.all(insertQueries);
      console.log('✅ Dummy orders seeded successfully.');
    }

    console.log('✅ Schema setup complete.');
  } catch (err) {
    console.error('Error setting up tables:', err);
    throw err;
  }
}
