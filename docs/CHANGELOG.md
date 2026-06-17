# 📝 CHANGELOG — Arthabumi Project

Riwayat lengkap pengembangan aplikasi (v1.1-v1.6b) dan backup/deployment (v1.10 onwards).

---

## 📊 STRUKTUR CHANGELOG

**Bagian 1:** App Development History (v1.1 → v1.6b)  
**Bagian 2:** Backup & Deployment History (v1.10 onwards)

Untuk dokumentasi teknis & arsitektur → baca `SYSTEM.md`

---

# 🔧 SESSION 13 (v1.20) — 2026-06-17

## [2026-06-17] v1.20 — Nav Swap + Bug Fix Pembelian

### UX: Bottom Nav — Model Nav Swap (index.html, frontend-only)
- ✨ **Hapus panel `#nav-lain`** — tidak ada lagi overlay/block yang muncul di atas nav bar
- ✨ **Nav swap model**: tap **···** → nav bar itu sendiri berubah isi jadi menu sekunder (← Back + Closing, Karyawan, Bayar, RAB, Subkon, Catatan). Tidak ada elemen tambahan, tinggi layar tidak berubah.
- ✨ State `S.navLain` (boolean) mengontrol mode nav. `openLainnya()` set true, `closeLainnya()` set false, `go()` selalu reset ke false setelah navigasi.
- 🧹 Hapus semua CSS `#nav-lain`, `#nav-lain-backdrop`, dan HTML `<div id="nav-lain">` dari file

### Bug Fix #1 — Project Dropdown Reset Saat Input Pembelian
- 🐛 **Root cause**: proyek dipilih dari DOM (`document.getElementById('beli-prj').value`) tanpa disimpan ke state. Setiap kali `go('beli')` dipanggil (misal `addBeliRow`, filter tanggal), seluruh form re-render dan pilihan proyek hilang.
- ✅ **Fix**: tambah `S.formBeliProj` dan `S.formBeliTgl` ke state. Dropdown proyek punya `onchange="S.formBeliProj=this.value"` + `selected` dari state. `submitBeli()` baca dari state, bukan DOM. Reset state setelah simpan berhasil.

### Bug Fix #2 — Date Range Input Hanya Bisa 1 Karakter
- 🐛 **Root cause**: input tanggal filter (beli & absensi) pakai `oninput` yang langsung panggil `go('beli')`/`go('absensi')` → re-render per karakter → input terpotong tiap ketik.
- ✅ **Fix**: ganti `oninput` → `onchange` pada semua date range input. `onchange` hanya fire saat field kehilangan fokus (selesai ketik), tidak per karakter. Fix berlaku di `beliLog()` dan `absLog()`.

### File yang diubah
- `arthabumi/index.html` — `buildNav()`, `openLainnya()`, `closeLainnya()`, `go()`, `beliInput()`, `beliLog()`, `absLog()`, `submitBeli()`, state `S`
- Tidak ada perubahan backend/GSheet

---

# 🔧 SESSION 8 (v1.15) — 2026-06-09

## [2026-06-09] v1.15 — Log Per Toko + Kerja Tambah/Kurang + Cleanup

### Fitur 1 — Log Pembelian Per Toko (index.html, UI-only)
- ✨ Toggle **📅 Per Tanggal / 🏪 Per Toko** di tab Log Pembelian (`beliLog`)
- ✨ Mode Per Toko: tiap toko diringkas (total belanja + jumlah item), diurut transaksi terbaru, tekan untuk expand rincian item
- ✨ Fungsi baru: `setBeliView()`, `toggleBeliToko()`, `beliItemCard()`
- Filter Proyek & Tanggal lama tetap berlaku. Tidak ada perubahan backend/sheet (field `toko` sudah ada).

### Fitur 2 — Kerja Tambah / Kurang per Proyek
- ✨ Data variasi disimpan **ringan sebagai JSON di kolom Q** MASTER PROJECT: `p.variasi=[{tgl,jenis:'tambah'|'kurang',nominal,catatan}]`
- ✨ `vSum(p)` → `{tambah,kurang,n,final}`; **Nilai Final = nilaiKontrak(awal) + Σtambah − Σkurang**
- ✨ Modal detail proyek (`openRekapProyek`): bagian Kerja Tambah/Kurang + tombol tambah/hapus; kartu proyek bisa diklik untuk membukanya
- ✨ Fungsi baru: `openVariasiForm()`, `saveVariasi()`, `delVariasi()`, `_projPayload()`
- ✨ Backend: `read.gs` range proyek B→Q + `_apiParseVariasi`; `write.gs` tulis kolom 17 + `_apiVariasiStr`; numpang action `updateProject` (tanpa action baru)
- ✨ Dashboard, tab Piutang, kartu proyek semua pakai `vSum(p).final`

