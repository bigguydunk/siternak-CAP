package com.example.ternakapp.ui.laporan

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ternakapp.data.response.PermintaanData
import com.example.ternakapp.databinding.FragmentLaporanBinding
import com.example.ternakapp.ui.auth.AuthViewModel
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class CariTugasFragment : Fragment() {

    private var _binding: FragmentLaporanBinding? = null
    private val binding get() = _binding!!

    private val viewModel: LaporanViewModel by viewModels {
        ViewModelFactory.getInstance(requireContext())
    }

    private val authViewModel: AuthViewModel by viewModels {
        ViewModelFactory.getInstance(requireContext())
    }

    private var userRole: String = "petugas"
    private var originalList: List<PermintaanData> = emptyList()
    private var currentSearchQuery: String = ""

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

        binding.tvHeader.text = "Cari Tugas Baru"
        binding.tvSubHeader.text = "Lihat dan ambil permintaan inseminasi dari peternak"
        binding.tvEmptyMessage.text = "Tidak ada tugas baru yang tersedia."

        setupSearch()
    }

    override fun onResume() {
        super.onResume()
        fetchData()
    }

    private fun setupSearch() {
        binding.edtSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                currentSearchQuery = s?.toString() ?: ""
                applyFilter()
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun fetchData() {
        lifecycleScope.launch {
            userRole = authViewModel.getRole().first() ?: "petugas"

            viewModel.getMyTugas().collect { result ->
                when (result) {
                    is ResultState.Loading -> {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.rvLaporan.visibility = View.GONE
                        binding.tvEmptyMessage.visibility = View.GONE
                    }
                    is ResultState.Success -> {
                        binding.progressBar.visibility = View.GONE
                        originalList = result.data.data
                        applyFilter()
                    }
                    is ResultState.Error -> {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(requireContext(), "Gagal memuat: ${result.error}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun applyFilter() {
        // Filter strictly for unassigned tasks (petugasId == null)
        var displayList = originalList.filter { it.petugasId == null }

        // Apply search query
        if (currentSearchQuery.isNotEmpty()) {
            displayList = displayList.filter {
                it.sapiId.toString().contains(currentSearchQuery, ignoreCase = true) ||
                it.lokasiTernak.contains(currentSearchQuery, ignoreCase = true) ||
                it.idPermintaan.toString().contains(currentSearchQuery, ignoreCase = true)
            }
        }

        if (displayList.isEmpty()) {
            binding.tvEmptyMessage.visibility = View.VISIBLE
            binding.rvLaporan.visibility = View.GONE
        } else {
            binding.tvEmptyMessage.visibility = View.GONE
            binding.rvLaporan.visibility = View.VISIBLE
            binding.rvLaporan.adapter = PermintaanAdapter(displayList, userRole)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
