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

    @GET("api/v1/petugas/tugas")
    suspend fun getMyTugas(): com.example.ternakapp.data.response.ListPermintaanResponse

    @POST("api/v1/permintaan")
    suspend fun createPermintaan(
        @Body request: com.example.ternakapp.data.response.PermintaanRequest
    ): com.example.ternakapp.data.response.PermintaanResponse

    @GET("api/v1/laporan/permintaan/{id}")
    suspend fun getLaporanTimeline(
        @retrofit2.http.Path("id") idPermintaan: Int
    ): com.example.ternakapp.data.response.ListLaporanResponse

    @GET("api/v1/laporan/sapi/{sapi_id}")
    suspend fun getLaporanTimelineBySapi(
        @retrofit2.http.Path("sapi_id") idSapi: Int
    ): com.example.ternakapp.data.response.ListLaporanResponse

    @POST("api/v1/laporan/ib/{laporan_id}")
    suspend fun createLaporanIB(
        @retrofit2.http.Path("laporan_id") laporanId: Int,
        @Body request: com.example.ternakapp.data.response.LaporanIBRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @POST("api/v1/laporan/kebuntingan/{laporan_id}")
    suspend fun createLaporanKebuntingan(
        @retrofit2.http.Path("laporan_id") laporanId: Int,
        @Body request: com.example.ternakapp.data.response.LaporanKebuntinganRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @POST("api/v1/laporan/kelahiran/{laporan_id}")
    suspend fun createLaporanKelahiran(
        @retrofit2.http.Path("laporan_id") laporanId: Int,
        @Body request: com.example.ternakapp.data.response.LaporanKelahiranRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @POST("api/v1/laporan/keguguran/{laporan_id}")
    suspend fun createLaporanKeguguran(
        @retrofit2.http.Path("laporan_id") laporanId: Int,
        @Body request: com.example.ternakapp.data.response.LaporanKeguguranRequest
    ): com.example.ternakapp.data.response.LaporanResponse

    @retrofit2.http.PUT("api/v1/tugas/{laporan_id}/konfirmasi")
    suspend fun konfirmasiTugas(
        @retrofit2.http.Path("laporan_id") id: Int
    ): com.example.ternakapp.data.response.ApiResponse<Any>
}