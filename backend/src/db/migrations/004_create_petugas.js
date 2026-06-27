/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('petugas', (table) => {
    table.increments('petugas_id').primary();
    table.string('petugas_nama', 100).notNullable();
    table.string('petugas_kontak', 20).nullable();
    table.string('petugas_email', 100).notNullable().unique();
    table.string('petugas_password', 255).notNullable();
    table.text('petugas_kinerja').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('petugas');
};
