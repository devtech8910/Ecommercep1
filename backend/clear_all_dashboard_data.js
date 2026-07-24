import pool, { query } from './db.js';

async function resetAllData() {
  try {
    console.log('🧹 Starting full database & dashboard data reset...');

    // Get list of all user tables in public schema
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log('📋 Existing database tables:', tableNames);

    // List of tables to clear completely (cascade truncate / delete)
    const tablesToClear = [
      'order_items',
      'order_details',
      'orders',
      'stock_movements',
      'inventory',
      'products',
      'user_addresses',
      'addresses',
      'cart_items',
      'wishlist_items',
      'coupons',
      'notifications'
    ];

    for (const tbl of tablesToClear) {
      if (tableNames.includes(tbl)) {
        try {
          await query(`TRUNCATE TABLE ${tbl} RESTART IDENTITY CASCADE;`);
          console.log(`✅ Truncated & reset sequence for table: '${tbl}'`);
        } catch (e) {
          try {
            await query(`DELETE FROM ${tbl};`);
            console.log(`✅ Deleted rows from table: '${tbl}'`);
          } catch (e2) {
            console.warn(`⚠️ Could not clear table '${tbl}':`, e2.message);
          }
        }
      }
    }

    // Keep admin account in users table if users exists
    if (tableNames.includes('users')) {
      try {
        await query(`DELETE FROM users WHERE role != 'admin' AND email != 'admin@devtech.com';`);
        console.log(`✅ Cleaned non-admin customer records from 'users' table.`);
      } catch (e) {
        console.warn(`⚠️ Could not clean users table:`, e.message);
      }
    }

    console.log('\n🎉 ALL DASHBOARD & STORE DATA HAS BEEN RESET FRESHLY!');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  } finally {
    await pool.end();
  }
}

resetAllData();
