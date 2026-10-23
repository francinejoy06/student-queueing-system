
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ---------- OFFICES ----------
async function getOffices() {
  const [rows] = await pool.query(
    'SELECT id, name, is_active FROM offices ORDER BY name'
  );
  return rows;
}

async function getActiveOffices() {
  const [rows] = await pool.query(
    'SELECT id, name FROM offices WHERE is_active = 1 ORDER BY name'
  );
  return rows;
}

// True if another office already uses this name (case-insensitive)
async function officeNameExists(name, excludeId = 0) {
  const [rows] = await pool.query(
    'SELECT id FROM offices WHERE LOWER(name) = LOWER(?) AND id <> ?',
    [name, excludeId]
  );
  return rows.length > 0;
}

async function createOffice(name) {
  await pool.query('INSERT INTO offices (name) VALUES (?)', [name]);
}

async function renameOffice(id, name) {
  await pool.query('UPDATE offices SET name = ? WHERE id = ?', [name, id]);
}

// Soft delete: offices are not deleted so old tickets stay valid
async function setOfficeActive(id, active) {
  await pool.query('UPDATE offices SET is_active = ? WHERE id = ?', [
    active,
    id,
  ]);
}

// ---------- USERS ----------
async function getUsers() {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.role,
       u.office_id,
       o.name AS office_name,
       u.created_at
     FROM users u
     LEFT JOIN offices o ON o.id = u.office_id
     ORDER BY u.id`
  );
  return rows;
}

async function createUser(fullName, email, password, role, officeId = null) {
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users
       (full_name, email, password_hash, role, office_id)
     VALUES (?, ?, ?, ?, ?)`,
    [fullName, email, hash, role, officeId]
  );
}

async function updateUser(id, fullName, role, officeId = null) {
  await pool.query(
    `UPDATE users
     SET full_name = ?, role = ?, office_id = ?
     WHERE id = ?`,
    [fullName, role, officeId, id]
  );
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = {
  getOffices,
  getActiveOffices,
  officeNameExists,
  createOffice,
  renameOffice,
  setOfficeActive,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
