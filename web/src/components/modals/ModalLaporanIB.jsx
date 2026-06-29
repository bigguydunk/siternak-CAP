import React, { useState, useEffect } from 'react';
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

const ModalLaporanIB = ({ laporanId, onClose }) => {
  const [semen, setSemen] = useState([]);
  const [formData, setFormData] = useState({
    kode_straw: '', isi_laporan_ib: '', waktu_proses_ib: '', is_success: true, komentar: ''
  });

  useEffect(() => {
    apiClient.get('/api/v1/semen').then(res => setSemen(res.data.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/v1/laporan/ib/${laporanId}`, formData);
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
        <h3>Isi Laporan IB</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={formData.kode_straw} onChange={e => setFormData({...formData, kode_straw: e.target.value})}>
            <option value="">-- Pilih Straw (Opsional) --</option>
            {semen.map(s => <option key={s.kode_straw} value={s.kode_straw}>{s.kode_straw}</option>)}
          </select>
          <textarea placeholder="Isi laporan..." value={formData.isi_laporan_ib} onChange={e => setFormData({...formData, isi_laporan_ib: e.target.value})} required />
          <input type="datetime-local" value={formData.waktu_proses_ib} onChange={e => setFormData({...formData, waktu_proses_ib: e.target.value})} required />
          
          <div>
            <label>Hasil IB: </label>
            <label><input type="radio" name="hasil" checked={formData.is_success === true} onChange={() => setFormData({...formData, is_success: true})} /> Berhasil</label>
            <label><input type="radio" name="hasil" checked={formData.is_success === false} onChange={() => setFormData({...formData, is_success: false})} /> Gagal</label>
          </div>

          <textarea placeholder="Komentar tambahan" value={formData.komentar} onChange={e => setFormData({...formData, komentar: e.target.value})} />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose}>Batal</button>
            <button type="submit" style={{ background: 'blue', color: 'white' }}>Simpan</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ModalLaporanIB;
