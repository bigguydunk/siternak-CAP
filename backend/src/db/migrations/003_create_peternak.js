/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('peternak', (table) => {
    table.increments('peternak_id').primary();
    table.string('peternak_nama', 100).notNullable();
    table.string('peternak_kontak', 20).nullable();
    table.text('peternak_alamat').nullable();
    table.string('peternak_email', 100).notNullable().unique();
    // NOTE: ERD has no password field for Peternak, but we add it
    // so they can log in to the Android app. Adjust if not needed.
    table.string('peternak_password', 255).notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('peternak');
};
