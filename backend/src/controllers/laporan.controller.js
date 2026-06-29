const db = require('../db');

// ─── POST /api/v1/laporan/ib/:laporan_id ─────────────────────────────────────
const createLaporanIB = async (req, res) => {
  try {
    let { laporan_id } = req.params;
    const { id_permintaan, kode_straw, isi_laporan_ib, waktu_proses_ib, is_success, komentar } = req.body;

    if (!laporan_id && id_permintaan) {
      const activeLaporan = await db('laporan')
        .where({ id_permintaan, flag_menunggu_laporan: true, flag_laporan_ib: true })
        .first();
      if (activeLaporan) {
        laporan_id = activeLaporan.id_laporan;
      }
    }

    const laporan = await db('laporan').where({ id_laporan: laporan_id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const resolvedPetugasId = req.user.id;

    const result = await db.transaction(async (trx) => {
      const [laporanIB] = await trx('laporan_ib').insert({
        laporan_id,
        petugas_id: resolvedPetugasId,
        kode_straw: kode_straw || null,
        isi_laporan_ib, waktu_proses_ib, is_success, komentar,
      }).returning('*');

      const isSuccessBool = is_success === true || is_success === 'true';

      if (isSuccessBool) {
        await trx('laporan').where({ id_laporan: laporan_id }).update({
          flag_laporan_ib: false,
          flag_menunggu_laporan: false
        });
        // Auto-transition to Kebuntingan
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 3);
        await trx('laporan').insert({
          id_permintaan: laporan.id_permintaan,
          flag_menunggu_laporan: true,
          flag_laporan_ib: false,
          flag_laporan_kebuntingan: true,
          flag_laporan_keguguran: false,
          flag_laporan_kelahiran: false,
          tanggal_waktu: new Date(),
          tenggat_waktu: deadline
        });
      } else {
        await trx('laporan').where({ id_laporan: laporan_id }).update({
          flag_menunggu_laporan: false,
          flag_laporan_ib: false,
          tenggat_waktu: null
        });
        await trx('permintaan').where({ id_permintaan: laporan.id_permintaan }).update({
          status_permintaan: 'IB Gagal',
          hasil_akhir: 'IB Gagal'
        });
      }
      
      return laporanIB;
    });

    return res.status(201).json({ success: true, message: 'Laporan IB berhasil dibuat.', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/kebuntingan/:laporan_id ───────────────────────────
const createLaporanKebuntingan = async (req, res) => {
  try {
    let { laporan_id } = req.params;
    const { id_permintaan, isi_laporan_kebuntingan, waktu_kebuntingan, hasil_pemeriksaan, tanggal_hpl } = req.body;
    if (!hasil_pemeriksaan) {
      return res.status(400).json({ success: false, message: 'hasil_pemeriksaan wajib diisi.' });
    }

    if (!laporan_id && id_permintaan) {
      const activeLaporan = await db('laporan')
        .where({ id_permintaan, flag_menunggu_laporan: true, flag_laporan_kebuntingan: true })
        .first();
      if (activeLaporan) {
        laporan_id = activeLaporan.id_laporan;
      }
    }

    const laporan = await db('laporan').where({ id_laporan: laporan_id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    
    const resolvedPetugasId = req.user.id;

    const result = await db.transaction(async (trx) => {
      const [laporanKebuntingan] = await trx('laporan_kebuntingan').insert({
        laporan_id,
        petugas_id: resolvedPetugasId,
        isi_laporan_kebuntingan, waktu_kebuntingan, hasil_pemeriksaan,
        tanggal_hpl: hasil_pemeriksaan === 'hamil' || hasil_pemeriksaan === 'Bunting' ? tanggal_hpl : null,
      }).returning('*');

      const isBunting = hasil_pemeriksaan === 'hamil' || hasil_pemeriksaan === 'Bunting';

      if (isBunting) {
        await trx('laporan').where({ id_laporan: laporan_id }).update({
          flag_laporan_kebuntingan: false,
          flag_menunggu_laporan: false
        });

        // Find waktu_proses_ib
        const ibReport = await trx('laporan_ib')
          .join('laporan', 'laporan_ib.laporan_id', 'laporan.id_laporan')
          .where('laporan.id_permintaan', laporan.id_permintaan)
          .first();
        const ibTime = ibReport && ibReport.waktu_proses_ib ? new Date(ibReport.waktu_proses_ib) : new Date();
        const deadline = new Date(ibTime);
        deadline.setMonth(deadline.getMonth() + 7);

        // Auto-transition to Kelahiran / Keguguran
        await trx('laporan').insert({
          id_permintaan: laporan.id_permintaan,
          flag_menunggu_laporan: true,
          flag_laporan_ib: false,
          flag_laporan_kebuntingan: false,
          flag_laporan_keguguran: true,
          flag_laporan_kelahiran: true,
          tanggal_waktu: new Date(),
          tenggat_waktu: deadline
        });
      } else {
        await trx('laporan').where({ id_laporan: laporan_id }).update({
          flag_menunggu_laporan: false,
          flag_laporan_kebuntingan: false,
          tenggat_waktu: null
        });
        await trx('permintaan').where({ id_permintaan: laporan.id_permintaan }).update({
          status_permintaan: 'Selesai',
          hasil_akhir: 'Tidak Bunting'
        });
      }
      return laporanKebuntingan;
    });

    return res.status(201).json({ success: true, message: 'Laporan kebuntingan berhasil dibuat.', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/keguguran/:laporan_id ─────────────────────────────
const createLaporanKeguguran = async (req, res) => {
  try {
    const { laporan_id } = req.params;
    const { isi_laporan_keguguran, waktu_keguguran } = req.body;
    
    const laporan = await db('laporan').where({ id_laporan: laporan_id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const resolvedPetugasId = req.user.id;

    const result = await db.transaction(async (trx) => {
      const [laporanKeguguran] = await trx('laporan_keguguran').insert({
        laporan_id,
        petugas_id: resolvedPetugasId,
        isi_laporan_keguguran, waktu_keguguran,
      }).returning('*');

      await trx('laporan').where({ id_laporan: laporan_id }).update({
        flag_menunggu_laporan: false,
        flag_laporan_keguguran: false,
        tenggat_waktu: null
      });

      await trx('permintaan').where({ id_permintaan: laporan.id_permintaan }).update({
        status_permintaan: 'Selesai',
        hasil_akhir: 'Keguguran'
      });

      return laporanKeguguran;
    });

    return res.status(201).json({ success: true, message: 'Laporan keguguran berhasil dibuat.', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── POST /api/v1/laporan/kelahiran/:laporan_id ─────────────────────────────
const createLaporanKelahiran = async (req, res) => {
  try {
    let { laporan_id } = req.params;
    const { id_permintaan, isi_laporan_kelahiran, kondisi_anak_sapi, jenis_kelamin_anak_sapi, waktu_kelahiran } = req.body;

    if (!laporan_id && id_permintaan) {
      const activeLaporan = await db('laporan')
        .where({ id_permintaan, flag_menunggu_laporan: true, flag_laporan_kelahiran: true })
        .first();
      if (activeLaporan) {
        laporan_id = activeLaporan.id_laporan;
      }
    }

    const laporan = await db('laporan').where({ id_laporan: laporan_id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    
    let resolvedPetugasId = req.user.id;
    if (req.user.role === 'peternak') {
      const dummyPetugas = await db('petugas').first();
      resolvedPetugasId = dummyPetugas ? dummyPetugas.petugas_id : null;
    }

    const result = await db.transaction(async (trx) => {
      const [laporanKelahiran] = await trx('laporan_kelahiran').insert({
        laporan_id,
        petugas_id: resolvedPetugasId,
        isi_laporan_kelahiran, kondisi_anak_sapi, jenis_kelamin_anak_sapi, waktu_kelahiran,
      }).returning('*');

      await trx('laporan').where({ id_laporan: laporan_id }).update({
        flag_menunggu_laporan: false,
        flag_laporan_kelahiran: false,
        tenggat_waktu: null
      });

      await trx('permintaan').where({ id_permintaan: laporan.id_permintaan }).update({
        status_permintaan: 'Selesai',
        hasil_akhir: `Kelahiran ${kondisi_anak_sapi || ''} ${jenis_kelamin_anak_sapi || ''}`.trim()
      });

      return laporanKelahiran;
    });

    return res.status(201).json({ success: true, message: 'Laporan kelahiran berhasil dibuat.', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─── GET /api/v1/laporan/permintaan/:id ─────────────────────────────────────
const getLaporanByPermintaan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporanList = await db('laporan')
      .leftJoin('permintaan', 'laporan.id_permintaan', 'permintaan.id_permintaan')
      .where('laporan.id_permintaan', id)
      .select('laporan.*', 'permintaan.petugas_id')
      .orderBy('laporan.tanggal_waktu', 'asc');

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

// ─── GET /api/v1/laporan ──────────────────────────────────────────────────
const getAllLaporan = async (req, res) => {
  try {
    const data = await db('laporan')
      .leftJoin('permintaan', 'laporan.id_permintaan', 'permintaan.id_permintaan')
      .leftJoin('sapi', 'permintaan.sapi_id', 'sapi.sapi_id')
      .leftJoin('peternak', 'permintaan.peternak_id', 'peternak.peternak_id')
      .select(
        'laporan.*',
        'permintaan.status_permintaan',
        'permintaan.lokasi_ternak',
        'permintaan.petugas_id',
        'sapi.sapi_eartag',
        'peternak.peternak_nama'
      )
      .orderBy('laporan.tanggal_waktu', 'desc');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/v1/laporan/mine ──────────────────────────────────────────────
const getMyLaporan = async (req, res) => {
  try {
    const { id } = req.user;
    const ibIds = await db('laporan_ib').where({ petugas_id: id }).pluck('laporan_id');
    const kebIds = await db('laporan_kebuntingan').where({ petugas_id: id }).pluck('laporan_id');
    const kegIds = await db('laporan_keguguran').where({ petugas_id: id }).pluck('laporan_id');
    const kelIds = await db('laporan_kelahiran').where({ petugas_id: id }).pluck('laporan_id');
    
    const allIds = [...new Set([...ibIds, ...kebIds, ...kegIds, ...kelIds])];
    
    let data = [];
    if (allIds.length > 0) {
      data = await db('laporan')
        .whereIn('id_laporan', allIds)
        .orderBy('tanggal_waktu', 'desc');
    }
      
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await db('laporan').where({ id_laporan: id }).first();
    if (!laporan) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }
    
    // Delete the entire permintaan cycle (this will cascade delete all laporan under it)
    await db('permintaan').where({ id_permintaan: laporan.id_permintaan }).del();
    
    return res.status(200).json({ success: true, message: 'Siklus laporan berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createLaporanIB, createLaporanKebuntingan, createLaporanKeguguran, createLaporanKelahiran,
  getLaporanByPermintaan, getLaporanById, updateLaporanIB, getAllLaporan, getMyLaporan, deleteLaporan
};
