# Plan 02 — Web Frontend for Admin & Petugas Actors

> **Primary Source:** Academic journal *fulltext_G6401211060_4d1e4e14c5ba472e8af8bfd09229a21f.pdf* — the reference web system built by `istiadilia/siternak-be`. The journal documents two iterations of a prototyping process. **Iteration 2 is the target** (state machine–based design).
>
> **Scope:** Design and implement a React + Vite web frontend for **Admin** and **Petugas** actors. The Android app (`app/`) covers **Peternak** only.
>
> **Backend:** Same REST API as the Android app (`/api/v1/...`). Backend must be fixed and extended per [Plan 01](./plan_01_backend_routing_fix.md) before this frontend can be fully integrated.

---

## Critical Architectural Insight from the Journal

The journal (Iteration 2) introduces a **centralized state machine** pattern that is fundamentally different from a naive CRUD approach. Key design rules extracted from the journal (pp. 36–55, 74–76):

### State Machine: How `Laporan` Works

When Admin approves a `Permintaan`, the system **does not wait for the petugas to create a `Laporan`**. Instead:
1. Admin clicks "Setujui & Tugaskan Petugas" → backend **simultaneously** updates `Permintaan` status AND **creates a `Laporan` placeholder row** (with `flag_menunggu_laporan=true`, `flag_laporan_ib=true`, and `petugas_id` set).
2. Petugas sees this placeholder as their "tugas" (task).
3. Petugas clicks "Konfirmasi Tugas" (`PUT /api/tugas/:laporan_id/konfirmasi`) → `status_permintaan` updates to "Petugas Menuju Lokasi", `tenggat_waktu` resets to now + 24h.
4. Petugas fills and submits the laporan form (`POST /api/laporan/ib/:laporan_id`) → backend fills in the placeholder, advances flags to the next stage, sets `tenggat_waktu = now + 3 months`.
5. This pattern repeats for each phase (IB → Kebuntingan → Kelahiran/Keguguran).

### `tenggat_waktu` (Deadline) Column

The journal (p. 53) describes a **dynamic deadline system**:
- Created when Admin assigns petugas; reset when petugas confirms task (+24h).
- After IB berhasil: `tenggat_waktu = +3 bulan` (waiting for kebuntingan).
- After bunting: `tenggat_waktu = +7 bulan from IB awal` (waiting for kelahiran).
- Deadline passed → System auto-escalates, Admin sees badge count on dashboard.
- API: `GET /api/notifications/counts` — returns count of overdue permintaan.

> **This means `tenggat_waktu` column must be added to the `laporan` table** as part of Plan 01's backend work.

### Laporan POST Endpoints Use `laporan_id` (not `permintaan_id`)

From the journal testing tables (p. 76):
```
POST /api/laporan/ib/:laporan_id
POST /api/laporan/kebuntingan/:laporan_id
POST /api/laporan/kelahiran/:laporan_id
POST /api/laporan/keguguran/:laporan_id
```
The `laporan_id` refers to the **placeholder row** created at validation time. The current backend uses `id_permintaan` in the body instead — this must be reconciled in Plan 01.

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React + Vite** | Confirmed by journal (p. 34): "antarmuka pengguna dikembangkan menggunakan React dan Vite" |
| HTTP Client | **Axios** | Standard for React; interceptor support for JWT |
| Routing | **React Router v6** | Role-based routing |
| Styling | **Vanilla CSS / CSS Modules** | No Tailwind unless explicitly requested |

Scaffold:
```bash
# from repo root
npx create-vite@latest web --template react
cd web
npm install axios react-router-dom
```

---

## 2. Project Structure

```
web/
├── src/
│   ├── api/
│   │   └── apiClient.js          ← Axios with JWT interceptor
│   ├── context/
│   │   └── AuthContext.jsx       ← Token + role storage
│   ├── components/
│   │   ├── ProtectedRoute.jsx    ← Role guard
│   │   ├── Navbar.jsx
│   │   ├── NotifCard.jsx         ← Notification count cards (dashboard)
│   │   ├── PermintaanTable.jsx   ← Reusable table with filter/search
│   │   ├── StatusTimeline.jsx    ← Visual cycle timeline (journal Fig. 37)
│   │   └── modals/
│   │       ├── ModalLaporanIB.jsx
│   │       ├── ModalLaporanKebuntingan.jsx
│   │       ├── ModalLaporanKeguguran.jsx
│   │       └── ModalLaporanKelahiran.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx
│   │   ├── admin/
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── DetailPermintaanAdmin.jsx
│   │   │   ├── PetugasListPage.jsx
│   │   │   └── SemenPage.jsx
│   │   └── petugas/
│   │       ├── DashboardPetugas.jsx
│   │       └── DetailTugasPetugas.jsx
│   ├── utils/
│   │   └── getStatusDisplay.js   ← Maps flags + status to display text (journal p. 73)
│   ├── App.jsx
│   └── main.jsx
```

