/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('laporan_ib', (table) => {
    // Shared PK pattern: laporan_id is both PK and FK → laporan.id_laporan
    table.integer('laporan_id').unsigned().primary()
      .references('id_laporan').inTable('laporan').onDelete('CASCADE');
    table.integer('petugas_id').unsigned().notNullable()
      .references('petugas_id').inTable('petugas').onDelete('RESTRICT');
    // kode_straw is nullable (IB may fail before straw is recorded)
    table.string('kode_straw', 50).nullable()
      .references('kode_straw').inTable('semen').onDelete('SET NULL');
    table.timestamp('tanggal_pengajuan').defaultTo(knex.fn.now());
    table.text('isi_laporan_ib').nullable();
    table.timestamp('waktu_proses_ib').nullable();
    table.boolean('is_success').nullable();
    table.text('komentar').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('laporan_ib');
};
