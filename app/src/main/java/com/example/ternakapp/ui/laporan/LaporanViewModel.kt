package com.example.ternakapp.ui.laporan

import androidx.lifecycle.ViewModel
import com.example.ternakapp.data.repository.LaporanRepository
import com.example.ternakapp.data.response.*
import kotlinx.coroutines.flow.Flow
import com.example.ternakapp.utils.ResultState

class LaporanViewModel(private val laporanRepository: LaporanRepository) : ViewModel() {
    fun createPermintaan(request: PermintaanRequest) = laporanRepository.createPermintaan(request)
    fun getMyPermintaan() = laporanRepository.getMyPermintaan()
    fun getMyTugas() = laporanRepository.getMyTugas()
    fun getLaporanTimeline(idPermintaan: Int): Flow<ResultState<com.example.ternakapp.data.response.ListLaporanResponse>> =
        laporanRepository.getLaporanTimeline(idPermintaan)

    fun getLaporanTimelineBySapi(idSapi: Int): Flow<ResultState<com.example.ternakapp.data.response.ListLaporanResponse>> =
        laporanRepository.getLaporanTimelineBySapi(idSapi)
    fun createLaporanIB(laporanId: Int, request: LaporanIBRequest) = laporanRepository.createLaporanIB(laporanId, request)
    fun createLaporanKebuntingan(laporanId: Int, request: LaporanKebuntinganRequest) = laporanRepository.createLaporanKebuntingan(laporanId, request)
    fun createLaporanKelahiran(laporanId: Int, request: LaporanKelahiranRequest) = laporanRepository.createLaporanKelahiran(laporanId, request)
    fun createLaporanKeguguran(laporanId: Int, request: LaporanKeguguranRequest) = laporanRepository.createLaporanKeguguran(laporanId, request)
    fun konfirmasiTugas(laporanId: Int) = laporanRepository.konfirmasiTugas(laporanId)
}
