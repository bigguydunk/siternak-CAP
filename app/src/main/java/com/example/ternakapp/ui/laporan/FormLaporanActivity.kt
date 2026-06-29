package com.example.ternakapp.ui.laporan

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.ternakapp.data.response.*
import com.example.ternakapp.databinding.ActivityFormLaporanBinding
import com.example.ternakapp.ui.auth.ViewModelFactory
import com.example.ternakapp.utils.ResultState
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class FormLaporanActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFormLaporanBinding
    private val viewModel: LaporanViewModel by viewModels {
        ViewModelFactory.getInstance(this)
    }

    private var laporanType: String = ""
    private var idPermintaan: Int = -1
    private var laporanId: Int = -1

    private val calendarEvent = Calendar.getInstance()
    private val calendarHpl = Calendar.getInstance()

    private var selectedDateTimeString: String = ""
    private var selectedHplString: String? = null

    private val sdfDisplay = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
    private val sdfApi = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    private val sdfHplDisplay = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    private val sdfHplApi = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFormLaporanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        laporanType = intent.getStringExtra(EXTRA_LAPORAN_TYPE) ?: ""
        idPermintaan = intent.getIntExtra(EXTRA_ID_PERMINTAAN, -1)
        laporanId = intent.getIntExtra("EXTRA_LAPORAN_ID", -1)

        if (idPermintaan == -1 || laporanType.isEmpty() || laporanId == -1) {
            Toast.makeText(this, "Data tidak valid", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Initialize default event date & time to now
        selectedDateTimeString = sdfApi.format(Date())
        binding.btnPickDateTime.text = sdfDisplay.format(Date())

        setupUI()
        setupAction()
    }

    private fun setupUI() {
        binding.tvTitle.text = "Form Laporan ${laporanType}"

        when (laporanType) {
            "IB" -> {
                binding.layoutIB.visibility = View.VISIBLE
            }
            "Bunting" -> {
                binding.layoutKebuntingan.visibility = View.VISIBLE
                binding.layoutHpl.visibility = View.VISIBLE
                
                // Pre-fill HPL to now + 7 months (gestation reminder)
                calendarHpl.time = Date()
                calendarHpl.add(Calendar.MONTH, 7)
                selectedHplString = sdfHplApi.format(calendarHpl.time)
                binding.btnPickHpl.text = sdfHplDisplay.format(calendarHpl.time)
            }
            "LahirKeguguran" -> {
                binding.layoutLahirGugurToggle.visibility = View.VISIBLE
                binding.layoutKelahiran.visibility = View.VISIBLE
                binding.tvTitle.text = "Laporan Kelahiran / Keguguran"
            }
        }
    }

    private fun setupAction() {
        binding.btnBack.setOnClickListener { finish() }

        // Event Date Time Picker
        binding.btnPickDateTime.setOnClickListener {
            showDateTimePicker()
        }

        // HPL Date Picker
        binding.btnPickHpl.setOnClickListener {
            showHplDatePicker()
        }

        // Kebuntingan radio group toggle
        binding.rgHasilKebuntingan.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == binding.rbHamil.id) {
                binding.layoutHpl.visibility = View.VISIBLE
            } else {
                binding.layoutHpl.visibility = View.GONE
                selectedHplString = null
                binding.btnPickHpl.text = "Pilih Tanggal HPL"
            }
        }

        // Lahir/Gugur radio group toggle
        binding.rgHasilLahirGugur.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == binding.rbLahir.id) {
                binding.layoutKelahiran.visibility = View.VISIBLE
                binding.layoutKeguguran.visibility = View.GONE
            } else {
                binding.layoutKelahiran.visibility = View.GONE
                binding.layoutKeguguran.visibility = View.VISIBLE
            }
        }

        binding.btnSubmit.setOnClickListener {
            val isiLaporan = binding.edtIsiLaporan.text.toString().trim()
            if (isiLaporan.isEmpty()) {
                binding.edtIsiLaporan.error = "Isi laporan wajib diisi"
                return@setOnClickListener
            }

            when (laporanType) {
                "IB" -> {
                    val straw = binding.edtKodeStraw.text.toString().trim()
                    val isSuccess = binding.rbBerhasil.isChecked
                    val request = LaporanIBRequest(idPermintaan, straw, isiLaporan, selectedDateTimeString, isSuccess)
                    submitIB(request)
                }
                "Bunting" -> {
                    val isBunting = binding.rbHamil.isChecked
                    val hasil = if (isBunting) "hamil" else "tidak hamil"
                    if (isBunting && selectedHplString == null) {
                        Toast.makeText(this, "Silakan pilih perkiraan tanggal HPL", Toast.LENGTH_SHORT).show()
                        return@setOnClickListener
                    }
                    val request = LaporanKebuntinganRequest(idPermintaan, isiLaporan, selectedDateTimeString, hasil, selectedHplString)
                    submitKebuntingan(request)
                }
                "LahirKeguguran" -> {
                    if (binding.rbLahir.isChecked) {
                        val kondisi = if (binding.rbSelamat.isChecked) "selamat" else "mati lahir"
                        val jk = if (binding.rbJantan.isChecked) "jantan" else "betina"
                        val request = LaporanKelahiranRequest(idPermintaan, isiLaporan, kondisi, jk, selectedDateTimeString)
                        submitKelahiran(request)
                    } else {
                        val request = LaporanKeguguranRequest(idPermintaan, isiLaporan, selectedDateTimeString)
                        submitKeguguran(request)
                    }
                }
            }
        }
    }

    private fun showDateTimePicker() {
        val currentYear = calendarEvent.get(Calendar.YEAR)
        val currentMonth = calendarEvent.get(Calendar.MONTH)
        val currentDay = calendarEvent.get(Calendar.DAY_OF_MONTH)

        DatePickerDialog(this, { _, year, month, dayOfMonth ->
            calendarEvent.set(Calendar.YEAR, year)
            calendarEvent.set(Calendar.MONTH, month)
            calendarEvent.set(Calendar.DAY_OF_MONTH, dayOfMonth)

            val currentHour = calendarEvent.get(Calendar.HOUR_OF_DAY)
            val currentMinute = calendarEvent.get(Calendar.MINUTE)

            TimePickerDialog(this, { _, hourOfDay, minute ->
                calendarEvent.set(Calendar.HOUR_OF_DAY, hourOfDay)
                calendarEvent.set(Calendar.MINUTE, minute)

                selectedDateTimeString = sdfApi.format(calendarEvent.time)
                binding.btnPickDateTime.text = sdfDisplay.format(calendarEvent.time)
            }, currentHour, currentMinute, true).show()

        }, currentYear, currentMonth, currentDay).show()
    }

    private fun showHplDatePicker() {
        val currentYear = calendarHpl.get(Calendar.YEAR)
        val currentMonth = calendarHpl.get(Calendar.MONTH)
        val currentDay = calendarHpl.get(Calendar.DAY_OF_MONTH)

        DatePickerDialog(this, { _, year, month, dayOfMonth ->
            calendarHpl.set(Calendar.YEAR, year)
            calendarHpl.set(Calendar.MONTH, month)
            calendarHpl.set(Calendar.DAY_OF_MONTH, dayOfMonth)

            selectedHplString = sdfHplApi.format(calendarHpl.time)
            binding.btnPickHpl.text = sdfHplDisplay.format(calendarHpl.time)
        }, currentYear, currentMonth, currentDay).show()
    }

    private fun submitIB(request: LaporanIBRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanIB(laporanId, request).collect { handleResult(it) }
        }
    }

    private fun submitKebuntingan(request: LaporanKebuntinganRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanKebuntingan(laporanId, request).collect { handleResult(it) }
        }
    }

    private fun submitKelahiran(request: LaporanKelahiranRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanKelahiran(laporanId, request).collect { handleResult(it) }
        }
    }

    private fun submitKeguguran(request: LaporanKeguguranRequest) {
        lifecycleScope.launch {
            viewModel.createLaporanKeguguran(laporanId, request).collect { handleResult(it) }
        }
    }

    private fun handleResult(result: ResultState<Any>) {
        when (result) {
            is ResultState.Loading -> binding.btnSubmit.isEnabled = false
            is ResultState.Success -> {
                binding.btnSubmit.isEnabled = true
                Toast.makeText(this, "Laporan berhasil dikirim!", Toast.LENGTH_SHORT).show()
                if (laporanType == "Bunting" && binding.rbHamil.isChecked) {
                    scheduleCalendarReminder()
                }
                finish()
            }
            is ResultState.Error -> {
                binding.btnSubmit.isEnabled = true
                Toast.makeText(this, "Gagal: ${result.error}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun scheduleCalendarReminder() {
        try {
            val timeInMillis = calendarHpl.timeInMillis

            val intent = android.content.Intent(android.content.Intent.ACTION_INSERT).apply {
                data = android.provider.CalendarContract.Events.CONTENT_URI
                putExtra(android.provider.CalendarContract.Events.TITLE, "Cek Kelahiran Sapi (Permintaan #$idPermintaan)")
                putExtra(android.provider.CalendarContract.Events.DESCRIPTION, "Jadwal cek kelahiran sapi untuk reproduksi sapi setelah kebuntingan 7 bulan.")
                putExtra(android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME, timeInMillis)
                putExtra(android.provider.CalendarContract.EXTRA_EVENT_END_TIME, timeInMillis + 60 * 60 * 1000)
                putExtra(android.provider.CalendarContract.Events.ALL_DAY, true)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Gagal membuka kalender: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        const val EXTRA_LAPORAN_TYPE = "extra_laporan_type"
        const val EXTRA_ID_PERMINTAAN = "extra_id_permintaan"
    }
}
