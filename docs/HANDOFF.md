# ARTHABUMI — Handoff Document
**Owner:** Eddy Santoso
**Terakhir diupdate:** 2026-05-22
**Status proyek:** Session 2 selesai ✅ | Apps Script perlu redeploy ⚠️

---

## Konteks Proyek

Sistem manajemen keuangan & operasional kontraktor **Arthabumi** milik Pak Eddy.
Backend: **Google Apps Script** terhubung ke **Google Sheets**.
Frontend: **index.html** (web app / PWA yang diakses dari HP dan desktop).

---

## Struktur File

### Apps Script (Google Drive) — 8 file
```
constants.gs    → nama sheet, batas baris, config API token
config.gs       → doGet, doPost, router action
helpers.gs      → utilitas: date, find, sanitize, pad
read.gs         → semua fungsi READ data dari GSheet
write.gs        → semua fungsi WRITE/UPDATE/DELETE ke GSheet
setup.gs        → format tampilan semua sheet (warna, kolom)
diagnostic.gs   → cek kesehatan sistem
backup.gs       → backup & restore JSON ke Google Drive
```

### Frontend
```
arthabumi/index.html   → web app utama
```

### Dokumen
```
HANDOFF.md      → file ini
arthabumi/SYSTEM.md    → briefing singkat untuk Claude session baru
arthabumi/CHANGELOG.md → riwayat versi
```

---

## Yang Dikerjakan di Session 2 (2026-05-22)

### Apps Script — 3 file diupdate

**`read.gs`**
- Diskon pembelian: `Number(r[8]) * 100` → `Number(r[8]) || 0` (baca nominal Rp, bukan persen)
- RAB: range diperluas `B:H` → `B:L`, tambah field `labelMat`, `labelUpah`, `labelSubkon`, `labelOverhead`
- MASTER PROJECT: range diperluas `B:N` → `B:O`, tambah field `catatan`

**`write.gs`**
- `_apiAddPembelian`: diskon ditulis nominal Rp (`#,##0`), formula total → `MAX(0, qty×harga - diskon)`
- `_apiSaveRAB`: tambah tulis kolom I–L untuk 4 label kategori RAB
- `_apiDeleteRAB`: fungsi baru — hapus 1 baris RAB berdasarkan kodeProj
- `_apiAddProject` & `_apiUpdateProject`: tambah tulis kolom O untuk catatan

**`config.gs`**
- Router: tambah `case "deleteRAB"` → `_apiDeleteRAB()`

### Frontend — index.html (banyak fitur baru)

#### Bug Fix
- Diskon pembelian: ubah dari persen → nominal Rp di input form & kalkulasi total
- RAB label: baca langsung dari DOM saat `saveRAB()` agar tidak hilang saat diketik

#### Fitur Baru — Pembelian
- **Tab "Cek Harga"** di halaman Beli: live search master barang, tampilkan harga terakhir + Min/Avg/Max + riwayat per transaksi (toko & tanggal)

#### Fitur Baru — RAB
- Label kategori RAB bisa diisi bebas per proyek (labelMat, labelUpah, labelSubkon, labelOverhead)
- Tombol **Hapus RAB** per proyek
- Label custom tampil di tab Vs Realisasi

#### Fitur Baru — Dashboard
- **Tab Piutang**: list proyek diurutkan piutang terbesar, KPI total, progress bar % terbayar
- **Tab Hutang**: hutang upah karyawan per proyek + hutang subkon belum lunas, KPI grand total
- Dashboard filter status tetap ada di tab Proyek

#### Fitur Baru — Rekap Proyek
- Tombol **📋 Rekap** di setiap project card (dashboard & master proyek)
- Modal 1 halaman: finansial (kontrak, piutang, biaya, laba+margin), breakdown biaya per kategori, **upah belum dibayar per karyawan** ("dana yang perlu disiapkan"), riwayat pembayaran klien, RAB progress bar

#### Fitur Baru — Catatan Proyek
- Halaman **📝 Catatan** tersendiri di nav (bukan di modal edit proyek)
- Pilih proyek → isi textarea → simpan
- Existing catatan otomatis load saat pilih proyek
- Semua catatan tersimpan ditampilkan di bawah (tap untuk edit)
- Catatan juga tampil di: card Master Proyek (kotak kuning), modal Rekap (paling atas)
- Tersimpan di GSheet kolom O sheet MASTER PROJECT

---

## Status Deploy

⚠️ **Apps Script belum diupdate** — perlu copy 3 file ke Google Apps Script dan redeploy:

| File | Perubahan |
|---|---|
| `read.gs` | Diskon fix, RAB label, catatan proyek |
| `write.gs` | Diskon fix, formula total, RAB label, deleteRAB, catatan proyek |
| `config.gs` | Tambah case deleteRAB di router |

**Langkah deploy:**
1. Buka Google Apps Script → proyek Arthabumi
2. Buka `read.gs` → select all → paste isi file dari folder Cowork
3. Ulangi untuk `write.gs` dan `config.gs`
4. **Deploy → New Deployment** (atau update existing)
5. Setelah deploy, test: cek harga, hapus RAB, simpan catatan proyek

---

## Catatan Penting

- **GSheet kolom O MASTER PROJECT** — kolom baru untuk catatan. Tidak perlu buat manual, Apps Script otomatis tulis ke sana saat pertama kali simpan catatan
- **GSheet kolom I–L RAB** — kolom baru untuk label kategori. Sama, otomatis terisi saat saveRAB
- **API_TOKEN** di `constants.gs` masih kosong `""` — isi sebelum production
- **autoBackup()** belum dipasang trigger — pasang manual di Apps Script Triggers
- **Hutang ke toko/supplier** belum bisa ditampilkan — pembelian tidak punya field "status bayar ke toko"

---

## Versi Kode

| File | Versi | Catatan |
|---|---|---|
| constants.gs | v1.8 | Tidak ada perubahan |
| config.gs | v1.9 | +deleteRAB route |
| helpers.gs | v1.8 | Tidak ada perubahan |
| read.gs | v1.9 | +diskon fix, +RAB label, +catatan |
| write.gs | v1.9 | +diskon fix, +formula total, +RAB label, +deleteRAB, +catatan |
| setup.gs | v1.8.1 | Tidak ada perubahan |
| diagnostic.gs | v1.8 | Tidak ada perubahan |
| backup.gs | v1.0 | Tidak ada perubahan |
| index.html | v1.9 | Banyak fitur baru (lihat bagian Session 2) |

---

## Cara Lanjutkan di Session Baru

```
Buka Claude / Cowork baru
→ Baca HANDOFF.md ini (konteks lengkap)
→ Baca arthabumi/SYSTEM.md (arsitektur teknis)
→ Akses folder: D:\Mirror\Claude Cowork\Apps Arthabumi
→ File utama yang sering diubah: arthabumi/index.html, read.gs, write.gs, config.gs
```

---

## Fitur yang Diusulkan Tapi Belum Dikerjakan

| Fitur | Prioritas | Keterangan |
|---|---|---|
| Progress % per proyek | Tinggi | Input manual berapa % selesai |
| Alert / tanda bahaya | Tinggi | Peringatan upah menumpuk, biaya mendekati RAB |
| Stok material SISA | Sedang | List pembelian berstatus SISA per proyek |
| Print rekap proyek | Sedang | Halaman bersih untuk laporan ke klien |
| Hutang ke toko | Sedang | Perlu tambah field "status bayar" di pembelian |
| Rekap cash flow bulanan | Sedang | Total masuk vs keluar per bulan |
| Duplikasi RAB | Rendah | Copy RAB dari proyek lama |
