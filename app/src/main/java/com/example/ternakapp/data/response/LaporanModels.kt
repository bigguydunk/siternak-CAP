package com.example.ternakapp.data.response

import com.google.gson.annotations.SerializedName

data class PermintaanRequest(
    @SerializedName("sapi_id") val sapiId: Int,
    @SerializedName("lokasi_ternak") val lokasiTernak: String
)

data class PermintaanResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: PermintaanData?
)

data class ListPermintaanResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: List<PermintaanData>
)

data class PermintaanData(
    @SerializedName("id_permintaan") val idPermintaan: Int,
    @SerializedName("sapi_id") val sapiId: Int,
    @SerializedName("peternak_id") val peternakId: Int,
    @SerializedName("lokasi_ternak") val lokasiTernak: String,
    @SerializedName("status_validitas") val statusValiditas: String,
    @SerializedName("status_permintaan") val statusPermintaan: String,
    @SerializedName("persetujuan_permintaan") val persetujuanPermintaan: String?,
    @SerializedName("tanggal_pengajuan") val tanggalPengajuan: String
)

data class LaporanResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: LaporanData?
)

data class ListLaporanResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: List<LaporanData>
)

data class LaporanData(
    @SerializedName("id_laporan") val idLaporan: Int,
    @SerializedName("id_permintaan") val idPermintaan: Int,
    @SerializedName("tanggal_waktu") val tanggalWaktu: String,
    @SerializedName("flag_laporan_ib") val isIB: Boolean,
    @SerializedName("flag_laporan_kebuntingan") val isKebuntingan: Boolean,
    @SerializedName("flag_laporan_kelahiran") val isKelahiran: Boolean,
    @SerializedName("flag_laporan_keguguran") val isKeguguran: Boolean,
    // Note: Detail data parsing could be added here if needed
)

// Request Models for Laporan
data class LaporanIBRequest(
    @SerializedName("id_permintaan") val idPermintaan: Int,
    @SerializedName("kode_straw") val kodeStraw: String,
    @SerializedName("isi_laporan_ib") val isiLaporan: String,
    @SerializedName("waktu_proses_ib") val waktuProses: String,
    @SerializedName("is_success") val isSuccess: Boolean
)

data class LaporanKebuntinganRequest(
    @SerializedName("id_permintaan") val idPermintaan: Int,
    @SerializedName("isi_laporan_kebuntingan") val isiLaporan: String,
    @SerializedName("waktu_kebuntingan") val waktuKebuntingan: String,
    @SerializedName("hasil_pemeriksaan") val hasilPemeriksaan: String,
    @SerializedName("tanggal_hpl") val tanggalHpl: String?
)

data class LaporanKelahiranRequest(
    @SerializedName("id_permintaan") val idPermintaan: Int,
    @SerializedName("isi_laporan_kelahiran") val isiLaporan: String,
    @SerializedName("kondisi_anak_sapi") val kondisiAnak: String,
    @SerializedName("jenis_kelamin_anak_sapi") val jenisKelaminAnak: String,
    @SerializedName("waktu_kelahiran") val waktuKelahiran: String
)
