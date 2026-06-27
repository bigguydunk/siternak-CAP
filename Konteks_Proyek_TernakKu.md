# Konteks Proyek — "TernakKu" (Sistem Manajemen Reproduksi Sapi Berbasis IB)

> Dokumen ini merangkum pemahaman menyeluruh tentang proyek capstone ini, disusun dari dua
> sumber: (1) dokumen proses bisnis (`Proses_Bisnis_Capstone_15.pdf`) yang menjelaskan alur
> kerja dari 3 sudut pandang pengguna, dan (2) struktur data pada ERD (`ternakKu_capstone.png`).
> Karena dokumen proses bisnis yang diberikan **tidak lengkap** (hanya mencakup siklus utama,
> belum mencakup beberapa entitas yang justru muncul di ERD seperti Admin, Foto, Semen),
> beberapa bagian di bawah adalah **inferensi** berdasarkan struktur data — bagian ini ditandai
> secara eksplisit agar mudah dikonfirmasi ulang ke pemilik proyek.

---

## 1. Apa Proyek Ini?

**TernakKu** adalah sebuah sistem informasi untuk mengelola dan mendokumentasikan **siklus
reproduksi sapi** pada peternakan, dengan fokus utama pada proses **Inseminasi Buatan (IB
/ kawin suntik)** — mulai dari deteksi birahi, pengajuan permintaan IB, pelaksanaan IB oleh
petugas lapangan, pemantauan kebuntingan, hingga pelaporan hasil akhir (kelahiran atau
keguguran). Sistem ini menjembatani tiga jenis pengguna:

- **Peternak** — pemilik sapi, pihak yang mengamati kondisi sapi dan melaporkan kejadian (birahi, kelahiran, dll).
- **Admin** — pengelola yang memverifikasi laporan/permintaan dan menugaskan petugas lapangan.
- **Petugas** — tenaga lapangan (inseminator/mantri ternak) yang melakukan pemeriksaan fisik dan tindakan IB di lokasi.

Sistem ini pada dasarnya adalah **platform pencatatan dan notifikasi berbasis siklus/status**,
di mana setiap "kasus reproduksi" satu sapi diwakili oleh satu baris `Permintaan`, yang akan
melewati beberapa tahap pelaporan berurutan (`Laporan` dengan subtype-nya) sampai siklus
ditutup.

---

## 2. Alur Bisnis Utama (End-to-End)

Berdasarkan dokumen proses bisnis, siklus reproduksi sapi berjalan sebagai berikut:

### Tahap 1 — Deteksi Birahi & Pengajuan
1. Peternak mengamati tanda-tanda birahi pada sapi miliknya.
2. Peternak menginput laporan kondisi tersebut ke sistem.
3. Sistem otomatis mengirim notifikasi ke **petugas** untuk pengecekan lapangan.
4. Admin memverifikasi kelengkapan laporan dan menentukan apakah laporan diteruskan untuk pengecekan lapangan, lalu menugaskan petugas yang sesuai (lengkap dengan info lokasi kandang, identitas sapi, dan data peternak).

### Tahap 2 — Pengecekan Kesiapan IB
5. Petugas mengunjungi lokasi, memeriksa kondisi sapi, dan menentukan **siap** atau **tidak siap** untuk IB.
6. Hasil pemeriksaan diinput petugas ke sistem → sistem mengirim notifikasi pembaruan status ke admin dan peternak.
7. Jika **siap** → admin menugaskan petugas untuk melaksanakan IB (notifikasi penugasan IB beserta lokasi, data sapi, jadwal).
   Jika **tidak siap** → sistem mengirim notifikasi kegagalan kesiapan IB ke peternak & petugas, proses IB tidak dilanjutkan untuk siklus ini.

### Tahap 3 — Pelaksanaan IB
8. Petugas melaksanakan tindakan IB, lalu mengisi laporan pelaksanaan (kondisi sapi sebelum/selama tindakan, hambatan jika ada, **straw semen** yang dipakai).
9. Sistem mengirim notifikasi status pelaksanaan IB (berhasil / tidak dapat dilakukan / ada kendala) ke admin dan peternak.

