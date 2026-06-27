# ERD — Sistem Manajemen Reproduksi Sapi (TernakKu Capstone)

> Dokumen ini adalah hasil pembacaan ulang (re-check) dari diagram ERD `ternakKu_capstone.png`.
> Tujuannya untuk dipakai sebagai acuan saat membuat skema PostgreSQL, jadi setiap tabel,
> kolom, tipe data, constraint, dan relasi dituliskan selengkap dan seakurat mungkin sesuai
> gambar aslinya. Penamaan tabel/kolom dipertahankan dalam Bahasa Indonesia sesuai diagram.

---

## Daftar Entitas

1. [Admin](#1-admin)
2. [Peternak](#2-peternak)
3. [Sapi](#3-sapi)
4. [Foto](#4-foto)
5. [Permintaan](#5-permintaan)
6. [Laporan](#6-laporan-supertype)
7. [Laporan_IB](#7-laporan_ib-subtype-dari-laporan)
8. [Laporan_Kebuntingan](#8-laporan_kebuntingan-subtype-dari-laporan)
9. [Laporan_Keguguran](#9-laporan_keguguran-subtype-dari-laporan)
10. [Laporan_Kelahiran](#10-laporan_kelahiran-subtype-dari-laporan)
11. [Semen](#11-semen)
12. [Petugas](#12-petugas)

---

## 1. Admin

| Kolom | Tipe | Constraint |
|---|---|---|
| admin_id | INT | PK, AUTO_INCREMENT |
| admin_nama | VARCHAR(100) | NOT NULL |
| admin_kontak | VARCHAR(20) | – |
| admin_email | VARCHAR(100) | NOT NULL, UNIQUE |
| admin_Password | VARCHAR(100) | NOT NULL |

**Relasi:**
- `Admin (1) ──── (0..N) Permintaan` — satu admin bisa memproses/menerima banyak permintaan; satu permintaan punya tepat satu admin (lewat FK `admin_id` di tabel `Permintaan`).

---

## 2. Peternak

| Kolom | Tipe | Constraint |
|---|---|---|
| peternak_id | INT | PK, AUTO_INCREMENT |
| peternak_nama | VARCHAR(100) | NOT NULL |
| peternak_kontak | VARCHAR(20) | – |
| peternak_alamat | TEXT | – |
| peternak_email | VARCHAR(100) | NOT NULL, UNIQUE |

**Relasi:**
- `Peternak (1) ──── (0..N) Sapi` — satu peternak bisa memiliki banyak sapi; satu sapi wajib dimiliki tepat satu peternak (FK `peternak_id` NOT NULL di tabel `Sapi`).

---

## 3. Sapi

| Kolom | Tipe | Constraint |
|---|---|---|
| sapi_id | INT | PK, AUTO_INCREMENT |
| peternak_id | INT | FK → Peternak.peternak_id, NOT NULL |
| sapi_jenis_kelamin | ENUM | NOT NULL |
| sapi_eartag | VARCHAR(20) | – |
| sapi_berat | DECIMAL | – |
| tanggal_terdaftar | DATETIME | – |

**Relasi:**
- `Sapi (1) ──── (0..N) Permintaan` — satu sapi bisa punya banyak riwayat permintaan IB; satu permintaan merujuk ke tepat satu sapi (FK `sapi_id` di tabel `Permintaan`).
- `Sapi (1) ──── (0..N) Foto` — satu sapi bisa punya banyak foto (depan/belakang/umum); satu foto milik tepat satu sapi (FK `sapi_id` NOT NULL di tabel `Foto`).

> **Catatan desain:** Karena `sapi_jenis_kelamin` ber-ENUM dan ada field `Laporan_Kelahiran.jenis_kelamin_anak_sapi`, kemungkinan besar ENUM ini hanya berisi `'jantan'`/`'betina'`. Sesuaikan dengan kebutuhan bisnis riil saat implementasi PostgreSQL (PostgreSQL tidak punya tipe `ENUM` native seperti MySQL — gunakan `CREATE TYPE ... AS ENUM (...)` atau `CHECK` constraint).

---

## 4. Foto

| Kolom | Tipe | Constraint |
|---|---|---|
| foto_id | INT | PK, AUTO_INCREMENT |
| sapi_id | INT | FK → Sapi.sapi_id, NOT NULL |
| foto_path | VARCHAR(255) | NOT NULL |
| foto_tipe | ENUM | nilai: `'depan'`, `'belakang'`, `'umum'` |

**Relasi:**
- Many-to-one ke `Sapi` (lihat di atas).

---

## 5. Permintaan

Tabel ini merepresentasikan **permintaan/pengajuan tindakan IB (Inseminasi Buatan)** yang diajukan untuk seekor sapi.

| Kolom | Tipe | Constraint |
|---|---|---|
| id_permintaan | INT | PK, AUTO_INCREMENT |
| sapi_id | INT | FK → Sapi.sapi_id |
| admin_id | INT | FK → Admin.admin_id |
| tanggal_pengajuan | INT* | default CURRENT_TIMESTAMP |
| lokasi_ternak | VARCHAR(255) | NOT NULL |
| status_validitas | ENUM | default `'Menunggu'` |
| persetujuan_permintaan | ENUM | default NULL |
| alasan_penolakan | TEXT | – |
| status_permintaan | VARCHAR(100) | default `'Menunggu'` |
| hasil_akhir | VARCHAR(100) | – |

> *⚠️ **Inkonsistensi pada diagram asli:** kolom `tanggal_pengajuan` digambar bertipe `INT` padahal nilai default-nya `CURRENT_TIMESTAMP`, yang menunjukkan ini seharusnya bertipe **DATETIME/TIMESTAMP**. Saat membuat tabel PostgreSQL, gunakan `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, bukan `INT`. Ini kemungkinan typo di ERD asli.

**Relasi:**
- Many-to-one ke `Sapi` dan ke `Admin` (lihat di atas).
- `Permintaan (1) ──── (0..1) Laporan` — satu permintaan paling banyak menghasilkan satu baris `Laporan` (relasi opsional 1-ke-0/1, sesuai notasi crow's foot di diagram: sisi `Laporan` adalah "satu atau nol").

**Catatan bisnis (disimpulkan dari kolom + proses bisnis):**
- `status_validitas`: kemungkinan menyatakan apakah laporan/permintaan ini valid secara administratif (misalnya `'Menunggu'`, `'Valid'`, `'Tidak Valid'`).
- `persetujuan_permintaan`: kemungkinan ENUM `'Disetujui'` / `'Ditolak'` — keputusan admin atas permintaan IB.
- `status_permintaan`: status keseluruhan siklus permintaan (`'Menunggu'`, `'Diproses'`, `'Selesai'`, dll).
- `hasil_akhir`: ringkasan hasil akhir siklus reproduksi terkait permintaan ini.

---

## 6. Laporan (Supertype)

Tabel ini adalah **supertype** dari sebuah relasi **disjoint subtype (exclusive-or)**, ditandai simbol `d` pada diagram. Artinya: setiap baris `Laporan` akan punya **tepat satu** baris pasangan di salah satu dari empat tabel subtype (`Laporan_IB`, `Laporan_Kebuntingan`, `Laporan_Keguguran`, `Laporan_Kelahiran`), tidak boleh lebih dari satu dan tidak boleh tidak ada — sesuai dengan tahap apa yang sedang dilaporkan dalam siklus reproduksi sapi tersebut.

| Kolom | Tipe | Constraint |
|---|---|---|
| id_laporan | INT | PK, AUTO_INCREMENT |
| id_permintaan | INT | FK → Permintaan.id_permintaan |
| flag_menunggu_laporan | TINYINT(1) | default 1 |
| flag_laporan_IB | TINYINT(1) | default 0 |
| flag_laporan_kebuntingan | TINYINT(1) | default 0 |
| flag_laporan_keguguran | TINYINT(1) | default 0 |
| flag_laporan_kelahiran | TINYINT(1) | default 0 |
| tanggal_waktu | DATETIME | – |
| tugas_IB_awal | DATETIME | – |

> 💡 Pada PostgreSQL, `TINYINT(1)` tidak ada — gunakan `BOOLEAN` (`DEFAULT TRUE` / `DEFAULT FALSE`).

**Relasi:**
- Many-to-one ke `Permintaan` (satu `Permintaan` → 0 atau 1 `Laporan`, lihat di atas).
- `Laporan (1) ──── (1) {Laporan_IB | Laporan_Kebuntingan | Laporan_Keguguran | Laporan_Kelahiran}` — relasi subtype eksklusif. PK dari masing-masing tabel subtype = FK ke `Laporan.id_laporan` (pola **Class Table Inheritance / shared primary key**).

**Catatan bisnis:**
Kombinasi kolom flag (`flag_menunggu_laporan`, `flag_laporan_IB`, `flag_laporan_kebuntingan`, `flag_laporan_keguguran`, `flag_laporan_kelahiran`) berfungsi sebagai **penanda tahap mana dari siklus reproduksi** yang sedang/sudah dilaporkan untuk permintaan ini — sejalan dengan tahapan di proses bisnis: birahi → IB → (birahi ulang / kebuntingan) → kelahiran/keguguran.

---

## 7. Laporan_IB (subtype dari Laporan)

Laporan hasil pelaksanaan tindakan **Inseminasi Buatan (IB)**.

| Kolom | Tipe | Constraint |
|---|---|---|
| laporan_id | INT | PK, FK → Laporan.id_laporan |
| petugas_id | INT | FK → Petugas.petugas_id |
| kode_straw | VARCHAR(5)* | FK → Semen.kode_straw |
| tanggal_pengajuan | DATETIME | default CURRENT_TIMESTAMP |
| isi_laporan_IB | TEXT | – |
| waktu_proses_IB | DATETIME | – |
| is_success | TINYINT(1) | – |
| komentar | TEXT | – |

> *Lebar VARCHAR untuk `kode_straw` terpotong di gambar (`VARCHAR(5...`); sesuaikan dengan lebar yang sama dengan `Semen.kode_straw` saat implementasi (lihat tabel `Semen`).

**Relasi:**
- `laporan_id` adalah PK sekaligus FK ke `Laporan.id_laporan` (1-to-1, shared PK pattern khas table inheritance).
- Many-to-one ke `Petugas` — satu petugas bisa menangani banyak laporan IB.
- `Semen (1) ──── (0..N) Laporan_IB` — satu batch semen/straw bisa dipakai di banyak laporan IB; `kode_straw` di sini **opsional** (boleh NULL — sesuai notasi lingkaran "zero" di diagram), kemungkinan karena IB bisa gagal dilakukan sebelum straw-nya tercatat.

---

## 8. Laporan_Kebuntingan (subtype dari Laporan)

Laporan hasil **pemeriksaan kebuntingan** (umumnya dilakukan di bulan ke-3 setelah IB, sesuai proses bisnis).

| Kolom | Tipe | Constraint |
|---|---|---|
| laporan_id | INT | PK, FK → Laporan.id_laporan |
| petugas_id | INT | FK → Petugas.petugas_id |
| tanggal_pengajuan | DATETIME | default CURRENT_TIMESTAMP |
| isi_laporan_kebuntingan | TEXT | – |
| waktu_kebuntingan | DATETIME | – |
| hasil_pemeriksaan | ENUM | nilai: `'hamil'`, `'birahi'`, `'tidak hamil'` |
| tanggal_hpl | DATETIME | – |

**Relasi:**
- `laporan_id` PK/FK ke `Laporan` (1-to-1).
- Many-to-one ke `Petugas`.

**Catatan:** `tanggal_hpl` = perkiraan **Hari Perkiraan Lahir**, dihitung bila `hasil_pemeriksaan = 'hamil'`.

---

## 9. Laporan_Keguguran (subtype dari Laporan)

Laporan kejadian **keguguran**.

| Kolom | Tipe | Constraint |
|---|---|---|
| laporan_id | INT | PK, FK → Laporan.id_laporan |
| petugas_id | INT | FK → Petugas.petugas_id |
| tanggal_pengajuan | DATETIME | default CURRENT_TIMESTAMP |
| isi_laporan_keguguran | TEXT | – |
| waktu_keguguran | DATETIME | – |

**Relasi:**
- `laporan_id` PK/FK ke `Laporan` (1-to-1).
- Many-to-one ke `Petugas`.

---

## 10. Laporan_Kelahiran (subtype dari Laporan)

Laporan kejadian **kelahiran anak sapi** (selamat maupun mati lahir).

| Kolom | Tipe | Constraint |
|---|---|---|
| laporan_id | INT | PK, FK → Laporan.id_laporan |
| petugas_id | INT | FK → Petugas.petugas_id |
| tanggal_pengajuan | DATETIME | default CURRENT_TIMESTAMP |
| isi_laporan_kelahiran | TEXT | – |
| kondisi_anak_sapi | ENUM | kemungkinan: `'selamat'`, `'mati lahir'` |
| jenis_kelamin_anak_sapi | ENUM | kemungkinan: `'jantan'`, `'betina'` |
| waktu_kelahiran | ENUM* | – |

> *⚠️ **Inkonsistensi pada diagram asli:** `waktu_kelahiran` digambar bertipe `ENUM` tanpa daftar nilai, padahal secara semantik (nama kolom "waktu") ini lebih cocok bertipe **DATETIME/TIMESTAMP**, konsisten dengan `waktu_keguguran` dan `waktu_kebuntingan` di tabel subtype lainnya. Kemungkinan ini typo pada ERD asli — pertimbangkan menggunakan `TIMESTAMP` saat implementasi, kecuali memang dimaksudkan sebagai kategori waktu (misal `'pagi'/'siang'/'malam'`), yang sebaiknya dikonfirmasi ke pemilik proyek.

**Relasi:**
- `laporan_id` PK/FK ke `Laporan` (1-to-1).
- Many-to-one ke `Petugas`.

---

## 11. Semen

Data inventaris **straw semen/bibit** yang dipakai untuk proses IB.

| Kolom | Tipe | Constraint |
|---|---|---|
| kode_straw | VARCHAR(5) | PK |
| semen_batch | VARCHAR(5) | – |
| tanggal_produksi | DATETIME | – |
| tanggal_kadaluarsa | DATETIME | – |

**Relasi:**
- `Semen (1) ──── (0..N) Laporan_IB` (lihat di atas).

---

## 12. Petugas

Petugas lapangan (mantri/inseminator) yang menjalankan pemeriksaan dan tindakan IB.

| Kolom | Tipe | Constraint |
|---|---|---|
| petugas_id | INT | PK, AUTO_INCREMENT |
| petugas_nama | VARCHAR(100) | NOT NULL |
| petugas_kontak | VARCHAR(20) | – |
| petugas_email | VARCHAR(100) | NOT NULL, UNIQUE |
| petugas_password | VARCHAR(255) | NOT NULL |
| petugas_kinerja | TEXT | – |

**Relasi:**
- `Petugas (1) ──── (0..N) Laporan_IB`
- `Petugas (1) ──── (0..N) Laporan_Kebuntingan`
- `Petugas (1) ──── (0..N) Laporan_Keguguran`
- `Petugas (1) ──── (0..N) Laporan_Kelahiran`

(Satu petugas dapat menangani banyak laporan di keempat jenis subtype; setiap baris di subtype wajib merujuk tepat satu petugas.)

---

## Ringkasan Relasi (Crow's Foot Summary)

```
Admin        (1) ────── (0..N) Permintaan
Peternak     (1) ────── (0..N) Sapi
Sapi         (1) ────── (0..N) Permintaan
Sapi         (1) ────── (0..N) Foto
Permintaan   (1) ────── (0..1) Laporan
Laporan      (1) ────── (1)    Laporan_IB            ⎫
Laporan      (1) ────── (1)    Laporan_Kebuntingan    ⎬  disjoint subtype (d)
Laporan      (1) ────── (1)    Laporan_Keguguran      ⎪  hanya SATU yang terisi
Laporan      (1) ────── (1)    Laporan_Kelahiran      ⎭  per id_laporan
Semen        (1) ────── (0..N) Laporan_IB
Petugas      (1) ────── (0..N) Laporan_IB
Petugas      (1) ────── (0..N) Laporan_Kebuntingan
Petugas      (1) ────── (0..N) Laporan_Keguguran
Petugas      (1) ────── (0..N) Laporan_Kelahiran
```

---

## Catatan Penting untuk Implementasi PostgreSQL

1. **TINYINT(1) → BOOLEAN.** Semua kolom flag (`flag_menunggu_laporan`, dst.) dan `is_success` sebaiknya jadi `BOOLEAN` di Postgres.
2. **ENUM di MySQL vs PostgreSQL.** Postgres tidak mendukung sintaks `ENUM` inline seperti MySQL. Gunakan salah satu:
   - `CREATE TYPE status_validitas_enum AS ENUM ('Menunggu', 'Valid', 'Tidak Valid');` lalu pakai sebagai tipe kolom, atau
   - kolom `VARCHAR` + `CHECK (kolom IN (...))`.
3. **Subtype pattern (Laporan → 4 tabel anak).** Ini adalah pola **shared primary key inheritance**: `laporan_id` di tiap tabel anak adalah PK **dan** FK ke `Laporan.id_laporan` sekaligus (`PRIMARY KEY (laporan_id), FOREIGN KEY (laporan_id) REFERENCES Laporan(id_laporan)`). Untuk benar-benar memaksakan **exclusivity** (hanya 1 dari 4 subtype yang boleh terisi per `id_laporan`), tambahkan validasi di level aplikasi atau gunakan trigger, karena constraint relasional murni tidak otomatis menjamin disjointness ini.
4. **Perbaiki tipe data yang tidak konsisten** (lihat catatan ⚠️ di atas):
   - `Permintaan.tanggal_pengajuan`: ubah dari `INT` → `TIMESTAMP`.
   - `Laporan_Kelahiran.waktu_kelahiran`: pertimbangkan ubah dari `ENUM` → `TIMESTAMP`, atau konfirmasi dulu nilai ENUM yang dimaksud.
5. **Lebar kolom yang terpotong di gambar** (`VARCHAR(5...` pada `kode_straw`, `semen_batch`, `Laporan_IB.kode_straw`) — pastikan lebar `VARCHAR` antara tabel `Semen` dan kolom FK `kode_straw` di `Laporan_IB` **sama persis** agar FK valid.
6. **Penamaan kolom tidak konsisten** — beberapa tempat pakai snake_case penuh (`admin_password`), beberapa pakai campuran kapital (`admin_Password` di tabel Admin, `petugas_password` huruf kecil semua di tabel Petugas). Sebaiknya diseragamkan jadi snake_case murni saat membuat DDL.
7. **Auto-increment** → di Postgres gunakan `SERIAL`/`BIGSERIAL` atau `GENERATED ALWAYS AS IDENTITY`.
