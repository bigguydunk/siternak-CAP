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

    fun createLaporanIB(request: LaporanIBRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanIB(request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanKebuntingan(request: LaporanKebuntinganRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanKebuntingan(request)
            if (response.success) emit(ResultState.Success(response))
            else emit(ResultState.Error(response.message ?: "Error"))
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun createLaporanKelahiran(request: LaporanKelahiranRequest): Flow<ResultState<LaporanResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.createLaporanKelahiran(request)
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
