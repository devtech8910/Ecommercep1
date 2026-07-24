import pool, { query } from './db.js';

async function clearProducts() {
  try {
    console.log('🗑️ Removing all products from database...');
    try { await query('DELETE FROM order_items;'); } catch (e) {}
    try { await query('DELETE FROM stock_movements;'); } catch (e) {}
    
    const res = await query('DELETE FROM products;');
    console.log(`✅ All product rows successfully removed from database! Total deleted rows: ${res.rowCount}`);
  } catch (err) {
    console.error('❌ Error clearing products:', err.message);
  } finally {
    await pool.end();
  }
}

clearProducts();
