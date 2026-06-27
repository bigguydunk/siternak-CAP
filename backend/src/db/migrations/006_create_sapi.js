/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('sapi', (table) => {
    table.increments('sapi_id').primary();
    table.integer('peternak_id').unsigned().notNullable()
      .references('peternak_id').inTable('peternak').onDelete('CASCADE');
    table.specificType('sapi_jenis_kelamin', 'jenis_kelamin_enum').notNullable();
    table.string('sapi_eartag', 20).nullable();
    table.decimal('sapi_berat', 8, 2).nullable();
    table.timestamp('tanggal_terdaftar').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sapi');
};
