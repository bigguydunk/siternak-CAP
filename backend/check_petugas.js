const db = require('./src/db');

async function main() {
  try {
    const petugas = await db('petugas').first();
    console.log("Found petugas:", petugas);
    if (!petugas) {
      console.log("Inserting dummy petugas...");
      await db('petugas').insert({
        petugas_nama: 'Dummy Petugas',
        petugas_email: 'dummy@petugas.com',
        petugas_password: 'dummy'
      });
      console.log("Inserted!");
    }
    
    // Also let's clean up those broken laporan rows!
    const deleted = await db('laporan')
      .where('flag_laporan_ib', true)
      .whereNotIn('id_laporan', db('laporan_ib').select('laporan_id'))
      .del();
      
    console.log("Deleted broken laporan rows:", deleted);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}

main();