---

## 3. Authentication

Both Admin and Petugas use:

```
POST /api/v1/auth/login
Body: { email, password, role: "admin" | "petugas" }
Response: { token, role, user }
```

Store `token` and `role` in `localStorage`. Axios interceptor attaches `Authorization: Bearer <token>` on every request. On `401`, clear storage and redirect to `/login`.

```js
// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({ baseURL: 'http://localhost:3000' });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
```

---

## 4. Routing (React Router v6)

```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  {/* Admin */}
  <Route element={<ProtectedRoute requiredRole="admin" />}>
    <Route path="/admin" element={<DashboardAdmin />} />
    <Route path="/admin/permintaan/:id" element={<DetailPermintaanAdmin />} />
    <Route path="/admin/petugas" element={<PetugasListPage />} />
    <Route path="/admin/semen" element={<SemenPage />} />
  </Route>

  {/* Petugas */}
  <Route element={<ProtectedRoute requiredRole="petugas" />}>
    <Route path="/petugas" element={<DashboardPetugas />} />
    <Route path="/petugas/tugas/:laporan_id" element={<DetailTugasPetugas />} />
  </Route>

  <Route path="*" element={<Navigate to="/login" />} />
</Routes>
```

---

## 5. Shared Utility: `getStatusDisplay.js`

From the journal (p. 73): "fungsi helper `getStatusDisplay` untuk memastikan status yang ditampilkan selalu konsisten". This function translates the raw `status_permintaan` + active `flags` into a human-readable label and color:

```js
// src/utils/getStatusDisplay.js
export function getStatusDisplay(permintaan, laporan) {
  const sp = permintaan?.status_permintaan;
  const flags = laporan || {};

  if (sp === 'Menunggu') return { label: 'Menunggu Validasi Admin', color: 'gray' };
  if (sp === 'Ditolak') return { label: 'Ditolak', color: 'red' };
  if (flags.flag_laporan_ib && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Laporan IB', color: 'orange' };
  if (flags.flag_laporan_kebuntingan && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Cek Kebuntingan', color: 'blue' };
  if (flags.flag_laporan_kelahiran && flags.flag_menunggu_laporan)
    return { label: 'Menunggu Laporan Kelahiran', color: 'purple' };
  if (flags.flag_laporan_keguguran && flags.flag_menunggu_laporan)
    return { label: 'Verifikasi Keguguran', color: 'darkred' };
  if (sp === 'Selesai') return { label: 'Selesai', color: 'green' };
  return { label: sp || 'Tidak Diketahui', color: 'gray' };
}
```

---

## 6. Admin Actor — All Screens

### 6.1 `DashboardAdmin.jsx`

**Journal ref:** p. 33 (Fig. 9), p. 73 (Fig. 36 — notification cards, iteration 2).

**Layout:**
- Top row: 3–4 **notification cards** (`NotifCard` component):
  - Total permintaan baru (status = 'Menunggu')
  - Laporan terlambat (`tenggat_waktu < NOW()`) — from `GET /api/v1/notifications/counts`
  - Permintaan aktif (status = 'Diproses')
- Below: **PermintaanTable** — full list of all permintaan.
  - Columns: No., Peternak, Sapi EarTag, Lokasi, Tanggal Pengajuan, Status (via `getStatusDisplay`), Aksi (link to detail).
  - Filter bar: text search + status dropdown filter.
  - Auto-refresh every 30 seconds (polling) to detect new permintaan.

**API calls:**
- `GET /api/v1/permintaan` — all permintaan (add filter `?status_permintaan=` param)
- `GET /api/v1/notifications/counts` — overdue count *(requires new backend endpoint — see Plan 01)*

---

### 6.2 `DetailPermintaanAdmin.jsx`

**Journal ref:** p. 33 (Fig. 10), p. 73–74 (Figs. 37–38, iteration 2 timeline + action buttons).

This is the **most important admin screen**. It shows a single permintaan's full lifecycle.

