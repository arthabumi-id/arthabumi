# Uji otomatis App Kontraktor

Semua uji memakai **data contoh fiktif** di localStorage atau Apps Script tiruan — **tidak menyentuh Google Sheet asli**.
Playwright dipinjam dari repo FCC (`D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright`),
jadi uji ini hanya jalan di PC Eddy. Hasil (screenshot/json) masuk ke `tests/out/` (tidak di-commit).

Jalankan dari folder `tests/`:

| Perintah | Isi |
|---|---|
| `node harness.js <label> [shots] [dark]` | Buka 46 layar/tab/modal, simpan teks tiap layar ke `out/<label>.json` (+ screenshot). Untuk membandingkan sebelum/sesudah perubahan: jalankan dengan label lama (sebelum patch) & baru, lalu bandingkan json-nya. `W=1280 H=860` untuk ukuran PC. |
| `node sheet.js <label>` | Gabungkan screenshot `out/<label>/` jadi lembar ringkas `out/sheet-<label>-N.png`. |
| `node interact.js` | Dialog konfirmasi, penahan sync, tema, huruf, manifest, toast, menu samping PC (v1.41–1.44). |
| `node interact145.js` | Kunci data FCC, pengingat input kasbon/bayar, absensi cepat, render ulang saat sync. |
| `node interact146.js` | Slip closing, pengingat Dashboard, service worker + buka tanpa sinyal. |
| `node interact147.js` | Dropdown cari, Reset filter, Kosongkan isian, ketik tanggal custom. |
| `node interact148.js` | Sync ringan dengan Apps Script tiruan (hitung unduhan lengkap vs cek versi, backend lama). |
| `node interact149.js` | Tombol Ke atas (HP & PC). |
| `node gstest148.js` | Router `backend/config.gs` (versi, ringan, token) dengan Google tiruan. |
| `node setup-gs-test.js` | `setupAllSheets()` di `backend/setup.gs` dengan Sheet tiruan. |
| `node datetest.js <index-lama.html>` | Bandingkan ketik tanggal custom versi lama vs sekarang. |

Kebiasaan: **sebelum commit, jalankan semua `interact*.js` → harus "SEMUA LULUS"**, dan bandingkan teks `harness.js` sebelum/sesudah.
Data contoh ada di `harness.js` (`const seed = {...}`) — uji lain membaca seed dari situ.
