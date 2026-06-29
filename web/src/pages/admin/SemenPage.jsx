import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

const SemenPage = () => {
  const [semen, setSemen] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ kode_straw: '', semen_batch: '', tanggal_produksi: '', tanggal_kadaluarsa: '' });

  const fetchSemen = async () => {
    try {
      const res = await apiClient.get('/api/v1/semen');
      setSemen(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchSemen(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/v1/semen', formData);
      setShowForm(false);
      setFormData({ kode_straw: '', semen_batch: '', tanggal_produksi: '', tanggal_kadaluarsa: '' });
      fetchSemen();
    } catch (err) {
      console.error(err);
      alert('Error registering semen');
    }
  };

  const handleDelete = async (kode) => {
    if (!window.confirm('Yakin hapus?')) return;
    try {
      await apiClient.delete(`/api/v1/semen/${kode}`);
      fetchSemen();
    } catch (err) {
      console.error(err);
      alert('Error hapus semen');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manajemen Semen (Straw)</h2>
      <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px' }}>
        {showForm ? 'Batal' : 'Tambah Straw'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <div style={{ marginBottom: '10px' }}><input placeholder="Kode Straw" value={formData.kode_straw} onChange={e => setFormData({...formData, kode_straw: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input placeholder="Batch" value={formData.semen_batch} onChange={e => setFormData({...formData, semen_batch: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input type="date" placeholder="Produksi" value={formData.tanggal_produksi} onChange={e => setFormData({...formData, tanggal_produksi: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input type="date" placeholder="Kadaluarsa" value={formData.tanggal_kadaluarsa} onChange={e => setFormData({...formData, tanggal_kadaluarsa: e.target.value})} required /></div>
          <button type="submit">Simpan</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Kode Straw</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Batch</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tanggal Produksi</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tanggal Kadaluarsa</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {semen.map(s => {
            const isExpired = new Date(s.tanggal_kadaluarsa) < new Date();
            return (
              <tr key={s.kode_straw} style={{ color: isExpired ? 'red' : 'black' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{s.kode_straw}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{s.semen_batch}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(s.tanggal_produksi).toLocaleDateString()}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(s.tanggal_kadaluarsa).toLocaleDateString()} {isExpired && '(Expired)'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button onClick={() => handleDelete(s.kode_straw)}>Hapus</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SemenPage;