**Top section — Info cards (read-only):**
- Sapi: earTag, berat, jenis kelamin, foto (from `GET /api/v1/foto/sapi/:sapiId`)
- Peternak: nama, kontak, alamat
- Lokasi kandang
- Petugas yang ditugaskan (if assigned)
- Current `status_permintaan`
- `tenggat_waktu` countdown (if active)

**StatusTimeline (visual, from journal Fig. 37):**
Vertical stepper with these stages:
```
[1] Pengajuan Permintaan
[2] Validasi Admin
[3] IB Awal           ← active if flag_laporan_ib
[4] Cek Kebuntingan   ← active if flag_laporan_kebuntingan
[5] Kelahiran / Keguguran ← active if flag_laporan_kelahiran / keguguran
[6] Selesai
```
Each stage is colored: completed (green), active/pending (orange), failed (red), upcoming (gray).

**Conditional Action Panel (journal p. 47–50, use case descriptions):**

| Condition | Button Shown |
|---|---|
| `status_permintaan = 'Menunggu'` | **[Setujui & Tugaskan Petugas]** + **[Tolak Permintaan]** |
| After setujui, laporan kebuntingan/kelahiran needed | **[Tugaskan Cek Kebuntingan]**, **[Tugaskan Verifikasi Keguguran]**, or **[Tugaskan Cek Kelahiran]** |
| `status_permintaan = 'Selesai'` or all flags false | Read-only |

**"Setujui & Tugaskan Petugas" flow (journal p. 47–48, Use Case Table 10):**
1. Admin clicks button → dropdown to select petugas (`GET /api/v1/petugas`).
2. Confirm → `PUT /api/v1/permintaan/:id/validasi` with body:
   ```json
   { "status_validitas": "Valid", "persetujuan_permintaan": "Disetujui", "petugas_id": <selected_id> }
   ```
3. Backend simultaneously: updates permintaan status, **creates Laporan placeholder** with `flag_menunggu_laporan=true`, `flag_laporan_ib=true`, `petugas_id` set. *(This backend behavior must be implemented per Plan 01.)*
4. Frontend refreshes page.

**"Tolak Permintaan" flow:**
- Shows text input for `alasan_penolakan`.
- `PUT /api/v1/permintaan/:id/validasi` body: `{ "status_validitas": "Tidak Valid", "persetujuan_permintaan": "Ditolak", "alasan_penolakan": "..." }`.

**"Tugaskan Cek Kebuntingan / Kelahiran / Keguguran" flow (journal p. 49, Use Case Table 12):**
- Admin selects petugas → `PUT /api/v1/permintaan/:id/tugaskan-lanjutan` body: `{ "jenis_laporan": "kebuntingan", "petugas_id": ... }`.
- Backend creates a new Laporan placeholder row for the correct subtype, updates `status_permintaan`.

**API calls:**
- `GET /api/v1/permintaan/:id` — full detail with joins
- `GET /api/v1/laporan/permintaan/:id` — timeline
- `GET /api/v1/foto/sapi/:sapiId`
- `GET /api/v1/petugas` — for dropdown
- `PUT /api/v1/permintaan/:id/validasi`
- `PUT /api/v1/permintaan/:id/tugaskan-lanjutan` *(new endpoint — Plan 01)*

---

### 6.3 `PetugasListPage.jsx`

- Table: petugas_nama, petugas_email, petugas_kontak, petugas_kinerja.
- **[Tambah Petugas]** → form with: nama, email, password, kontak → `POST /api/v1/auth/register/petugas`.
- **[Hapus]** / **[Edit]** per row.

**API:** `GET /api/v1/petugas`, `POST /api/v1/auth/register/petugas`, `PUT /api/v1/petugas/:id`

---

### 6.4 `SemenPage.jsx`

- Table: kode_straw, semen_batch, tanggal_produksi, tanggal_kadaluarsa.
- **[Tambah]** form, **[Hapus]** per row.
- Highlight expired straw (tanggal_kadaluarsa < today) in red.

**API:** `GET /api/v1/semen`, `POST /api/v1/semen`, `DELETE /api/v1/semen/:kode`

---

## 7. Petugas Actor — All Screens

### 7.1 `DashboardPetugas.jsx`

**Journal ref:** p. 34 (Fig. 11), iteration 2 design.

**Layout:**
- Notification cards:
  - Tugas baru/belum dikonfirmasi
  - Tugas aktif (sudah dikonfirmasi, laporan belum diisi)
  - Tugas terlambat (`tenggat_waktu < NOW()`)
