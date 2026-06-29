const express = require('express');
const router = express.Router();
const { getCounts } = require('../controllers/notifications.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/counts', requireRole('admin', 'petugas'), getCounts);

module.exports = router;
