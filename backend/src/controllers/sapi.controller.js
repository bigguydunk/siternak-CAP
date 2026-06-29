const db = require('../db');

/** POST /api/v1/sapi — Admin or Peternak */
const createSapi = async (req, res) => {
  try {
    const { sapi_jenis_kelamin, sapi_eartag, sapi_berat, peternak_id } = req.body;
    if (!sapi_jenis_kelamin) {
      return res.status(400).json({ success: false, message: 'Jenis kelamin sapi wajib diisi.' });
    }

    // Peternak can only register sapi for themselves
    let resolvedPeternakId = peternak_id;
    if (req.user.role === 'peternak') {
      resolvedPeternakId = req.user.id;
    }
    if (!resolvedPeternakId) {
      return res.status(400).json({ success: false, message: 'peternak_id wajib diisi.' });
    }

    const [newSapi] = await db('sapi').insert({
      peternak_id: resolvedPeternakId, sapi_jenis_kelamin, sapi_eartag, sapi_berat,
      tanggal_terdaftar: new Date(),
    }).returning('*');
    return res.status(201).json({ success: true, message: 'Sapi berhasil didaftarkan.', data: newSapi });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/** GET /api/v1/sapi — Admin: all sapi */
const getAllSapi = async (req, res) => {
  try {
    const { peternak_id } = req.query;
    let query = db('sapi')
      .join('peternak', 'sapi.peternak_id', 'peternak.peternak_id')
      .select('sapi.*', 'peternak.peternak_nama', 'peternak.peternak_kontak');
      
    if (peternak_id) {
      query = query.where('sapi.peternak_id', peternak_id);
    }
    
    const data = await query;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/sapi/mine — Peternak: own sapi list */
const getMySapi = async (req, res) => {
  try {
    const data = await db('sapi').where({ peternak_id: req.user.id });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/sapi/:id — All authenticated */
const getSapiById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db('sapi')
      .join('peternak', 'sapi.peternak_id', 'peternak.peternak_id')
      .where('sapi.sapi_id', id)
      .select('sapi.*', 'peternak.peternak_nama', 'peternak.peternak_email', 'peternak.peternak_kontak')
      .first();
    if (!data) return res.status(404).json({ success: false, message: 'Sapi tidak ditemukan.' });
    // Peternak can only view own sapi
    if (req.user.role === 'peternak' && data.peternak_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/sapi/:id — Admin or owning Peternak */
const updateSapi = async (req, res) => {
  try {
    const { id } = req.params;
    const sapi = await db('sapi').where({ sapi_id: id }).first();
    if (!sapi) return res.status(404).json({ success: false, message: 'Sapi tidak ditemukan.' });
    if (req.user.role === 'peternak' && sapi.peternak_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const { sapi_jenis_kelamin, sapi_eartag, sapi_berat } = req.body;
    const updates = { updated_at: new Date() };
    if (sapi_jenis_kelamin) updates.sapi_jenis_kelamin = sapi_jenis_kelamin;
    if (sapi_eartag !== undefined) updates.sapi_eartag = sapi_eartag;
    if (sapi_berat !== undefined) updates.sapi_berat = sapi_berat;

    const [updated] = await db('sapi').where({ sapi_id: id }).update(updates).returning('*');
    return res.status(200).json({ success: true, message: 'Data sapi diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** DELETE /api/v1/sapi/:id — Admin only */
const deleteSapi = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('sapi').where({ sapi_id: id }).delete();
    if (!deleted) return res.status(404).json({ success: false, message: 'Sapi tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Sapi berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createSapi, getAllSapi, getMySapi, getSapiById, updateSapi, deleteSapi };