- **Tugas table** — all permintaan assigned to this petugas.
  - Columns: Sapi EarTag, Peternak, Lokasi, Jenis Tugas (IB / Kebuntingan / Kelahiran), Status, Tenggat Waktu.
  - Click row → `DetailTugasPetugas`.

**API:** `GET /api/v1/petugas/tugas` (returns permintaan assigned to logged-in petugas — Plan 01)

---

### 7.2 `DetailTugasPetugas.jsx`

**Journal ref:** p. 33–34 (Figs. 10–11), pp. 49–50 (Use Case Tables 13–16), p. 74 (Fig. 38 — modal form).

Same info cards as admin detail (Sapi, Peternak, Lokasi) but **petugas-specific action panel**.

**Conditional action logic (based on `laporan` flags):**

| Flag Active | Laporan Filled? | Button |
|---|---|---|
| `flag_laporan_ib = true`, no detail yet | Not confirmed | **[Konfirmasi Tugas]** |
| `flag_laporan_ib = true`, confirmed | Confirmed, no report | **[Isi Laporan IB]** → opens `ModalLaporanIB` |
| `flag_laporan_kebuntingan = true`, confirmed | Not reported | **[Isi Laporan Kebuntingan]** → `ModalLaporanKebuntingan` |
| `flag_laporan_keguguran = true`, confirmed | Not reported | **[Isi Laporan Keguguran]** → `ModalLaporanKeguguran` |
| `flag_laporan_kelahiran = true`, confirmed | Not reported | **[Isi Laporan Kelahiran]** → `ModalLaporanKelahiran` |
| All flags false | — | Read-only: "Tugas selesai" |

**"Konfirmasi Tugas" action (journal p. 49, Use Case Table 13):**
```
PUT /api/v1/tugas/:laporan_id/konfirmasi
```
- Updates `status_permintaan` to "Petugas Menuju Lokasi [Jenis]"
- Resets `tenggat_waktu` to now + 24 hours.
*(New backend endpoint — Plan 01)*

**StatusTimeline** — same visual component as admin detail, read-only here.

**API calls:**
- `GET /api/v1/permintaan/:id` — permintaan detail
- `GET /api/v1/laporan/permintaan/:id` — to determine which flag is active and whether placeholder is confirmed
- `PUT /api/v1/tugas/:laporan_id/konfirmasi`
- Modal-specific POST calls (see Section 8)

---

## 8. Laporan Modals (Petugas)

Each modal appears as an overlay when the relevant "Isi Laporan" button is pressed. Journal (p. 74, Fig. 38): "komponen modal laporan yang terpisah".

All POST calls use **`laporan_id`** (the placeholder row ID), not `permintaan_id`:

### 8.1 `ModalLaporanIB.jsx`

**Journal ref:** p. 50 (Use Case Table 14), p. 76 (testing table — `POST /api/laporan/ib/:laporan_id`)

Fields:
- `kode_straw` — dropdown from `GET /api/v1/semen`
- `isi_laporan_ib` — textarea
- `waktu_proses_ib` — datetime picker
- `hasil_ib` — radio: **Berhasil** / **Gagal**
- `komentar` — textarea (optional)

On submit: `POST /api/v1/laporan/ib/:laporan_id`

Backend response behavior (journal p. 76):
- If **Berhasil**: `flag_laporan_ib → false`, `flag_laporan_kebuntingan → true`, `tenggat_waktu += 3 months`
- If **Gagal**: `flag_menunggu_laporan → false`, `status_permintaan = 'IB Gagal'`, `hasil_akhir = 'IB Gagal'`

### 8.2 `ModalLaporanKebuntingan.jsx`

**Journal ref:** p. 50 (Use Case Table 15), p. 76

Fields:
- `isi_laporan_kebuntingan` — textarea
- `waktu_kebuntingan` — datetime picker
- `hasil_pemeriksaan` — radio: **Bunting** / **Tidak Bunting**
- `tanggal_hpl` — date picker (shown only if Bunting)

On submit: `POST /api/v1/laporan/kebuntingan/:laporan_id`

Backend behavior (journal p. 76):
- If **Bunting**: `flag_laporan_kebuntingan → false`, `flag_laporan_kelahiran → true`, `tenggat_waktu = IB_awal + 7 months`
- If **Tidak Bunting**: `flag_menunggu_laporan → false`, `hasil_akhir = 'Tidak Bunting'`

### 8.3 `ModalLaporanKeguguran.jsx`

