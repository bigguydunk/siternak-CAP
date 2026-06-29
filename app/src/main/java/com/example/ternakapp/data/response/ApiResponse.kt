package com.example.ternakapp.data.response

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("user") val user: T? = null
)

data class UserData(
    @SerializedName("peternak_id") val peternakId: Int? = null,
    @SerializedName("peternak_nama") val peternakNama: String? = null,
    @SerializedName("peternak_email") val peternakEmail: String? = null,
    @SerializedName("petugas_id") val petugasId: Int? = null,
    @SerializedName("petugas_nama") val petugasNama: String? = null,
    @SerializedName("petugas_email") val petugasEmail: String? = null
)
