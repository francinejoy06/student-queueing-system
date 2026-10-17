
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function homeForUser(user) {
  if (user.role === 'admin') return '/admin/users';
  if (user.role === 'student') return '/student/dashboard';
  return '/staff/dashboard';
}

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect(homeForUser(req.session.user));
  }

  return res.render('auth/login', {
    error: null,
    email: '',
    success: req.query.registered
      ? 'Your student account is ready. Sign in to continue.'
      : null,
  });
}

function showSignup(req, res) {
  if (req.session.user) {
    return res.redirect(homeForUser(req.session.user));
  }

  return res.render('auth/signup', {
    error: null,
    fullName: '',
    email: '',
  });
}

async function signup(req, res) {
  const fullName = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirm_password || '');

  let error = null;

  if (fullName.length < 2 || fullName.length > 100) {
    error = 'Enter your full name (2 to 100 characters).';
  } else if (!EMAIL_REGEX.test(email) || email.length > 100) {
    error = 'Enter a valid email address.';
  } else if (
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    error =
      'Your password must be at least 8 characters and no more than 72 bytes.';
  } else if (password !== confirmPassword) {
    error = 'The passwords do not match.';
  }

  if (error) {
    return res.status(400).render('auth/signup', {
      error,
      fullName,
      email,
    });
  }

  try {
    await userModel.create({
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'student',
    });

    return res.redirect('/login?registered=1');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('auth/signup', {
        error: 'An account with that email already exists. Sign in instead.',
        fullName,
        email,
      });
    }

    console.error(err);
    return res.status(500).send('Could not create your account.');
  }
}

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (
    !email ||
    email.length > 100 ||
    !EMAIL_REGEX.test(email) ||
    !password
  ) {
    return res.status(400).render('auth/login', {
      error: 'Enter a valid email address and your password.',
      email,
      success: null,
    });
  }

  try {
    const user = await userModel.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).render('auth/login', {
        error: 'Invalid email or password.',
        email,
        success: null,
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Could not start your session.');
      }

      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      };

      return res.redirect(homeForUser(user));
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not sign in.');
  }
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);

    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  showSignup,
  signup,
  login,
  logout,
};
