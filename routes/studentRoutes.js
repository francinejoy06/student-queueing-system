const express = require('express');
const studentController = require('../controllers/studentController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('student'));
router.get('/dashboard', studentController.showDashboard);
router.get('/queue/add', studentController.showAddForm);
router.post('/queue/add', studentController.addTicket);

module.exports = router;
