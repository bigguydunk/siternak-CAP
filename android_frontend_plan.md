# Android Frontend Implementation Plan — TernakKu

> This document covers **how** to build and test the Android frontend for the TernakKu app. It does **not** cover UI design. The app is already bootstrapped as a Kotlin + Retrofit project at `app/`.

---

## 1. Architecture Pattern

Use **MVVM (Model-View-ViewModel)** with the following layers:

```
UI Layer         → Activity / Fragment (observe LiveData/StateFlow)
ViewModel Layer  → holds UI state, calls Repository
Repository Layer → decides: call API (Retrofit) or local cache (Room/DataStore)
Data Layer       → Retrofit ApiService (remote) + Room/DataStore (local)
```

This pattern is already partially set up (ViewBinding is enabled, ViewModel/LiveData deps are in `build.gradle`).

---

## 2. Package Structure

Organise the `com.example.ternakapp` package as follows:

```
ternakapp/
├── data/
│   ├── model/          ← Data classes matching API responses (Kotlin data classes)
│   ├── remote/         ← ApiService.kt + ApiConfig.kt (Retrofit)
│   ├── local/          ← DataStore (token storage), optional Room for caching
│   └── repository/     ← One repository per domain (AuthRepository, SapiRepository, etc.)
├── ui/
│   ├── auth/           ← LoginActivity, RegisterActivity
│   ├── home/           ← Home/Dashboard screen per role
│   ├── sapi/           ← SapiListFragment, SapiDetailFragment, AddSapiFragment
│   ├── permintaan/     ← PermintaanListFragment, PermintaanDetailFragment, NewPermintaanFragment
│   ├── laporan/        ← LaporanDetailFragment, subtype forms (IB, Kebuntingan, etc.)
│   ├── semen/          ← SemenListFragment, SemenFormFragment (Admin only)
│   └── profile/        ← ProfileFragment
├── utils/
│   ├── ResultState.kt  ← sealed class: Loading / Success / Error
│   └── Extensions.kt   ← helper extension functions
└── MainActivity.kt     ← single-activity host with NavController
```

---

## 3. Networking Setup (Retrofit)

### 3.1 Base URL Strategy

The backend runs locally. To connect the Android emulator or a physical device:

| Scenario | Base URL |
|---|---|
| Android Emulator → localhost backend | `http://10.0.2.2:3000/` |
| Physical device → PC on same WiFi | `http://<your-PC-LAN-IP>:3000/` |
| Expose to internet for testing | Use `ngrok http 3000` and update `ApiConfig.BASE_URL` |

### 3.2 Auth Token Interceptor

Replace the current manual `@Header("Authorization")` on every call with an **OkHttp Interceptor** that automatically attaches the Bearer token from DataStore:

```kotlin
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Chain): Response {
        val token = tokenProvider()
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else chain.request()
        return chain.proceed(request)
    }
}
```

### 3.3 Token Storage (DataStore)

Use `androidx.datastore:datastore-preferences` (already in `build.gradle`) to persist the JWT and user role after login. Create a `UserPreferences` class that exposes:
- `suspend fun saveToken(token: String, role: String)`
- `val tokenFlow: Flow<String?>`
- `val roleFlow: Flow<String?>`
- `suspend fun clearToken()`

---

## 4. API Response Models

Create Kotlin data classes in `data/model/` mirroring every API response. Use `@SerializedName` annotations to match the snake_case JSON fields. Key models to create:

| Model File | Covers |
|---|---|
| `AuthModels.kt` | `LoginRequest`, `LoginResponse`, `RegisterPeternakRequest` |
| `SapiModels.kt` | `Sapi`, `CreateSapiRequest` |
| `FotoModels.kt` | `Foto` |
| `PermintaanModels.kt` | `Permintaan`, `CreatePermintaanRequest`, `ValidasiRequest`, `TutupRequest` |
| `LaporanModels.kt` | `Laporan`, `LaporanIB`, `LaporanKebuntingan`, `LaporanKeguguran`, `LaporanKelahiran` |
| `SemenModels.kt` | `Semen`, `CreateSemenRequest` |
| `PetugasModels.kt` | `Petugas` |
| `PeternakModels.kt` | `Peternak` |
| `ApiResponse.kt` | Generic wrapper `data class ApiResponse<T>(val success: Boolean, val message: String, val data: T?)` |

