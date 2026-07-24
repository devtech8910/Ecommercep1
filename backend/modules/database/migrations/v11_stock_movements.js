import pool from '../../../db.js';

async function migrate() {
  try {
    console.log('Starting migration for stock_movements...');

    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(pid) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL,
          size VARCHAR(20),
          quantity_changed INTEGER NOT NULL,
          quantity_before INTEGER DEFAULT 0,
          quantity_after INTEGER DEFAULT 0,
          reason TEXT,
          changed_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ stock_movements table created.');

    // 2. Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_action ON stock_movements(action);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
    `);
    console.log('✅ Indexes created.');

    // 3. Seed initial movement records
    const res = await pool.query('SELECT pid, size_stock FROM products WHERE size_stock IS NOT NULL');
    const products = res.rows;
    let seeded = 0;

    for (const product of products) {
      if (product.size_stock) {
        // e.g., 'S:10, M:10, L:10'
        const parts = product.size_stock.split(',');
        for (const part of parts) {
          const [size, qtyStr] = part.split(':').map(s => s.trim());
          const qty = parseInt(qtyStr, 10);
          if (size && !isNaN(qty)) {
            await pool.query(`
              INSERT INTO stock_movements 
              (product_id, action, size, quantity_changed, quantity_before, quantity_after, reason) 
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              product.pid,
              'product_added',
              size,
              qty,
              0,
              qty,
              'Initial seed from products size_stock'
            ]);
            seeded++;
          }
        }
      }
    }
    console.log(`✅ Seeded ${seeded} initial movement records.`);

    console.log('🏁 Migration v11 completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
