package com.example.ternakapp.ui.laporan

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.data.response.LaporanIBRequest
import com.example.ternakapp.data.response.LaporanKebuntinganRequest
import com.example.ternakapp.data.response.LaporanKelahiranRequest
import com.example.ternakapp.databinding.ActivityFormLaporanBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class FormLaporanActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFormLaporanBinding
    private val viewModel: LaporanViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    private var laporanType: String = ""
    private var idPermintaan: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFormLaporanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        laporanType = intent.getStringExtra(EXTRA_LAPORAN_TYPE) ?: ""
        idPermintaan = intent.getIntExtra(EXTRA_ID_PERMINTAAN, -1)

        if (idPermintaan == -1 || laporanType.isEmpty()) {
            Toast.makeText(this, "Data tidak valid", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupUI()
        setupAction()
    }

    private fun setupUI() {
        binding.tvTitle.text = "Form Laporan ${laporanType}"

        when (laporanType) {
            "IB" -> binding.layoutIB.visibility = View.VISIBLE
            "Bunting" -> binding.layoutKebuntingan.visibility = View.VISIBLE
            "Lahir" -> binding.layoutKelahiran.visibility = View.VISIBLE
        }
    }

    private fun setupAction() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnSubmit.setOnClickListener {
            val isiLaporan = binding.edtIsiLaporan.text.toString()
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val currentTime = sdf.format(Date())

            when (laporanType) {
                "IB" -> {
                    val strawText = binding.edtKodeStraw.text.toString().trim()
                    val straw = if (strawText.isEmpty()) "" else strawText
                    val isSuccess = binding.rbBerhasil.isChecked
                    val request = LaporanIBRequest(idPermintaan, straw, isiLaporan, currentTime, isSuccess)
                    submitIB(request)
                }
                "Bunting" -> {
                    val hasil = binding.edtHasilPemeriksaan.text.toString()
                    val request = LaporanKebuntinganRequest(idPermintaan, isiLaporan, currentTime, hasil, null)
                    submitKebuntingan(request)
                }
                "Lahir" -> {
                    val kondisi = binding.edtKondisiAnak.text.toString()
                    val jk = binding.edtJenisKelaminAnak.text.toString()
                    val request = LaporanKelahiranRequest(idPermintaan, isiLaporan, kondisi, jk, currentTime)
                    submitKelahiran(request)
                }
            }
        }
    }

    private fun submitIB(request: LaporanIBRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanIB(request).collect { handleResult(it) }
        }
    }

    private fun submitKebuntingan(request: LaporanKebuntinganRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanKebuntingan(request).collect { handleResult(it) }
        }
    }

    private fun submitKelahiran(request: LaporanKelahiranRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanKelahiran(request).collect { handleResult(it) }
        }
    }

    private fun handleResult(result: ResultState<Any>) {
        when (result) {
            is ResultState.Loading -> binding.btnSubmit.isEnabled = false
            is ResultState.Success -> {
                binding.btnSubmit.isEnabled = true
                Toast.makeText(this, "Laporan berhasil dikirim!", Toast.LENGTH_SHORT).show()
                finish()
            }
            is ResultState.Error -> {
                binding.btnSubmit.isEnabled = true
                Toast.makeText(this, "Gagal: ${result.error}", Toast.LENGTH_LONG).show()
            }
        }
    }

    companion object {
        const val EXTRA_LAPORAN_TYPE = "extra_laporan_type"
        const val EXTRA_ID_PERMINTAAN = "extra_id_permintaan"
    }
}
