
const express = require('express');
const studentController = require('../controllers/studentController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Only logged-in students can access these routes.
router.use(requireRole('student'));

// Student dashboard
router.get('/dashboard', studentController.showDashboard);

// Create a queue ticket
router.get('/queue/add', studentController.showAddForm);
router.post('/queue/add', studentController.addTicket);

// Edit the purpose of a waiting ticket
router.post(
  '/tickets/:id/edit-purpose',
  studentController.editPurpose
);

// Cancel a waiting ticket
router.post(
  '/tickets/:id/cancel',
  studentController.cancelTicket
);

module.exports = router;
