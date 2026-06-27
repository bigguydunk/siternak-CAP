package com.example.ternakapp.data.response

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("role") val role: String
)

data class RegisterPeternakRequest(
    @SerializedName("peternak_nama") val nama: String,
    @SerializedName("peternak_email") val email: String,
    @SerializedName("peternak_password") val password: String,
    @SerializedName("peternak_kontak") val kontak: String,
    @SerializedName("peternak_alamat") val alamat: String
)
