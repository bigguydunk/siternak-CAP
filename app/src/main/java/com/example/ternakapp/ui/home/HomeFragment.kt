package com.example.ternakapp.ui.home

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.databinding.FragmentHomeBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.ui.sapi.RegistrasiSapiActivity
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import com.example.ternakapp.ui.auth.AuthViewModel
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.example.ternakapp.R

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HomeViewModel by viewModels {
        ViewModelFactory.getInstance(requireContext())
    }

    private val authViewModel: AuthViewModel by viewModels {
        ViewModelFactory.getInstance(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupAction()
    }

    override fun onResume() {
        super.onResume()
        fetchData()
    }

    private fun setupAction() {
        lifecycleScope.launch {
            val role = authViewModel.getRole().first()
            if (role == "petugas") {
                binding.btnTambahSapi.visibility = View.GONE
                
                binding.tvGreetingTitle.text = "SELAMAT BEKERJA,"
                binding.tvActionTitle.text = "Pantau Tugas Anda"
                binding.tvActionSubtitle.text = "Lihat daftar permintaan IB dan konfirmasi laporan peternak."
                
                binding.btnLaporBirahi.text = "Lihat Daftar Tugas"
                binding.btnLaporBirahi.setOnClickListener {
                    // Navigate to Laporan tab by selecting it in BottomNavigationView
                    activity?.findViewById<BottomNavigationView>(R.id.nav_view)?.selectedItemId = R.id.navigation_post
                }
                
                binding.tvStatsTitle.text = "Total Tugas"
                binding.tvStatsSubtitle.text = "Tugas"
                
                binding.tvStatusTitle.text = "Tugas Selesai"
                binding.tvStatusSubtitle.text = "Riwayat"
                binding.tvStatus.text = "0" // Placeholder for now
            } else {
                binding.btnTambahSapi.setOnClickListener {
                    startActivity(Intent(requireContext(), RegistrasiSapiActivity::class.java))
                }
                
                binding.btnLaporBirahi.setOnClickListener {
                    // Navigate to Sapi tab
                    activity?.findViewById<BottomNavigationView>(R.id.nav_view)?.selectedItemId = R.id.navigation_sapi
                }
            }
        }
    }

    private fun fetchData() {
        lifecycleScope.launch {
            viewModel.getMe().collect { result ->
                if (result is ResultState.Success) {
                    val name = result.data.user?.peternakNama ?: result.data.user?.petugasNama ?: "Pengguna"
                    binding.tvUserName.text = "Pak $name!"
                }
            }
        }

        lifecycleScope.launch {
            val role = authViewModel.getRole().first()
            
            if (role == "petugas") {
                viewModel.getMyTugas().collect { result ->
                    when (result) {
                        is ResultState.Loading -> { }
                        is ResultState.Success -> {
                            val dataList = result.data.data
                            binding.tvTotalSapi.text = dataList.size.toString()
                            
                            val finishedTasks = dataList.count { it.statusPermintaan.equals("selesai", ignoreCase = true) }
                            binding.tvStatus.text = finishedTasks.toString()
                        }
                        is ResultState.Error -> {
                            Toast.makeText(requireContext(), "Gagal memuat tugas: ${result.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } else {
                viewModel.getMySapi().collect { result ->
                    when (result) {
                        is ResultState.Loading -> { }
                        is ResultState.Success -> {
                            val dataList = result.data.data
                            binding.tvTotalSapi.text = dataList.size.toString()
                        }
                        is ResultState.Error -> {
                            Toast.makeText(requireContext(), "Gagal memuat sapi: ${result.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}