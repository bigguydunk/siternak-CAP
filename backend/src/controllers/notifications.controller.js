const db = require('../db');

/** GET /api/v1/notifications/counts */
const getCounts = async (req, res) => {
  try {
    const { role, id } = req.user;

    let overdueCount = 0;
    let newPermintaanCount = 0;

    if (role === 'admin') {
      const overdueQuery = await db('laporan')
        .where('flag_menunggu_laporan', true)
        .whereNotNull('tenggat_waktu')
        .where('tenggat_waktu', '<', new Date())
        .count('id_laporan as cnt')
        .first();
      overdueCount = parseInt(overdueQuery.cnt, 10);

      const newPermintaanQuery = await db('permintaan')
        .where('status_permintaan', 'Menunggu')
        .count('id_permintaan as cnt')
        .first();
      newPermintaanCount = parseInt(newPermintaanQuery.cnt, 10);
    } else if (role === 'petugas') {
      const overdueQuery = await db('laporan')
        .join('permintaan', 'laporan.id_permintaan', 'permintaan.id_permintaan')
        .where('permintaan.petugas_id', id)
        .where('laporan.flag_menunggu_laporan', true)
        .whereNotNull('laporan.tenggat_waktu')
        .where('laporan.tenggat_waktu', '<', new Date())
        .count('laporan.id_laporan as cnt')
        .first();
      overdueCount = parseInt(overdueQuery.cnt, 10);
    }

    return res.status(200).json({ success: true, data: { overdue: overdueCount, new: newPermintaanCount } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCounts };
