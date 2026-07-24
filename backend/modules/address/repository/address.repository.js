import { query } from '../../../db.js';

export async function createAddress(userId, data) {
  const {
    fullName, mobile, alternateMobile, houseNumber, building, street, area, landmark,
    city, state, country, pincode, latitude, longitude,
    addressType = 'home', isDefault = false
  } = data;

  const sql = `
    INSERT INTO user_addresses (
      user_id, full_name, mobile, alternate_mobile, house_number, building, street, area, landmark,
      city, state, country, pincode, latitude, longitude, address_type, is_default
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *;
  `;

  const values = [
    userId, fullName, mobile, alternateMobile, houseNumber, building, street, area, landmark,
    city, state, country, pincode, latitude, longitude, addressType, isDefault
  ];

  const result = await query(sql, values);
  return mapDbRowToAddress(result.rows[0]);
}

export async function updateAddress(id, userId, data) {
  const {
    fullName, mobile, alternateMobile, houseNumber, building, street, area, landmark,
    city, state, country, pincode, latitude, longitude,
    addressType, isDefault
  } = data;

  const sql = `
    UPDATE user_addresses
    SET
      full_name = COALESCE($3, full_name),
      mobile = COALESCE($4, mobile),
      alternate_mobile = COALESCE($5, alternate_mobile),
      house_number = COALESCE($6, house_number),
      building = COALESCE($7, building),
      street = COALESCE($8, street),
      area = COALESCE($9, area),
      landmark = COALESCE($10, landmark),
      city = COALESCE($11, city),
      state = COALESCE($12, state),
      country = COALESCE($13, country),
      pincode = COALESCE($14, pincode),
      latitude = COALESCE($15, latitude),
      longitude = COALESCE($16, longitude),
      address_type = COALESCE($17, address_type),
      is_default = COALESCE($18, is_default),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;

  const values = [
    id, userId, fullName, mobile, alternateMobile, houseNumber, building, street, area, landmark,
    city, state, country, pincode, latitude, longitude, addressType, isDefault
  ];

  const result = await query(sql, values);
  if (result.rows.length === 0) return null;
  return mapDbRowToAddress(result.rows[0]);
}

export async function deleteAddress(id, userId) {
  const sql = `
    UPDATE user_addresses
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `;
  const result = await query(sql, [id, userId]);
  return result.rows.length > 0;
}

export async function listAddresses(userId) {
  const sql = `
    SELECT * FROM user_addresses
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY is_default DESC, created_at DESC;
  `;
  const result = await query(sql, [userId]);
  return result.rows.map(mapDbRowToAddress);
}

export async function clearDefaultAddresses(userId) {
  const sql = `
    UPDATE user_addresses
    SET is_default = FALSE
    WHERE user_id = $1;
  `;
  await query(sql, [userId]);
}

export async function setDefaultAddress(id, userId) {
  await clearDefaultAddresses(userId);
  const sql = `
    UPDATE user_addresses
    SET is_default = TRUE
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const result = await query(sql, [id, userId]);
  if (result.rows.length === 0) return null;
  return mapDbRowToAddress(result.rows[0]);
}

function mapDbRowToAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    mobile: row.mobile,
    alternateMobile: row.alternate_mobile,
    houseNumber: row.house_number,
    building: row.building,
    street: row.street,
    area: row.area,
    landmark: row.landmark,
    city: row.city,
    state: row.state,
    country: row.country,
    pincode: row.pincode,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    addressType: row.address_type,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
