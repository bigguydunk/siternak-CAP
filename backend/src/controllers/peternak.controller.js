const db = require('../db');
const bcrypt = require('bcryptjs');

/** GET /api/v1/peternak — Admin only */
const getAllPeternak = async (req, res) => {
  try {
    const data = await db('peternak').select('peternak_id', 'peternak_nama', 'peternak_kontak', 'peternak_alamat', 'peternak_email', 'created_at');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/peternak/:id — Admin or self */
const getPeternakById = async (req, res) => {
  try {
    const { id } = req.params;
    // Peternak can only view own profile
    if (req.user.role === 'peternak' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const data = await db('peternak')
      .where({ peternak_id: id })
      .select('peternak_id', 'peternak_nama', 'peternak_kontak', 'peternak_alamat', 'peternak_email', 'created_at')
      .first();
    if (!data) return res.status(404).json({ success: false, message: 'Peternak tidak ditemukan.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/peternak/:id — Admin or self */
const updatePeternak = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'peternak' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const { peternak_nama, peternak_kontak, peternak_alamat, peternak_password } = req.body;
    const updates = {};
    if (peternak_nama) updates.peternak_nama = peternak_nama;
    if (peternak_kontak) updates.peternak_kontak = peternak_kontak;
    if (peternak_alamat) updates.peternak_alamat = peternak_alamat;
    if (peternak_password) updates.peternak_password = await bcrypt.hash(peternak_password, 10);
    updates.updated_at = new Date();

    const [updated] = await db('peternak').where({ peternak_id: id }).update(updates)
      .returning(['peternak_id', 'peternak_nama', 'peternak_kontak', 'peternak_alamat', 'peternak_email']);
    if (!updated) return res.status(404).json({ success: false, message: 'Peternak tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Profil diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** DELETE /api/v1/peternak/:id — Admin only */
const deletePeternak = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('peternak').where({ peternak_id: id }).delete();
    if (!deleted) return res.status(404).json({ success: false, message: 'Peternak tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Peternak berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllPeternak, getPeternakById, updatePeternak, deletePeternak };
