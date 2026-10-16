const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

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

async function deleteUser(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).send('Invalid user.');
  if (id === Number(req.session.user.id)) {
    return res.redirect('/admin/users?error=You+cannot+delete+your+own+account');
  }

  try {
    const deleted = await userModel.remove(id);
    res.redirect(`/admin/users?message=${deleted ? 'User+deleted' : 'User+not+found'}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not delete the user. A user with queue records cannot be deleted.');
  }
}

module.exports = { showUsers, addUser, deleteUser };
