const adminModel = require('../models/adminModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['student', 'staff', 'admin'];

function go(res, path, msg) {
  res.redirect(`${path}?message=${encodeURIComponent(msg)}`);
}

// ---------- OFFICES ----------
async function showOffices(req, res) {
  try {
    const offices = await adminModel.getOffices();
    res.render('admin/offices', { offices, message: req.query.message || null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load offices.');
  }
}

async function addOffice(req, res) {
  const name = (req.body.name || '').trim();
  if (!name) return go(res, '/admin/offices', 'Office name is required');
  if (name.length > 100) return go(res, '/admin/offices', 'Office name is too long (max 100)');

  try {
    await adminModel.createOffice(name);
    go(res, '/admin/offices', 'Office added');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return go(res, '/admin/offices', 'Office name already exists');
    console.error(err);
    res.status(500).send('Could not add office.');
  }
}

async function editOffice(req, res) {
  const id = parseInt(req.params.id, 10);
  const name = (req.body.name || '').trim();
  if (Number.isNaN(id)) return res.status(400).send('Invalid office.');
  if (!name) return go(res, '/admin/offices', 'Office name is required');
  if (name.length > 100) return go(res, '/admin/offices', 'Office name is too long (max 100)');

  try {
    await adminModel.renameOffice(id, name);
    go(res, '/admin/offices', 'Office updated');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return go(res, '/admin/offices', 'Office name already exists');
    console.error(err);
    res.status(500).send('Could not update office.');
  }
}

async function toggleOffice(req, res) {
  const id = parseInt(req.params.id, 10);
  const active = req.body.active === '1';
  if (Number.isNaN(id)) return res.status(400).send('Invalid office.');

  try {
    await adminModel.setOfficeActive(id, active);
    go(res, '/admin/offices', active ? 'Office activated' : 'Office deactivated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update office.');
  }
}

// ---------- USERS ----------
async function showUsers(req, res) {
  try {
    const users = await adminModel.getUsers();
    res.render('admin/users', { users, roles: ROLES, message: req.query.message || null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load users.');
  }
}

async function addUser(req, res) {
  const fullName = (req.body.full_name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const role = req.body.role;

  if (!fullName || !email || !password) return go(res, '/admin/users', 'All fields are required');
  if (fullName.length > 100) return go(res, '/admin/users', 'Name is too long (max 100)');
  if (!EMAIL_RE.test(email)) return go(res, '/admin/users', 'Invalid email format');
  if (password.length < 8) return go(res, '/admin/users', 'Password must be at least 8 characters');
  if (!ROLES.includes(role)) return go(res, '/admin/users', 'Invalid role');

  try {
    await adminModel.createUser(fullName, email, password, role);
    go(res, '/admin/users', 'User added');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return go(res, '/admin/users', 'Email already registered');
    console.error(err);
    res.status(500).send('Could not add user.');
  }
}

async function editUser(req, res) {
  const id = parseInt(req.params.id, 10);
  const fullName = (req.body.full_name || '').trim();
  const role = req.body.role;

  if (Number.isNaN(id)) return res.status(400).send('Invalid user.');
  if (!fullName) return go(res, '/admin/users', 'Name is required');
  if (fullName.length > 100) return go(res, '/admin/users', 'Name is too long (max 100)');
  if (!ROLES.includes(role)) return go(res, '/admin/users', 'Invalid role');

  try {
    await adminModel.updateUser(id, fullName, role);
    go(res, '/admin/users', 'User updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update user.');
  }
}

async function removeUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).send('Invalid user.');

  try {
    await adminModel.deleteUser(id);
    go(res, '/admin/users', 'User deleted');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return go(res, '/admin/users', 'Cannot delete a user who already has tickets');
    }
    console.error(err);
    res.status(500).send('Could not delete user.');
  }
}

module.exports = {
  showOffices,
  addOffice,
  editOffice,
  toggleOffice,
  showUsers,
  addUser,
  editUser,
  removeUser,
};