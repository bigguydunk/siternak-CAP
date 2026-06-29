package com.example.ternakapp.ui.sapi

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.data.response.RegistrasiSapiRequest
import com.example.ternakapp.databinding.ActivityRegistrasiSapiBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.utils.ResultState
import android.net.Uri
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import kotlinx.coroutines.launch

class RegistrasiSapiActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegistrasiSapiBinding
    private val viewModel: SapiViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    private var currentPeternakId: Int = 0
    private var activeImageType: String = ""

    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        uri?.let {
            when (activeImageType) {
                "depan" -> binding.imgDepan.setImageURI(it)
                "belakang" -> binding.imgBelakang.setImageURI(it)
                "kanan" -> binding.imgKanan.setImageURI(it)
                "kiri" -> binding.imgKiri.setImageURI(it)
                "eartag" -> binding.imgEarTag.setImageURI(it)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegistrasiSapiBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupAction()
        fetchUserData()
    }

    private fun setupUI() {
        val statusList = listOf("Jantan", "Betina")
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, statusList)
        binding.spinnerStatus.setAdapter(adapter)

        val tahunList = (0..20).map { "$it Tahun" }
        val bulanList = (0..11).map { "$it Bulan" }
        val adapterTahun = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, tahunList)
        val adapterBulan = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, bulanList)
        binding.spinnerTahun.setAdapter(adapterTahun)
        binding.spinnerBulan.setAdapter(adapterBulan)
    }

    private fun fetchUserData() {
        lifecycleScope.launch {
            viewModel.getMe().collect { result ->
                if (result is ResultState.Success) {
                    currentPeternakId = result.data.user?.peternakId ?: 0
                }
            }
        }
    }

    private fun setupAction() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnGantiDepan.setOnClickListener {
            activeImageType = "depan"
            pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
        binding.btnGantiBelakang.setOnClickListener {
            activeImageType = "belakang"
            pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
        binding.btnGantiKanan.setOnClickListener {
            activeImageType = "kanan"
            pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
        binding.btnGantiKiri.setOnClickListener {
            activeImageType = "kiri"
            pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
        binding.btnGantiEarTag.setOnClickListener {
            activeImageType = "eartag"
            pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }

        binding.btnSelesai.setOnClickListener {
            val umur = "${binding.spinnerTahun.text} ${binding.spinnerBulan.text}"
            val beratStr = binding.edtBerat.text.toString()
            val statusKelamin = binding.spinnerStatus.text.toString()
            val earTag = binding.edtEarTagInput.text.toString()
            
            if (beratStr.isEmpty() || statusKelamin.isEmpty() || earTag.isEmpty()) {
                Toast.makeText(this, "Mohon lengkapi Ear Tag, berat, dan status kelamin", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val berat = beratStr.toDoubleOrNull() ?: 0.0
            val request = RegistrasiSapiRequest(statusKelamin.trim().lowercase(), earTag, berat, currentPeternakId)

            lifecycleScope.launch {
                viewModel.registerSapi(request).collect { result ->
                    when (result) {
                        is ResultState.Loading -> binding.btnSelesai.isEnabled = false
                        is ResultState.Success -> {
                            binding.btnSelesai.isEnabled = true
                            Toast.makeText(this@RegistrasiSapiActivity, "Sapi berhasil didaftarkan!", Toast.LENGTH_SHORT).show()
                            finish()
                        }
                        is ResultState.Error -> {
                            binding.btnSelesai.isEnabled = true
                            Toast.makeText(this@RegistrasiSapiActivity, "Gagal: ${result.error}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
        }
    }
}
