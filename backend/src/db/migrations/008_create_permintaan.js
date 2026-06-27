/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('permintaan', (table) => {
    table.increments('id_permintaan').primary();
    table.integer('sapi_id').unsigned().notNullable()
      .references('sapi_id').inTable('sapi').onDelete('RESTRICT');
    table.integer('admin_id').unsigned().nullable()
      .references('admin_id').inTable('admin').onDelete('SET NULL');
    table.integer('peternak_id').unsigned().notNullable()
      .references('peternak_id').inTable('peternak').onDelete('RESTRICT');
    table.timestamp('tanggal_pengajuan').defaultTo(knex.fn.now());
    table.string('lokasi_ternak', 255).notNullable();
    table.specificType('status_validitas', 'status_validitas_enum').defaultTo('Menunggu');
    table.specificType('persetujuan_permintaan', 'persetujuan_enum').nullable();
    table.text('alasan_penolakan').nullable();
    table.specificType('status_permintaan', 'status_permintaan_enum').defaultTo('Menunggu');
    table.string('hasil_akhir', 255).nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('permintaan');
};
