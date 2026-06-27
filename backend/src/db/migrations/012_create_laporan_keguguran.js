/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('laporan_keguguran', (table) => {
    table.integer('laporan_id').unsigned().primary()
      .references('id_laporan').inTable('laporan').onDelete('CASCADE');
    table.integer('petugas_id').unsigned().notNullable()
      .references('petugas_id').inTable('petugas').onDelete('RESTRICT');
    table.timestamp('tanggal_pengajuan').defaultTo(knex.fn.now());
    table.text('isi_laporan_keguguran').nullable();
    table.timestamp('waktu_keguguran').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('laporan_keguguran');
};
