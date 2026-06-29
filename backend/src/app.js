require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const cors = require('cors');

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static: serve uploaded photos ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'TernakKu API is running.', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/peternak',   require('./routes/peternak.routes'));
app.use('/api/v1/sapi',       require('./routes/sapi.routes'));
app.use('/api/v1/foto',       require('./routes/foto.routes'));
app.use('/api/v1/permintaan', require('./routes/permintaan.routes'));
app.use('/api/v1/laporan',    require('./routes/laporan.routes'));
app.use('/api/v1/semen',      require('./routes/semen.routes'));
app.use('/api/v1/petugas',    require('./routes/petugas.routes'));
app.use('/api/v1/notifications', require('./routes/notifications.routes'));
app.use('/api/v1/tugas',      require('./routes/tugas.routes'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran file melebihi batas 5 MB.' });
  }
  if (err.message && err.message.includes('gambar')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

module.exports = app;
