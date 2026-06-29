package com.example.ternakapp.data.repository

import com.example.ternakapp.data.response.*
import com.example.ternakapp.data.retrofit.ApiService
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException

class LaporanRepository private constructor(
    private val apiService: ApiService
) {

    fun createPermintaan(request: PermintaanRequest): Flow<ResultState<PermintaanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createPermintaan(request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun getMyPermintaan(): Flow<ResultState<ListPermintaanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getMyPermintaan()
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun getMyTugas(): Flow<ResultState<ListPermintaanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getMyTugas()
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun getLaporanTimeline(idPermintaan: Int): Flow<ResultState<ListLaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getLaporanTimeline(idPermintaan)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanIB(laporanId: Int, request: LaporanIBRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanIB(laporanId, request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanKebuntingan(laporanId: Int, request: LaporanKebuntinganRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanKebuntingan(laporanId, request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanKelahiran(laporanId: Int, request: LaporanKelahiranRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanKelahiran(laporanId, request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanKeguguran(laporanId: Int, request: LaporanKeguguranRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanKeguguran(laporanId, request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun konfirmasiTugas(laporanId: Int): Flow<ResultState<ApiResponse<Any>>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.konfirmasiTugas(laporanId)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    companion object {
        @Volatile
        private var instance: LaporanRepository? = null
        fun getInstance(apiService: ApiService): LaporanRepository =
            instance ?: synchronized(this) {
                instance ?: LaporanRepository(apiService)
            }.also { instance = it }
    }
}
