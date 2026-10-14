const db = require('../config/db');

// Find one user by email (returns undefined if not found)
exports.findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Create a user and return the new id
exports.create = async (fullName, email, passwordHash, role = 'student') => {
  const [result] = await db.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, role]
  );
  return result.insertId;
};
