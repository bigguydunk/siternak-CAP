package com.example.ternakapp.utils

import android.content.Context
import android.content.Intent
import com.example.ternakapp.ui.auth.LoginActivity

object NavigationUtils {
    fun navigateToLogin(context: Context) {
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }
}