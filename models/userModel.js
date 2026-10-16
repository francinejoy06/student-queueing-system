const pool = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function getAll() {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

async function create({ fullName, email, passwordHash, role }) {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, role]
  );
  return result.insertId;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findByEmail, getAll, create, remove };
