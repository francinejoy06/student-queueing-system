const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.get('/queue', staffController.showQueue);
router.post('/queue/call-next', staffController.callNext);
router.post('/queue/finish', staffController.finishTicket);

module.exports = router;