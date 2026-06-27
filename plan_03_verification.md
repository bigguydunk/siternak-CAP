# Plan 03 — End-to-End Verification

> **Scope:** A complete, scenario-driven verification plan to confirm that the backend, Android app (Peternak), and web frontend (Admin + Petugas) work together correctly, covering the full reproductive cycle of one cow from birahi to birth.
>
> **Prerequisite:** Plans [01](./plan_01_backend_routing_fix.md) and [02](./plan_02_web_frontend_admin_petugas.md) must be implemented before running end-to-end scenarios. Standalone unit tests for each layer can be run independently.
>
> **Reference:** Business flow from [`Konteks_Proyek_TernakKu.md`](./Konteks_Proyek_TernakKu.md) Section 2 (10 stages). ERD from [`ERD_TernakKu_Capstone.md`](./ERD_TernakKu_Capstone.md).

---

## Setup Checklist (Run Before Any Test)

### Backend
- [ ] `cd backend && npm install`
- [ ] Copy `.env.example` → `.env`, fill in DB credentials
- [ ] PostgreSQL is running and `ternakku_db` database exists
- [ ] `npm run migrate` — confirm 14 migrations run without error (13 original + 1 from Plan 01)
- [ ] `npm run dev` — server starts on port 3000
- [ ] `GET http://localhost:3000/api/v1/health` → `{ success: true }`

### Web (Admin & Petugas)
- [ ] `cd web && npm install && npm run dev` — Vite starts on port 5173
- [ ] Backend CORS allows `http://localhost:5173` (see Plan 02 Section 8)

### Android App (Peternak)
- [ ] Open `app/` in Android Studio
- [ ] Set `BASE_URL` in `ApiConfig.kt` to `http://10.0.2.2:3000/` (emulator) or LAN IP (physical device)
- [ ] Build and run on emulator/device

---

## Part A — Backend Unit Tests (API Layer, Postman/curl)

Test each group of endpoints in isolation before running full end-to-end. All requests in this section go directly to the backend.

### A1 — Auth

| # | Request | Expected Response |
|---|---|---|
| 1 | `POST /api/v1/auth/register/admin` with valid body | `201` — admin created (first run only) |
| 2 | `POST /api/v1/auth/register/admin` (second run) | `409` — email already taken |
| 3 | `POST /api/v1/auth/register/peternak` valid body | `201` — peternak created, no token returned |
| 4 | `POST /api/v1/auth/login` — peternak email+pass+role | `200` — token + role: `peternak` |
| 5 | `POST /api/v1/auth/login` — admin email+pass+role | `200` — token + role: `admin` |
| 6 | `POST /api/v1/auth/login` wrong password | `401` |
| 7 | `POST /api/v1/auth/login` wrong role | `400` — role invalid |
| 8 | `GET /api/v1/auth/me` (with peternak token) | `200` — peternak user object |
| 9 | `GET /api/v1/auth/me` (no token) | `401` |

---

### A2 — Sapi

Use **peternak token** for all tests.

