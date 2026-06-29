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

const ModalLaporanKebuntingan = ({ laporanId, onClose }) => {
  const [formData, setFormData] = useState({
    isi_laporan_kebuntingan: '', waktu_kebuntingan: '', hasil_pemeriksaan: 'Bunting', tanggal_hpl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/v1/laporan/kebuntingan/${laporanId}`, formData);
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
        <h3>Isi Laporan Kebuntingan</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea placeholder="Isi laporan..." value={formData.isi_laporan_kebuntingan} onChange={e => setFormData({...formData, isi_laporan_kebuntingan: e.target.value})} required />
          <input type="datetime-local" value={formData.waktu_kebuntingan} onChange={e => setFormData({...formData, waktu_kebuntingan: e.target.value})} required />
          
          <div>
            <label>Hasil Pemeriksaan: </label>
            <label><input type="radio" checked={formData.hasil_pemeriksaan === 'Bunting'} onChange={() => setFormData({...formData, hasil_pemeriksaan: 'Bunting'})} /> Bunting</label>
            <label><input type="radio" checked={formData.hasil_pemeriksaan === 'Tidak Bunting'} onChange={() => setFormData({...formData, hasil_pemeriksaan: 'Tidak Bunting'})} /> Tidak Bunting</label>
          </div>

          {formData.hasil_pemeriksaan === 'Bunting' && (
            <div>
              <label>Tanggal HPL: </label>
              <input type="date" value={formData.tanggal_hpl} onChange={e => setFormData({...formData, tanggal_hpl: e.target.value})} required />
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose}>Batal</button>
            <button type="submit" style={{ background: 'blue', color: 'white' }}>Simpan</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ModalLaporanKebuntingan;
