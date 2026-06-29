import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

const NotifCard = ({ title, count, color }) => (
  <div style={{ padding: '20px', border: `1px solid ${color}`, borderRadius: '8px', minWidth: '150px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
    <h4 style={{ margin: '0 0 10px 0', color: color }}>{title}</h4>
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
  </div>
);

const DashboardAdmin = () => {
  const [counts, setCounts] = useState({ overdue: 0, new: 0 });
  const [laporanList, setLaporanList] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const resCounts = await apiClient.get('/api/v1/notifications/counts');
      setCounts(resCounts.data.data);

      const resLaporan = await apiClient.get('/api/v1/laporan');
      setLaporanList(resLaporan.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteLaporan = async (laporanId) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus laporan #${laporanId}?`)) return;
    try {
      await apiClient.delete(`/api/v1/laporan/${laporanId}`);
      alert('Laporan berhasil dihapus.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus laporan.');
    }
  };

  // Apply filters locally
  const filteredLaporan = laporanList.filter(l => {
    // Type Filter
    if (typeFilter === 'ib' && !l.flag_laporan_ib) return false;
    if (typeFilter === 'kebuntingan' && !l.flag_laporan_kebuntingan) return false;
    if (typeFilter === 'kelahiran' && !l.flag_laporan_kelahiran) return false;
    if (typeFilter === 'keguguran' && !l.flag_laporan_keguguran) return false;

    // Status Filter
    if (statusFilter === 'menunggu' && !l.flag_menunggu_laporan) return false;
    if (statusFilter === 'selesai' && l.flag_menunggu_laporan) return false;

    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Admin - Daftar Laporan</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <NotifCard title="Permintaan Baru" count={counts.new} color="blue" />
        <NotifCard title="Laporan Terlambat" count={counts.overdue} color="red" />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label>Filter Tipe Laporan: </label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="ib">Inseminasi Buatan (IB)</option>
            <option value="kebuntingan">Pemeriksaan Kebuntingan</option>
            <option value="kelahiran">Cek Kelahiran</option>
            <option value="keguguran">Verifikasi Keguguran</option>
          </select>
        </div>

        <div>
          <label>Filter Status: </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="menunggu">Menunggu Laporan</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>No.</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID Laporan</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Peternak</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sapi EarTag</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Lokasi</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tipe Laporan</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tanggal</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredLaporan.map((l, idx) => {
            let tipe = 'Laporan';
            if (l.flag_laporan_ib) tipe = 'Inseminasi Buatan (IB)';
            else if (l.flag_laporan_kebuntingan) tipe = 'Pemeriksaan Kebuntingan';
            else if (l.flag_laporan_keguguran) tipe = 'Laporan Keguguran';
            else if (l.flag_laporan_kelahiran) tipe = 'Laporan Kelahiran';

            return (
              <tr key={l.id_laporan}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>#{l.id_laporan}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{l.peternak_nama || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{l.sapi_eartag || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{l.lokasi_ternak || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tipe}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(l.tanggal_waktu).toLocaleString()}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', color: l.flag_menunggu_laporan ? (l.petugas_id ? 'orange' : 'blue') : 'green' }}>
                  {l.flag_menunggu_laporan ? (l.petugas_id ? 'Menunggu Laporan' : 'Menunggu Petugas') : 'Selesai'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button 
                    onClick={() => navigate(`/admin/permintaan/${l.id_permintaan}`)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  >
                    Detail
                  </button>
                  <button 
                    onClick={() => handleDeleteLaporan(l.id_laporan)}
                    style={{ background: 'red', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardAdmin;
