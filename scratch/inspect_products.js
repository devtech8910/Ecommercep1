import pool from '../backend/db.js';

async function inspect() {
  try {
    const columnsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== Products Table Columns ===');
    console.table(columnsRes.rows);

    const rowsRes = await pool.query(`
      SELECT pid, title, price, category, image_url, sizes
      FROM products
      LIMIT 10;
    `);
    console.log('\n=== First 10 rows in products table ===');
    console.table(rowsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

inspect();
