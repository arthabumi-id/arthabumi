# CHANGELOG — Arthabumi App

Format: `[YYYY-MM-DD] Versi X.X — Deskripsi`

---

## [2026-05-20] v1.6b — Fix Tanggal GSheet (Root Fix)

### Fix
- 🐛 **Tanggal ada jam di GSheet** — `5/19/2026 10:00:00` → `20/05/2026` ✅
  - Root cause: `new Date(yr,mo,dy)` pakai timezone Apps Script project (bukan WIB)
  - Fix: ganti ke `Utilities.parseDate(s, sstz, "yyyy-MM-dd")` dengan timezone Spreadsheet
- 🐛 **`_apiSerDate` baca tanggal salah** — ganti ke `formatDate(..., sstz, ...)` (timezone Spreadsheet)

### File yang diubah
- `arthabumi-webapi.gs` — fungsi `_apiParseDate` dan `_apiSerDate`

---

## [2026-05-20] v1.6 — Hapus Pembelian + Paste Input + Fix Format Tanggal

### Fitur Baru
- ✨ **Hapus log pembelian** — tombol 🗑 per baris di log pembelian, sync ke GSheet
- ✨ **Paste pembelian** — input cepat dari copy-paste nota
  - Format: `nama barang, jumlah, harga, nama toko`
  - Harga bisa pakai titik Indonesia (`55.000` → 55000)
  - Preview sebelum apply, validasi per baris
- ✨ **GSheet action baru: `deletePembelian`** — hapus baris berdasarkan tgl+kodeProj+namaBarang

### Fix
- 🐛 **Format tanggal GSheet** — `setNumberFormat("DD/MM/YYYY")` → `"dd/MM/yyyy"` (format benar Apps Script)

### File yang diubah
- `index.html` — fungsi `beliLog()`, `delPembelian()`, `openPasteBeli()`, `parsePasteText()`, `applyPasteBeli()`
- `arthabumi-webapi.gs` — tambah `_apiDeletePembelian()`, fix semua `setNumberFormat`

---

## [2026-05-19] v1.5 — Bug Fix + UI Improvement

### Fix
- 🐛 **Tanggal timezone bug** — tanggal tidak lagi shift 1 hari (WIB fix)
- 🐛 **fDate() parsing** — parse YYYY-MM-DD sebagai local time bukan UTC

### Fitur Baru
- ✨ **Dashboard filter status** — pilih Semua / Berjalan / Selesai / Hold / Batal
- ✨ **Hapus log absensi** — tombol 🗑 per baris (hanya yang belum closing)
- ✨ **Status absensi = tombol** — tidak perlu dropdown lagi, tap langsung
- ✨ **Proyek absensi pakai nama** — tidak lagi pakai kode proyek
- ✨ **Summary bar absensi** — lihat total Hadir/Setengah/Tidak/Libur sebelum simpan

### GSheet (webapi.gs)
- ✨ **deleteAbsensi action** — hapus baris dari GSheet saat delete di app
- 🐛 **_apiParseDate timezone fix** — tanggal yang ditulis ke GSheet sudah benar

---

## [2026-05-18] v1.4 — GSheet 2-Way Sync

### Fix
- 🐛 **POST no-cors diganti GET** — data sekarang benar-benar masuk ke GSheet
- 🐛 **doSync feedback** — toast informatif: "🔄 Menyimpan…" → "✅ Berhasil" / "❌ Gagal"

### Fitur Baru
- ✨ **Auto-poll** — refresh otomatis dari GSheet setiap N detik
- ✨ **Retry queue** — jika sync gagal, otomatis coba ulang 3x
- ✨ **Page visibility** — re-fetch saat tab aktif kembali

---

## [2026-05-17] v1.3 — PWA iPhone

### Fitur Baru
- ✨ **PWA support** — bisa Add to Home Screen di iPhone
- ✨ **Safe area** — support iPhone notch (env safe-area-inset)
- ✨ **Zero dependency** — hapus React, Babel, Tailwind CDN → pure vanilla JS
- ✨ **Bottom navigation** — cocok untuk thumb di HP

---

## [2026-05-16] v1.2 — GSheet Integration

### Fitur Baru
- ✨ **Apps Script Web API** — doGet + doPost untuk semua CRUD
- ✨ **Settings modal** — input URL, test koneksi, pilih interval
- ✨ **Sync badge** — header menampilkan status sync realtime

---

## [2026-05-15] v1.1 — Accounting App

### Fitur Baru
- ✨ **8 modul** — Dashboard, Proyek, Pembelian, Karyawan, Absensi, Kasbon, Closing, Bayar
- ✨ **localStorage** — data tersimpan offline di browser
- ✨ **Closing gaji** — generate rekap + finalize dengan kasbon potong
