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
import kotlinx.coroutines.launch

class RegistrasiSapiActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegistrasiSapiBinding
    private val viewModel: SapiViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    private var currentPeternakId: Int = 0

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

        binding.btnSelesai.setOnClickListener {
            val umur = binding.edtUmur.text.toString()
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
