const express = require('express');
const studentController = require('../controllers/studentController');
const { requireStudent } = require('../middleware/auth');

const router = express.Router();
router.use(requireStudent);
router.get('/dashboard', studentController.showDashboard);
router.get('/queue/add', studentController.showAddForm);
router.post('/queue/add', studentController.addTicket);

module.exports = router;
