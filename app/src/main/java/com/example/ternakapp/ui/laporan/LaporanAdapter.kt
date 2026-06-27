package com.example.ternakapp.ui.laporan

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ternakapp.data.response.LaporanData
import com.example.ternakapp.databinding.ItemLaporanBinding

class LaporanAdapter(private val list: List<LaporanData>) : RecyclerView.Adapter<LaporanAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemLaporanBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemLaporanBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val data = list[position]
        holder.binding.tvWaktu.text = data.tanggalWaktu
        
        var jenis = "Laporan"
        if (data.isIB) jenis = "Laporan IB"
        if (data.isKebuntingan) jenis = "Laporan Kebuntingan"
        if (data.isKelahiran) jenis = "Laporan Kelahiran"
        if (data.isKeguguran) jenis = "Laporan Keguguran"

        holder.binding.tvJenisLaporan.text = jenis
        holder.binding.tvStatus.text = "Selesai"
    }

    override fun getItemCount(): Int = list.size
}
