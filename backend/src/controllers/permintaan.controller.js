const db = require('../db');

/** POST /api/v1/permintaan — Peternak mengajukan permintaan IB */
const createPermintaan = async (req, res) => {
  try {
    const { sapi_id, lokasi_ternak } = req.body;
    if (!sapi_id || !lokasi_ternak) {
      return res.status(400).json({ success: false, message: 'sapi_id dan lokasi_ternak wajib diisi.' });
    }
    // Verify the sapi belongs to this peternak
    const sapi = await db('sapi').where({ sapi_id }).first();
    if (!sapi) return res.status(404).json({ success: false, message: 'Sapi tidak ditemukan.' });
    if (req.user.role === 'peternak' && sapi.peternak_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sapi ini bukan milik Anda.' });
    }

    const [newPermintaan] = await db('permintaan').insert({
      sapi_id,
      peternak_id: req.user.role === 'peternak' ? req.user.id : sapi.peternak_id,
      lokasi_ternak,
      status_validitas: 'Valid',
      status_permintaan: 'Diproses',
      persetujuan_permintaan: 'Disetujui',
    }).returning('*');

    return res.status(201).json({ success: true, message: 'Permintaan IB berhasil diajukan.', data: newPermintaan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/permintaan — Admin: all permintaan with joins */
const getAllPermintaan = async (req, res) => {
  try {
    const data = await db('permintaan')
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .leftJoin('peternak', 'permintaan.peternak_id', 'peternak.peternak_id')
      .leftJoin('admin', 'permintaan.admin_id', 'admin.admin_id')
      .select(
        'permintaan.*',
        'sapi.sapi_eartag', 'sapi.sapi_jenis_kelamin',
        'peternak.peternak_nama', 'peternak.peternak_kontak',
        'admin.admin_nama'
      )
      .orderBy('permintaan.tanggal_pengajuan', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/permintaan/mine — Peternak: own permintaan */
const getMyPermintaan = async (req, res) => {
  try {
    const data = await db('permintaan')
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .where('permintaan.peternak_id', req.user.id)
      .select('permintaan.*', 'sapi.sapi_eartag', 'sapi.sapi_jenis_kelamin')
      .orderBy('permintaan.tanggal_pengajuan', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/permintaan/:id — All authenticated */
const getPermintaanById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db('permintaan')
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .leftJoin('peternak', 'permintaan.peternak_id', 'peternak.peternak_id')
      .leftJoin('admin', 'permintaan.admin_id', 'admin.admin_id')
      .where('permintaan.id_permintaan', id)
      .select('permintaan.*', 'sapi.sapi_eartag', 'sapi.sapi_jenis_kelamin', 'sapi.sapi_berat',
        'peternak.peternak_nama', 'peternak.peternak_kontak', 'peternak.peternak_alamat',
        'admin.admin_nama')
      .first();
    if (!data) return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    if (req.user.role === 'peternak' && data.peternak_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/permintaan/:id/validasi — Admin: set status_validitas + persetujuan */
const validasiPermintaan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_validitas, persetujuan_permintaan, alasan_penolakan } = req.body;
    const updates = { admin_id: req.user.id, updated_at: new Date() };
    if (status_validitas) updates.status_validitas = status_validitas;
    if (persetujuan_permintaan) {
      updates.persetujuan_permintaan = persetujuan_permintaan;
      if (persetujuan_permintaan === 'Disetujui') updates.status_permintaan = 'Diproses';
      if (persetujuan_permintaan === 'Ditolak') {
        updates.status_permintaan = 'Ditolak';
        updates.alasan_penolakan = alasan_penolakan || null;
      }
    }
    const [updated] = await db('permintaan').where({ id_permintaan: id }).update(updates).returning('*');
    if (!updated) return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Status permintaan diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/permintaan/:id/tutup — Admin: close the cycle */
const tutupPermintaan = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasil_akhir } = req.body;
    const [updated] = await db('permintaan').where({ id_permintaan: id })
      .update({ status_permintaan: 'Selesai', hasil_akhir, updated_at: new Date() })
      .returning('*');
    if (!updated) return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Siklus reproduksi ditutup.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createPermintaan, getAllPermintaan, getMyPermintaan, getPermintaanById, validasiPermintaan, tutupPermintaan };
