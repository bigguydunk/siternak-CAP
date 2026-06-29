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

    // Check if there is an ongoing reproduction cycle (laporan is in progress / not finished)
    const activePermintaan = await db('permintaan')
      .where({ sapi_id })
      .whereIn('status_permintaan', ['Menunggu', 'Diproses'])
      .first();
    if (activePermintaan) {
      return res.status(400).json({ success: false, message: 'Sapi ini masih memiliki proses reproduksi/laporan yang sedang berjalan.' });
    }

    const newPermintaan = await db.transaction(async (trx) => {
      const [permintaanRow] = await trx('permintaan').insert({
        sapi_id,
        peternak_id: req.user.role === 'peternak' ? req.user.id : sapi.peternak_id,
        lokasi_ternak,
        status_validitas: 'Valid',
        status_permintaan: 'Diproses',
        persetujuan_permintaan: 'Disetujui',
      }).returning('*');

      await trx('laporan').insert({
        id_permintaan: permintaanRow.id_permintaan,
        flag_menunggu_laporan: true,
        flag_laporan_ib: true,
        flag_laporan_kebuntingan: false,
        flag_laporan_keguguran: false,
        flag_laporan_kelahiran: false,
        tanggal_waktu: new Date(),
        tenggat_waktu: null
      });

      return permintaanRow;
    });

    return res.status(201).json({ success: true, message: 'Permintaan IB berhasil diajukan.', data: newPermintaan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/v1/permintaan — Admin: all permintaan with joins */
const getAllPermintaan = async (req, res) => {
  try {
    const { status_permintaan } = req.query;
    let query = db('permintaan')
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

    if (status_permintaan) {
      query = query.where('permintaan.status_permintaan', status_permintaan);
    }

    const data = await query;
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

    // Attach active laporan stage
    const enriched = await Promise.all(data.map(async (p) => {
      const activeLaporan = await db('laporan')
        .where({ id_permintaan: p.id_permintaan, flag_menunggu_laporan: true })
        .first();
      let tahap = 'Selesai';
      if (activeLaporan) {
        if (activeLaporan.flag_laporan_ib) tahap = 'Inseminasi Buatan (IB)';
        else if (activeLaporan.flag_laporan_kebuntingan) tahap = 'Pemeriksaan Kebuntingan';
        else if (activeLaporan.flag_laporan_keguguran && activeLaporan.flag_laporan_kelahiran) tahap = 'Pemantauan Kelahiran / Keguguran';
        else if (activeLaporan.flag_laporan_keguguran) tahap = 'Verifikasi Keguguran';
        else if (activeLaporan.flag_laporan_kelahiran) tahap = 'Laporan Kelahiran';
      }
      return { ...p, tahap_aktif: tahap };
    }));

    return res.status(200).json({ success: true, data: enriched });
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
    console.log('req.body in validasiPermintaan:', req.body);
    const { status_validitas, persetujuan_permintaan, alasan_penolakan, petugas_id } = req.body;
    
    let updated;
    await db.transaction(async (trx) => {
      const updates = { admin_id: req.user.id, updated_at: new Date() };
      if (status_validitas) updates.status_validitas = status_validitas;
      if (petugas_id) updates.petugas_id = petugas_id;
      if (persetujuan_permintaan) {
        updates.persetujuan_permintaan = persetujuan_permintaan;
        if (persetujuan_permintaan === 'Disetujui') updates.status_permintaan = 'Diproses';
        if (persetujuan_permintaan === 'Ditolak') {
          updates.status_permintaan = 'Ditolak';
          updates.alasan_penolakan = alasan_penolakan || null;
        }
      }
      console.log('updates:', updates);
      
      const resUpdate = await trx('permintaan').where({ id_permintaan: id }).update(updates).returning('*');
      updated = resUpdate[0];
      
      console.log('updated:', !!updated, 'persetujuan:', persetujuan_permintaan, 'petugas_id:', petugas_id);
      
      if (updated && persetujuan_permintaan === 'Disetujui' && petugas_id) {
        // Create Laporan placeholder
        await trx('laporan').insert({
          id_permintaan: id,
          flag_menunggu_laporan: true,
          flag_laporan_ib: true,
          flag_laporan_kebuntingan: false,
          flag_laporan_keguguran: false,
          flag_laporan_kelahiran: false,
          tanggal_waktu: new Date(),
          tenggat_waktu: null
        });
      }
    });

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

/** PUT /api/v1/permintaan/:id/tugaskan — Admin: assign petugas */
const tugaskanPetugas = async (req, res) => {
  try {
    const { id } = req.params;
    const { petugas_id } = req.body;
    if (!petugas_id) return res.status(400).json({ success: false, message: 'petugas_id wajib diisi.' });

    const [updated] = await db('permintaan').where({ id_permintaan: id })
      .update({ petugas_id, updated_at: new Date() })
      .returning('*');
    if (!updated) return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Petugas berhasil ditugaskan.', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PUT /api/v1/permintaan/:id/tugaskan-lanjutan — Admin: assign petugas for follow up */
const tugaskanLanjutan = async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis_laporan, petugas_id } = req.body;
    if (!jenis_laporan || !petugas_id) {
      return res.status(400).json({ success: false, message: 'jenis_laporan dan petugas_id wajib diisi.' });
    }
    
    await db.transaction(async (trx) => {
      const flags = {
        flag_menunggu_laporan: true,
        flag_laporan_ib: jenis_laporan === 'ib',
        flag_laporan_kebuntingan: jenis_laporan === 'kebuntingan',
        flag_laporan_keguguran: jenis_laporan === 'keguguran',
        flag_laporan_kelahiran: jenis_laporan === 'kelahiran',
      };
      
      await trx('laporan').insert({
        id_permintaan: id,
        ...flags,
        tanggal_waktu: new Date(),
        tenggat_waktu: null
      });
      
      await trx('permintaan').where({ id_permintaan: id }).update({ petugas_id, updated_at: new Date() });
    });
    
    return res.status(200).json({ success: true, message: `Petugas ditugaskan untuk ${jenis_laporan}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createPermintaan, getAllPermintaan, getMyPermintaan, getPermintaanById, validasiPermintaan, tutupPermintaan, tugaskanPetugas, tugaskanLanjutan };
