import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { getStatusDisplay } from '../../utils/getStatusDisplay';
import { useNavigate } from 'react-router-dom';

const NotifCard = ({ title, count, color }) => (
  <div style={{ padding: '20px', border: `1px solid ${color}`, borderRadius: '8px', minWidth: '150px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
    <h4 style={{ margin: '0 0 10px 0', color: color }}>{title}</h4>
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
  </div>
);

const DashboardPetugas = () => {
  const [counts, setCounts] = useState({ overdue: 0, new: 0 });
  const [tugasList, setTugasList] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const resCounts = await apiClient.get('/api/v1/notifications/counts');
      setCounts(resCounts.data.data);

      const resTugas = await apiClient.get('/api/v1/petugas/tugas');
      setTugasList(resTugas.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Petugas</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <NotifCard title="Tugas Terlambat" count={counts.overdue} color="red" />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sapi EarTag</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Peternak</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Lokasi</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {tugasList.map((t) => {
            const statusDisplay = getStatusDisplay(t, null); // We don't have active laporan directly in this list payload usually, but let's just pass status
            return (
              <tr key={t.id_permintaan}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.sapi_eartag}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.peternak_nama}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.lokasi_ternak}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', color: statusDisplay.color }}>{statusDisplay.label}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button onClick={() => navigate(`/petugas/tugas/${t.id_permintaan}`)}>Detail Tugas</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardPetugas;
