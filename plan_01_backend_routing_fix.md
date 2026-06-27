# Plan 01 — Backend Routing & Logic Fix

> **Scope:** Align the existing backend (`backend/`) with the design patterns and intent of the reference backend at [https://github.com/istiadilia/siternak-be](https://github.com/istiadilia/siternak-be).
>
> The reference backend (`istiadilia/siternak-be`) is treated as the authoritative reference for **naming conventions, route structure, business logic correctness, and missing endpoints**. The current backend has the correct tech stack (Express, Knex, PostgreSQL, JWT, Zod, Multer) and database schema — the work here is to audit and patch the gaps.

---

## Background

The current backend at [`backend/`](./backend/) is self-built and covers the core entities. However, a comparison against the reference backend and the ERD ([`ERD_TernakKu_Capstone.md`](./ERD_TernakKu_Capstone.md)) reveals:

1. **Missing endpoints** — several business-critical routes are absent (e.g. tugas/penugasan petugas, filter/query params on list endpoints, `petugas/:id/tugas` routes).
2. **Business logic shortcuts** — `createPermintaan` auto-approves instead of entering a `Menunggu` state; `createLaporanIB` uses a dummy petugas when called by peternak.
3. **No input validation** — Zod is installed but not used anywhere. All controllers accept raw `req.body` without sanitization.
4. **Missing `petugas_id` / `peternak_id` column in `permintaan`** — The migration adds `peternak_id` which is correct but was not in the ERD. Need to verify this column is intentional and consistent.
5. **`updated_at` column referenced in controllers but may not exist** — Some controllers call `.update({ updated_at: new Date() })` which only works if `table.timestamps(true, true)` was used in the migration. Verify all tables have this.
6. **File naming** — Reference backend uses `*.route.js` (singular), current uses `*.routes.js` (plural). This is cosmetic — **do not rename files** to avoid breaking imports. Only matters if following the reference exactly.

---

## Detailed Gap Analysis

### Auth (`/api/v1/auth`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `POST /login` | ✅ Present. Accepts `{ email, password, role }`. | None. |
| `POST /register/peternak` | ✅ Present. | None. |
| `POST /register/petugas` | ✅ Present. Admin-only. | None. |
| `GET /me` | ✅ Present. | None. |
| `POST /register/admin` | ❌ Missing | **Add** — at minimum a seed script or a one-off `POST /register/admin` (protected or run manually) so the first admin can be created. |

**Action:** Add `POST /api/v1/auth/register/admin` (protected — only callable if zero admins exist, or protected by an `ADMIN_SEED_SECRET` env var).

---

### Permintaan (`/api/v1/permintaan`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `POST /` | ⚠️ Bug: auto-sets `status_validitas = 'Valid'`, `status_permintaan = 'Diproses'`, `persetujuan_permintaan = 'Disetujui'` at creation. | **Fix:** On creation, set `status_validitas = 'Menunggu'`, `status_permintaan = 'Menunggu'`, `persetujuan_permintaan = null`. Admin must explicitly validate it. |
| `GET /mine` | ✅ Present (peternak only). | None. |
| `GET /` | ✅ Present (admin + petugas). | **Add** query param filter: `?status_permintaan=Menunggu` so admin dashboard can filter pending items. |
| `GET /:id` | ✅ Present. | None. |
| `PUT /:id/validasi` | ⚠️ Exists but only sets `status_validitas` + `persetujuan_permintaan`. Does not assign `petugas_id`. | **Add `petugas_id` field** — validasi should also accept `{ petugas_id }` in body to assign which petugas will do the field check. Store in permintaan or a new `tugas` table (see below). |
| `PUT /:id/tutup` | ✅ Present. | None. |
| `PUT /:id/tugaskan` | ❌ Missing | **Add** — Separate endpoint for admin to assign/re-assign petugas to a permintaan after validation. Body: `{ petugas_id }`. Updates a `petugas_id` column on `permintaan`. |

**Migration fix needed:**
The `permintaan` table currently has `peternak_id` but **no `petugas_id`**. Add a new migration:

```js
// 014_add_petugas_id_to_permintaan.js
exports.up = (knex) =>
  knex.schema.table('permintaan', (table) => {
    table.integer('petugas_id').unsigned().nullable()
      .references('petugas_id').inTable('petugas').onDelete('SET NULL');
  });

exports.down = (knex) =>
  knex.schema.table('permintaan', (table) => {
    table.dropColumn('petugas_id');
  });
```

---

### Laporan (`/api/v1/laporan`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `POST /ib` | ⚠️ Bug: if called by peternak, uses first petugas in DB as dummy. Peternak should NOT create IB laporan directly — only petugas. | **Fix role guard:** Remove `peternak` from allowed roles on `POST /laporan/ib`, `/kebuntingan`, `/keguguran`. Only `petugas` creates these. Peternak only creates the initial `permintaan` and `laporan/kelahiran` (birth report). |
| `POST /kebuntingan` | ⚠️ Same bug as above. | Same fix as above. |
| `POST /keguguran` | ⚠️ Same bug. | Same fix. |
| `POST /kelahiran` | ✅ Peternak + petugas can create. | ✅ Correct. |
| `GET /permintaan/:id` | ✅ Present. Returns timeline with subtype detail. | **Enhance:** Add join to `petugas` table per subtype record to include petugas name in response. |
| `GET /:id` | ✅ Present. | None. |
| `PUT /ib/:id` | ✅ Present. | **Fix:** guard to petugas only (not peternak). |
| `GET /` (all laporan, admin view) | ❌ Missing | **Add** `GET /api/v1/laporan` for admin to see all pending laporan across all permintaan. |

**Petugas-side laporan routes** — Add the following so petugas can see their own pending tasks:
- `GET /api/v1/laporan/mine` — returns all laporan entries where the logged-in petugas is assigned (query across all 4 subtype tables by `petugas_id`). This is distinct from `GET /api/v1/petugas/:id/laporan` (admin view).

---

### Petugas (`/api/v1/petugas`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `GET /` | ✅ Admin only. | None. |
| `GET /:id` | ✅ Admin + self. | None. |
| `PUT /:id` | ✅ Admin + self. | None. |
| `GET /:id/laporan` | ✅ Present. | None. |
| `GET /tugas` (petugas sees own assigned permintaan) | ❌ Missing | **Add** `GET /api/v1/petugas/tugas` — returns all `permintaan` rows where `petugas_id = req.user.id`. Petugas role only. |

---

### Sapi (`/api/v1/sapi`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `GET /mine` | ✅ Peternak only. | None. |
| `POST /` | ✅ Admin + peternak. | None. |
| `GET /` | ✅ Admin only. | **Add** `?peternak_id=` filter param for admin use. |
| `GET /:id` | ✅ All roles. | None. |
| `PUT /:id` | ✅ Admin + peternak. | None. |
| `DELETE /:id` | ✅ Admin only. | None. |

---

### Semen (`/api/v1/semen`)

No missing endpoints. Current CRUD is complete. Verify `kode_straw` length is consistent (VARCHAR(50) recommended — the ERD's `VARCHAR(5)` is likely a typo as noted in [`ERD_TernakKu_Capstone.md`](./ERD_TernakKu_Capstone.md)).

---

### Foto (`/api/v1/foto`)

| Endpoint | Current Status | Required Fix |
|---|---|---|
| `POST /sapi/:sapiId` | ✅ Present. Multipart upload. | None. |
| `GET /sapi/:sapiId` | ✅ Present. | None. |
| `DELETE /:fotoId` | ✅ Admin only. | None. |

---

### Peternak (`/api/v1/peternak`)

Review `peternak.controller.js` — based on the file size (3220 bytes), it likely has basic CRUD. Verify:
- `GET /` — Admin only (all peternak list)
- `GET /:id` — Admin + self
- `PUT /:id` — Admin + self (update profile)

No missing endpoints anticipated, but confirm auth guards match the pattern.

---

## Input Validation (Zod)

Zod is installed (`^3.23.8`) but **never used**. Add Zod schema validation to the 3 most critical flows:

1. **`POST /auth/login`** — validate `{ email: z.string().email(), password: z.string().min(6), role: z.enum(['admin', 'petugas', 'peternak']) }`
2. **`POST /permintaan`** — validate `{ sapi_id: z.number().int().positive(), lokasi_ternak: z.string().min(1) }`
3. **`POST /laporan/ib`** — validate required fields, `is_success: z.boolean()`

Create `src/middleware/validate.js`:
```js
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
};
module.exports = validate;
```

Then use it per route:
```js
router.post('/', validate(createPermintaanSchema), requireRole('peternak', 'admin'), createPermintaan);
```

---

## Business Logic Corrections Summary

| File | Current Bug | Fix |
|---|---|---|
| [`permintaan.controller.js`](./backend/src/controllers/permintaan.controller.js) L17–24 | `createPermintaan` auto-approves | Set all statuses to `'Menunggu'` / `null` at creation |
| [`laporan.controller.js`](./backend/src/controllers/laporan.controller.js) L30–34 | Dummy petugas fallback for peternak | Remove — peternak must NOT create laporan IB/kebuntingan/keguguran |
| [`laporan.routes.js`](./backend/src/routes/laporan.routes.js) L10–12 | Peternak allowed on IB/kebuntingan/keguguran POST | Remove `'peternak'` from those role guards |
| [`laporan.controller.js`](./backend/src/controllers/laporan.controller.js) L204 | `updateLaporanIB` references `updated_at` column | Confirm column exists in migration; if not, remove from update object |

---

## New Files to Create

| File | Purpose |
|---|---|
| `backend/src/middleware/validate.js` | Zod validation middleware |
| `backend/src/db/migrations/014_add_petugas_id_to_permintaan.js` | Add `petugas_id` FK to permintaan |

---

## New Endpoints to Add (Summary)

| Method | Path | Role | Action |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/admin` | None (seeding) | Create first admin account |
| `GET` | `/api/v1/permintaan?status_permintaan=` | admin, petugas | Filter permintaan by status |
| `PUT` | `/api/v1/permintaan/:id/tugaskan` | admin | Assign/re-assign petugas to a permintaan |
| `GET` | `/api/v1/laporan` | admin | All laporan across the system |
| `GET` | `/api/v1/laporan/mine` | petugas | Laporan assigned to logged-in petugas |
| `GET` | `/api/v1/petugas/tugas` | petugas | All permintaan assigned to logged-in petugas |

---

## Execution Order

1. Run `npm run migrate:rollback` if schema changes are needed, apply migration `014`, then `npm run migrate`.
2. Fix business logic bugs in `permintaan.controller.js` and `laporan.controller.js`.
3. Fix role guards in `laporan.routes.js`.
4. Add new endpoints (controller functions + route bindings).
5. Add Zod validation middleware and apply to critical routes.
6. Test all endpoints manually using Postman/curl (see Plan 03 for checklist).

---

## Files to Modify

| File | Change |
|---|---|
| [`backend/src/controllers/permintaan.controller.js`](./backend/src/controllers/permintaan.controller.js) | Fix `createPermintaan` defaults; add `tugaskanPetugas` function |
| [`backend/src/routes/permintaan.routes.js`](./backend/src/routes/permintaan.routes.js) | Add `PUT /:id/tugaskan` route; add filter query support |
| [`backend/src/controllers/laporan.controller.js`](./backend/src/controllers/laporan.controller.js) | Remove dummy petugas fallback; add `getAllLaporan`, `getMyLaporan` |
| [`backend/src/routes/laporan.routes.js`](./backend/src/routes/laporan.routes.js) | Remove peternak from IB/kebuntingan/keguguran POST; add new GET routes |
| [`backend/src/controllers/auth.controller.js`](./backend/src/controllers/auth.controller.js) | Add `registerAdmin` function |
| [`backend/src/routes/auth.routes.js`](./backend/src/routes/auth.routes.js) | Add `POST /register/admin` |
| [`backend/src/controllers/petugas.controller.js`](./backend/src/controllers/petugas.controller.js) | Add `getMyTugas` function |
| [`backend/src/routes/petugas.routes.js`](./backend/src/routes/petugas.routes.js) | Add `GET /tugas` |
