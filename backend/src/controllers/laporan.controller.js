const db = require('../db');

// ─── Helper: create laporan supertype row ───────────────────────────────────
const createLaporanBase = async (id_permintaan, flagUpdate = {}) => {
  const flags = {
    flag_menunggu_laporan: false,
    flag_laporan_ib: false,
    flag_laporan_kebuntingan: false,
    flag_laporan_keguguran: false,
    flag_laporan_kelahiran: false,
    ...flagUpdate,
  };
  const [laporan] = await db('laporan').insert({
    id_permintaan,
    ...flags,
    tanggal_waktu: new Date(),
  }).returning('*');
  return laporan;
};

// ─── POST /api/v1/laporan/ib ────────────────────────────────────────────────
const createLaporanIB = async (req, res) => {
  try {
    const { id_permintaan, kode_straw, isi_laporan_ib, waktu_proses_ib, is_success, komentar } = req.body;
    if (!id_permintaan) return res.status(400).json({ success: false, message: 'id_permintaan wajib diisi.' });

    const permintaan = await db('permintaan').where({ id_permintaan }).first();
    if (!permintaan) return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });

    let resolvedPetugasId = req.user.id;
    if (req.user.role === 'peternak') {
      const dummyPetugas = await db('petugas').first();
      resolvedPetugasId = dummyPetugas ? dummyPetugas.petugas_id : null;
    }

    const result = await db.transaction(async (trx) => {
      const flags = { flag_menunggu_laporan: false, flag_laporan_ib: true };
      const [laporan] = await trx('laporan').insert({
        id_permintaan,
        ...flags,
        tanggal_waktu: new Date(),
      }).returning('*');

      const [laporanIB] = await trx('laporan_ib').insert({
        laporan_id: laporan.id_laporan,
        petugas_id: resolvedPetugasId,
        kode_straw: kode_straw || null,
        isi_laporan_ib, waktu_proses_ib, is_success, komentar,
      }).returning('*');

      // If IB failed, set Permintaan status to Gagal
      if (is_success === false || is_success === 'false') {
        await trx('permintaan')
          .where({ id_permintaan })
          .update({ status_permintaan: 'Gagal' });
      }
      
      return { ...laporan, ...laporanIB };
    });

    return res.status(201).json({ success: true, message: 'Laporan IB berhasil dibuat.', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/kebuntingan ──────────────────────────────────────
const createLaporanKebuntingan = async (req, res) => {
  try {
    const { id_permintaan, isi_laporan_kebuntingan, waktu_kebuntingan, hasil_pemeriksaan, tanggal_hpl } = req.body;
    if (!id_permintaan || !hasil_pemeriksaan) {
      return res.status(400).json({ success: false, message: 'id_permintaan dan hasil_pemeriksaan wajib diisi.' });
    }
    const laporan = await createLaporanBase(id_permintaan, { flag_laporan_kebuntingan: true });
    
    let resolvedPetugasId = req.user.id;
    if (req.user.role === 'peternak') {
      const dummyPetugas = await db('petugas').first();
      resolvedPetugasId = dummyPetugas ? dummyPetugas.petugas_id : null;
    }

    const [laporanKebuntingan] = await db('laporan_kebuntingan').insert({
      laporan_id: laporan.id_laporan,
      petugas_id: resolvedPetugasId,
      isi_laporan_kebuntingan, waktu_kebuntingan, hasil_pemeriksaan,
      tanggal_hpl: hasil_pemeriksaan === 'hamil' ? tanggal_hpl : null,
    }).returning('*');

    return res.status(201).json({ success: true, message: 'Laporan kebuntingan berhasil dibuat.', data: { ...laporan, ...laporanKebuntingan } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/keguguran ────────────────────────────────────────
const createLaporanKeguguran = async (req, res) => {
  try {
    const { id_permintaan, isi_laporan_keguguran, waktu_keguguran } = req.body;
    if (!id_permintaan) return res.status(400).json({ success: false, message: 'id_permintaan wajib diisi.' });

    const laporan = await createLaporanBase(id_permintaan, { flag_laporan_keguguran: true });
    
    let resolvedPetugasId = req.user.id;
    if (req.user.role === 'peternak') {
      const dummyPetugas = await db('petugas').first();
      resolvedPetugasId = dummyPetugas ? dummyPetugas.petugas_id : null;
    }

    const [laporanKeguguran] = await db('laporan_keguguran').insert({
      laporan_id: laporan.id_laporan,
      petugas_id: resolvedPetugasId,
      isi_laporan_keguguran, waktu_keguguran,
    }).returning('*');

    return res.status(201).json({ success: true, message: 'Laporan keguguran berhasil dibuat.', data: { ...laporan, ...laporanKeguguran } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/kelahiran ────────────────────────────────────────
const createLaporanKelahiran = async (req, res) => {
  try {
    const { id_permintaan, isi_laporan_kelahiran, kondisi_anak_sapi, jenis_kelamin_anak_sapi, waktu_kelahiran } = req.body;
    if (!id_permintaan) return res.status(400).json({ success: false, message: 'id_permintaan wajib diisi.' });

    const laporan = await createLaporanBase(id_permintaan, { flag_laporan_kelahiran: true });
    
    let resolvedPetugasId = req.user.id;
    if (req.user.role === 'peternak') {
      const dummyPetugas = await db('petugas').first();
      resolvedPetugasId = dummyPetugas ? dummyPetugas.petugas_id : null;
    }

    const [laporanKelahiran] = await db('laporan_kelahiran').insert({
      laporan_id: laporan.id_laporan,
      petugas_id: resolvedPetugasId,
      isi_laporan_kelahiran, kondisi_anak_sapi, jenis_kelamin_anak_sapi, waktu_kelahiran,
    }).returning('*');

    return res.status(201).json({ success: true, message: 'Laporan kelahiran berhasil dibuat.', data: { ...laporan, ...laporanKelahiran } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── GET /api/v1/laporan/permintaan/:id ─────────────────────────────────────
const getLaporanByPermintaan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporanList = await db('laporan').where({ id_permintaan: id }).orderBy('tanggal_waktu', 'asc');

    // For each laporan, attach its subtype data
    const enriched = await Promise.all(laporanList.map(async (l) => {
      let subtype = null;
      if (l.flag_laporan_ib) {
        subtype = await db('laporan_ib').where({ laporan_id: l.id_laporan }).first();
      } else if (l.flag_laporan_kebuntingan) {
        subtype = await db('laporan_kebuntingan').where({ laporan_id: l.id_laporan }).first();
      } else if (l.flag_laporan_keguguran) {
        subtype = await db('laporan_keguguran').where({ laporan_id: l.id_laporan }).first();
      } else if (l.flag_laporan_kelahiran) {
        subtype = await db('laporan_kelahiran').where({ laporan_id: l.id_laporan }).first();
      }
      return { ...l, detail: subtype };
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── GET /api/v1/laporan/:id — single laporan with subtype ──────────────────
const getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await db('laporan').where({ id_laporan: id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    let subtype = null;
    if (laporan.flag_laporan_ib) subtype = await db('laporan_ib').where({ laporan_id: id }).first();
    else if (laporan.flag_laporan_kebuntingan) subtype = await db('laporan_kebuntingan').where({ laporan_id: id }).first();
    else if (laporan.flag_laporan_keguguran) subtype = await db('laporan_keguguran').where({ laporan_id: id }).first();
    else if (laporan.flag_laporan_kelahiran) subtype = await db('laporan_kelahiran').where({ laporan_id: id }).first();

    return res.status(200).json({ success: true, data: { ...laporan, detail: subtype } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── PUT /api/v1/laporan/ib/:id — update laporan IB ────────────────────────
const updateLaporanIB = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_straw, isi_laporan_ib, waktu_proses_ib, is_success, komentar } = req.body;
    const [updated] = await db('laporan_ib').where({ laporan_id: id })
      .update({ kode_straw, isi_laporan_ib, waktu_proses_ib, is_success, komentar, updated_at: new Date() })
      .returning('*');
    if (!updated) return res.status(404).json({ success: false, message: 'Laporan IB tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Laporan IB diperbarui.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

module.exports = {
  createLaporanIB, createLaporanKebuntingan, createLaporanKeguguran, createLaporanKelahiran,
  getLaporanByPermintaan, getLaporanById, updateLaporanIB,
};
