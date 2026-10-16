
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send('Access denied: You do not have permission to view this page.');
    }

    next();
  };
}

module.exports = { requireLogin, requireRole };
function requireUser(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireStaff(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (!['staff', 'admin'].includes(req.session.user.role)) {
    return res.status(403).send('You do not have access to the staff area.');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).send('You do not have access to the admin area.');
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'student') {
    return res.status(403).send('This page is for student accounts.');
  }
  next();
}

module.exports = { requireUser, requireStaff, requireAdmin, requireStudent };
