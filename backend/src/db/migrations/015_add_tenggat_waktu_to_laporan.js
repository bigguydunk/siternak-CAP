exports.up = (knex) =>
  knex.schema.table('laporan', (table) => {
    table.timestamp('tenggat_waktu').nullable();
  });

exports.down = (knex) =>
  knex.schema.table('laporan', (table) => {
    table.dropColumn('tenggat_waktu');
  });