### Tahap 4 — Pemantauan Pasca-IB (0–3 bulan)
10. Peternak memantau sapi selama 0–3 bulan pasca-IB.
    - **Jika birahi muncul lagi sebelum 3 bulan** → indikasi **kegagalan IB**. Peternak melapor → petugas ditugaskan kembali untuk pengecekan lapangan → hasil pengecekan menentukan apakah benar gagal IB atau ada kondisi lain → notifikasi ke admin & peternak. Jika gagal, peternak dapat mengajukan **permintaan IB baru** (siklus permintaan baru dimulai).
    - **Jika tidak ada tanda birahi ulang** → tunggu sampai bulan ke-3 untuk pemeriksaan kebuntingan.

### Tahap 5 — Pemeriksaan Kebuntingan (bulan ke-3)
11. Petugas ditugaskan untuk pemeriksaan kebuntingan, menginput hasil: **bunting** / **tidak bunting** (kemungkinan juga **birahi** lagi, sesuai ENUM `hasil_pemeriksaan` pada `Laporan_Kebuntingan`).
12. Sistem mengirim notifikasi hasil ke admin & peternak.
    - **Tidak bunting** → status diperbarui sebagai hasil IB gagal; peternak bisa mengajukan permintaan IB berikutnya.
    - **Bunting** → lanjut ke tahap pemantauan kehamilan, dengan estimasi HPL (`tanggal_hpl`) dicatat.

### Tahap 6 — Pemantauan Kehamilan & Kelahiran (bulan ke-10/11)
13. Peternak memantau kehamilan sampai mendekati bulan ke-10–11; petugas ditugaskan untuk pemeriksaan menjelang kelahiran.
14. Saat kelahiran terjadi, peternak (atau petugas via pengecekan langsung) melaporkan hasil akhir:
    - **Lahir selamat**, **mati lahir**, atau **keguguran** — beserta keterangan penyebab (komplikasi, gangguan kesehatan, dll) dan identitas anak sapi (jika ada yang lahir, hidup maupun mati).
15. Laporan diverifikasi → sistem mengirim notifikasi **penyelesaian siklus reproduksi**, dan admin menutup siklus tersebut.

### Sifat Notifikasi
Notifikasi dikirim otomatis oleh sistem di setiap perpindahan status penting: penugasan ke petugas (berhasil/gagal ditugaskan), update hasil pemeriksaan, hasil IB, hasil kebuntingan, hasil kelahiran/keguguran, dan penutupan siklus — selalu ditujukan ke kombinasi **admin, petugas, dan/atau peternak** sesuai konteks tahap.

---

## 3. Pemetaan Alur Bisnis ke Struktur Data (ERD)

| Tahap Bisnis | Entitas Terkait |
|---|---|
| Sapi & pemiliknya | `Peternak`, `Sapi`, `Foto` (foto depan/belakang/umum sapi) |
| Pengajuan kasus reproduksi (mis. laporan birahi → permintaan IB) | `Permintaan` (status_validitas, persetujuan_permintaan, status_permintaan, hasil_akhir) |
| Pelacakan tahap laporan dalam satu siklus | `Laporan` (supertype dengan flag penanda tahap: menunggu / IB / kebuntingan / keguguran / kelahiran) |
| Hasil pelaksanaan IB | `Laporan_IB` (terhubung ke `Semen` via `kode_straw`, dan ke `Petugas`) |
| Hasil pemeriksaan kebuntingan (bulan ke-3) | `Laporan_Kebuntingan` (ENUM: hamil / birahi / tidak hamil + `tanggal_hpl`) |
| Hasil keguguran | `Laporan_Keguguran` |
| Hasil kelahiran (bulan ke-10/11) | `Laporan_Kelahiran` (kondisi anak sapi, jenis kelamin anak sapi, waktu kelahiran) |
| Inventaris bibit/straw untuk IB | `Semen` (kode_straw, batch, tanggal produksi & kadaluarsa) |
| Verifikasi & penugasan oleh admin | `Admin` ↔ `Permintaan` |
| Eksekusi lapangan oleh petugas | `Petugas` ↔ semua 4 tabel subtype `Laporan_*` |

**Pola desain kunci:** relasi `Laporan` ke empat anaknya adalah **disjoint subtype**
(simbol `d` di ERD) — satu `id_laporan` hanya boleh punya **satu** baris di **satu** dari
empat tabel anak, sesuai tahap apa yang sedang berjalan dalam siklus reproduksi sapi tersebut
pada waktu itu. Inilah cara skema merepresentasikan "satu siklus reproduksi bisa melahirkan
banyak laporan berbeda jenis dari waktu ke waktu" — setiap kali ada laporan baru di tahap
berbeda, dibuat baris `Laporan` baru (dengan `id_permintaan` yang sama) yang dipasangkan ke
subtype yang sesuai.

