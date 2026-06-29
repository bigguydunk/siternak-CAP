const express = require('express');
const router = express.Router();
const {
  createLaporanIB, createLaporanKebuntingan, createLaporanKeguguran, createLaporanKelahiran,
  getLaporanByPermintaan, getLaporanBySapi, getLaporanById, updateLaporanIB, getAllLaporan, getMyLaporan, deleteLaporan
} = require('../controllers/laporan.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

const createLaporanIBSchema = z.object({
  kode_straw: z.string().optional(),
  isi_laporan_ib: z.string().optional(),
  waktu_proses_ib: z.string().optional(),
  is_success: z.boolean().optional(),
  komentar: z.string().optional()
});

router.use(authenticate);
router.post('/ib/:laporan_id', validate(createLaporanIBSchema), requireRole('petugas'), createLaporanIB);
router.post('/ib', requireRole('petugas'), createLaporanIB);
router.post('/kebuntingan/:laporan_id', requireRole('petugas'), createLaporanKebuntingan);
router.post('/kebuntingan', requireRole('petugas'), createLaporanKebuntingan);
router.post('/keguguran/:laporan_id', requireRole('petugas'), createLaporanKeguguran);
router.post('/kelahiran/:laporan_id', requireRole('petugas', 'peternak'), createLaporanKelahiran);
router.post('/kelahiran', requireRole('petugas', 'peternak'), createLaporanKelahiran);
router.get('/permintaan/:id', requireRole('admin', 'petugas', 'peternak'), getLaporanByPermintaan);
router.get('/sapi/:sapi_id', requireRole('admin', 'petugas', 'peternak'), getLaporanBySapi);
router.get('/mine', requireRole('petugas'), getMyLaporan);
router.delete('/:id', requireRole('admin'), deleteLaporan);
router.get('/:id', requireRole('admin', 'petugas', 'peternak'), getLaporanById);
router.get('/', requireRole('admin'), getAllLaporan);
router.put('/ib/:id', requireRole('petugas'), updateLaporanIB);

module.exports = router;
