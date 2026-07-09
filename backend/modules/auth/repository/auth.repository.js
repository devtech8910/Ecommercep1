import { query } from '../../../db.js';

export async function findUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1;`;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

export async function findUserByPhone(phone) {
  const sql = `SELECT * FROM users WHERE phone = $1;`;
  const result = await query(sql, [phone]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const sql = `SELECT * FROM users WHERE id = $1;`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function createUser(userData) {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    passwordHash
  } = userData;

  const sql = `
    INSERT INTO users (first_name, last_name, email, phone, date_of_birth, password_hash)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [firstName, lastName, email, phone, dob || null, passwordHash];
  const result = await query(sql, values);
  return result.rows[0];
}
