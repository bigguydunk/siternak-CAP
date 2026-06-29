import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { getStatusDisplay } from '../../utils/getStatusDisplay';

const StatusTimeline = ({ activeIndex }) => {
  const steps = [
    'Pengajuan Permintaan', 'Validasi Admin', 'IB Awal', 
    'Cek Kebuntingan', 'Kelahiran / Keguguran', 'Selesai'
  ];
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      {steps.map((step, idx) => {
        let color = 'gray';
        if (idx < activeIndex) color = 'green';
        else if (idx === activeIndex) color = 'orange';
        return (
          <div key={idx} style={{ padding: '10px', border: `2px solid ${color}`, borderRadius: '5px', color }}>
            {step}
          </div>
        );
      })}
    </div>
  );
};

const DetailPermintaanAdmin = () => {
  const { id } = useParams();
  const [permintaan, setPermintaan] = useState(null);
  const [laporanList, setLaporanList] = useState([]);
  const [petugasList, setPetugasList] = useState([]);
  const [selectedPetugas, setSelectedPetugas] = useState('');
  const [alasan, setAlasan] = useState('');

  const fetchData = async () => {
    try {
      const pRes = await apiClient.get(`/api/v1/permintaan/${id}`);
      setPermintaan(pRes.data.data);
      const lRes = await apiClient.get(`/api/v1/laporan/permintaan/${id}`);
      setLaporanList(lRes.data.data);
      const ptRes = await apiClient.get('/api/v1/petugas');
      setPetugasList(ptRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!permintaan) return <div>Loading...</div>;

  const activeLaporan = laporanList[laporanList.length - 1]; // get the latest phase
  const statusInfo = getStatusDisplay(permintaan, activeLaporan);

  let activeIndex = 0;
  if (permintaan.status_permintaan !== 'Menunggu') activeIndex = 1;
  if (activeLaporan?.flag_laporan_ib) activeIndex = 2;
  if (activeLaporan?.flag_laporan_kebuntingan) activeIndex = 3;
  if (activeLaporan?.flag_laporan_kelahiran || activeLaporan?.flag_laporan_keguguran) activeIndex = 4;
  if (permintaan.status_permintaan === 'Selesai') activeIndex = 5;

  const handleValidasi = async (persetujuan) => {
    if (persetujuan === 'Disetujui' && !selectedPetugas) return alert('Pilih petugas!');
    try {
      await apiClient.put(`/api/v1/permintaan/${id}/validasi`, {
        status_validitas: persetujuan === 'Disetujui' ? 'Valid' : 'Tidak Valid',
        persetujuan_permintaan: persetujuan,
        alasan_penolakan: alasan,
        petugas_id: selectedPetugas || null
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleTugaskanLanjutan = async (jenis) => {
    if (!selectedPetugas) return alert('Pilih petugas!');
    try {
      await apiClient.put(`/api/v1/permintaan/${id}/tugaskan-lanjutan`, {
        jenis_laporan: jenis,
        petugas_id: selectedPetugas
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error tugaskan lanjutan');
    }
  };

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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Detail Permintaan #{permintaan.id_permintaan}</h2>
      
      <StatusTimeline activeIndex={activeIndex} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Info Sapi</h3>
          <p><strong>EarTag:</strong> {permintaan.sapi_eartag}</p>
          <p><strong>Berat:</strong> {permintaan.sapi_berat} kg</p>
          <p><strong>Gender:</strong> {permintaan.sapi_jenis_kelamin}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Info Peternak & Lokasi</h3>
          <p><strong>Nama:</strong> {permintaan.peternak_nama}</p>
          <p><strong>Kontak:</strong> {permintaan.peternak_kontak}</p>
          <p><strong>Lokasi:</strong> {permintaan.lokasi_ternak}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Status Saat Ini: <span style={{ color: statusInfo.color }}>{statusInfo.label}</span></h3>
        {activeLaporan?.tenggat_waktu && (
          <p style={{ color: new Date(activeLaporan.tenggat_waktu) < new Date() ? 'red' : 'black' }}>
            <strong>Tenggat Waktu:</strong> {new Date(activeLaporan.tenggat_waktu).toLocaleString()}
          </p>
        )}
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Riwayat Laporan</h3>
        {laporanList.length === 0 ? (
          <p>Belum ada laporan.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>ID Laporan</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Tipe</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Tanggal</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {laporanList.map((l) => {
                let tipe = 'Laporan';
                if (l.flag_laporan_ib) tipe = 'Inseminasi Buatan (IB)';
                else if (l.flag_laporan_kebuntingan) tipe = 'Pemeriksaan Kebuntingan';
                else if (l.flag_laporan_keguguran) tipe = 'Laporan Keguguran';
                else if (l.flag_laporan_kelahiran) tipe = 'Laporan Kelahiran';
                
                return (
                  <tr key={l.id_laporan}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>#{l.id_laporan}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tipe}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{new Date(l.tanggal_waktu).toLocaleString()}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd', color: l.flag_menunggu_laporan ? (l.petugas_id ? 'orange' : 'blue') : 'green' }}>
                      {l.flag_menunggu_laporan ? (l.petugas_id ? 'Menunggu Laporan' : 'Menunggu Petugas') : 'Selesai'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
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
        )}
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Aksi Admin</h3>
        {permintaan.status_permintaan === 'Menunggu' && (
          <div>
            <select value={selectedPetugas} onChange={e => setSelectedPetugas(e.target.value)} style={{ marginRight: '10px' }}>
              <option value="">-- Pilih Petugas --</option>
              {petugasList.map(pt => <option key={pt.petugas_id} value={pt.petugas_id}>{pt.petugas_nama}</option>)}
            </select>
            <button onClick={() => handleValidasi('Disetujui')} style={{ background: 'green', color: '#fff', marginRight: '10px' }}>Setujui & Tugaskan Petugas</button>
            
            <input type="text" placeholder="Alasan tolak" value={alasan} onChange={e => setAlasan(e.target.value)} style={{ marginRight: '10px' }} />
            <button onClick={() => handleValidasi('Ditolak')} style={{ background: 'red', color: '#fff' }}>Tolak Permintaan</button>
          </div>
        )}

        {/* Action needed if waiting for next task */}
        {permintaan.status_permintaan === 'Diproses' && !activeLaporan?.flag_menunggu_laporan && activeLaporan && (
           <div style={{ marginTop: '10px' }}>
             <select value={selectedPetugas} onChange={e => setSelectedPetugas(e.target.value)} style={{ marginRight: '10px' }}>
               <option value="">-- Pilih Petugas Lanjutan --</option>
               {petugasList.map(pt => <option key={pt.petugas_id} value={pt.petugas_id}>{pt.petugas_nama}</option>)}
             </select>
             {/* Evaluate what the next phase should be based on activeLaporan history */}
             <button onClick={() => handleTugaskanLanjutan('kebuntingan')} style={{ marginRight: '10px' }}>Tugaskan Cek Kebuntingan</button>
             <button onClick={() => handleTugaskanLanjutan('kelahiran')} style={{ marginRight: '10px' }}>Tugaskan Cek Kelahiran</button>
             <button onClick={() => handleTugaskanLanjutan('keguguran')}>Tugaskan Verifikasi Keguguran</button>
           </div>
        )}

        {permintaan.status_permintaan === 'Selesai' && <p>Siklus telah selesai. Hasil: {permintaan.hasil_akhir}</p>}
      </div>

    </div>
  );
};

export default DetailPermintaanAdmin;
