exports.up = (knex) =>
  knex.schema.table('permintaan', (table) => {
    table.integer('petugas_id').unsigned().nullable()
      .references('petugas_id').inTable('petugas').onDelete('SET NULL');
  });

exports.down = (knex) =>
  knex.schema.table('permintaan', (table) => {
    table.dropColumn('petugas_id');
  });
