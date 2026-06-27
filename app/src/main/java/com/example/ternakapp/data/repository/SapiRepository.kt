package com.example.ternakapp.data.repository

import com.example.ternakapp.data.response.ListSapiResponse
import com.example.ternakapp.data.response.RegistrasiSapiRequest
import com.example.ternakapp.data.response.SapiResponse
import com.example.ternakapp.data.response.UserData
import com.example.ternakapp.data.response.ApiResponse
import com.example.ternakapp.data.retrofit.ApiService
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException

class SapiRepository private constructor(
    private val apiService: ApiService
) {
    fun getMySapi(): Flow<ResultState<ListSapiResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getMySapi()
            if (response.success) {
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Unknown error"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun getSapiById(id: Int): Flow<ResultState<SapiResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getSapiById(id)
            if (response.success) {
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Unknown error"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun registerSapi(request: RegistrasiSapiRequest): Flow<ResultState<SapiResponse>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.registerSapi(request)
            if (response.success) {
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Unknown error"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }
    
    fun getMe(): Flow<ResultState<ApiResponse<UserData>>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.getMe()
            if (response.success) {
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Unknown error"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    companion object {
        @Volatile
        private var instance: SapiRepository? = null
        fun getInstance(
            apiService: ApiService
        ): SapiRepository =
            instance ?: synchronized(this) {
                instance ?: SapiRepository(apiService)
            }.also { instance = it }
    }
}
