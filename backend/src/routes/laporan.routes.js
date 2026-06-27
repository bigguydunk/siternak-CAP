const express = require('express');
const router = express.Router();
const {
  createLaporanIB, createLaporanKebuntingan, createLaporanKeguguran, createLaporanKelahiran,
  getLaporanByPermintaan, getLaporanById, updateLaporanIB,
} = require('../controllers/laporan.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/ib', requireRole('petugas', 'peternak'), createLaporanIB);
router.post('/kebuntingan', requireRole('petugas', 'peternak'), createLaporanKebuntingan);
router.post('/keguguran', requireRole('petugas', 'peternak'), createLaporanKeguguran);
router.post('/kelahiran', requireRole('petugas', 'peternak'), createLaporanKelahiran);
router.get('/permintaan/:id', requireRole('admin', 'petugas', 'peternak'), getLaporanByPermintaan);
router.get('/:id', requireRole('admin', 'petugas', 'peternak'), getLaporanById);
router.put('/ib/:id', requireRole('petugas', 'peternak'), updateLaporanIB);

module.exports = router;
