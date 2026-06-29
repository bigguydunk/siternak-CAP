const db = require('../db');
const bcrypt = require('bcryptjs');

/** GET /api/v1/petugas — Admin only */
const getAllPetugas = async (req, res) => {
  try {
    const data = await db('petugas')
      .select('petugas_id', 'petugas_nama', 'petugas_kontak', 'petugas_email', 'petugas_kinerja', 'created_at');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/petugas/:id */
const getPetugasById = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'petugas' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const data = await db('petugas')
      .where({ petugas_id: id })
      .select('petugas_id', 'petugas_nama', 'petugas_kontak', 'petugas_email', 'petugas_kinerja', 'created_at')
      .first();
    if (!data) return res.status(404).json({ success: false, message: 'Petugas tidak ditemukan.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/petugas/:id — Admin or self */
const updatePetugas = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'petugas' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const { petugas_nama, petugas_kontak, petugas_kinerja, petugas_password } = req.body;
    const updates = { updated_at: new Date() };
    if (petugas_nama) updates.petugas_nama = petugas_nama;
    if (petugas_kontak) updates.petugas_kontak = petugas_kontak;
    if (petugas_kinerja) updates.petugas_kinerja = petugas_kinerja;
    if (petugas_password) updates.petugas_password = await bcrypt.hash(petugas_password, 10);

    const [updated] = await db('petugas').where({ petugas_id: id }).update(updates)
      .returning(['petugas_id', 'petugas_nama', 'petugas_kontak', 'petugas_email', 'petugas_kinerja']);
    if (!updated) return res.status(404).json({ success: false, message: 'Petugas tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Profil diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/petugas/:id/laporan — All laporan subtypes handled by this petugas */
const getLaporanByPetugas = async (req, res) => {
  try {
    const { id } = req.params;
    // Collect laporan_ids from all 4 subtype tables
    const ibIds = await db('laporan_ib').where({ petugas_id: id }).pluck('laporan_id');
    const kebIds = await db('laporan_kebuntingan').where({ petugas_id: id }).pluck('laporan_id');
    const kegIds = await db('laporan_keguguran').where({ petugas_id: id }).pluck('laporan_id');
    const kelIds = await db('laporan_kelahiran').where({ petugas_id: id }).pluck('laporan_id');
    const allIds = [...new Set([...ibIds, ...kebIds, ...kegIds, ...kelIds])];

    if (!allIds.length) return res.status(200).json({ success: true, data: [] });

    const data = await db('laporan')
      .whereIn('id_laporan', allIds)
      .leftJoin('permintaan', 'laporan.id_permintaan', 'permintaan.id_permintaan')
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .select('laporan.*', 'sapi.sapi_eartag', 'permintaan.lokasi_ternak')
      .orderBy('laporan.tanggal_waktu', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/petugas/tugas — Petugas sees own assigned permintaan */
const getMyTugas = async (req, res) => {
  try {
    const { id } = req.user;
    const data = await db('permintaan')
      .where('permintaan.status_permintaan', 'Diproses')
      .where((builder) => {
        builder.where('permintaan.petugas_id', id).orWhereNull('permintaan.petugas_id');
      })
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .leftJoin('peternak', 'permintaan.peternak_id', 'peternak.peternak_id')
      .select(
        'permintaan.*',
        'sapi.sapi_eartag', 'sapi.sapi_jenis_kelamin',
        'peternak.peternak_nama', 'peternak.peternak_kontak'
      )
      .orderBy('permintaan.tanggal_pengajuan', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllPetugas, getPetugasById, updatePetugas, getLaporanByPetugas, getMyTugas };
