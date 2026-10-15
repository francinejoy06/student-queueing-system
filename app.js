require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

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
  })
);

// Test route
app.use('/', require('./routes/auth'));

const staffRoutes = require('./routes/staffRoutes');
app.use('/staff', staffRoutes);

app.get('/', (req, res) => {
  res.send('Student Queueing System is running!');
});

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// Routes
const staffRoutes = require('./routes/staffRoutes');
app.use('/staff', staffRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});