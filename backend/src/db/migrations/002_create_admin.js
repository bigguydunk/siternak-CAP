/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('admin', (table) => {
    table.increments('admin_id').primary();
    table.string('admin_nama', 100).notNullable();
    table.string('admin_kontak', 20).nullable();
    table.string('admin_email', 100).notNullable().unique();
    table.string('admin_password', 255).notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin');
};