**Journal ref:** p. 55 (Fig. 21 — phase 3), p. 77 (negative test table)

Fields:
- `isi_laporan_keguguran` — textarea
- `waktu_keguguran` — datetime picker

On submit: `POST /api/v1/laporan/keguguran/:laporan_id`

Backend behavior: `flag_menunggu_laporan → false`, `hasil_akhir = 'Keguguran'`, `status_permintaan = 'Selesai'`

### 8.4 `ModalLaporanKelahiran.jsx`

Fields:
- `isi_laporan_kelahiran` — textarea
- `kondisi_anak_sapi` — dropdown: `selamat` / `mati lahir`
- `jenis_kelamin_anak_sapi` — radio: `jantan` / `betina`
- `waktu_kelahiran` — datetime picker

On submit: `POST /api/v1/laporan/kelahiran/:laporan_id`

Backend behavior (journal p. 76): All flags → false, `tenggat_waktu = NULL`, `hasil_akhir` set, `status_permintaan = 'Selesai'`

---

## 9. Notifications / Deadline System

The journal (p. 53) describes **backend deadline detection**:
- A background check (or triggered on dashboard load) finds `tenggat_waktu < NOW()`.
- Admin dashboard shows the count via badge.

**MVP approach (no WebSocket needed):**
- `GET /api/v1/notifications/counts` → returns `{ overdue: N, new: M }`
- Called on every Admin dashboard load and every 30 seconds.
- Display as red badge number on notification card.

> This requires a new backend endpoint (Plan 01) that queries: `SELECT COUNT(*) FROM laporan WHERE tenggat_waktu < NOW() AND flag_menunggu_laporan = true`.

---

## 10. CORS Fix (Backend Requirement)

```bash
cd backend && npm install cors
```

In `backend/src/app.js`, add before routes:
```js
const cors = require('cors');
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
```

---

## 11. New Backend Endpoints Required (From PDF Analysis)

These are **in addition to** Plan 01's list. The journal reveals endpoints not previously identified:

| Method | Path | Purpose |
|---|---|---|
| `PUT` | `/api/v1/tugas/:laporan_id/konfirmasi` | Petugas confirms receipt of task — resets `tenggat_waktu` to +24h, updates status |
| `PUT` | `/api/v1/permintaan/:id/tugaskan-lanjutan` | Admin assigns petugas for follow-up (kebuntingan / kelahiran / keguguran check) — creates new Laporan placeholder |
| `GET` | `/api/v1/notifications/counts` | Returns count of overdue laporan and new permintaan |
| `POST` | `/api/v1/laporan/ib/:laporan_id` | Submit IB report by `laporan_id` (not `permintaan_id`) |
| `POST` | `/api/v1/laporan/kebuntingan/:laporan_id` | Submit kebuntingan report by `laporan_id` |
| `POST` | `/api/v1/laporan/keguguran/:laporan_id` | Submit keguguran report by `laporan_id` |
| `POST` | `/api/v1/laporan/kelahiran/:laporan_id` | Submit kelahiran report by `laporan_id` |

> **Note on `laporan_id` vs `permintaan_id`:** The journal's design submits laporan by the placeholder `laporan_id`, not the permintaan. This requires updating the current backend laporan POST handlers to accept `laporan_id` as a route param and fill the existing placeholder row, rather than creating a new one.

Additionally, `laporan` table needs `tenggat_waktu` and `tugas_ib_awal` columns. The migration `009_create_laporan.js` already has `tugas_ib_awal` — add `tenggal_waktu` if not already present (check migration file).

---

## 12. Execution Order

1. Scaffold `web/` with Vite React template.
2. Install `axios`, `react-router-dom`.
3. Fix CORS in backend `app.js`.
4. Build `apiClient.js` + `AuthContext.jsx` + `ProtectedRoute.jsx`.
5. Build `LoginPage.jsx` — test admin and petugas login.
6. Build `getStatusDisplay.js` utility.
7. **Admin path:**
   - `DashboardAdmin` with notification cards + table
   - `DetailPermintaanAdmin` with `StatusTimeline` + conditional action buttons
   - `PetugasListPage` + `SemenPage`
8. **Petugas path:**
   - `DashboardPetugas` with tugas table
   - `DetailTugasPetugas` with `StatusTimeline` + konfirmasi + laporan modals
9. Build all 4 laporan modals.
10. Add polling/refresh for notifications.
11. Full E2E test per [Plan 03](./plan_03_verification.md).