---

## 4. Hal-Hal yang Disimpulkan dari ERD (Tidak Tercakup Eksplisit di Dokumen Proses Bisnis)

Dokumen proses bisnis yang diberikan berfokus pada *alur kerja antar-aktor* (siapa melakukan
apa, notifikasi apa terkirim ke siapa), namun **tidak menjelaskan beberapa detail struktural**
yang justru terlihat jelas di ERD. Berikut adalah hal-hal yang disimpulkan/diinferensi dan
sebaiknya dikonfirmasi ke pemilik proyek:

1. **Manajemen inventaris semen/straw (`Semen`).**
   Dokumen proses bisnis menyebut "tindakan IB" secara umum, tapi tidak menjelaskan bahwa
   sistem juga melacak **stok straw semen** (kode_straw, batch, tanggal produksi, tanggal
   kadaluarsa) yang dipakai per tindakan IB. Ini mengindikasikan sistem juga berperan sebagai
   **modul inventaris sederhana** untuk bibit/semen beku, kemungkinan untuk keperluan
   keterlacakan (traceability) genetik anak sapi di masa depan.

2. **Galeri foto sapi (`Foto`).**
   ERD menunjukkan setiap sapi bisa memiliki banyak foto bertipe `depan`, `belakang`, atau
   `umum`. Ini kemungkinan dipakai untuk **identifikasi visual sapi** (mirip dokumentasi
   profil ternak) saat pendaftaran sapi atau saat verifikasi oleh admin/petugas, namun proses
   ini tidak disebut sama sekali dalam dokumen proses bisnis.

3. **Peran eksplisit Admin sebagai approver permintaan.**
   Tabel `Permintaan` punya kolom `persetujuan_permintaan` dan `alasan_penolakan`, yang
   mengindikasikan ada mekanisme **admin bisa menolak** sebuah permintaan IB (dengan alasan
   tertulis) — bukan hanya meneruskan ke petugas seperti yang dijelaskan secara naratif di
   dokumen. Skenario "permintaan ditolak admin" sebaiknya didetailkan lebih lanjut (apakah
   peternak diberi notifikasi penolakan, apakah bisa mengajukan ulang, dsb).

4. **`status_validitas` vs `status_permintaan` vs `persetujuan_permintaan`.**
   Ada tiga kolom status yang berbeda pada tabel `Permintaan`. Kemungkinan maknanya:
   - `status_validitas` — apakah data permintaan itu sendiri valid secara administratif (kelengkapan data).
   - `persetujuan_permintaan` — keputusan admin (disetujui/ditolak).
   - `status_permintaan` — status keseluruhan siklus (mis. menunggu, diproses, selesai, gagal).
   Tiga kolom ini **tumpang tindih secara konsep** dan berisiko ambigu — sangat disarankan
   untuk diklarifikasi nilai-nilai ENUM/VARCHAR yang valid untuk masing-masing sebelum coding,
   agar tidak terjadi state yang saling kontradiksi.

5. **Login & otentikasi untuk 3 role.**
   Ketiga tabel aktor (`Admin`, `Petugas`, `Peternak` — meski `Peternak` tidak memiliki
   kolom password di ERD) menyiratkan adanya **sistem login multi-role**. Menariknya,
   `Peternak` **tidak punya kolom password**, sementara `Admin` dan `Petugas` punya. Ini
   mengindikasikan kemungkinan **peternak tidak login ke sistem secara langsung** (mungkin
   hanya berinteraksi via WhatsApp/SMS notifikasi atau dicatat oleh admin/petugas atas nama
   peternak), atau ini adalah celah/omission pada desain ERD yang perlu diklarifikasi —
   karena dokumen proses bisnis jelas menyebutkan peternak "menginput laporan ke sistem".

6. **Flag bertahap (`flag_menunggu_laporan`, dst.) di tabel `Laporan`.**
   Pola lima flag boolean ini mengindikasikan kemungkinan sistem memakai flag sebagai
   **state machine sederhana** untuk tracking tahap mana yang sedang aktif/menunggu untuk
   satu `id_permintaan`, melengkapi relasi subtype. Ini berguna untuk query cepat "laporan
   apa saja yang masih menunggu tindak lanjut" tanpa perlu join ke semua tabel subtype.

