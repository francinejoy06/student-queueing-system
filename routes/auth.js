const express = require('express');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where each role lands after login (change if your team uses other URLs)
const HOME_BY_ROLE = {
  student: '/',
  staff: '/staff/queue',
  admin: '/admin/offices'
};

// ---------- REGISTER ----------
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { errors: [], old: {} });
});

router.post('/register', async (req, res, next) => {
  try {
    const fullName = (req.body.full_name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const confirm = req.body.confirm_password || '';

    const errors = [];
    if (!fullName) errors.push('Full name is required.');
    else if (fullName.length > 100) errors.push('Full name must be 100 characters or less.');

    if (!email) errors.push('Email is required.');
    else if (!EMAIL_RE.test(email)) errors.push('Please enter a valid email address.');
    else if (email.length > 100) errors.push('Email must be 100 characters or less.');

    if (password.length < 8) errors.push('Password must be at least 8 characters.');
    else if (password.length > 72) errors.push('Password must be 72 characters or less.');
    if (password !== confirm) errors.push('Passwords do not match.');

    if (errors.length === 0 && (await userModel.findByEmail(email))) {
      errors.push('That email is already registered.');
    }

    if (errors.length > 0) {
      return res.status(400).render('register', { errors, old: { full_name: fullName, email } });
    }

    const hash = await bcrypt.hash(password, 10);
        // Role is ALWAYS 'student' here. Never take the role from the form.
    try {
      await userModel.create(fullName, email, hash, 'student');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).render('register', {
          errors: ['That email is already registered.'],
          old: { full_name: fullName, email }
        });
      }

      return next(err);
    }

    return res.redirect('/login?registered=1');
  } catch (err) {
    next(err);
  }
});

// ---------- LOGIN ----------
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect(HOME_BY_ROLE[req.session.user.role] || '/dashboard');
  res.render('login', { error: null, registered: req.query.registered === '1' });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).render('login', { error: 'Email and password are required.', registered: false });
    }

    const user = await userModel.findByEmail(email);
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;

    // Same message for unknown email and wrong password
    if (!ok) {
      return res.status(401).render('login', { error: 'Invalid email or password.', registered: false });
    }

    // New session id on login (prevents session fixation)
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, name: user.full_name, role: user.role };
      req.session.save((err2) => {
        if (err2) return next(err2);
        res.redirect(HOME_BY_ROLE[user.role] || '/dashboard');
      });
    });
  } catch (err) {
    next(err);
  }
});

// ---------- LOGOUT ----------
router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
