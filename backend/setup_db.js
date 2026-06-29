const db = require('./src/db');
const bcrypt = require('bcryptjs');

async function setup() {
  try {
    console.log('Clearing old data...');
    await db.raw('TRUNCATE TABLE admin, peternak, petugas, semen, sapi CASCADE');
    
    console.log('Creating fresh admin account...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db('admin').insert({
      admin_nama: 'Administrator TernakKu',
      admin_email: 'admin@ternakku.com',
      admin_password: hashedPassword,
      admin_kontak: '081234567890'
    });
    console.log('Admin account created successfully.');
  } catch (err) {
    console.error('Failed to setup DB:', err);
  } finally {
    process.exit(0);
  }
}

setup();
