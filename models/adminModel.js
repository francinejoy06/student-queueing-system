const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ---------- OFFICES ----------
async function getOffices() {
  const [rows] = await pool.query(
    'SELECT id, name, is_active FROM offices ORDER BY name'
  );
  return rows;
}

async function createOffice(name) {
  await pool.query('INSERT INTO offices (name) VALUES (?)', [name]);
}

async function renameOffice(id, name) {
  await pool.query('UPDATE offices SET name = ? WHERE id = ?', [name, id]);
}

// Soft delete: hindi binubura ang office para hindi masira ang mga lumang tickets
async function setOfficeActive(id, active) {
  await pool.query('UPDATE offices SET is_active = ? WHERE id = ?', [active, id]);
}

// ---------- USERS ----------
async function getUsers() {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, created_at FROM users ORDER BY id'
  );
  return rows;
}

async function createUser(fullName, email, password, role) {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, hash, role]
  );
}

async function updateUser(id, fullName, role) {
  await pool.query('UPDATE users SET full_name = ?, role = ? WHERE id = ?', [
    fullName,
    role,
    id,
  ]);
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = {
  getOffices,
  createOffice,
  renameOffice,
  setOfficeActive,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};