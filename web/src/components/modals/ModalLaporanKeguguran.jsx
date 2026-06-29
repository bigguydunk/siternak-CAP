import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const modalStyle = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  background: '#fff', padding: '20px', border: '1px solid #ccc', zIndex: 1000,
  width: '400px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
};
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', zIndex: 999
};

const ModalLaporanKeguguran = ({ laporanId, onClose }) => {
  const [formData, setFormData] = useState({
    isi_laporan_keguguran: '', waktu_keguguran: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/v1/laporan/keguguran/${laporanId}`, formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error submit laporan');
    }
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <h3>Isi Laporan Keguguran</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea placeholder="Isi laporan..." value={formData.isi_laporan_keguguran} onChange={e => setFormData({...formData, isi_laporan_keguguran: e.target.value})} required />
          <input type="datetime-local" value={formData.waktu_keguguran} onChange={e => setFormData({...formData, waktu_keguguran: e.target.value})} required />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose}>Batal</button>
            <button type="submit" style={{ background: 'blue', color: 'white' }}>Simpan</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ModalLaporanKeguguran;
