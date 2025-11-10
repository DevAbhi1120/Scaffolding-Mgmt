const bcrypt = require('bcryptjs');
const db = require('../config/db');


exports.getAllUsers = async (limit = 10, offset = 0) => {
  const [rows] = await db.query(
    `SELECT * FROM users WHERE status = 1 LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  return rows;
};

exports.countAllUsers = async () => {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM users WHERE status = 1');
  return rows[0].total;
};



exports.getUserByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows.length > 0 ? rows[0] : null;
};

exports.authenticateUserByEmail = async (email, password) => {
  const user = await exports.getUserByEmail(email); // fixed 'this' context issue
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
};


exports.createUser = async (name, email, password, role = 'user', phone = null) => {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, role, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, password, role, phone]
  );
  return result.insertId;
};


exports.getUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND status = 1', [id]);
  return rows[0];
};

exports.updateUserById = async (id, data) => {
  const { name, email, password, role, phone, profile_image } = data;
  await db.query(
    `UPDATE users
     SET name = ?, email = ?, password = ?, role = ?, phone = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name,  email, password, role, phone, profile_image, id]
  );
};



// Get user by ID (including deleted if needed)
exports.findUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

// Soft delete user by setting status = 0
exports.softDeleteUserById = async (id) => {
  const [result] = await db.query(
    'UPDATE users SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
  return result;
};

// Restore soft-deleted user
exports.restoreUserById = async (id) => {
  const [result] = await db.query(
    'UPDATE users SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
  return result;
};


exports.searchUsers = async (query) => {
  const searchTerm = `%${query}%`;
  const [rows] = await db.query(
    `SELECT * FROM users 
     WHERE status = 1 AND (
       name LIKE ? OR 
       email LIKE ?
     )`,
    [searchTerm, searchTerm, searchTerm]
  );
  return rows;
};