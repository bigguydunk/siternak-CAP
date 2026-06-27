const express = require('express');
const router = express.Router();
const { uploadFoto, getFotoBySapi, deleteFoto } = require('../controllers/foto.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);
router.post('/sapi/:sapiId', requireRole('admin', 'peternak'), upload.single('foto'), uploadFoto);
router.get('/sapi/:sapiId', requireRole('admin', 'peternak', 'petugas'), getFotoBySapi);
router.delete('/:fotoId', requireRole('admin'), deleteFoto);

module.exports = router;
