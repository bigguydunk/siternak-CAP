const express = require('express');
const router = express.Router();
const {
  createPermintaan, getAllPermintaan, getMyPermintaan,
  getPermintaanById, validasiPermintaan, tutupPermintaan, tugaskanPetugas, tugaskanLanjutan
} = require('../controllers/permintaan.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

const createPermintaanSchema = z.object({
  sapi_id: z.number().int().positive(),
  lokasi_ternak: z.string().min(1)
});

router.use(authenticate);
router.post('/', validate(createPermintaanSchema), requireRole('peternak', 'admin'), createPermintaan);
router.get('/mine', requireRole('peternak'), getMyPermintaan);
router.get('/', requireRole('admin', 'petugas'), getAllPermintaan);
router.get('/:id', requireRole('admin', 'petugas', 'peternak'), getPermintaanById);
router.put('/:id/validasi', requireRole('admin'), validasiPermintaan);
router.put('/:id/tugaskan', requireRole('admin'), tugaskanPetugas);
router.put('/:id/tugaskan-lanjutan', requireRole('admin'), tugaskanLanjutan);
router.put('/:id/tutup', requireRole('admin'), tutupPermintaan);

module.exports = router;
