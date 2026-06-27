package com.example.ternakapp.ui.auth

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.data.response.RegisterPeternakRequest
import com.example.ternakapp.databinding.ActivityRegisterBinding
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding
    private val viewModel: AuthViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupAction()
    }

    private fun setupAction() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnRegister.setOnClickListener {
            val nama = binding.edtNama.text.toString()
            val email = binding.edtEmail.text.toString()
            val kontak = binding.edtKontak.text.toString()
            val alamat = binding.edtAlamat.text.toString()
            val password = binding.edtPassword.text.toString()

            if (nama.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Nama, Email, dan Password wajib diisi!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = RegisterPeternakRequest(nama, email, password, kontak, alamat)

            lifecycleScope.launch {
                viewModel.registerPeternak(request).collect { result ->
                    when (result) {
                        is ResultState.Loading -> {
                            binding.btnRegister.isEnabled = false
                        }
                        is ResultState.Success -> {
                            binding.btnRegister.isEnabled = true
                            Toast.makeText(this@RegisterActivity, "Registrasi Berhasil! Silakan Login", Toast.LENGTH_SHORT).show()
                            finish()
                        }
                        is ResultState.Error -> {
                            binding.btnRegister.isEnabled = true
                            Toast.makeText(this@RegisterActivity, "Gagal: \${result.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }
}
