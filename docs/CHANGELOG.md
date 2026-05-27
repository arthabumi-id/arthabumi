# 📝 CHANGELOG — Arthabumi Project

Riwayat lengkap pengembangan aplikasi (v1.1-v1.6b) dan backup/deployment (v1.10 onwards).

---

## 📊 STRUKTUR CHANGELOG

**Bagian 1:** App Development History (v1.1 → v1.6b)  
**Bagian 2:** Backup & Deployment History (v1.10 onwards)

Untuk dokumentasi teknis & arsitektur → baca `SYSTEM.md`

---

# 🔧 BAGIAN 2: SESSION 5 (v1.12)

## [2026-05-27] v1.12 — Fitur Lembur di Absensi

### Fitur Baru
- ✨ **Input Jam Lembur per Karyawan** — muncul otomatis di card karyawan saat status Hadir/Setengah Hari
  - Input angka jam lembur (0.5 increment, max 24 jam)
  - Tarif lembur = upahHarian / 8 per jam
  - Total upah = base upah + (jamLembur × upahHarian / 8)
- ✨ **Kalkulasi Otomatis** — upahHariIni sudah inklusif lembur (semua SUMIF/total otomatis benar)
- ✨ **Log Absensi** — tampilkan label "⏰ Lembur X jam · +Rp Y" jika ada lembur
- ✨ **Closing Detail Modal** — tampilkan badge "⏰Xj" di per-baris hari kerja
- ✨ **GSheet Kolom baru** — M=jamLembur, N=upahLembur di LOG ABSENSI

### File yang diubah
- `arthabumi/index.html` → absInput(), setAbsRow(), submitAbsensi(), absLog(), openClosingDetail()
- `arthabumi/backend/write.gs` → _apiAddAbsensi() tulis kolom M & N
- `arthabumi/backend/read.gs` → _apiReadLogAbsensi() baca kolom M & N (range ke :N)

### Notes
- **Backward compatible**: data lama tanpa lembur tetap aman (jamLembur default 0)
- **GSheet**: Perlu tambah header kolom M = "Jam Lembur" dan N = "Upah Lembur" secara manual
- Kalkulasi: `tarif = upahHarian/8`, `upahLembur = round(jamLembur × upahHarian/8)`

---

# 🔧 BAGIAN 1: APP DEVELOPMENT HISTORY (v1.1 → v1.6b)

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
- `arthabumi/index.html` — fungsi `beliLog()`, `delPembelian()`, `openPasteBeli()`, `parsePasteText()`, `applyPasteBeli()`
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

## [2026-05-15] v1.1 — Accounting App (First Release)

### Fitur Baru
- ✨ **8 modul** — Dashboard, Proyek, Pembelian, Karyawan, Absensi, Kasbon, Closing, Bayar
- ✨ **localStorage** — data tersimpan offline di browser
- ✨ **Closing gaji** — generate rekap + finalize dengan kasbon potong

---

# 📦 BAGIAN 2: BACKUP & DEPLOYMENT HISTORY (v1.10 onwards)

## **v1.10** — 2026-05-26 ✨ NEW
**Dua fitur TODO high-priority dari Session 2 berhasil diimplementasikan**

### ✅ TODO #1: Progress % per Proyek
- **Field baru**: `progress` (0-100%) di setiap proyek
- **Add Project Modal**: Input progress saat buat proyek baru
- **Edit Project Modal**: Bisa update progress kapan saja
- **saveProject()**: Simpan progress ke localStorage & GSheet sync
- **Dashboard Display**: Progress bar dengan color coding:
  - 🟢 Hijau (≥75%) — Sudah jauh maju
  - 🟡 Kuning (50-74%) — Sedang berjalan
  - 🔴 Merah (<50%) — Baru dimulai
- **Rekap Modal**: Tampilkan progress bar di bagian atas

### ✅ TODO #2: Alert / Tanda Bahaya
- **⚠️ Upah Menumpuk**: Alert jika upah belum bayar > 10% dari nilai kontrak
- **⚠️ Biaya Mendekati RAB**: Alert jika biaya sudah > 90% dari RAB
- **Display**: Badge di dashboard + project card

---

## **v1.11** — 2026-05-26 ✨ NEW
**Empat fitur besar untuk meningkatkan UX pembelian & filter log**

### ✅ Feature 1: Cashflow per Proyek
- **Fungsi baru**: `calcCashflow(kodeProj)` = pembayaran - (pembelian + upah + subkon)
- **Integrasi Dashboard**: Setiap project card punya chip 💰 Cashflow
  - Menampilkan: Pembayaran diterima - Total biaya
  - 🟢 Hijau jika positif (bayar > biaya)
  - 🔴 Merah jika negatif (bayar < biaya)
  - Posisi: Antara chip Bayar & Piutang
- **Formula**: Pembayaran klien dikurangi semua biaya (material, upah, subkon)
- **Gunakan**: Untuk dashboard KPI dan analisa cash position per proyek

### ✅ Feature 2: Single Shop Name Input
- **Pembelian Form**: Single `toko` input field di top form (full width)
- **Sinkronisasi real-time**: Semua item rows otomatis pakai toko yang sama
- **Implementasi**: `S.formItems.forEach(x=>x.toko=this.value)` on input
- **Ekstrak**: Ambil shop dari first item saat render form

### ✅ Feature 3: Confirmation Modal
- **Fitur baru**: `showBeliConfirmation()` — modal breakdown sebelum save
- **Tampil**: Item breakdown (name, qty, price, discount, subtotal per item)
- **Total**: Hitung ulang total setelah semua diskon
- **Aksi**: User approve/cancel sebelum `executeBeli()` proses sync

### ✅ Feature 4: Date Filter
- **Logika baru**: `filterByDate(items, mode, fromDate, toDate)` helper
- **Mode**: 'all' | 'today' | 'thisweek' | 'thismonth' | 'custom'
- **Aplikasi**: Purchase Log (beliLog) & Attendance Log (absLog)
- **UI**: 5 mode buttons + conditional date range inputs
- **Filter**: Compare date substring `tgl.substring(0,10)` dalam range

---