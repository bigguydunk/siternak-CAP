package com.example.ternakapp.data.repository

import com.example.ternakapp.data.local.UserPreferences
import com.example.ternakapp.data.response.ApiResponse
import com.example.ternakapp.data.response.LoginRequest
import com.example.ternakapp.data.response.RegisterPeternakRequest
import com.example.ternakapp.data.response.UserData
import com.example.ternakapp.data.retrofit.ApiService
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException

class AuthRepository private constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    fun login(request: LoginRequest): Flow<ResultState<ApiResponse<UserData>>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.login(request)
            if (response.success && response.token != null) {
                userPreferences.saveToken(response.token)
                userPreferences.saveRole(response.role ?: request.role)
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Login gagal"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun registerPeternak(request: RegisterPeternakRequest): Flow<ResultState<ApiResponse<UserData>>> = flow {
        emit(ResultState.Loading)
        try {
            val response = apiService.registerPeternak(request)
            if (response.success) {
                emit(ResultState.Success(response))
            } else {
                emit(ResultState.Error(response.message ?: "Registrasi gagal"))
            }
        } catch (e: HttpException) {
            emit(ResultState.Error(e.response()?.errorBody()?.string() ?: e.message()))
        } catch (e: Exception) {
            emit(ResultState.Error(e.message.toString()))
        }
    }

    fun getToken(): Flow<String?> = userPreferences.getToken()
    fun getRole(): Flow<String?> = userPreferences.getRole()
    
    suspend fun logout() {
        userPreferences.clearToken()
    }

    companion object {
        @Volatile
        private var instance: AuthRepository? = null
        fun getInstance(
            apiService: ApiService,
            userPreferences: UserPreferences
        ): AuthRepository =
            instance ?: synchronized(this) {
                instance ?: AuthRepository(apiService, userPreferences)
            }.also { instance = it }
    }
}
