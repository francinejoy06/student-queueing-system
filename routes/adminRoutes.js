
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Only admin users can access these routes
router.use(requireAdmin);

router.get('/offices', adminController.showOffices);
router.post('/offices', adminController.addOffice);
router.post('/offices/:id/edit', adminController.editOffice);
router.post('/offices/:id/toggle', adminController.toggleOffice);

router.get('/users', adminController.showUsers);
router.post('/users', adminController.addUser);
router.post('/users/:id/edit', adminController.editUser);
router.post('/users/:id/delete', adminController.deleteUser);

module.exports = router;
