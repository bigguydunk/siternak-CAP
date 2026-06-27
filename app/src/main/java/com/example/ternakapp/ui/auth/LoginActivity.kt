package com.example.ternakapp.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.MainActivity
import com.example.ternakapp.data.response.LoginRequest
import com.example.ternakapp.databinding.ActivityLoginBinding
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private val viewModel: AuthViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupAction()
    }

    private fun setupAction() {
        binding.btnLogin.setOnClickListener {
            val email = binding.edtEmail.text.toString()
            val password = binding.edtPassword.text.toString()
            
            // Determine role based on which button is checked in the ToggleGroup
            val role = if (binding.toggleRole.checkedButtonId == binding.btnRolePeternak.id) {
                "peternak"
            } else {
                "petugas"
            }

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Email dan Password tidak boleh kosong", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = LoginRequest(email, password, role)
            
            lifecycleScope.launch {
                viewModel.login(request).collect { result ->
                    when (result) {
                        is ResultState.Loading -> {
                            // Optionally show progress bar
                            binding.btnLogin.isEnabled = false
                        }
                        is ResultState.Success -> {
                            binding.btnLogin.isEnabled = true
                            Toast.makeText(this@LoginActivity, "Login Berhasil", Toast.LENGTH_SHORT).show()
                            val intent = Intent(this@LoginActivity, MainActivity::class.java)
                            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK
                            startActivity(intent)
                            finish()
                        }
                        is ResultState.Error -> {
                            binding.btnLogin.isEnabled = true
                            Toast.makeText(this@LoginActivity, "Login Gagal: \${result.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }

        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }
}
