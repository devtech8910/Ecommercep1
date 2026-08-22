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

export async function ensureProfileEditLimitTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS profile_edit_limits (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      edit_year INTEGER NOT NULL,
      edit_count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, edit_year)
    );
  `);
}

export async function getProfileEditUsage(userId, editYear) {
  await ensureProfileEditLimitTable();
  const result = await query(
    'SELECT edit_count FROM profile_edit_limits WHERE user_id = $1 AND edit_year = $2;',
    [userId, editYear]
  );
  return result.rows[0] ? parseInt(result.rows[0].edit_count, 10) || 0 : 0;
}

export async function recordProfileEdit(userId, editYear) {
  await ensureProfileEditLimitTable();
  const result = await query(`
    INSERT INTO profile_edit_limits (user_id, edit_year, edit_count, updated_at)
    VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, edit_year)
    DO UPDATE SET edit_count = profile_edit_limits.edit_count + 1, updated_at = CURRENT_TIMESTAMP
    RETURNING edit_count;
  `, [userId, editYear]);
  return parseInt(result.rows[0].edit_count, 10) || 0;
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

export async function updateUser(id, userData) {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    passwordHash
  } = userData;

  let sql;
  let values;

  if (passwordHash) {
    sql = `
      UPDATE users
      SET first_name = $1, last_name = $2, email = $3, phone = $4, date_of_birth = $5, password_hash = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;
    values = [firstName, lastName, email, phone, dob || null, passwordHash, id];
  } else {
    sql = `
      UPDATE users
      SET first_name = $1, last_name = $2, email = $3, phone = $4, date_of_birth = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    values = [firstName, lastName, email, phone, dob || null, id];
  }

  const result = await query(sql, values);
  return result.rows[0];
}

export async function saveResetOtp(email, otp, expiresAt) {
  await query('DELETE FROM password_resets WHERE email = $1;', [email]);
  
  const sql = `
    INSERT INTO password_resets (email, otp, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await query(sql, [email, otp, expiresAt]);
  return result.rows[0];
}

export async function findResetRecord(email, otp) {
  const sql = `SELECT * FROM password_resets WHERE email = $1 AND otp = $2;`;
  const result = await query(sql, [email, otp]);
  return result.rows[0] || null;
}

export async function deleteResetRecord(email) {
  const sql = `DELETE FROM password_resets WHERE email = $1;`;
  await query(sql, [email]);
}

export async function updateUserPassword(userId, passwordHash) {
  const sql = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;
  const result = await query(sql, [passwordHash, userId]);
  return result.rows[0];
}

export async function scheduleUserDeletion(userId) {
  const sql = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query(sql, [userId]);
  return result.rows[0];
}

export async function cancelUserDeletion(userId) {
  const sql = `
    UPDATE users
    SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query(sql, [userId]);
  return result.rows[0];
}

export async function permanentlyDeleteUser(userId) {
  const sql = `DELETE FROM users WHERE id = $1;`;
  await query(sql, [userId]);
}
