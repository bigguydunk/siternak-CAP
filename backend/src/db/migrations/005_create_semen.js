/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('semen', (table) => {
    // kode_straw is the PK (not auto-increment) — it's a business code like "STR01"
    table.string('kode_straw', 50).primary();
    table.string('semen_batch', 50).nullable();
    table.timestamp('tanggal_produksi').nullable();
    table.timestamp('tanggal_kadaluarsa').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('semen');
};
