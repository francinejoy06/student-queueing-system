
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

// Only admin users can access these routes
router.use(requireRole('admin'));

// Office management
router.get('/offices', adminController.showOffices);
router.post('/offices', adminController.addOffice);
router.post('/offices/:id/edit', adminController.editOffice);
router.post('/offices/:id/toggle', adminController.toggleOffice);

// User management
router.get('/users', adminController.showUsers);
router.post('/users', adminController.addUser);
router.post('/users/:id/edit', adminController.editUser);
router.post('/users/:id/delete', adminController.deleteUser);

module.exports = router;
