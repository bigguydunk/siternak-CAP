package com.example.ternakapp.data.retrofit

import com.example.ternakapp.data.local.UserPreferences
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class ApiConfig {
    companion object {
        var BASE_URL = "http://10.0.2.2:3000/"

        fun getApiService(userPreferences: UserPreferences): ApiService {
            val loggingInterceptor = HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BODY)
            
            val authInterceptor = Interceptor { chain ->
                val req = chain.request()
                // Dynamically fetch token for every request
                val token = runBlocking { userPreferences.getToken().first() } ?: ""
                
                val requestHeaders = req.newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
                chain.proceed(requestHeaders)
            }
            
            val client = OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
                .addInterceptor(authInterceptor)
                .build()
                
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .client(client)
                .build()
                
            return retrofit.create(ApiService::class.java)
        }
    }
}