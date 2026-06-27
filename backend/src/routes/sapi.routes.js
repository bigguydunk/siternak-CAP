const express = require('express');
const router = express.Router();
const { createSapi, getAllSapi, getMySapi, getSapiById, updateSapi, deleteSapi } = require('../controllers/sapi.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
// NOTE: /mine must be defined BEFORE /:id to avoid being caught as a param
router.get('/mine', requireRole('peternak'), getMySapi);
router.post('/', requireRole('admin', 'peternak'), createSapi);
router.get('/', requireRole('admin'), getAllSapi);
router.get('/:id', requireRole('admin', 'peternak', 'petugas'), getSapiById);
router.put('/:id', requireRole('admin', 'peternak'), updateSapi);
router.delete('/:id', requireRole('admin'), deleteSapi);

module.exports = router;
