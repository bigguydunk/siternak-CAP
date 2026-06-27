package com.example.ternakapp.ui.sapi

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ternakapp.data.response.PermintaanRequest
import com.example.ternakapp.databinding.ActivityDetailSapiBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.ui.laporan.FormLaporanActivity
import com.example.ternakapp.ui.laporan.LaporanAdapter
import com.example.ternakapp.ui.laporan.LaporanViewModel
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch

class DetailSapiActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDetailSapiBinding
    private val sapiViewModel: SapiViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }
    private val laporanViewModel: LaporanViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    private var currentSapiId: Int = -1
    private var currentPermintaanId: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDetailSapiBinding.inflate(layoutInflater)
        setContentView(binding.root)

        currentSapiId = intent.getIntExtra(EXTRA_SAPI_ID, -1)
        currentPermintaanId = intent.getIntExtra("EXTRA_PERMINTAAN_ID", -1)
        
        if (currentSapiId == -1) {
            Toast.makeText(this, "ID Sapi tidak valid", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupRecyclerView()
        setupAction()
        fetchDetailSapi(currentSapiId)
    }

    override fun onResume() {
        super.onResume()
        if (currentPermintaanId != -1) {
            fetchTimeline(currentPermintaanId)
        }
    }

    private fun setupRecyclerView() {
        binding.rvTimelineLaporan.layoutManager = LinearLayoutManager(this)
    }

    private fun setupAction() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnLaporkanBirahiLagi.setOnClickListener {
            // Auto create permintaan for this Sapi
            val request = PermintaanRequest(currentSapiId, "Kandang 1")
            lifecycleScope.launch {
                laporanViewModel.createPermintaan(request).collect { result ->
                    when (result) {
                        is ResultState.Loading -> binding.btnLaporkanBirahiLagi.isEnabled = false
                        is ResultState.Success -> {
                            binding.btnLaporkanBirahiLagi.isEnabled = true
                            Toast.makeText(this@DetailSapiActivity, "Permintaan Auto-Approved!", Toast.LENGTH_SHORT).show()
                            currentPermintaanId = result.data.data?.idPermintaan ?: -1
                            fetchTimeline(currentPermintaanId)
                        }
                        is ResultState.Error -> {
                            binding.btnLaporkanBirahiLagi.isEnabled = true
                            Toast.makeText(this@DetailSapiActivity, "Gagal: ${result.error}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
        }

        binding.btnTestLaporIB.setOnClickListener {
            openForm("IB")
        }
        binding.btnTestLaporBunting.setOnClickListener {
            openForm("Bunting")
        }
        binding.btnTestLaporLahir.setOnClickListener {
            openForm("Lahir")
        }
    }

    private fun openForm(type: String) {
        if (currentPermintaanId == -1) {
            Toast.makeText(this, "Silakan Laporkan Birahi dulu untuk membuat Permintaan", Toast.LENGTH_SHORT).show()
            return
        }
        val intent = Intent(this, FormLaporanActivity::class.java)
        intent.putExtra(FormLaporanActivity.EXTRA_LAPORAN_TYPE, type)
        intent.putExtra(FormLaporanActivity.EXTRA_ID_PERMINTAAN, currentPermintaanId)
        startActivity(intent)
    }

    private fun fetchDetailSapi(id: Int) {
        lifecycleScope.launch {
            sapiViewModel.getSapiById(id).collect { result ->
                if (result is ResultState.Success) {
                    val sapi = result.data.data
                    if (sapi != null) {
                        binding.tvCattleId.text = "ID-${sapi.sapiId}"
                        binding.tvEarTag.text = sapi.eartag ?: "Belum ada Ear Tag"
                        binding.tvBerat.text = "${sapi.berat ?: 0.0} Kg"
                        binding.tvJenis.text = sapi.jenisKelamin.capitalize()
                    }
                }
            }
        }
    }

    private fun fetchTimeline(idPermintaan: Int) {
        lifecycleScope.launch {
            laporanViewModel.getLaporanTimeline(idPermintaan).collect { result ->
                if (result is ResultState.Success) {
                    val list = result.data.data
                    if (list.isNotEmpty()) {
                        binding.rvTimelineLaporan.adapter = LaporanAdapter(list)
                    }
                }
            }
        }
    }

    companion object {
        const val EXTRA_SAPI_ID = "extra_sapi_id"
    }
}
