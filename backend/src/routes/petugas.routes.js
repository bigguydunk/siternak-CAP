const express = require('express');
const router = express.Router();
const { getAllPetugas, getPetugasById, updatePetugas, getLaporanByPetugas } = require('../controllers/petugas.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireRole('admin'), getAllPetugas);
router.get('/:id', requireRole('admin', 'petugas'), getPetugasById);
router.put('/:id', requireRole('admin', 'petugas'), updatePetugas);
router.get('/:id/laporan', requireRole('admin', 'petugas'), getLaporanByPetugas);

module.exports = router;
