const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);
router.get('/users', adminController.showUsers);
router.post('/users', adminController.addUser);
router.post('/users/:id/delete', adminController.deleteUser);

module.exports = router;
