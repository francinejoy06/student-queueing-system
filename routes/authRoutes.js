const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/signup', authController.showSignup);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);

module.exports = router;
