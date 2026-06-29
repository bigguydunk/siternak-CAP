package com.example.ternakapp.ui.sapi

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
import com.example.ternakapp.databinding.FragmentSapiBinding
import com.example.ternakapp.ui.auth.AuthViewModel
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.ui.home.HomeViewModel
import com.example.ternakapp.ui.home.SapiAdapter
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class SapiFragment : Fragment() {

    private var _binding: FragmentSapiBinding? = null
    private val binding get() = _binding!!

    // We can reuse HomeViewModel since it has getMySapi()
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
        _binding = FragmentSapiBinding.inflate(inflater, container, false)
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
        binding.fabAddSapi.setOnClickListener {
            startActivity(Intent(requireContext(), RegistrasiSapiActivity::class.java))
        }
    }

    private fun fetchData() {
        lifecycleScope.launch {
            val role = authViewModel.getRole().first()
            
            if (role != "petugas") {
                viewModel.getMySapi().collect { result ->
                    when (result) {
                        is ResultState.Loading -> {
                            binding.progressBar.visibility = View.VISIBLE
                            binding.rvSapi.visibility = View.GONE
                            binding.tvEmptyMessage.visibility = View.GONE
                        }
                        is ResultState.Success -> {
                            binding.progressBar.visibility = View.GONE
                            val dataList = result.data.data
                            
                            if (dataList.isEmpty()) {
                                binding.tvEmptyMessage.visibility = View.VISIBLE
                                binding.rvSapi.visibility = View.GONE
                            } else {
                                binding.tvEmptyMessage.visibility = View.GONE
                                binding.rvSapi.visibility = View.VISIBLE
                                val adapter = SapiAdapter(dataList)
                                binding.rvSapi.adapter = adapter
                            }
                        }
                        is ResultState.Error -> {
                            binding.progressBar.visibility = View.GONE
                            Toast.makeText(requireContext(), "Gagal memuat sapi: ${result.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } else {
                // Should not happen for petugas since they don't see this tab
                binding.fabAddSapi.visibility = View.GONE
                binding.tvEmptyMessage.text = "Fitur sapi hanya untuk peternak."
                binding.tvEmptyMessage.visibility = View.VISIBLE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
