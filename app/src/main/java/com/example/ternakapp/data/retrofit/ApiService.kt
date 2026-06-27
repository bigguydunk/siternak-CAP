package com.example.ternakapp.data.retrofit

import com.example.ternakapp.data.response.ApiResponse

import com.example.ternakapp.data.response.LoginRequest
import com.example.ternakapp.data.response.RegisterPeternakRequest
import com.example.ternakapp.data.response.UserData
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {
    @POST("api/v1/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): ApiResponse<UserData>

    @POST("api/v1/auth/register/peternak")
    suspend fun registerPeternak(
        @Body request: RegisterPeternakRequest
    ): ApiResponse<UserData>

    @GET("api/v1/auth/me")
    suspend fun getMe(): ApiResponse<UserData>

    @GET("api/v1/sapi/mine")
    suspend fun getMySapi(): com.example.ternakapp.data.response.ListSapiResponse

    @GET("api/v1/sapi/{id}")
    suspend fun getSapiById(@retrofit2.http.Path("id") id: Int): com.example.ternakapp.data.response.SapiResponse

    @POST("api/v1/sapi")
    suspend fun registerSapi(
        @Body request: com.example.ternakapp.data.response.RegistrasiSapiRequest
    ): com.example.ternakapp.data.response.SapiResponse

    // Permintaan & Laporan Endpoints
    @GET("api/v1/permintaan/mine")
    suspend fun getMyPermintaan(): com.example.ternakapp.data.response.ListPermintaanResponse

    @POST("api/v1/permintaan")
    suspend fun createPermintaan(
        @Body request: com.example.ternakapp.data.response.PermintaanRequest
    ): com.example.ternakapp.data.response.PermintaanResponse

    @GET("api/v1/laporan/permintaan/{id_permintaan}")
    suspend fun getLaporanTimeline(
        @retrofit2.http.Path("id_permintaan") id: Int
    ): com.example.ternakapp.data.response.ListLaporanResponse

    @POST("api/v1/laporan/ib")
    suspend fun createLaporanIB(
        @Body request: com.example.ternakapp.data.response.LaporanIBRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @POST("api/v1/laporan/kebuntingan")
    suspend fun createLaporanKebuntingan(
        @Body request: com.example.ternakapp.data.response.LaporanKebuntinganRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @POST("api/v1/laporan/kelahiran")
    suspend fun createLaporanKelahiran(
        @Body request: com.example.ternakapp.data.response.LaporanKelahiranRequest
    ): com.example.ternakapp.data.response.LaporanResponse
}