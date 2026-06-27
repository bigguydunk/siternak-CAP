const express = require('express');
const router = express.Router();
const { getAllPeternak, getPeternakById, updatePeternak, deletePeternak } = require('../controllers/peternak.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireRole('admin'), getAllPeternak);
router.get('/:id', requireRole('admin', 'peternak'), getPeternakById);
router.put('/:id', requireRole('admin', 'peternak'), updatePeternak);
router.delete('/:id', requireRole('admin'), deletePeternak);

module.exports = router;
