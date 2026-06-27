package com.example.ternakapp.utils

import android.content.Context
import com.example.ternakapp.data.local.UserPreferences
import com.example.ternakapp.data.local.dataStore
import com.example.ternakapp.data.repository.AuthRepository
import com.example.ternakapp.data.repository.SapiRepository
import com.example.ternakapp.data.repository.LaporanRepository
import com.example.ternakapp.data.retrofit.ApiConfig

object Injection {
    fun provideAuthRepository(context: Context): AuthRepository {
        val pref = UserPreferences.getInstance(context.dataStore)
        val apiService = ApiConfig.getApiService(pref)
        return AuthRepository.getInstance(apiService, pref)
    }

    fun provideSapiRepository(context: Context): SapiRepository {
        val pref = UserPreferences.getInstance(context.dataStore)
        val apiService = ApiConfig.getApiService(pref)
        return SapiRepository.getInstance(apiService)
    }

    fun provideLaporanRepository(context: Context): LaporanRepository {
        val pref = UserPreferences.getInstance(context.dataStore)
        val apiService = ApiConfig.getApiService(pref)
        return LaporanRepository.getInstance(apiService)
    }
}
