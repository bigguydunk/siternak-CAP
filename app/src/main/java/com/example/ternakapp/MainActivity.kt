package com.example.ternakapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.ui.auth.AuthViewModel
import com.example.ternakapp.ui.auth.LoginActivity
import com.example.ternakapp.ui.auth.ViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {

    private val authViewModel: AuthViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        lifecycleScope.launch {
            val token = authViewModel.getToken().first()
            if (token.isNullOrEmpty()) {
                val intent = Intent(this@MainActivity, LoginActivity::class.java)
                startActivity(intent)
                finish()
            } else {
                // Setup Navigation Component
                val navHostFragment = supportFragmentManager.findFragmentById(R.id.nav_host_fragment_activity_main) as NavHostFragment
                val navController = navHostFragment.navController
                val navView: BottomNavigationView = findViewById(R.id.nav_view)
                navView.setupWithNavController(navController)
            }
        }
    }
}