7. **`is_success` & `komentar` pada `Laporan_IB`.**
   Mendukung skenario di proses bisnis "IB berhasil dilakukan / tidak dapat dilakukan /
   terdapat kendala" — `is_success` kemungkinan boolean sederhana (berhasil/gagal), sedangkan
   detail kendala dicatat di `komentar` (teks bebas).

---

## 5. Aktor & Hak Akses (Role) — Ringkasan

| Role | Tabel Identitas | Punya Password? | Tanggung Jawab Utama |
|---|---|---|---|
| **Admin** | `Admin` | Ya | Verifikasi laporan/permintaan, menugaskan petugas, menyetujui/menolak permintaan, memantau & menutup siklus reproduksi |
| **Petugas** | `Petugas` | Ya | Pengecekan lapangan, eksekusi IB, input hasil pemeriksaan kebuntingan/keguguran/kelahiran |
| **Peternak** | `Peternak` | Tidak ada di ERD (perlu konfirmasi) | Memiliki sapi, melaporkan birahi/kelahiran, mengajukan permintaan IB, memantau status |

---

## 6. Entitas Inti & Perannya

- **Peternak** — pemilik ternak.
- **Sapi** — unit utama yang ditelusuri sepanjang siklus reproduksinya; punya foto dan riwayat permintaan.
- **Permintaan** — representasi satu "kasus"/siklus reproduksi yang diajukan untuk seekor sapi (dari laporan birahi sampai siklus selesai).
- **Laporan** — checkpoint pelaporan dalam satu siklus; bercabang ke 4 jenis laporan spesifik tergantung tahap.
- **Laporan_IB** — detail eksekusi inseminasi buatan.
- **Laporan_Kebuntingan** — detail hasil cek bunting/tidak bunting/birahi ulang.
- **Laporan_Keguguran** — detail kejadian keguguran.
- **Laporan_Kelahiran** — detail hasil akhir kelahiran (selamat/mati lahir) dan data anak sapi.
- **Semen** — inventaris straw/bibit yang dipakai saat IB.
- **Petugas** — eksekutor lapangan untuk semua jenis laporan.
- **Admin** — pengelola & approver permintaan.
- **Foto** — dokumentasi visual sapi.

---

## 7. Pertanyaan Terbuka untuk Pemilik Proyek (Disarankan Dikonfirmasi)

- Apakah Peternak benar-benar tidak memiliki akun login (tanpa password), atau ini bagian yang belum lengkap di ERD?
- Apa perbedaan pasti antara `status_validitas`, `persetujuan_permintaan`, dan `status_permintaan` pada tabel `Permintaan` — termasuk daftar nilai ENUM yang valid untuk masing-masing?
- Apakah nilai `hasil_pemeriksaan` pada `Laporan_Kebuntingan` ('hamil', 'birahi', 'tidak hamil') sudah final, dan bagaimana skenario alur jika hasilnya `'birahi'` (kemungkinan berarti birahi ulang terdeteksi saat jadwal cek bunting)?
- Apa nilai-nilai valid untuk ENUM `kondisi_anak_sapi`, `jenis_kelamin_anak_sapi`, dan `waktu_kelahiran` pada `Laporan_Kelahiran` (khususnya `waktu_kelahiran` yang tipe datanya tampak tidak konsisten di ERD — lihat catatan di file ERD)?
- Apakah `Foto` hanya dipakai untuk pendaftaran sapi, atau juga untuk dokumentasi kondisi sapi di setiap tahap pemeriksaan?
- Bagaimana mekanisme penolakan permintaan oleh admin memengaruhi notifikasi ke peternak (apakah peternak diberi tahu, dan apakah bisa mengajukan ulang)?

---

## 8. Ringkasan Teknologi yang Tersirat

Berdasarkan tipe data pada ERD (`AUTO_INCREMENT`, `TINYINT(1)`, `ENUM`, `DATETIME`), skema
ini **awalnya dirancang dengan dialek MySQL/MariaDB**. Karena permintaan proyek ini adalah
migrasi/implementasi ke **PostgreSQL**, sejumlah penyesuaian tipe data diperlukan — sudah
dirinci secara lengkap di file `ERD_TernakKu_Capstone.md` pada bagian "Catatan Penting untuk
Implementasi PostgreSQL".
