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
      return res.status(403).send(
        'Access denied: You do not have permission to view this page.'
      );
    }

    next();
  };
}

// Compatibility helpers for existing routes
function requireUser(req, res, next) {
  return requireLogin(req, res, next);
}

function requireStaff(req, res, next) {
  return requireRole('staff', 'admin')(req, res, next);
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

function requireStudent(req, res, next) {
  return requireRole('student')(req, res, next);
}

module.exports = {
  requireLogin,
  requireRole,
  requireUser,
  requireStaff,
  requireAdmin,
  requireStudent
};