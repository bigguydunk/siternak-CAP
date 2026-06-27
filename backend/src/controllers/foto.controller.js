const db = require('../db');
const path = require('path');
const fs = require('fs');

/** POST /api/v1/foto/sapi/:sapiId — Upload foto sapi */
const uploadFoto = async (req, res) => {
  try {
    const { sapiId } = req.params;
    const { foto_tipe } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File gambar wajib diunggah.' });
    }
    if (!foto_tipe || !['depan', 'belakang', 'umum'].includes(foto_tipe)) {
      return res.status(400).json({ success: false, message: 'foto_tipe harus salah satu dari: depan, belakang, umum.' });
    }

    // Verify sapi exists and peternak owns it
    const sapi = await db('sapi').where({ sapi_id: sapiId }).first();
    if (!sapi) return res.status(404).json({ success: false, message: 'Sapi tidak ditemukan.' });
    if (req.user.role === 'peternak' && sapi.peternak_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const foto_path = `/uploads/${req.file.filename}`;
    const [newFoto] = await db('foto').insert({
      sapi_id: sapiId, foto_path, foto_tipe,
    }).returning('*');

    return res.status(201).json({ success: true, message: 'Foto berhasil diunggah.', data: newFoto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/foto/sapi/:sapiId — Get all foto for a sapi */
const getFotoBySapi = async (req, res) => {
  try {
    const { sapiId } = req.params;
    const data = await db('foto').where({ sapi_id: sapiId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** DELETE /api/v1/foto/:fotoId — Admin only */
const deleteFoto = async (req, res) => {
  try {
    const { fotoId } = req.params;
    const foto = await db('foto').where({ foto_id: fotoId }).first();
    if (!foto) return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });

    // Delete file from disk
    const filePath = path.join(__dirname, '..', '..', foto.foto_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db('foto').where({ foto_id: fotoId }).delete();
    return res.status(200).json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { uploadFoto, getFotoBySapi, deleteFoto };
