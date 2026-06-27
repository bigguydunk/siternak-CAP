/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('laporan_kelahiran', (table) => {
    table.integer('laporan_id').unsigned().primary()
      .references('id_laporan').inTable('laporan').onDelete('CASCADE');
    table.integer('petugas_id').unsigned().notNullable()
      .references('petugas_id').inTable('petugas').onDelete('RESTRICT');
    table.timestamp('tanggal_pengajuan').defaultTo(knex.fn.now());
    table.text('isi_laporan_kelahiran').nullable();
    table.specificType('kondisi_anak_sapi', 'kondisi_anak_sapi_enum').nullable();
    // jenis_kelamin_anak_sapi reuses the same ENUM type as sapi.sapi_jenis_kelamin
    table.specificType('jenis_kelamin_anak_sapi', 'jenis_kelamin_enum').nullable();
    // ERD had ENUM (no values) — implementing as TIMESTAMP (consistent with other waktu_ cols)
    table.timestamp('waktu_kelahiran').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('laporan_kelahiran');
};
