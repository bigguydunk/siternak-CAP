const db = require('../db');

/** POST /api/v1/semen — Admin only */
const createSemen = async (req, res) => {
  try {
    const { kode_straw, semen_batch, tanggal_produksi, tanggal_kadaluarsa } = req.body;
    if (!kode_straw) return res.status(400).json({ success: false, message: 'kode_straw wajib diisi.' });
    const exists = await db('semen').where({ kode_straw }).first();
    if (exists) return res.status(409).json({ success: false, message: 'kode_straw sudah terdaftar.' });
    const [data] = await db('semen').insert({ kode_straw, semen_batch, tanggal_produksi, tanggal_kadaluarsa }).returning('*');
    return res.status(201).json({ success: true, message: 'Straw semen berhasil ditambahkan.', data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/semen */
const getAllSemen = async (req, res) => {
  try {
    const data = await db('semen').orderBy('created_at', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/semen/:kode */
const getSemenByKode = async (req, res) => {
  try {
    const { kode } = req.params;
    const data = await db('semen').where({ kode_straw: kode }).first();
    if (!data) return res.status(404).json({ success: false, message: 'Straw tidak ditemukan.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/semen/:kode */
const updateSemen = async (req, res) => {
  try {
    const { kode } = req.params;
    const { semen_batch, tanggal_produksi, tanggal_kadaluarsa } = req.body;
    const [updated] = await db('semen').where({ kode_straw: kode })
      .update({ semen_batch, tanggal_produksi, tanggal_kadaluarsa, updated_at: new Date() })
      .returning('*');
    if (!updated) return res.status(404).json({ success: false, message: 'Straw tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Straw diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** DELETE /api/v1/semen/:kode */
const deleteSemen = async (req, res) => {
  try {
    const { kode } = req.params;
    const deleted = await db('semen').where({ kode_straw: kode }).delete();
    if (!deleted) return res.status(404).json({ success: false, message: 'Straw tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Straw berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createSemen, getAllSemen, getSemenByKode, updateSemen, deleteSemen };
