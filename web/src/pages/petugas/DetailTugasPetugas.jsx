import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { getStatusDisplay } from '../../utils/getStatusDisplay';
import ModalLaporanIB from '../../components/modals/ModalLaporanIB';
import ModalLaporanKebuntingan from '../../components/modals/ModalLaporanKebuntingan';
import ModalLaporanKeguguran from '../../components/modals/ModalLaporanKeguguran';
import ModalLaporanKelahiran from '../../components/modals/ModalLaporanKelahiran';

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

const DetailTugasPetugas = () => {
  const { laporan_id } = useParams(); // wait, the route from DashboardPetugas uses id_permintaan! Let's rename param to id_permintaan.
  const id_permintaan = laporan_id; 

  const [permintaan, setPermintaan] = useState(null);
  const [laporanList, setLaporanList] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'ib', 'kebuntingan', 'keguguran', 'kelahiran'

  const fetchData = async () => {
    try {
      const pRes = await apiClient.get(`/api/v1/permintaan/${id_permintaan}`);
      setPermintaan(pRes.data.data);
      const lRes = await apiClient.get(`/api/v1/laporan/permintaan/${id_permintaan}`);
      setLaporanList(lRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id_permintaan]);

  if (!permintaan) return <div>Loading...</div>;

  const activeLaporan = laporanList[laporanList.length - 1]; 
  const statusInfo = getStatusDisplay(permintaan, activeLaporan);

  let activeIndex = 0;
  if (permintaan.status_permintaan !== 'Menunggu') activeIndex = 1;
  if (activeLaporan?.flag_laporan_ib) activeIndex = 2;
  if (activeLaporan?.flag_laporan_kebuntingan) activeIndex = 3;
  if (activeLaporan?.flag_laporan_kelahiran || activeLaporan?.flag_laporan_keguguran) activeIndex = 4;
  if (permintaan.status_permintaan === 'Selesai') activeIndex = 5;

  const handleKonfirmasi = async () => {
    try {
      await apiClient.put(`/api/v1/tugas/${activeLaporan.id_laporan}/konfirmasi`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error konfirmasi tugas');
    }
  };

  const isConfirmed = !!activeLaporan?.tenggat_waktu;
  const showKonfirmasi = activeLaporan?.flag_menunggu_laporan && !isConfirmed;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Detail Tugas Permintaan #{permintaan.id_permintaan}</h2>
      
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
        <h3>Aksi Petugas</h3>
        {showKonfirmasi ? (
          <button onClick={handleKonfirmasi} style={{ background: 'blue', color: '#fff', padding: '10px' }}>Konfirmasi Tugas</button>
        ) : activeLaporan?.flag_menunggu_laporan ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeLaporan.flag_laporan_ib && <button onClick={() => setActiveModal('ib')}>Isi Laporan IB</button>}
            {activeLaporan.flag_laporan_kebuntingan && <button onClick={() => setActiveModal('kebuntingan')}>Isi Laporan Kebuntingan</button>}
            {activeLaporan.flag_laporan_keguguran && <button onClick={() => setActiveModal('keguguran')}>Isi Laporan Keguguran</button>}
            {activeLaporan.flag_laporan_kelahiran && <button onClick={() => setActiveModal('kelahiran')}>Isi Laporan Kelahiran</button>}
          </div>
        ) : (
          <p>Tugas selesai / menunggu tindakan Admin.</p>
        )}
      </div>

      {activeModal === 'ib' && <ModalLaporanIB laporanId={activeLaporan.id_laporan} onClose={() => { setActiveModal(null); fetchData(); }} />}
      {activeModal === 'kebuntingan' && <ModalLaporanKebuntingan laporanId={activeLaporan.id_laporan} onClose={() => { setActiveModal(null); fetchData(); }} />}
      {activeModal === 'keguguran' && <ModalLaporanKeguguran laporanId={activeLaporan.id_laporan} onClose={() => { setActiveModal(null); fetchData(); }} />}
      {activeModal === 'kelahiran' && <ModalLaporanKelahiran laporanId={activeLaporan.id_laporan} onClose={() => { setActiveModal(null); fetchData(); }} />}

    </div>
  );
};

export default DetailTugasPetugas;
