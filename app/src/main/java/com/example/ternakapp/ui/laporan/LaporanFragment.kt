package com.example.ternakapp.ui.laporan

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ternakapp.databinding.FragmentLaporanBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch

class LaporanFragment : Fragment() {

    private var _binding: FragmentLaporanBinding? = null
    private val binding get() = _binding!!

    private val viewModel: LaporanViewModel by viewModels {
        ViewModelFactory.getInstance(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLaporanBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        binding.rvLaporan.layoutManager = LinearLayoutManager(requireContext())
    }

    override fun onResume() {
        super.onResume()
        fetchData()
    }

    private fun fetchData() {
        lifecycleScope.launch {
            viewModel.getMyPermintaan().collect { result ->
                when (result) {
                    is ResultState.Loading -> {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.rvLaporan.visibility = View.GONE
                        binding.tvEmptyMessage.visibility = View.GONE
                    }
                    is ResultState.Success -> {
                        binding.progressBar.visibility = View.GONE
                        val dataList = result.data.data
                        if (dataList.isEmpty()) {
                            binding.tvEmptyMessage.visibility = View.VISIBLE
                            binding.rvLaporan.visibility = View.GONE
                        } else {
                            binding.tvEmptyMessage.visibility = View.GONE
                            binding.rvLaporan.visibility = View.VISIBLE
                            binding.rvLaporan.adapter = PermintaanAdapter(dataList)
                        }
                    }
                    is ResultState.Error -> {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(requireContext(), "Gagal memuat: ${result.error}", Toast.LENGTH_SHORT).show()
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
