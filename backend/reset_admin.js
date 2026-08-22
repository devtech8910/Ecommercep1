import bcrypt from 'bcryptjs';
import pool from './db.js';

async function reset() {
  try {
    const password = 'password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log(`Generated hash for 'password': ${hash}`);
    
    // Upsert admin@fashioncompany.com
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
      VALUES ('Fashion Company', 'Administrator', 'admin@fashioncompany.com', '9999999991', 'admin', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin', phone = '9999999991';
    `, [hash]);
    console.log('✅ Upserted admin@fashioncompany.com with password "password"');

    // Upsert fashioncompanyadmin@gmail.com
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
      VALUES ('Fashion Company', 'Admin', 'fashioncompanyadmin@gmail.com', '9999999992', 'admin', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin', phone = '9999999992';
    `, [hash]);
    console.log('✅ Upserted fashioncompanyadmin@gmail.com with password "password"');

    // Upsert admin@devtech.com
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
      VALUES ('System', 'Administrator', 'admin@devtech.com', '9999999993', 'admin', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin', phone = '9999999993';
    `, [hash]);
    console.log('✅ Upserted admin@devtech.com with password "password"');

    // Upsert customer@fashioncompany.com
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
      VALUES ('Demo', 'Customer', 'customer@fashioncompany.com', '9999999994', 'customer', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'customer', phone = '9999999994';
    `, [hash]);
    console.log('✅ Upserted customer@fashioncompany.com with password "password"');

    const res = await pool.query('SELECT id, first_name, last_name, email, role FROM users ORDER BY id;');
    console.log('Current DB Users:', res.rows);

  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    pool.end();
  }
}

reset();
