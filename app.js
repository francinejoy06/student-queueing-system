const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

// Routes
app.get('/', (req, res) => {
  const user = req.session.user;
  res.redirect(
    !user ? '/login'
      : user.role === 'admin' ? '/admin/users'
        : user.role === 'student' ? '/student/dashboard'
          : '/staff/dashboard'
  );
});

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);
app.use('/', require('./routes/authRoutes'));
app.use('/student', require('./routes/studentRoutes'));
const staffRoutes = require('./routes/staffRoutes');
app.use('/staff', staffRoutes);
app.use('/admin', require('./routes/adminRoutes'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});