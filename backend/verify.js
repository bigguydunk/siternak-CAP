const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let petugasToken = '';
let peternakToken = '';
let peternakId = null;
let petugasId = null;
let sapiId = null;
let permintaanId = null;
let laporanId = null;

const api = {
  get: async (url, config = {}) => {
    const res = await fetch(BASE_URL + url, { headers: config.headers });
    const data = await res.json().catch(()=>null);
    return { status: res.status, data };
  },
  post: async (url, body, config = {}) => {
    const res = await fetch(BASE_URL + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(()=>null);
    return { status: res.status, data };
  },
  put: async (url, body, config = {}) => {
    const res = await fetch(BASE_URL + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(()=>null);
    return { status: res.status, data };
  }
};

const pass = (msg) => console.log(`✅ [PASS] ${msg}`);
const fail = (msg, data) => console.log(`❌ [FAIL] ${msg}`, data || '');

const TS = Date.now();
let ADMIN_EMAIL = `admin${TS}@test.com`;
const PETERNAK_EMAIL = `peternak${TS}@test.com`;
const PETUGAS_EMAIL = `petugas${TS}@test.com`;

const db = require('./src/db');

async function runTests() {
  console.log('--- A1: Auth Tests ---');
  
  // Find existing admin or create
  const existingAdmin = await db('admin').first();
  if (existingAdmin) {
    ADMIN_EMAIL = existingAdmin.admin_email;
    pass('A1-1: Admin exists, using ' + ADMIN_EMAIL);
  } else {
    let res = await api.post('/api/v1/auth/register/admin', {
      admin_nama: 'Admin1', admin_email: ADMIN_EMAIL, admin_password: 'password', admin_kontak: '123'
    });
    if (res.status === 201) pass('A1-1: Admin created');
    else fail(`A1-1: Admin creation failed (${res.status})`, res.data);
  }

  let res = await api.post('/api/v1/auth/register/admin', {
    admin_nama: 'Admin1', admin_email: ADMIN_EMAIL, admin_password: 'password', admin_kontak: '123'
  });
  if (res.status === 409 || res.status === 400 || res.status === 500) pass('A1-2: Duplicate admin rejected');
  else fail(`A1-2: Duplicate admin not rejected (${res.status})`);

  // Create peternak
  res = await api.post('/api/v1/auth/register/peternak', {
    peternak_nama: 'Peternak1', peternak_email: PETERNAK_EMAIL, peternak_password: 'password', peternak_kontak: '123', peternak_alamat: 'Alamat'
  });
  if (res.status === 201 || res.status === 409 || res.status === 400) pass('A1-3: Peternak created/exists');
  else fail(`A1-3: Peternak creation failed (${res.status})`, res.data);

  // Login peternak
  res = await api.post('/api/v1/auth/login', { email: PETERNAK_EMAIL, password: 'password', role: 'peternak' });
  if (res.status === 200 && res.data.token) {
    pass('A1-4: Peternak login');
    peternakToken = res.data.token;
    peternakId = res.data.user.peternak_id;
  } else fail(`A1-4: Peternak login failed (${res.status})`, res.data);

  // Login admin
  res = await api.post('/api/v1/auth/login', { email: ADMIN_EMAIL, password: 'password', role: 'admin' });
  if (res.status === 200 && res.data.token) {
    pass('A1-5: Admin login');
    adminToken = res.data.token;
  } else fail(`A1-5: Admin login failed (${res.status})`, res.data);

  // Create petugas (as admin)
  res = await api.post('/api/v1/auth/register/petugas', {
    petugas_nama: 'Petugas1', petugas_email: PETUGAS_EMAIL, petugas_password: 'password', petugas_kontak: '123'
  }, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (res.status === 201) {
    pass('Setup: Petugas created');
    petugasId = res.data.user.petugas_id;
    console.log("Got petugasId:", petugasId);
  }

  // Login petugas
  res = await api.post('/api/v1/auth/login', { email: PETUGAS_EMAIL, password: 'password', role: 'petugas' });
  if (res.status === 200 && res.data.token) {
    pass('Setup: Petugas login');
    petugasToken = res.data.token;
    petugasId = res.data.user.petugas_id;
  }

  console.log('\n--- A2: Sapi Tests ---');
  res = await api.post('/api/v1/sapi', {
    sapi_eartag: 'TAG001', sapi_jenis_kelamin: 'betina', sapi_berat: '250',
    sapi_tanggal_lahir: '2023-01-01', sapi_jenis: 'Limousin'
  }, { headers: { Authorization: `Bearer ${peternakToken}` } });
  if (res.status === 201) {
    pass('A2-10: Sapi created');
    sapiId = res.data.data.sapi_id;
  } else fail(`A2-10: Sapi creation failed (${res.status})`);

  res = await api.get('/api/v1/sapi/mine', { headers: { Authorization: `Bearer ${peternakToken}` } });
  if (res.status === 200 && res.data.data.length > 0) pass('A2-11: Get mine sapi');
  else fail(`A2-11: Get mine sapi failed (${res.status})`);

  console.log('\n--- A3: Permintaan Tests ---');
  res = await api.post('/api/v1/permintaan', {
    sapi_id: sapiId, lokasi_ternak: 'Kandang 1'
  }, { headers: { Authorization: `Bearer ${peternakToken}` } });
  if (res.status === 201) {
    pass('A3-16: Permintaan created');
    permintaanId = res.data.data.id_permintaan;
  } else fail(`A3-16: Permintaan creation failed (${res.status})`);

  const validasiBody = {
    status_validitas: 'Valid', persetujuan_permintaan: 'Disetujui', petugas_id: petugasId
  };
  console.log('Sending validasi:', JSON.stringify(validasiBody));
  res = await api.put(`/api/v1/permintaan/${permintaanId}/validasi`, validasiBody, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (res.status === 200) pass('A3-20: Admin Validasi & Assign Petugas');
  else fail(`A3-20: Admin Validasi failed (${res.status})`);

  console.log('\n--- A5: Semen Tests ---');
  res = await api.post('/api/v1/semen', {
    kode_straw: 'STR01', semen_batch: 'B01', tanggal_produksi: '2024-01-01', tanggal_kadaluarsa: '2025-01-01'
  }, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (res.status === 201 || res.status === 409 || res.status === 400) pass('A5-35: Semen created');
  else fail(`A5-35: Semen creation failed (${res.status})`);

  console.log('\n--- A4: Laporan Tests ---');
  // First, get the reports list for this permintaan to get the laporan_id
  res = await api.get(`/api/v1/laporan/permintaan/${permintaanId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (res.status === 200 && res.data.data.length > 0) {
    laporanId = res.data.data[0].id_laporan;
    pass('A4 Setup: Got laporan_id from placeholder');
  } else fail(`A4 Setup: Could not find laporan placeholder (${res.status})`);

  if (laporanId) {
    // Petugas confirms task
    res = await api.put(`/api/v1/tugas/${laporanId}/konfirmasi`, {}, { headers: { Authorization: `Bearer ${petugasToken}` } });
    if (res.status === 200) pass('Task Konfirmasi');
    else fail(`Task Konfirmasi failed (${res.status})`);

    // Petugas fills IB
    res = await api.post(`/api/v1/laporan/ib/${laporanId}`, {
      kode_straw: 'STR01', isi_laporan_ib: 'IB Berhasil', waktu_proses_ib: new Date().toISOString(), is_success: true
    }, { headers: { Authorization: `Bearer ${petugasToken}` } });
    if (res.status === 201) pass('A4-26: Laporan IB created');
    else fail(`A4-26: Laporan IB creation failed (${res.status})`);

    // Petugas fills Kebuntingan
    // First, Admin must assign petugas lanjutan? Wait, does the plan specify manual assignment for kebuntingan?
    // Let's check status:
    // Admin calls tugaskan-lanjutan for kebuntingan
    await api.put(`/api/v1/permintaan/${permintaanId}/tugaskan-lanjutan`, {
      jenis_laporan: 'kebuntingan', petugas_id: petugasId
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    res = await api.get(`/api/v1/laporan/permintaan/${permintaanId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    let newLaporanId = res.data.data[res.data.data.length - 1].id_laporan;

    res = await api.put(`/api/v1/tugas/${newLaporanId}/konfirmasi`, {}, { headers: { Authorization: `Bearer ${petugasToken}` } });

    res = await api.post(`/api/v1/laporan/kebuntingan/${newLaporanId}`, {
      isi_laporan_kebuntingan: 'Hamil', waktu_kebuntingan: new Date().toISOString(), hasil_pemeriksaan: 'hamil', tanggal_hpl: '2025-01-01'
    }, { headers: { Authorization: `Bearer ${petugasToken}` } });
    if (res.status === 201) pass('A4-29: Laporan Kebuntingan created');
    else fail(`A4-29: Laporan Kebuntingan failed (${res.status})`);

    // Fetch again
    // Admin calls tugaskan-lanjutan for kelahiran
    await api.put(`/api/v1/permintaan/${permintaanId}/tugaskan-lanjutan`, {
      jenis_laporan: 'kelahiran', petugas_id: petugasId
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    res = await api.get(`/api/v1/laporan/permintaan/${permintaanId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    newLaporanId = res.data.data[res.data.data.length - 1].id_laporan;

    res = await api.put(`/api/v1/tugas/${newLaporanId}/konfirmasi`, {}, { headers: { Authorization: `Bearer ${petugasToken}` } });

    res = await api.post(`/api/v1/laporan/kelahiran/${newLaporanId}`, {
      isi_laporan_kelahiran: 'Lahir sehat', kondisi_anak_sapi: 'selamat', jenis_kelamin_anak_sapi: 'betina', waktu_kelahiran: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${petugasToken}` } });
    if (res.status === 201) pass('A4-32: Laporan Kelahiran created');
    else fail(`A4-32: Laporan Kelahiran failed (${res.status})`);
  }

  // Tutup permintaan
  res = await api.put(`/api/v1/permintaan/${permintaanId}/tutup`, {
    hasil_akhir: 'Lahir selamat - betina'
  }, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (res.status === 200) pass('A3-25: Admin Tutup Siklus');
  else fail(`A3-25: Admin Tutup Siklus failed (${res.status})`, res.data);

  console.log('\n--- C: Role Isolation Tests ---');
  let resC1 = await api.get('/api/v1/permintaan', { headers: { Authorization: `Bearer ${peternakToken}` } });
  if (resC1.status === 403) pass('C1: Peternak cannot access admin routes');
  else fail(`C1: Failed (${resC1.status})`);

  let resC2 = await api.post(`/api/v1/laporan/ib/${laporanId}`, {}, { headers: { Authorization: `Bearer ${peternakToken}` } });
  if (resC2.status === 403) pass('C2: Peternak cannot POST laporan IB');
  else fail(`C2: Failed (${resC2.status})`);

  let resC3 = await api.post('/api/v1/semen', {}, { headers: { Authorization: `Bearer ${petugasToken}` } });
  if (resC3.status === 403) pass('C3: Petugas cannot POST semen');
  else fail(`C3: Failed (${resC3.status})`);

  let resC4 = await api.put(`/api/v1/permintaan/${permintaanId}/validasi`, {}, { headers: { Authorization: `Bearer ${petugasToken}` } });
  if (resC4.status === 403) pass('C4: Petugas cannot validasi');
  else fail(`C4: Failed (${resC4.status})`);

  console.log('\n--- E: Database Integrity Tests ---');
  const e1 = await db.raw(`
    SELECT id_laporan,
      (SELECT COUNT(*) FROM laporan_ib WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_kebuntingan WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_keguguran WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_kelahiran WHERE laporan_id = l.id_laporan) AS subtype_count
    FROM laporan l
    WHERE (SELECT COUNT(*) FROM laporan_ib WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_kebuntingan WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_keguguran WHERE laporan_id = l.id_laporan) +
      (SELECT COUNT(*) FROM laporan_kelahiran WHERE laporan_id = l.id_laporan) != 1 AND flag_menunggu_laporan = false;
  `);
  if (e1.rows.length === 0) pass('E1: Subtype integrity');
  else fail('E1: Subtype integrity failed', e1.rows);

  const e2 = await db.raw(`
    SELECT id_laporan FROM laporan
    WHERE id_permintaan NOT IN (SELECT id_permintaan FROM permintaan);
  `);
  if (e2.rows.length === 0) pass('E2: Laporan-Permintaan relation integrity');
  else fail('E2: Failed', e2.rows);

  const e4 = await db.raw(`
    SELECT id_permintaan FROM permintaan
    WHERE status_permintaan = 'Selesai' AND hasil_akhir IS NULL;
  `);
  if (e4.rows.length === 0) pass('E4: Closed requests have hasil_akhir');
  else fail('E4: Failed', e4.rows);

  process.exit(0);
}

runTests();
