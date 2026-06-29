const express = require('express');
const router = express.Router();
const { konfirmasiTugas } = require('../controllers/tugas.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.put('/:laporan_id/konfirmasi', requireRole('petugas'), konfirmasiTugas);

module.exports = router;
