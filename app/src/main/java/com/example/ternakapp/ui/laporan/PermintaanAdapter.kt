package com.example.ternakapp.ui.laporan

import android.content.Intent
import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ternakapp.data.response.PermintaanData
import com.example.ternakapp.databinding.ItemPermintaanBinding
import com.example.ternakapp.ui.sapi.DetailSapiActivity
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class PermintaanAdapter(private val listPermintaan: List<PermintaanData>) : RecyclerView.Adapter<PermintaanAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemPermintaanBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemPermintaanBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val data = listPermintaan[position]
        holder.binding.tvIdPermintaan.text = "Laporan Birahi #${data.idPermintaan}"
        holder.binding.tvSapiId.text = "Sapi ID: ${data.sapiId}"
        holder.binding.tvLokasi.text = "Lokasi: ${data.lokasiTernak}"
        
        holder.binding.chipStatus.text = data.statusPermintaan
        
        if (data.statusPermintaan.equals("selesai", ignoreCase = true)) {
            holder.binding.chipStatus.setChipBackgroundColorResource(android.R.color.holo_green_dark)
        } else {
            // Default color from XML is primary_red which is good for "diproses" or "menunggu"
        }

        try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            parser.timeZone = TimeZone.getTimeZone("UTC")
            val date = parser.parse(data.tanggalPengajuan)
            val formatter = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            holder.binding.tvTanggal.text = "Tanggal Pengajuan: ${date?.let { formatter.format(it) } ?: data.tanggalPengajuan}"
        } catch (e: Exception) {
            holder.binding.tvTanggal.text = "Tanggal Pengajuan: ${data.tanggalPengajuan}"
        }

        holder.itemView.setOnClickListener {
            val intent = Intent(holder.itemView.context, DetailSapiActivity::class.java)
            intent.putExtra(DetailSapiActivity.EXTRA_SAPI_ID, data.sapiId)
            intent.putExtra("EXTRA_PERMINTAAN_ID", data.idPermintaan)
            holder.itemView.context.startActivity(intent)
        }
    }

    override fun getItemCount(): Int = listPermintaan.size
}
