const express = require('express');
const router = express.Router();
const { createSemen, getAllSemen, getSemenByKode, updateSemen, deleteSemen } = require('../controllers/semen.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', requireRole('admin'), createSemen);
router.get('/', requireRole('admin', 'petugas'), getAllSemen);
router.get('/:kode', requireRole('admin', 'petugas'), getSemenByKode);
router.put('/:kode', requireRole('admin'), updateSemen);
router.delete('/:kode', requireRole('admin'), deleteSemen);

module.exports = router;
