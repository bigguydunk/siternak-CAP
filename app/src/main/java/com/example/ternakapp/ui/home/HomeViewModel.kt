package com.example.ternakapp.ui.home

import androidx.lifecycle.ViewModel
import com.example.ternakapp.data.repository.SapiRepository

import com.example.ternakapp.data.repository.LaporanRepository

class HomeViewModel(
    private val sapiRepository: SapiRepository,
    private val laporanRepository: LaporanRepository
) : ViewModel() {
    fun getMySapi() = sapiRepository.getMySapi()
    fun getMe() = sapiRepository.getMe()
    fun getMyTugas() = laporanRepository.getMyTugas()
}