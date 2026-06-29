export function getStatusDisplay(permintaan, laporan) {
  const sp = permintaan?.status_permintaan;
  const flags = laporan || {};

  if (sp === 'Menunggu') return { label: 'Menunggu Validasi Admin', color: 'gray' };
  if (sp === 'Ditolak') return { label: 'Ditolak', color: 'red' };
  
  if (flags.flag_menunggu_laporan && !permintaan?.petugas_id) {
    return { label: 'Menunggu Petugas', color: 'blue' };
  }
  
  if (flags.flag_laporan_ib && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Laporan IB', color: 'orange' };
  if (flags.flag_laporan_kebuntingan && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Cek Kebuntingan', color: 'blue' };
  if (flags.flag_laporan_kelahiran && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Laporan Kelahiran', color: 'purple' };
  if (flags.flag_laporan_keguguran && flags.flag_menunggu_laporan)
    return { label: 'Verifikasi Keguguran', color: 'darkred' };
  if (sp === 'Selesai') return { label: 'Selesai', color: 'green' };
  
  // If no flags match but it's assigned or in progress
  return { label: sp || 'Tidak Diketahui', color: 'gray' };
}
