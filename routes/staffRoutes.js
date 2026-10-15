const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { requireRole } = require('../middleware/auth');

// Only staff users can access these routes
router.get('/queue', requireRole('staff'), staffController.showQueue);
router.post('/queue/call-next', requireRole('staff'), staffController.callNext);
router.post('/queue/finish', requireRole('staff'), staffController.finishTicket);

module.exports = router;