package com.example.ternakapp.data.response

import com.google.gson.annotations.SerializedName

data class SapiResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: SapiData?
)

data class ListSapiResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: List<SapiData>
)

data class SapiData(
    @SerializedName("sapi_id") val sapiId: Int,
    @SerializedName("sapi_eartag") val eartag: String?,
    @SerializedName("sapi_jenis_kelamin") val jenisKelamin: String,
    @SerializedName("sapi_berat") val berat: Double?,
    @SerializedName("peternak_id") val peternakId: Int?,
    @SerializedName("tanggal_terdaftar") val tanggalTerdaftar: String?
)

data class RegistrasiSapiRequest(
    @SerializedName("sapi_jenis_kelamin") val jenisKelamin: String,
    @SerializedName("sapi_eartag") val eartag: String,
    @SerializedName("sapi_berat") val berat: Double,
    @SerializedName("peternak_id") val peternakId: Int // Peternak needs to send their ID, or the backend infers it. Let's send it.
)
