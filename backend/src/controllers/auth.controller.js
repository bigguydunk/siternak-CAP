const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const TABLES = {
  admin: { table: 'admin', idCol: 'admin_id', emailCol: 'admin_email', passCol: 'admin_password' },
  petugas: { table: 'petugas', idCol: 'petugas_id', emailCol: 'petugas_email', passCol: 'petugas_password' },
  peternak: { table: 'peternak', idCol: 'peternak_id', emailCol: 'peternak_email', passCol: 'peternak_password' },
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password, role: 'admin'|'petugas'|'peternak' }
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, dan role wajib diisi.' });
    }
    const cfg = TABLES[role];
    if (!cfg) {
      return res.status(400).json({ success: false, message: 'Role tidak valid. Gunakan admin, petugas, atau peternak.' });
    }

    const user = await db(cfg.table).where({ [cfg.emailCol]: email }).first();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user[cfg.passCol]);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const payload = { id: user[cfg.idCol], role, email: user[cfg.emailCol] };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    // Strip password from response
    const { [cfg.passCol]: _pass, ...userData } = user;
    return res.status(200).json({ success: true, message: 'Login berhasil.', token, role, user: userData });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/v1/auth/register/peternak
 * Body: { peternak_nama, peternak_email, peternak_password, peternak_kontak?, peternak_alamat? }
 */
const registerPeternak = async (req, res) => {
  try {
    const { peternak_nama, peternak_email, peternak_password, peternak_kontak, peternak_alamat } = req.body;
    if (!peternak_nama || !peternak_email || !peternak_password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }
    const exists = await db('peternak').where({ peternak_email }).first();
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    const hashedPassword = await bcrypt.hash(peternak_password, 10);
    const [newPeternak] = await db('peternak').insert({
      peternak_nama, peternak_email, peternak_password: hashedPassword, peternak_kontak, peternak_alamat,
    }).returning(['peternak_id', 'peternak_nama', 'peternak_email', 'peternak_kontak', 'peternak_alamat']);

    return res.status(201).json({ success: true, message: 'Registrasi peternak berhasil.', user: newPeternak });
  } catch (err) {
    console.error('registerPeternak error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/v1/auth/register/petugas  (Admin only)
 * Body: { petugas_nama, petugas_email, petugas_password, petugas_kontak? }
 */
const registerPetugas = async (req, res) => {
  try {
    const { petugas_nama, petugas_email, petugas_password, petugas_kontak } = req.body;
    if (!petugas_nama || !petugas_email || !petugas_password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }
    const exists = await db('petugas').where({ petugas_email }).first();
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    const hashedPassword = await bcrypt.hash(petugas_password, 10);
    const [newPetugas] = await db('petugas').insert({
      petugas_nama, petugas_email, petugas_password: hashedPassword, petugas_kontak,
    }).returning(['petugas_id', 'petugas_nama', 'petugas_email', 'petugas_kontak']);

    return res.status(201).json({ success: true, message: 'Akun petugas berhasil dibuat.', user: newPetugas });
  } catch (err) {
    console.error('registerPetugas error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/v1/auth/me  — returns current user profile based on JWT
 */
const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    const cfg = TABLES[role];
    const user = await db(cfg.table).where({ [cfg.idCol]: id }).first();
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    const { [cfg.passCol]: _pass, ...userData } = user;
    return res.status(200).json({ success: true, user: userData });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, registerPeternak, registerPetugas, getMe };
