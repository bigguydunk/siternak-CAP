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
        
        // For Menunggu state it says "Laporan Kelahiran / Keguguran", but if finished, it picks the right one based on detail
        if (data.isKelahiran && data.isKeguguran) {
            jenis = "Laporan Kelahiran / Keguguran"
            if (data.detail != null) {
                if (data.detail.isiLaporanKelahiran != null) jenis = "Laporan Kelahiran"
                else if (data.detail.isiLaporanKeguguran != null) jenis = "Laporan Keguguran"
            }
        } else if (data.isKelahiran) {
            jenis = "Laporan Kelahiran"
        } else if (data.isKeguguran) {
            jenis = "Laporan Keguguran"
        }

        holder.binding.tvJenisLaporan.text = jenis
        
        // Populate Detail & Isi Laporan if available
        var isiLaporanText: String? = null
        var detailText: String? = null

        if (data.detail != null) {
            if (data.isIB) {
                isiLaporanText = data.detail.isiLaporanIb
                val successStr = if (data.detail.isSuccess == true) "Berhasil" else "Gagal"
                val straw = data.detail.kodeStraw ?: "-"
                detailText = "Status: $successStr | Straw: $straw"
                if (!data.detail.komentar.isNullOrEmpty()) detailText += "\nKomentar: ${data.detail.komentar}"
            } else if (data.isKebuntingan) {
                isiLaporanText = data.detail.isiLaporanKebuntingan
                detailText = "Hasil: ${data.detail.hasilPemeriksaan}"
                if (!data.detail.tanggalHpl.isNullOrEmpty()) detailText += " | HPL: ${data.detail.tanggalHpl.substringBefore("T")}"
            } else if (jenis == "Laporan Kelahiran") {
                isiLaporanText = data.detail.isiLaporanKelahiran
                detailText = "Kondisi: ${data.detail.kondisiAnakSapi} | Kelamin: ${data.detail.jenisKelaminAnakSapi}"
            } else if (jenis == "Laporan Keguguran") {
                isiLaporanText = data.detail.isiLaporanKeguguran
                detailText = "Sapi mengalami keguguran"
            }
        }

        if (!isiLaporanText.isNullOrEmpty()) {
            holder.binding.tvIsiLaporan.text = "Catatan:\n$isiLaporanText"
            holder.binding.tvIsiLaporan.visibility = android.view.View.VISIBLE
        } else {
            holder.binding.tvIsiLaporan.visibility = android.view.View.GONE
        }

        if (!detailText.isNullOrEmpty()) {
            holder.binding.tvDetail.text = detailText
            holder.binding.tvDetail.visibility = android.view.View.VISIBLE
        } else {
            holder.binding.tvDetail.visibility = android.view.View.GONE
        }

        if (data.flagMenungguLaporan) {
            if (data.petugasId == null) {
                holder.binding.tvStatus.text = "Menunggu Petugas"
                holder.binding.tvStatus.setTextColor(android.graphics.Color.parseColor("#E65100"))
            } else {
                holder.binding.tvStatus.text = "Menunggu $jenis"
                holder.binding.tvStatus.setTextColor(android.graphics.Color.parseColor("#1565C0")) 
            }
            
            if (!data.tenggatWaktu.isNullOrEmpty()) {
                try {
                    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault())
                    sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
                    val date = sdf.parse(data.tenggatWaktu)
                    if (date != null) {
                        val diff = date.time - System.currentTimeMillis()
                        if (diff > 0) {
                            val days = java.util.concurrent.TimeUnit.MILLISECONDS.toDays(diff)
                            if (days > 30) {
                                val months = days / 30
                                val remDays = days % 30
                                holder.binding.tvCountdown.text = "$months bulan $remDays hari"
                            } else {
                                holder.binding.tvCountdown.text = "$days hari"
                            }
                            holder.binding.tvCountdown.visibility = android.view.View.VISIBLE
                        } else {
                            holder.binding.tvCountdown.text = "Terlambat!"
                            holder.binding.tvCountdown.visibility = android.view.View.VISIBLE
                        }
                    }
                } catch (e: Exception) {
                    holder.binding.tvCountdown.visibility = android.view.View.GONE
                }
            } else {
                holder.binding.tvCountdown.visibility = android.view.View.GONE
            }
        } else {
            holder.binding.tvStatus.text = "Selesai"
            holder.binding.tvStatus.setTextColor(android.graphics.Color.parseColor("#2E7D32"))
            holder.binding.tvCountdown.visibility = android.view.View.GONE
        }
    }

    override fun getItemCount(): Int = list.size
}
