const express = require('express');
const router = express.Router();
const { login, registerPeternak, registerPetugas, registerAdmin, getMe } = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'petugas', 'peternak'])
});

router.post('/login', validate(loginSchema), login);
router.post('/register/peternak', registerPeternak);
router.post('/register/petugas', authenticate, requireRole('admin'), registerPetugas);
router.post('/register/admin', registerAdmin);
router.get('/me', authenticate, getMe);

module.exports = router;
