# 🐄 TernakKu — Sistem Manajemen Reproduksi Sapi Berbasis Inseminasi Buatan

> Proyek Capstone — Kelompok 15

TernakKu adalah sistem informasi terintegrasi untuk mengelola dan mendokumentasikan **siklus reproduksi sapi** pada peternakan, dengan fokus pada proses **Inseminasi Buatan (IB / kawin suntik)**. Sistem ini menjembatani tiga jenis pengguna — Peternak, Admin, dan Petugas lapangan — mulai dari deteksi birahi, pengajuan permintaan IB, pemantauan kebuntingan, hingga pelaporan hasil kelahiran atau keguguran.

---

## 📋 Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Fitur Utama](#fitur-utama)
- [Aktor & Peran](#aktor--peran)
- [Alur Bisnis](#alur-bisnis)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Repositori](#struktur-repositori)
- [Skema Database (Ringkasan ERD)](#skema-database-ringkasan-erd)
- [API Endpoints](#api-endpoints)
- [Cara Menjalankan (Setup Lokal)](#cara-menjalankan-setup-lokal)
- [Kredit & Referensi](#kredit--referensi)

---

## Latar Belakang

Proses monitoring reproduksi sapi masih menghadapi kendala dalam pencatatan dan pengelolaan data secara terstruktur. Peternak mengalami kesulitan dalam melaporkan kondisi sapi serta memantau perkembangan proses inseminasi buatan (IB). Selain itu, data pemeriksaan, tindakan IB, hingga informasi kelahiran belum terdokumentasi dengan baik, sehingga menyulitkan proses monitoring dan pengambilan keputusan.

**Tujuan sistem ini:**
- Mempermudah proses monitoring reproduksi sapi secara end-to-end
- Menyediakan informasi status reproduksi secara terstruktur dan real-time
- Meningkatkan efisiensi koordinasi antara peternak, admin, dan petugas lapangan

---

## Fitur Utama

| Fitur | Keterangan |
|---|---|
| 📝 Laporan Birahi | Peternak melaporkan tanda birahi sapi melalui aplikasi Android |
| ✅ Verifikasi Admin | Admin memverifikasi laporan dan menugaskan petugas lapangan |
| 🔬 Pengecekan Lapangan | Petugas mencatat hasil pemeriksaan kesiapan IB |
| 💉 Pelaksanaan IB | Petugas mengisi laporan tindakan IB beserta data straw semen yang digunakan |
| 🔔 Notifikasi Otomatis | Sistem mengirim notifikasi ke aktor yang relevan di setiap perpindahan status |
| 🤰 Pemantauan Kebuntingan | Cek bunting di bulan ke-3 pasca-IB dengan pencatatan estimasi HPL |
| 👶 Laporan Kelahiran | Dokumentasi hasil akhir: lahir selamat, mati lahir, atau keguguran |
| 🗺️ Integrasi Peta | Peta lokasi kandang (osmdroid) untuk penugasan petugas & estimasi jarak |
| 📸 Galeri Foto Sapi | Dokumentasi visual sapi (depan/belakang/umum) untuk identifikasi |
| 🧪 Inventaris Semen | Pelacakan straw semen (kode, batch, tanggal produksi & kadaluarsa) |

---

## Aktor & Peran

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Peternak   │    │    Admin     │    │   Petugas    │
│  (Android)   │    │    (Web)     │    │   (Web)      │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ • Lapor      │    │ • Verifikasi │    │ • Cek sapi   │
│   birahi     │    │   laporan    │    │   di lapangan│
│ • Pantau     │    │ • Tugaskan   │    │ • Laksanakan │
│   status     │    │   petugas    │    │   tindakan IB│
│ • Lapor      │    │ • Setujui /  │    │ • Input hasil│
│   kelahiran  │    │   tolak IB   │    │   pemeriksaan│
│ • Daftar     │    │ • Tutup      │    │ • Laporan    │
│   sapi       │    │   siklus     │    │   kebuntingan│
└──────────────┘    └──────────────┘    └──────────────┘
```

> **Catatan:** Peternak mengakses sistem melalui **aplikasi Android** (repo ini). Admin dan Petugas mengakses melalui antarmuka **web** (repo terpisah — akses privat).

---

## Alur Bisnis

Satu siklus reproduksi sapi berjalan melalui tahap-tahap berikut:

```
[1] Peternak deteksi birahi → input laporan di Android
         ↓
[2] Admin verifikasi laporan → tugaskan Petugas ke lapangan
         ↓
[3] Petugas cek sapi → input hasil: SIAP / TIDAK SIAP
         ↓ (jika siap)
[4] Admin tugaskan Petugas untuk laksanakan IB
         ↓
[5] Petugas laksanakan IB → input laporan IB + data straw semen
         ↓
[6] Peternak pantau 0–3 bulan
    ├── Birahi ulang → indikasi gagal IB → laporan baru → kembali ke [2]
    └── Tidak birahi ulang → lanjut ke pemeriksaan kebuntingan
         ↓
[7] Petugas cek kebuntingan (bulan ke-3)
    ├── Tidak bunting → peternak ajukan permintaan IB baru
    └── Bunting → pencatatan estimasi HPL (Hari Perkiraan Lahir)
         ↓
[8] Peternak pantau kehamilan hingga bulan ke-10/11
         ↓
[9] Laporan hasil kelahiran: lahir selamat / mati lahir / keguguran
         ↓
[10] Admin verifikasi → siklus reproduksi DITUTUP & terdokumentasi
```

Notifikasi otomatis dikirim ke kombinasi Admin, Petugas, dan/atau Peternak di setiap perpindahan status penting.

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────┐
│               Klien / Frontend                  │
│                                                 │
│  ┌──────────────────┐   ┌─────────────────────┐ │
│  │  Android App     │   │     Web App         │ │
│  │  (Peternak)      │   │  (Admin & Petugas)  │ │
│  │  Kotlin / Java   │   │  (Repo Privat)      │ │
│  └────────┬─────────┘   └──────────┬──────────┘ │
└───────────┼──────────────────────┼─────────────┘
            │          REST API / JSON             
            ▼                      ▼              
┌─────────────────────────────────────────────────┐
│           Backend — Node.js + Express.js        │
│           REST API  /api/v1/...                 │
│           Auth: JWT  │  Validasi: Zod           │
│           ORM: Knex.js  │  Upload: Multer       │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   PostgreSQL          │
            │   Database            │
            │   (ternakku_db)       │
            └───────────────────────┘
```

---

## Tech Stack

### Backend (`/backend`)

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime |
| **Express.js** | ^4.19 | HTTP framework |
| **PostgreSQL** | ≥ 14 | Database utama |
| **Knex.js** | ^3.1 | Query builder & migrations |
| **JWT** (`jsonwebtoken`) | ^9.0 | Autentikasi multi-role |
| **bcryptjs** | ^2.4 | Hashing password |
| **Multer** | ^1.4 | Upload foto sapi |
| **Zod** | ^3.23 | Validasi input/request |
| **dotenv** | ^16 | Konfigurasi environment |

Referensi desain backend: [istiadilia/siternak-be](https://github.com/istiadilia/siternak-be)

### Android Frontend (`/app`)

| Teknologi | Kegunaan |
|---|---|
| **Kotlin / Java** | Bahasa utama Android |
| **osmdroid** | Peta lokasi kandang & estimasi jarak petugas |
| **Retrofit / Volley** | HTTP client ke REST API |
| **Android SDK** | Target API 31+ |

---

## Struktur Repositori

```
siternak-CAP/
├── app/                        # Android app (frontend Peternak)
│   └── src/main/
│       ├── java/               # Kode Kotlin/Java
│       │   └── ui/
│       │       ├── auth/       # Login & Register
│       │       ├── sapi/       # Registrasi & Detail Sapi
│       │       ├── laporan/    # Form pelaporan
│       │       ├── home/       # Halaman utama
│       │       ├── post/       # Feed laporan / post
│       │       └── profile/    # Profil peternak
│       └── res/                # Layout, drawable, strings
│
├── backend/                    # REST API (Node.js + Express)
│   └── src/
│       ├── controllers/        # Logic bisnis per entitas
│       ├── routes/             # Definisi endpoint API
│       ├── middleware/         # Auth JWT, validasi
│       └── db/
│           └── migrations/     # Skema database (Knex)
│
├── ERD_TernakKu_Capstone.md    # Dokumentasi lengkap ERD & skema PostgreSQL
├── Konteks_Proyek_TernakKu.md  # Konteks bisnis & alur sistem lengkap
└── README.MD                   # Dokumen ini
```

---

## Skema Database (Ringkasan ERD)

Database menggunakan **PostgreSQL**. Desain ERD menggunakan pola **disjoint subtype** untuk tabel `Laporan`.

### Entitas Utama

| Entitas | Deskripsi |
|---|---|
| `Admin` | Akun admin — verifikasi permintaan & tutup siklus |
| `Peternak` | Pemilik sapi |
| `Petugas` | Petugas lapangan / inseminator |
| `Sapi` | Unit utama yang dipantau siklus reproduksinya |
| `Foto` | Galeri foto sapi (`depan` / `belakang` / `umum`) |
| `Permintaan` | Satu "kasus" siklus reproduksi per sapi per pengajuan |
| `Laporan` | Supertype — checkpoint pelaporan dalam satu siklus |
| `Laporan_IB` | Detail pelaksanaan tindakan inseminasi buatan |
| `Laporan_Kebuntingan` | Hasil cek bunting: `hamil` / `birahi` / `tidak hamil` |
| `Laporan_Keguguran` | Dokumentasi kejadian keguguran |
| `Laporan_Kelahiran` | Hasil akhir: `lahir selamat` / `mati lahir` |
| `Semen` | Inventaris straw semen (kode, batch, kadaluarsa) |

### Pola Kunci

- **`Permintaan`** merepresentasikan satu siklus reproduksi, dengan kolom `status_validitas`, `persetujuan_permintaan`, dan `status_permintaan` untuk melacak progres dan keputusan admin.
- **`Laporan`** (supertype) + empat tabel anak menggunakan **Class Table Inheritance (shared primary key)** — satu `id_laporan` hanya boleh ada di **satu** dari empat subtype, sesuai tahap yang sedang aktif.
- Flag boolean (`flag_laporan_IB`, `flag_laporan_kebuntingan`, dll.) pada tabel `Laporan` berfungsi sebagai state machine sederhana untuk query cepat tahap mana yang masih menunggu tindak lanjut.

> 📄 Detail lengkap seluruh kolom, tipe data, constraint, dan catatan implementasi PostgreSQL tersedia di [`ERD_TernakKu_Capstone.md`](./ERD_TernakKu_Capstone.md).

---

## API Endpoints

Semua endpoint diawali dengan prefix `/api/v1/`. Autentikasi menggunakan **Bearer JWT Token**.

| Grup | Base Path | Keterangan |
|---|---|---|
| Auth | `/api/v1/auth` | Login, register (Admin, Petugas, Peternak) |
| Peternak | `/api/v1/peternak` | CRUD data peternak |
| Sapi | `/api/v1/sapi` | CRUD sapi milik peternak |
| Foto | `/api/v1/foto` | Upload & kelola foto sapi |
| Permintaan | `/api/v1/permintaan` | Buat, verifikasi & pantau permintaan IB |
| Laporan | `/api/v1/laporan` | Laporan IB, kebuntingan, keguguran, kelahiran |
| Semen | `/api/v1/semen` | Inventaris straw semen |
| Petugas | `/api/v1/petugas` | CRUD data petugas lapangan |
| Health | `/api/v1/health` | Cek status server |

---

## Cara Menjalankan (Setup Lokal)

### Prasyarat

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **Android Studio** (untuk menjalankan aplikasi Android)
- **Git**

---

### 1. Clone Repositori

```bash
git clone https://github.com/<username>/siternak-CAP.git
cd siternak-CAP
```

---

### 2. Setup Backend

```bash
cd backend
```

**Install dependensi:**
```bash
npm install
```

**Konfigurasi environment:**
```bash
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi lokal Anda:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=ternakku_db

# JWT
JWT_SECRET=ganti_dengan_secret_yang_kuat
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=uploads
```

**Buat database PostgreSQL:**
```sql
CREATE DATABASE ternakku_db;
```

**Jalankan migrasi database:**
```bash
npm run migrate
```

**Jalankan server (development):**
```bash
npm run dev
```

Server berjalan di `http://localhost:3000`. Cek status: `GET /api/v1/health`.

---

### 3. Setup Android App

1. Buka folder `app/` menggunakan **Android Studio**.
2. Pastikan Android Studio sudah terinstall dan SDK API 31+ tersedia.
3. Sesuaikan **base URL** di konfigurasi network app agar mengarah ke backend lokal (misalnya `http://10.0.2.2:3000/api/v1/` untuk emulator).
4. Build dan jalankan di emulator atau perangkat fisik.

---

## Kredit & Referensi

- **Proyek:** Capstone Kelompok 15
- **Referensi desain backend:** [istiadilia/siternak-be](https://github.com/istiadilia/siternak-be)
- **Referensi antarmuka web (Admin & Petugas):** Repositori privat — dikembangkan berdasarkan dokumen proses bisnis capstone yang sama.
- **Dokumen proses bisnis:** *Proses Bisnis Capstone 15* — dokumen internal kelompok.
- **Peta & geolokasi:** [osmdroid](https://github.com/osmdroid/osmdroid) — OpenStreetMap-based Android mapping library.

---

> ⚠️ **Catatan Pengembang:** Proyek ini masih dalam tahap pengembangan aktif. Backend berjalan secara lokal. Beberapa fitur pada antarmuka Android dan web masih dalam proses integrasi.