### Bug Fix
- 🐛 **Dashboard/Piutang tidak ikut kerja tambah** → bukan rumus GSheet; `pgDashboard`/`pgPiutang` hitung di app dari `p.nilaiKontrak` (awal). Diperbaiki ke `vSum(p).final`.

### Cleanup
- 🧹 Hapus monolit lama `arthabumi-webapi.gs` (root & backend/) — backend live = file terpisah dgn `config.gs` router
- 🧹 Hapus 4 file `index.html.bak-*` (ada git history + backup Drive)

### ⚠️ Known limitation (open)
- Sheet/tab REKAP & formula M/N (piutang/laba) masih pakai nilai AWAL kolom F — belum baca variasi kolom Q. Perlu ubah `rekap.gs` kalau mau angka di Google Sheet ikut final.

---

# 🔧 SESSION 7 (v1.14) — 2026-05-28

## [2026-05-28] v1.14 — Kasbon Hutang Riwayat Pelunasan + Biaya Model Final

### Keputusan Arsitektur — Biaya Model FINAL
**Formula total biaya proyek dikunci:**
```
Total Biaya = Material + Upah Gross + Subkon + Bonus Kasbon
```
POTONG kasbon = **informasional saja**, tidak mempengaruhi biaya proyek.
Alasan: biaya sudah tercatat saat AMBIL kasbon, POTONG hanya mekanisme pelunasan hutang.

### Fitur Baru — Tab Hutang Kasbon (index.html)
- ✨ **`_kasbonCard(k, kb, isLunas)`** — helper baru untuk render kartu karyawan kasbon, dipakai di dua tempat
- ✨ **Seksi Hutang Aktif** — kartu merah untuk karyawan masih punya hutang
- ✨ **Dropdown Riwayat Pelunasan** (`<details>`) — per karyawan, tiap entri POTONG ditampilkan:
  - Tanggal pelunasan
  - Dari upah proyek mana (kodeProj → nama proyek)
  - Nominal yang dipotong
  - No.Closing (jika ada)
  - Urut dari lama ke baru
  - Total dipotong di footer dropdown
- ✨ **Seksi Riwayat Sudah Lunas** — collapsed `<details>` di bawah hutang aktif
  - Karyawan yang pernah punya kasbon tapi sudah lunas 100%
  - Badge hijau ✅ LUNAS
  - Riwayat pelunasan tetap bisa dilihat (tidak hilang setelah lunas)

### Fix Backend
- 🐛 **`rekap.gs`**: `totalBiaya` diubah dari `mat + upahNet + subkon + bonus` → `mat + upahGross + subkon + bonus`
- 🐛 **`setup.gs`**: Formula kolom L sheet REKAP diubah dari `G+H-J+I+K` → `G+H+I+K`
- 🔤 **`setup.gs`**: Header kolom J diubah jadi "Kasbon Potong (info)" untuk kejelasan

### File yang diubah
- `arthabumi/index.html` — `_kasbonCard()`, `kasbonHutang()`
- `arthabumi/backend/rekap.gs` — totalBiaya formula
- `arthabumi/backend/setup.gs` — kolom L formula + header kolom J

### Notes
- Tidak ada perubahan GSheet schema (tidak perlu tambah/ubah kolom)
- Untuk aktifkan fix REKAP: paste `setup.gs` → jalankan `setupRekapSheet()`, lalu `_apiUpdateRekap()`

---

# 🔧 SESSION 6 (v1.13) — 2026-05-27

## [2026-05-27] v1.13 — Kasbon v2: kodeProj Langsung di LOG KASBON

### Perubahan Model Data
- **LOG KASBON kolom I** = kodeProj — diisi saat closing untuk POTONG & BONUS
- **`calcKasbonForProj(kode)`** v2: filter langsung by `kodeProj` di logKasbon, tidak lagi via noClosing linkage

### File yang diubah
- `arthabumi/index.html` — calcKasbonForProj, calcCashflow, pgDashboard, openRekapProyek, kasbonHutang
- `arthabumi/backend/write.gs` — _apiFinalizeClosing (tulis kodeProj ke kolom I), _apiDeleteClosing (hapus 9 kolom A:I), _apiAddPembelian (update MASTER TOKO jika toko baru)

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