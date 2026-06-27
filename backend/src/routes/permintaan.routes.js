const express = require('express');
const router = express.Router();
const {
  createPermintaan, getAllPermintaan, getMyPermintaan,
  getPermintaanById, validasiPermintaan, tutupPermintaan,
} = require('../controllers/permintaan.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', requireRole('peternak', 'admin'), createPermintaan);
router.get('/mine', requireRole('peternak'), getMyPermintaan);
router.get('/', requireRole('admin', 'petugas'), getAllPermintaan);
router.get('/:id', requireRole('admin', 'petugas', 'peternak'), getPermintaanById);
router.put('/:id/validasi', requireRole('admin'), validasiPermintaan);
router.put('/:id/tutup', requireRole('admin'), tutupPermintaan);

module.exports = router;
