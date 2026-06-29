const db = require('../db');

/** PUT /api/v1/tugas/:laporan_id/konfirmasi */
const konfirmasiTugas = async (req, res) => {
  try {
    const { laporan_id } = req.params;

    const laporan = await db('laporan').where({ id_laporan: laporan_id }).first();
    if (!laporan) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    // Ensure logged in petugas is assigned to this or task is unassigned
    const permintaan = await db('permintaan').where({ id_permintaan: laporan.id_permintaan }).first();
    if (permintaan.petugas_id !== null && permintaan.petugas_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tugas ini bukan milik Anda.' });
    }

    let jenisStatus = '';
    if (laporan.flag_laporan_ib) jenisStatus = 'IB';
    else if (laporan.flag_laporan_kebuntingan) jenisStatus = 'Cek Kebuntingan';
    else if (laporan.flag_laporan_keguguran) jenisStatus = 'Verifikasi Keguguran';
    else if (laporan.flag_laporan_kelahiran) jenisStatus = 'Cek Kelahiran';
    else jenisStatus = 'Laporan';

    const nextDeadline = new Date();
    nextDeadline.setHours(nextDeadline.getHours() + 24);

    await db.transaction(async (trx) => {
      await trx('laporan').where({ id_laporan: laporan_id }).update({
        tenggat_waktu: nextDeadline,
      });

      const updates = { updated_at: new Date() };
      if (permintaan.petugas_id === null) {
        updates.petugas_id = req.user.id;
      }
      await trx('permintaan').where({ id_permintaan: laporan.id_permintaan }).update(updates);
    });

    return res.status(200).json({ success: true, message: 'Tugas dikonfirmasi.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { konfirmasiTugas };
