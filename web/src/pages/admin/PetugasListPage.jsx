import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

const PetugasListPage = () => {
  const [petugas, setPetugas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nama: '', email: '', password: '', kontak: '' });

  const fetchPetugas = async () => {
    try {
      const res = await apiClient.get('/api/v1/petugas');
      setPetugas(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPetugas(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/v1/auth/register/petugas', {
        petugas_nama: formData.nama,
        petugas_email: formData.email,
        petugas_password: formData.password,
        petugas_kontak: formData.kontak
      });
      setShowForm(false);
      setFormData({ nama: '', email: '', password: '', kontak: '' });
      fetchPetugas();
    } catch (err) {
      console.error(err);
      alert('Error registering petugas');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manajemen Petugas</h2>
      <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px' }}>
        {showForm ? 'Batal' : 'Tambah Petugas'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <div style={{ marginBottom: '10px' }}><input placeholder="Nama" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required /></div>
          <div style={{ marginBottom: '10px' }}><input placeholder="Kontak" value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} required /></div>
          <button type="submit">Simpan</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nama</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Kontak</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Kinerja</th>
          </tr>
        </thead>
        <tbody>
          {petugas.map(p => (
            <tr key={p.petugas_id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.petugas_nama}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.petugas_email}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.petugas_kontak}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.petugas_kinerja || '0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PetugasListPage;
