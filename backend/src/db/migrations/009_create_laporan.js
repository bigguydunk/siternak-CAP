/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('laporan', (table) => {
    table.increments('id_laporan').primary();
    table.integer('id_permintaan').unsigned().notNullable()
      .references('id_permintaan').inTable('permintaan').onDelete('CASCADE');
    // Five boolean flags as state machine for the report cycle stage
    table.boolean('flag_menunggu_laporan').defaultTo(true);
    table.boolean('flag_laporan_ib').defaultTo(false);
    table.boolean('flag_laporan_kebuntingan').defaultTo(false);
    table.boolean('flag_laporan_keguguran').defaultTo(false);
    table.boolean('flag_laporan_kelahiran').defaultTo(false);
    table.timestamp('tanggal_waktu').nullable();
    table.timestamp('tugas_ib_awal').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('laporan');
};
