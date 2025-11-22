## Ringkasan Arsitektur
- Backend: Node.js + Express, MongoDB/Mongoose, JWT auth, file upload via `multer`.
- Frontend: React (CRA), React Router, Material UI, Axios, GSAP untuk tampilan login animasi.
- Struktur:
  - Backend di `backend/` dengan routes `auth` dan `products` (backend/server.js:41–43), port dari `.env` (backend/.env.example:15).
  - Frontend di `frontend/` dengan proxy dev ke `http://localhost:3001` (frontend/package.json:5), routing terproteksi token (frontend/src/App.js:29–37).

## Integrasi API Saat Ini
- Base URL front-end:
  - Diset per-komponen: `axios.defaults.baseURL = 'http://localhost:3001'` di beberapa file (frontend/src/components/HandphoneMenu.js:6, ProductDetail.js:10, Dashboard.js:16).
  - Juga dipakai hardcoded di beberapa request (`fetch`/`axios`) (LampLogin.jsx:140, ComplaintMenu.js:41, Customers.js:30–32).
- Autentikasi:
  - Token disimpan di `localStorage` lalu dikirim sebagai `Authorization: Bearer ...` (mis. HandphoneMenu.js:19–21, Dashboard.js:163–165).
  - Ada ketidakkonsistenan header: beberapa request kirim `x-auth-token` (Dashboard.js:292, 296) sementara middleware backend menunggu `Authorization` (backend/middleware/auth.js:6–12).
- Endpoint utama produk:
  - List semua produk: `GET /api/products` (backend/routes/products.js:293–307).
  - Detail produk: `GET /api/products/:id` (backend/routes/products.js:322–343).
  - Autocomplete pelanggan: `GET /api/products/customers` (butuh auth) (backend/routes/products.js:26–59).
  - Keluhan: `GET /api/products/complaints` (butuh auth) (backend/routes/products.js:62–99).
  - Buat/ubah/hapus produk: `POST/PUT/DELETE /api/products` (backend/routes/products.js:234–290, 359–420, 423–476).
- Upload & file statik: `GET /uploads/...` (backend/server.js:43). Frontend merakit URL file pakai baseURL (Dashboard.js:521, 545; ProductDetail.js:75).
- CORS: mengizinkan `FRONTEND_URL` dari env atau `http://localhost:3000` (backend/server.js:21–29).

## Temuan Penting
- Duplikasi dan hardcoded base URL di banyak komponen → sulit pindah environment dan rawan inkonsistensi.
- Header auth tidak konsisten (`Authorization` vs `x-auth-token`) → bisa gagal di middleware atau malah tidak terproteksi.
- Operasi write (`POST/PUT/DELETE /api/products`) tidak memakai `auth` middleware → celah keamanan (backend/routes/products.js:234, 359, 423 tidak ada `auth`).
- Login animasi (`LampLogin.jsx`) melakukan `fetch` ke URL absolute dan mengelola DOM langsung, di luar pola React.
- Dev proxy sudah ada (frontend/package.json:5), jadi set `axios.defaults.baseURL` per-komponen tidak diperlukan saat dev.

## Rencana Implementasi
### Fase 1: Konsolidasi Integrasi API
- Buat modul klien API terpusat, mis. `src/api/client.js` yang:
  - Menginisialisasi Axios dengan `baseURL` dari env (`REACT_APP_API_BASE_URL`) dengan fallback ke proxy dev.
  - Interceptor untuk menyisipkan `Authorization: Bearer <token>` otomatis dan penanganan error.
- Refactor semua komponen untuk menggunakan klien ini:
  - Hapus `axios.defaults.baseURL` dan URL absolut.
  - Samakan header menjadi `Authorization` di seluruh request.

### Fase 2: Penguatan Keamanan Backend
- Tambahkan `auth` middleware pada:
  - `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`, dan pertimbangkan `GET /api/products` agar hanya user login yang dapat membaca.
- Tambah rate limit dasar dan audit konsisten (paket sudah ada di dependencies).

### Fase 3: Perbaikan UX Login & Proteksi Halaman
- Modernisasi `LampLogin` menjadi form React MUI (tanpa manipulasi DOM langsung), gunakan klien API.
- Standardisasi penyimpanan token, redirect, dan penanganan error.

### Fase 4: Fitur & Penyaring Handphone
- Perkenalkan endpoint server-side untuk filter handphone (opsional): `GET /api/products?handphone=true&codeAgen=...` atau endpoint khusus, agar efisien pada dataset besar.
- Di `HandphoneMenu`, terapkan pencarian, debounced input, dan loading/error states konsisten MUI.

### Fase 5: Manajemen Konfigurasi & Build
- Tambah dukungan `.env` frontend (`REACT_APP_API_BASE_URL`) dan dokumentasi cara menjalankan dev/prod.
- Pastikan CSP di backend mengikuti host dinamis untuk `img-src`.

### Verifikasi
- Uji manual alur: login → akses dashboard → upload berkas → lihat gambar dari `/uploads`.
- Tambah tes ringan untuk klien API (mock), dan smoke test untuk route terproteksi.

## Dampak & Quick Wins
- Dengan API klien terpusat + header konsisten, integrasi jadi stabil dan mudah dipindah environment.
- Menambah `auth` di operasi write langsung menutup celah kritis.
- Migrasi login ke React meningkatkan maintainability dan aksesibilitas.

Konfirmasi rencana ini. Setelah disetujui, saya akan mulai dari Fase 1 dan melapor progres secara bertahap.