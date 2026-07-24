import bcrypt from 'bcryptjs';
import pool from './db.js';

async function reset() {
  try {
    const password = 'password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log(`Generated hash for 'password': ${hash}`);
    
    // Update admin
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2;', [hash, 'admin@devtech.com']);
    console.log('✅ Updated admin@devtech.com password to "password"');

    // Update customer
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2;', [hash, 'customer@devtech.com']);
    console.log('✅ Updated customer@devtech.com password to "password"');

  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    pool.end();
  }
}

reset();
