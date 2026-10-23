
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Support both registration URLs
router.get('/signup', authController.showSignup);
router.post('/signup', authController.signup);

router.get('/register', authController.showSignup);
router.post('/register', authController.signup);

// Staff registration
router.get('/staff/register', authController.showStaffSignup);
router.post('/staff/register', authController.staffSignup);

router.post('/logout', authController.logout);

module.exports = router;
