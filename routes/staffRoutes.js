const express = require('express');
const staffController = require('../controllers/staffController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Only staff and admin users can access these routes
router.use(requireRole('staff', 'admin'));

router.get('/dashboard', staffController.showDashboard);

router.get('/queue', staffController.showQueue);
router.post('/queue/call-next', staffController.callNext);
router.post('/queue/finish', staffController.finishLegacy);

router.get('/queue/add', staffController.showAddForm);
router.post('/queue/add', staffController.addTicket);

router.get('/queue/:id/edit', staffController.showEditForm);
router.post('/queue/:id/edit', staffController.editTicket);
router.post('/queue/:id/delete', staffController.deleteTicket);

router.post('/queue/:id/served', staffController.markServed);
router.post('/queue/:id/skip', staffController.skipTicket);

module.exports = router;