---

## 5. ApiService Refactor

The existing `ApiService.kt` has generic post/user endpoints — replace completely with endpoints matching the new backend:

```kotlin
interface ApiService {
    // Auth
    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/v1/auth/register/peternak")
    suspend fun registerPeternak(@Body request: RegisterPeternakRequest): Response<ApiResponse<Peternak>>

    @GET("api/v1/auth/me")
    suspend fun getMe(): Response<ApiResponse<Any>>

    // Sapi
    @GET("api/v1/sapi/mine")
    suspend fun getMySapi(): Response<ApiResponse<List<Sapi>>>

    @GET("api/v1/sapi/{id}")
    suspend fun getSapiById(@Path("id") id: Int): Response<ApiResponse<Sapi>>

    @POST("api/v1/sapi")
    suspend fun createSapi(@Body request: CreateSapiRequest): Response<ApiResponse<Sapi>>

    // Permintaan
    @POST("api/v1/permintaan")
    suspend fun createPermintaan(@Body request: CreatePermintaanRequest): Response<ApiResponse<Permintaan>>

    @GET("api/v1/permintaan/mine")
    suspend fun getMyPermintaan(): Response<ApiResponse<List<Permintaan>>>

    @GET("api/v1/permintaan/{id}")
    suspend fun getPermintaanById(@Path("id") id: Int): Response<ApiResponse<Permintaan>>

    // Laporan
    @GET("api/v1/laporan/permintaan/{id}")
    suspend fun getLaporanByPermintaan(@Path("id") id: Int): Response<ApiResponse<List<Laporan>>>

    // Foto (multipart)
    @Multipart
    @POST("api/v1/foto/sapi/{sapiId}")
    suspend fun uploadFoto(
        @Path("sapiId") sapiId: Int,
        @Part("foto_tipe") fotoTipe: RequestBody,
        @Part foto: MultipartBody.Part
    ): Response<ApiResponse<Foto>>

    // ... Admin/Petugas-specific endpoints
}
```

Switch all calls to `suspend fun` (coroutine-based) instead of `Call<T>`.

---

## 6. Repository Pattern

Create one repository per domain. Each repository:
- Injects `ApiService` (and optionally a local DAO)
- Wraps API calls in a `try/catch` returning `ResultState<T>`
- Handles HTTP error codes and maps them to user-friendly messages

```kotlin
// utils/ResultState.kt
sealed class ResultState<out T> {
    object Loading : ResultState<Nothing>()
    data class Success<T>(val data: T) : ResultState<T>()
    data class Error(val message: String) : ResultState<Nothing>()
}
```

Example `SapiRepository`:
```kotlin
class SapiRepository(private val apiService: ApiService) {
    suspend fun getMySapi(): ResultState<List<Sapi>> {
        return try {
            val response = apiService.getMySapi()
            if (response.isSuccessful) ResultState.Success(response.body()?.data ?: emptyList())
            else ResultState.Error(response.errorBody()?.string() ?: "Terjadi kesalahan")
        } catch (e: Exception) {
            ResultState.Error(e.message ?: "Tidak dapat terhubung ke server")
        }
    }
}
```

---

## 7. ViewModel & UI Wiring

Each screen fragment/activity has a dedicated ViewModel:
- ViewModel calls the Repository using `viewModelScope.launch`
- Exposes `LiveData<ResultState<T>>` or `StateFlow<ResultState<T>>`
- Fragment observes and shows loading/success/error states

```kotlin
class SapiViewModel(private val repo: SapiRepository) : ViewModel() {
    private val _sapiList = MutableLiveData<ResultState<List<Sapi>>>()
    val sapiList: LiveData<ResultState<List<Sapi>>> = _sapiList

    fun fetchMySapi() {
        _sapiList.value = ResultState.Loading
        viewModelScope.launch {
            _sapiList.value = repo.getMySapi()
        }
    }
}
```

---

## 8. Navigation

