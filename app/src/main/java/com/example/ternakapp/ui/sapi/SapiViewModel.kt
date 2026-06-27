package com.example.ternakapp.ui.sapi

import androidx.lifecycle.ViewModel
import com.example.ternakapp.data.repository.SapiRepository
import com.example.ternakapp.data.response.RegistrasiSapiRequest

class SapiViewModel(private val sapiRepository: SapiRepository) : ViewModel() {
    fun getSapiById(id: Int) = sapiRepository.getSapiById(id)
    fun registerSapi(request: RegistrasiSapiRequest) = sapiRepository.registerSapi(request)
    fun getMe() = sapiRepository.getMe()
}
