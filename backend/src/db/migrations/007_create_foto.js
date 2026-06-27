/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('foto', (table) => {
    table.increments('foto_id').primary();
    table.integer('sapi_id').unsigned().notNullable()
      .references('sapi_id').inTable('sapi').onDelete('CASCADE');
    table.string('foto_path', 255).notNullable();
    table.specificType('foto_tipe', 'foto_tipe_enum').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('foto');
};
