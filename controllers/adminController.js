const bcrypt = require('bcryptjs');
const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel');

const ROLES = ['student', 'staff', 'admin'];

// ---------- OFFICES ----------
function officeNameError(name) {
  if (!name) return 'Office name is required.';
  if (name.length > 100) return 'Office name must be 100 characters or fewer.';
  return null;
}

async function showOffices(req, res) {
  try {
    const offices = await adminModel.getOffices();
    res.render('admin/offices', {
      offices,
      currentUser: req.session.user,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load offices.');
  }
}

async function addOffice(req, res) {
  const name = String(req.body.name || '').trim();
  const problem = officeNameError(name);
  if (problem) return res.redirect(`/admin/offices?error=${encodeURIComponent(problem)}`);

  try {
    if (await adminModel.officeNameExists(name)) {
      return res.redirect('/admin/offices?error=Office+name+already+exists');
    }
    await adminModel.createOffice(name);
    res.redirect('/admin/offices?message=Office+added');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect('/admin/offices?error=Office+name+already+exists');
    }
    console.error(err);
    res.status(500).send('Could not add office.');
  }
}

async function editOffice(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).send('Invalid office.');
  const name = String(req.body.name || '').trim();
  const problem = officeNameError(name);
  if (problem) return res.redirect(`/admin/offices?error=${encodeURIComponent(problem)}`);

  try {
    if (await adminModel.officeNameExists(name, id)) {
      return res.redirect('/admin/offices?error=Office+name+already+exists');
    }
    await adminModel.renameOffice(id, name);
    res.redirect('/admin/offices?message=Office+updated');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect('/admin/offices?error=Office+name+already+exists');
    }
    console.error(err);
    res.status(500).send('Could not update office.');
  }
}

// Offices are deactivated, not deleted, so old tickets stay valid
async function toggleOffice(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).send('Invalid office.');
  const active = req.body.active === '1';

  try {
    await adminModel.setOfficeActive(id, active);
    res.redirect(`/admin/offices?message=${active ? 'Office+activated' : 'Office+deactivated'}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update office.');
  }
}

// ---------- USERS ----------
async function showUsers(req, res) {
  try {
    const users = await userModel.getAll();
    res.render('admin/users', {
      users,
      currentUser: req.session.user,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load users.');
  }
}

async function addUser(req, res) {
  const fullName = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = String(req.body.role || '');
  const message = !fullName || fullName.length > 100
    ? 'Name must be between 1 and 100 characters.'
    : email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address (100 characters or fewer).'
      : password.length < 8 || Buffer.byteLength(password, 'utf8') > 72
        ? 'Password must be 8 or more characters and no more than 72 bytes.'
        : !['staff', 'admin'].includes(role)
          ? 'Choose a valid role.'
          : null;
  if (message) {
    return res.redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }

  try {
    await userModel.create({
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
    res.redirect('/admin/users?message=User+created');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect('/admin/users?error=That+email+is+already+in+use');
    }
    console.error(err);
    res.status(500).send('Could not create user.');
  }
}

async function editUser(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).send('Invalid user.');
  const fullName = String(req.body.full_name || '').trim();
  const role = String(req.body.role || '');
  const isSelf = id === Number(req.session.user.id);

  let problem = null;
  if (!fullName || fullName.length > 100) problem = 'Name must be between 1 and 100 characters.';
  else if (!ROLES.includes(role)) problem = 'Choose a valid role.';
  else if (isSelf && role !== req.session.user.role) problem = 'You cannot change your own role.';
  if (problem) return res.redirect(`/admin/users?error=${encodeURIComponent(problem)}`);

  try {
    await adminModel.updateUser(id, fullName, role);
    if (isSelf) req.session.user.full_name = fullName;
    res.redirect('/admin/users?message=User+updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update user.');
  }
}


async function deleteUser(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).send('Invalid user.');

  if (id === Number(req.session.user.id)) {
    return res.redirect('/admin/users?error=You+cannot+delete+your+own+account');
  }

  try {
    const deleted = await userModel.remove(id);
    return res.redirect(`/admin/users?message=${deleted ? 'User+deleted' : 'User+not+found'}`);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.redirect(
        '/admin/users?error=' +
         encodeURIComponent('This user has queue tickets and cannot be deleted.')
      );
    }

    console.error(err);
    return res.redirect(
      '/admin/users?error=' +
        encodeURIComponent('Could not delete the user.')
    );
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
  deleteUser,
};