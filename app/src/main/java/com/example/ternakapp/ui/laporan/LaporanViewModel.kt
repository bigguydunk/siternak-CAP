package com.example.ternakapp.ui.laporan

import androidx.lifecycle.ViewModel
import com.example.ternakapp.data.repository.LaporanRepository
import com.example.ternakapp.data.response.*

class LaporanViewModel(private val laporanRepository: LaporanRepository) : ViewModel() {
    fun createPermintaan(request: PermintaanRequest) = laporanRepository.createPermintaan(request)
    fun getMyPermintaan() = laporanRepository.getMyPermintaan()
    fun getLaporanTimeline(idPermintaan: Int) = laporanRepository.getLaporanTimeline(idPermintaan)
    fun createLaporanIB(request: LaporanIBRequest) = laporanRepository.createLaporanIB(request)
    fun createLaporanKebuntingan(request: LaporanKebuntinganRequest) = laporanRepository.createLaporanKebuntingan(request)
    fun createLaporanKelahiran(request: LaporanKelahiranRequest) = laporanRepository.createLaporanKelahiran(request)
}
