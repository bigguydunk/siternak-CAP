const express = require('express');
const router = express.Router();
const { login, registerPeternak, registerPetugas, getMe } = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/register/peternak', registerPeternak);
router.post('/register/petugas', authenticate, requireRole('admin'), registerPetugas);
router.get('/me', authenticate, getMe);

module.exports = router;