Use the **Navigation Component** (already in `build.gradle` as `navigation-fragment-ktx`):

- One `nav_graph.xml` per role (or one shared graph with conditional start destinations)
- Set the start destination based on JWT presence + role from DataStore at app launch
- Deep links are optional for the capstone

**Role → Start Destination mapping:**
| Role | Home Screen |
|---|---|
| `peternak` | Dashboard with my sapi list + my permintaan |
| `petugas` | Dashboard with assigned tasks (laporan pending) |
| `admin` | Dashboard with all permintaan + validation queue |

---

## 9. Role-Based UI

After login, save the `role` string to DataStore. In `MainActivity`, read the role and load the appropriate nav graph or set the start destination accordingly. Hide/show bottom navigation tabs based on role.

---

## 10. Image Upload (Foto)

Use `ActivityResultContracts.GetContent()` to pick an image from the gallery. Convert the URI to a `MultipartBody.Part` and upload via Retrofit `@Multipart`.

Steps:
1. Register `pickImageLauncher` in the Fragment
2. On image picked, convert URI → `File` → `RequestBody` → `MultipartBody.Part`
3. Call `fotoRepository.uploadFoto(sapiId, fotoTipe, part)`
4. Load the resulting `foto_path` URL with **Glide** (already in `build.gradle`)

---

## 11. Testing Strategy

### 11.1 Unit Tests (JUnit 4 — `src/test/`)

Test business logic in isolation, **without** Android framework or network:

- **ViewModel tests**: Use `TestCoroutineDispatcher` + mock Repository (use `Mockito` or manual fakes). Verify `LiveData` emits `Loading` then `Success`/`Error` correctly.
- **Repository tests**: Mock `ApiService` responses with `MockWebServer` (OkHttp). Verify correct `ResultState` is returned for HTTP 200, 401, 500.
- **Utility/Extension tests**: Pure Kotlin logic, no special setup needed.

Add to `build.gradle`:
```groovy
testImplementation 'org.mockito:mockito-core:5.x'
testImplementation 'org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.x'
testImplementation 'com.squareup.okhttp3:mockwebserver:5.x'
testImplementation 'androidx.arch.core:core-testing:2.2.0'  // for LiveData testing
```

### 11.2 Instrumented Tests (Espresso — `src/androidTest/`)

Run on a real device or emulator:

- **Login flow**: Enter email + password → verify navigation to Home.
- **Sapi list**: Verify RecyclerView shows items after successful API response.
- **Form validation**: Submit empty form → verify error messages appear.

Use `MockWebServer` or a dedicated test backend instance so tests are not flaky.

### 11.3 Manual Testing Checklist

Before each feature is considered done, verify these manually:

- [ ] API call succeeds with correct token
- [ ] Loading state is shown while waiting
- [ ] Error message is shown on failure (no internet, 401, 500)
- [ ] Token expiry forces redirect to Login
- [ ] Role-restricted screens are inaccessible from the wrong role

---

## 12. Build Variants (Optional but Recommended)

Add `buildTypes` or `productFlavors` in `app/build.gradle` for:

| Variant | `BASE_URL` points to |
|---|---|
| `debug` | Local backend (`10.0.2.2:3000` or ngrok) |
| `release` | Production server URL |

Use `BuildConfig` fields:
```groovy
buildConfigField "String", "BASE_URL", '"http://10.0.2.2:3000/"'
```

Then in `ApiConfig.kt`: `val BASE_URL = BuildConfig.BASE_URL`

---

## 13. Setup & Run Checklist

1. **Clone** the repo and open in Android Studio.
2. Start the **backend** locally (`npm install` → `npm run migrate` → `npm run dev` in `backend/`).
3. **Update `BASE_URL`** in `ApiConfig.kt` to match your network setup (see Section 3.1).
4. Run the app on an **emulator** or connect a device via USB.
5. Enable **USB debugging** on the physical device if testing there.
6. If using ngrok: `ngrok http 3000` → copy the HTTPS URL → paste into `BASE_URL`.
7. Run unit tests: `./gradlew test` from the project root.
8. Run instrumented tests: `./gradlew connectedAndroidTest` (device must be connected).
