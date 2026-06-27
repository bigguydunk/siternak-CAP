package com.example.ternakapp.ui.home

import android.content.Intent
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ternakapp.data.response.SapiData
import com.example.ternakapp.databinding.ItemSapiBinding
import com.example.ternakapp.ui.sapi.DetailSapiActivity

class SapiAdapter(private val listSapi: List<SapiData>) : RecyclerView.Adapter<SapiAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemSapiBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSapiBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val sapi = listSapi[position]
        holder.binding.tvSapiId.text = sapi.eartag ?: "ID-${sapi.sapiId}"
        holder.binding.tvSapiName.text = "Sapi ${sapi.jenisKelamin.capitalize()}"
        holder.binding.tvBerat.text = "${sapi.berat ?: 0.0} kg"
        
        // Example static status
        holder.binding.tvStatusKondisi.text = "Baik"
        holder.binding.tvKesehatan.text = "Sehat"

        holder.binding.btnDetailReproduksi.setOnClickListener {
            val intent = Intent(holder.itemView.context, DetailSapiActivity::class.java)
            intent.putExtra(DetailSapiActivity.EXTRA_SAPI_ID, sapi.sapiId)
            holder.itemView.context.startActivity(intent)
        }
    }

    override fun getItemCount(): Int = listSapi.size
}
