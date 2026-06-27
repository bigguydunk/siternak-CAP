package com.example.ternakapp.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.ternakapp.data.repository.AuthRepository
import com.example.ternakapp.data.response.LoginRequest
import com.example.ternakapp.data.response.RegisterPeternakRequest
import com.example.ternakapp.utils.Injection
import android.content.Context

class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {
    
    fun login(request: LoginRequest) = authRepository.login(request)
    
    fun registerPeternak(request: RegisterPeternakRequest) = authRepository.registerPeternak(request)
    
    fun getToken() = authRepository.getToken()
    
    suspend fun logout() {
        authRepository.logout()
    }
}
