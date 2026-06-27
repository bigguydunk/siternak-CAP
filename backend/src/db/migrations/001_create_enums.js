/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    .raw(`CREATE TYPE jenis_kelamin_enum AS ENUM ('jantan', 'betina')`)
    .raw(`CREATE TYPE foto_tipe_enum AS ENUM ('depan', 'belakang', 'umum')`)
    .raw(`CREATE TYPE status_validitas_enum AS ENUM ('Menunggu', 'Valid', 'Tidak Valid')`)
    .raw(`CREATE TYPE persetujuan_enum AS ENUM ('Disetujui', 'Ditolak')`)
    .raw(`CREATE TYPE status_permintaan_enum AS ENUM ('Menunggu', 'Diproses', 'Selesai', 'Ditolak', 'Gagal')`)
    .raw(`CREATE TYPE hasil_pemeriksaan_enum AS ENUM ('hamil', 'birahi', 'tidak hamil')`)
    .raw(`CREATE TYPE kondisi_anak_sapi_enum AS ENUM ('selamat', 'mati lahir')`)
    .raw(`CREATE TYPE role_enum AS ENUM ('admin', 'petugas', 'peternak')`);
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema
    .raw(`DROP TYPE IF EXISTS role_enum`)
    .raw(`DROP TYPE IF EXISTS kondisi_anak_sapi_enum`)
    .raw(`DROP TYPE IF EXISTS hasil_pemeriksaan_enum`)
    .raw(`DROP TYPE IF EXISTS status_permintaan_enum`)
    .raw(`DROP TYPE IF EXISTS persetujuan_enum`)
    .raw(`DROP TYPE IF EXISTS status_validitas_enum`)
    .raw(`DROP TYPE IF EXISTS foto_tipe_enum`)
    .raw(`DROP TYPE IF EXISTS jenis_kelamin_enum`);
};
