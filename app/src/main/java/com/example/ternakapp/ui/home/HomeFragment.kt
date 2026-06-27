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
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ternakapp.databinding.FragmentHomeBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.ui.sapi.RegistrasiSapiActivity
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HomeViewModel by viewModels {
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

        setupRecyclerView()
        setupAction()
    }

    override fun onResume() {
        super.onResume()
        fetchData()
    }

    private fun setupRecyclerView() {
        binding.rvSapi.layoutManager = LinearLayoutManager(requireContext())
    }

    private fun setupAction() {
        binding.btnTambahSapi.setOnClickListener {
            startActivity(Intent(requireContext(), RegistrasiSapiActivity::class.java))
        }
        
        binding.btnLaporBirahi.setOnClickListener {
            Toast.makeText(requireContext(), "Silakan klik 'Detail Reproduksi' pada salah satu sapi Anda di bawah untuk melapor.", Toast.LENGTH_LONG).show()
        }
    }

    private fun fetchData() {
        lifecycleScope.launch {
            viewModel.getMe().collect { result ->
                if (result is ResultState.Success) {
                    val name = result.data.user?.peternakNama ?: result.data.user?.petugasNama ?: "Peternak"
                    binding.tvUserName.text = "Pak $name!"
                }
            }
        }

        lifecycleScope.launch {
            viewModel.getMySapi().collect { result ->
                when (result) {
                    is ResultState.Loading -> {
                        // show loading
                    }
                    is ResultState.Success -> {
                        val dataList = result.data.data
                        binding.tvTotalSapi.text = dataList.size.toString()
                        val adapter = SapiAdapter(dataList)
                        binding.rvSapi.adapter = adapter
                    }
                    is ResultState.Error -> {
                        Toast.makeText(requireContext(), "Gagal memuat sapi: \${result.error}", Toast.LENGTH_SHORT).show()
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