| # | Request | Expected |
|---|---|---|
| 10 | `POST /api/v1/sapi` body: `{ sapi_eartag, sapi_jenis_kelamin, sapi_berat }` | `201` — sapi created with peternak_id from token |
| 11 | `GET /api/v1/sapi/mine` | `200` — array with the sapi just created |
| 12 | `GET /api/v1/sapi/:id` (valid ID) | `200` — single sapi detail |
| 13 | `GET /api/v1/sapi/:id` (another peternak's sapi) | `403` |
| 14 | `POST /api/v1/foto/sapi/:sapiId` multipart with foto file | `201` — foto saved, `foto_path` in response |
| 15 | `GET /api/v1/foto/sapi/:sapiId` | `200` — array with the uploaded foto |

---

### A3 — Permintaan (Full Status Lifecycle)

| # | Request | Actor | Expected |
|---|---|---|---|
| 16 | `POST /api/v1/permintaan` body: `{ sapi_id, lokasi_ternak }` | Peternak | `201` — permintaan with `status_permintaan='Menunggu'`, `persetujuan_permintaan=null` |
| 17 | `GET /api/v1/permintaan/mine` | Peternak | `200` — list includes the new permintaan |
| 18 | `GET /api/v1/permintaan` | Admin | `200` — list includes new permintaan |
| 19 | `GET /api/v1/permintaan?status_permintaan=Menunggu` | Admin | `200` — only menunggu items |
| 20 | `PUT /api/v1/permintaan/:id/validasi` body: `{ status_validitas:'Valid', persetujuan_permintaan:'Disetujui' }` | Admin | `200` — status updated |
| 21 | `GET /api/v1/permintaan/:id` | Admin | `200` — confirm `persetujuan_permintaan='Disetujui'` |
| 22 | `PUT /api/v1/permintaan/:id/tugaskan` body: `{ petugas_id: <id> }` | Admin | `200` — petugas assigned |
| 23 | `GET /api/v1/petugas/tugas` | Petugas | `200` — contains the permintaan just assigned |
| 24 | `PUT /api/v1/permintaan/:id/validasi` body: `{ persetujuan_permintaan:'Ditolak', alasan_penolakan:'...' }` | Admin | `200` — tolak flow works |
| 25 | `PUT /api/v1/permintaan/:id/tutup` body: `{ hasil_akhir:'Lahir selamat' }` | Admin | `200` — status_permintaan='Selesai' |

---

### A4 — Laporan (All Subtypes)

Register a petugas via `POST /api/v1/auth/register/petugas` and login to get petugas token. Use a permintaan that has been validated and has a petugas assigned (from A3 test 22).

| # | Request | Actor | Expected |
|---|---|---|---|
| 26 | `POST /api/v1/laporan/ib` body: `{ id_permintaan, kode_straw, isi_laporan_ib, waktu_proses_ib, is_success:true }` | Petugas | `201` — laporan IB created |
| 27 | `POST /api/v1/laporan/ib` same (as peternak token) | Peternak | `403` — forbidden |
| 28 | `GET /api/v1/laporan/permintaan/:id` | Any role | `200` — timeline with IB laporan, `flag_laporan_ib=true` |
| 29 | `POST /api/v1/laporan/kebuntingan` body: `{ id_permintaan, hasil_pemeriksaan:'hamil', tanggal_hpl:'...' }` | Petugas | `201` — laporan kebuntingan |
| 30 | `POST /api/v1/laporan/kebuntingan` (result: `'tidak hamil'`) | Petugas | `201` — laporan tanpa HPL |
| 31 | `POST /api/v1/laporan/keguguran` body: `{ id_permintaan, isi_laporan_keguguran, waktu_keguguran }` | Petugas | `201` — laporan keguguran |
| 32 | `POST /api/v1/laporan/kelahiran` body: `{ id_permintaan, kondisi_anak_sapi:'selamat', jenis_kelamin_anak_sapi:'betina' }` | Peternak or Petugas | `201` — laporan kelahiran |
| 33 | `GET /api/v1/laporan/:id` (specific laporan) | Any | `200` — single laporan with detail subtype |
| 34 | `GET /api/v1/laporan/mine` (petugas token) | Petugas | `200` — laporan assigned to this petugas |

---

### A5 — Semen

Use admin token.

| # | Request | Expected |
|---|---|---|
| 35 | `POST /api/v1/semen` body: `{ kode_straw:'STR01', semen_batch:'B01', tanggal_produksi, tanggal_kadaluarsa }` | `201` |
| 36 | `GET /api/v1/semen` | `200` — list |
| 37 | `GET /api/v1/semen/STR01` | `200` — single |
| 38 | `PUT /api/v1/semen/STR01` body: update | `200` |
| 39 | `DELETE /api/v1/semen/STR01` | `200` |

---

## Part B — End-to-End Scenario (Full Reproductive Cycle)

Run this after Part A passes. Use all three interfaces (Android + Web) together. Follow the 10-stage business flow from [`Konteks_Proyek_TernakKu.md`](./Konteks_Proyek_TernakKu.md) Section 2.

**Actors:**
- **Peternak** = Android app (emulator or device)
- **Admin** = Web app logged in as admin
- **Petugas** = Web app logged in as petugas (open in separate browser tab/incognito)

---

### Stage 1 — Peternak Detects Birahi & Submits Permintaan

1. Open Android app → Login as peternak.
2. Register a new sapi: earTag = `TEST-001`, jenis kelamin = `betina`, berat = `250`.
3. Upload at least one foto for the sapi.
4. Submit permintaan for the sapi with lokasi kandang = `Desa Cileuksa, Bogor`.
5. Verify: Permintaan appears in peternak's "My Permintaan" list with status = **Menunggu**.

**Backend check:** `GET /api/v1/permintaan/:id` → `status_permintaan = 'Menunggu'`, `persetujuan_permintaan = null`.

---

### Stage 2 — Admin Verifies & Assigns Petugas

6. Open web app → Login as admin.
7. Go to Permintaan List → find the new permintaan from TEST-001.
8. Open detail → confirm sapi info and peternak info are visible.
9. Click **[Validasi & Setujui]** → confirm status changes to `status_validitas = 'Valid'`, `persetujuan_permintaan = 'Disetujui'`.
10. Click **[Tugaskan Petugas]** → select petugas from dropdown → confirm.

**Backend check:** `GET /api/v1/permintaan/:id` → `petugas_id` is set, `status_permintaan = 'Diproses'`.

---

### Stage 3 — Petugas Sees Assignment & Submits IB Report

11. Open web app (incognito/new tab) → Login as petugas.
12. Go to Tugas List → verify the permintaan appears.
13. Open detail → verify sapi, peternak, lokasi info.
14. Click **[Isi Laporan IB]** → fill form: select straw `STR01`, fill description, set waktu_proses_ib, select **Berhasil** → submit.

**Backend check:** `GET /api/v1/laporan/permintaan/:id` → returns 1 laporan with `flag_laporan_ib = true`.

---

### Stage 4 — Admin Sees IB Report

15. Admin refreshes Permintaan Detail.
16. LaporanTimeline shows the IB laporan with petugas name and success status.

---

### Stage 5 — Petugas Submits Kebuntingan Report (3 months later)

17. In petugas web app → open same permintaan detail.
18. Click **[Isi Laporan Kebuntingan]** → fill: `hasil_pemeriksaan = 'hamil'`, `tanggal_hpl = <3 months from now>` → submit.

**Backend check:** `GET /api/v1/laporan/permintaan/:id` → 2 laporan entries, second has `flag_laporan_kebuntingan = true`, `tanggal_hpl` set.

---

### Stage 6 — Peternak Reports Birth

19. Android app → open permintaan detail for TEST-001.
20. Submit laporan kelahiran: `kondisi_anak_sapi = 'selamat'`, `jenis_kelamin_anak_sapi = 'betina'`, `waktu_kelahiran = <now>`.

**Backend check:** `GET /api/v1/laporan/permintaan/:id` → 3 laporan entries, third has `flag_laporan_kelahiran = true`.

---

### Stage 7 — Admin Closes the Cycle

21. Admin opens permintaan detail.
22. LaporanTimeline shows all 3 stages.
23. Click **[Tutup Siklus]** → input `hasil_akhir = 'Lahir selamat - betina'` → confirm.

**Backend check:** `GET /api/v1/permintaan/:id` → `status_permintaan = 'Selesai'`, `hasil_akhir` set.

---

### Rejection Scenario (Separate Run)

24. Create a new permintaan as peternak.
25. Admin opens and clicks **[Tolak]** with alasan `"Data tidak lengkap"`.
26. **Backend check:** `persetujuan_permintaan = 'Ditolak'`, `alasan_penolakan` set.
27. **Android check:** Peternak sees permintaan with status `Ditolak` in list.

---

## Part C — Role Isolation Tests

These tests verify that roles cannot access endpoints they should not.

| # | Scenario | Expected |
|---|---|---|
| C1 | Peternak token → `GET /api/v1/permintaan` (admin route) | `403` Forbidden |
| C2 | Peternak token → `POST /api/v1/laporan/ib` | `403` |
| C3 | Petugas token → `POST /api/v1/semen` | `403` |
| C4 | Petugas token → `PUT /api/v1/permintaan/:id/validasi` | `403` |
| C5 | No token → any protected endpoint | `401` |
| C6 | Peternak → `GET /api/v1/sapi` (all sapi, admin route) | `403` |
| C7 | Peternak → `GET /api/v1/sapi/:id` for another peternak's sapi | `403` |
| C8 | Petugas → `GET /api/v1/petugas/tugas` with no assigned permintaan | `200` with empty array |
| C9 | Expired/invalid token → any endpoint | `401` |
| C10 | Admin → `POST /api/v1/auth/register/petugas` | `201` (admin can create petugas) |

---

## Part D — Android-Specific Tests

| # | Scenario | Expected |
|---|---|---|
| D1 | Login with wrong credentials | Error toast/message shown |
| D2 | Token persists after app restart | User stays logged in |
| D3 | Logout → token cleared → redirect to login | ✅ |
| D4 | Submit permintaan without selecting sapi | Validation error shown |
| D5 | Map screen loads correct location for kandang | Map marker at correct coordinates |
| D6 | No internet connection → API call | Error message shown, no crash |
| D7 | Long sapi list → RecyclerView scrolls smoothly | ✅ |

---

## Part E — Database Integrity Tests

Run these SQL queries directly on `ternakku_db` after running the full E2E scenario.

```sql
-- E1: Every laporan row has exactly one subtype record
SELECT id_laporan,
  (SELECT COUNT(*) FROM laporan_ib WHERE laporan_id = l.id_laporan) +
  (SELECT COUNT(*) FROM laporan_kebuntingan WHERE laporan_id = l.id_laporan) +
  (SELECT COUNT(*) FROM laporan_keguguran WHERE laporan_id = l.id_laporan) +
  (SELECT COUNT(*) FROM laporan_kelahiran WHERE laporan_id = l.id_laporan) AS subtype_count
FROM laporan l
HAVING subtype_count != 1;
-- Expected: 0 rows

-- E2: All laporan link to valid permintaan
SELECT id_laporan FROM laporan
WHERE id_permintaan NOT IN (SELECT id_permintaan FROM permintaan);
-- Expected: 0 rows

-- E3: No sapi with no peternak
SELECT sapi_id FROM sapi WHERE peternak_id IS NULL;
-- Expected: 0 rows

-- E4: Closed permintaan have hasil_akhir set
SELECT id_permintaan FROM permintaan
WHERE status_permintaan = 'Selesai' AND hasil_akhir IS NULL;
-- Expected: 0 rows

-- E5: Laporan IB that used a straw reference a valid semen
SELECT li.laporan_id FROM laporan_ib li
WHERE li.kode_straw IS NOT NULL
AND li.kode_straw NOT IN (SELECT kode_straw FROM semen);
-- Expected: 0 rows
```

---

## Pass/Fail Criteria

| Category | Pass Condition |
|---|---|
| Backend unit tests (A1–A5) | All 39 tests return expected HTTP status and response shape |
| Full E2E cycle (B) | All 7 stages complete without error; final permintaan has `status_permintaan='Selesai'` |
| Rejection scenario | Permintaan correctly shows `Ditolak` with alasan on Android |
| Role isolation (C) | All 10 role tests return expected status codes |
| Android tests (D) | All 7 scenarios work correctly on emulator |
| DB integrity (E) | All 5 SQL queries return 0 rows |

If any test fails, refer back to the relevant implementation plan:
- Backend logic issues → [Plan 01](./plan_01_backend_routing_fix.md)
- Web frontend issues → [Plan 02](./plan_02_web_frontend_admin_petugas.md)
- Android issues → [`android_frontend_plan.md`](./android_frontend_plan.md)
- DB schema issues → [`ERD_TernakKu_Capstone.md`](./ERD_TernakKu_Capstone.md)
