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
