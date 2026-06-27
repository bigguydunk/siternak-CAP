package com.example.ternakapp.ui.home

import androidx.lifecycle.ViewModel
import com.example.ternakapp.data.repository.SapiRepository

class HomeViewModel(private val sapiRepository: SapiRepository) : ViewModel() {
    fun getMySapi() = sapiRepository.getMySapi()
    fun getMe() = sapiRepository.getMe()
}