package com.example.ternakapp.ui.auth

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.ternakapp.data.repository.AuthRepository
import com.example.ternakapp.data.repository.LaporanRepository
import com.example.ternakapp.data.repository.SapiRepository
import com.example.ternakapp.ui.home.HomeViewModel
import com.example.ternakapp.ui.laporan.LaporanViewModel
import com.example.ternakapp.ui.sapi.SapiViewModel
import com.example.ternakapp.utils.Injection

class ViewModelFactory private constructor(
    private val authRepository: AuthRepository,
    private val sapiRepository: SapiRepository,
    private val laporanRepository: LaporanRepository
) : ViewModelProvider.NewInstanceFactory() {
    
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            return AuthViewModel(authRepository) as T
        }
        if (modelClass.isAssignableFrom(HomeViewModel::class.java)) {
            return HomeViewModel(sapiRepository) as T
        }
        if (modelClass.isAssignableFrom(SapiViewModel::class.java)) {
            return SapiViewModel(sapiRepository) as T
        }
        if (modelClass.isAssignableFrom(LaporanViewModel::class.java)) {
            return LaporanViewModel(laporanRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: \${modelClass.name}")
    }

    companion object {
        @Volatile
        private var instance: ViewModelFactory? = null
        fun getInstance(context: Context): ViewModelFactory =
            instance ?: synchronized(this) {
                instance ?: ViewModelFactory(
                    Injection.provideAuthRepository(context),
                    Injection.provideSapiRepository(context),
                    Injection.provideLaporanRepository(context)
                )
            }.also { instance = it }
    }
}
