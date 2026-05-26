# 🤖 SYSTEM.md — ARTHABUMI AI BRIEFING
> Paste file ini di awal conversation Claude baru. Tidak perlu paste yang lain kecuali diminta.

---

## IDENTITAS PROYEK
- **Nama:** Arthabumi | **Owner:** Eddy Santoso | **Bisnis:** Kontraktor (besi, interior, renovasi, waterproofing)
- **Versi aktif:** v1.10 (Latest)
- **App:** Single HTML file, pure vanilla JS, zero dependencies
- **Backend:** Google Apps Script → Google Sheets

---

## FILE STRUKTUR
```
arthabumi/
├── index.html                    ← App utama (v1.10)
├── SYSTEM.md                     ← File ini (briefing Claude)
├── backend/
│   ├── arthabumi-webapi.gs       ← Main GSheet API (paste ke Apps Script)
│   ├── backup.gs
│   ├── config.gs
│   ├── constants.gs
│   ├── diagnostic.gs
│   ├── helpers.gs
│   ├── read.gs
│   ├── setup.gs
│   └── write.gs
└── docs/
    ├── CHANGELOG.md              ← Riwayat versi lengkap
    ├── HANDOFF.md                ← Project status & TODO
    └── TODO.md                   ← Backlog fitur
```

---

## CARA KASIH PERINTAH KE CLAUDE

### ▶ Template Standar
```
Baca SYSTEM.md. [Upload: index.html + backend/arthabumi-webapi.gs kalau perlu baca kode]
Kerjakan: [deskripsi tugas]
File yang diubah: [index.html / backend/*.gs / keduanya]
```

### ▶ Shortcut per Jenis Tugas
| Jenis | Upload file yang dibutuhkan |
|---|---|
| Bug fix kecil | SYSTEM.md saja + describe bug |
| Fitur baru | SYSTEM.md + index.html + backend/arthabumi-webapi.gs |
| Fix GSheet/tanggal | SYSTEM.md + backend/arthabumi-webapi.gs |
| UI/tampilan saja | SYSTEM.md + index.html |
| TODO item | "Baca SYSTEM.md, kerjakan docs/TODO.md #[nomor]" |

> 💡 **Tips:** Kalau Claude tidak punya konteks kode terbaru, upload file-nya. Kalau hanya tanya atau diskusi, SYSTEM.md saja sudah cukup.

### ▶ File Locations (setelah reorganize)
- **Frontend:** `arthabumi/index.html`
- **Backend:** `arthabumi/backend/arthabumi-webapi.gs` (main API), atau file lain di `backend/`
- **Docs:** `arthabumi/docs/` (CHANGELOG, HANDOFF, TODO)
- **Backup:** `backups/index-v{VERSION}-{TIMESTAMP}.html`
- **Scripts:** Root folder (`backup-before-update.bat`, `backup-before-update.ps1`)

---

## ARSITEKTUR TEKNIS

### State Global `S`
```javascript
S = {
  page, tab,
  projects, pembelian, karyawan,
  logAbsensi, logKasbon, logPembayaran,
  masterBarang, masterToko,
  webAppUrl, pollInterval,
  syncing, lastSync, syncError, countdown, retryQ,
  dashFilter,   // filter dashboard by status proyek
  absRows,      // temp absensi input
  formItems,    // temp pembelian input
  payItems,     // temp pembayaran klien input
}
```

### Storage Keys (localStorage)
```javascript
KS = { p, beli, kr, abs, ksb, bayar, brg, toko, url, poll }
// prefix: 'ab3-' + key
```

---

## PETA FUNGSI — INDEX.HTML

| Page | Render | Sub-fungsi penting |
|---|---|---|
| dashboard | `pgDashboard()` | `setDashFilter(v)` |
| project | `pgProject()` | `openAddProject()`, `saveProject()`, `delProject()` |
| beli | `pgBeli()` | `beliInput()`, `beliLog()`, `submitBeli()`, `delPembelian()`, `openPasteBeli()` |
| karyawan | `pgKaryawan()` | `saveKaryawan()`, `delKaryawan()` |
| absensi | `pgAbsensi()` | `absInput()`, `absLog()`, `submitAbsensi()`, `delAbsensi()` |
| kasbon | `pgKasbon()` | `kasbonInput()`, `kasbonRekap()`, `submitKasbon()` |
| closing | `pgClosing()` | `genClosing()`, `finalizeClosing()` |
| bayar | `pgBayar()` | `bayarInput()`, `bayarLog()`, `submitPay()` |

### Fungsi Utama Lainnya
| Fungsi | Keterangan |
|---|---|
| `go(page)` | Navigasi + render page |
| `setTab(page, tab)` | Pindah tab dalam page |
| `openModal(html)` / `closeModal()` | Buka/tutup modal |
| `doSync(action, payload)` | Kirim data ke GSheet (async) |
| `doFetch(url?)` | Ambil data dari GSheet |
| `applyGS(data)` | Apply data GSheet ke state + localStorage |
| `showToast(msg, type)` | Notifikasi toast ('ok'/'err'/'info') |

---

## GSHEET API — WEBAPI.GS

### Actions yang tersedia
| Action | Payload |
|---|---|
| `addProject` / `updateProject` / `deleteProject` | `{kode, nama, jenis, status, nilaiKontrak, tglMulai}` |
| `addPembelian` | `[{tgl, kodeProj, namaBarang, kategori, satuan, qty, harga, diskon, status, toko}]` |
| `deletePembelian` | `{tgl, kodeProj, namaBarang}` |
| `addKaryawan` / `updateKaryawan` / `deleteKaryawan` | `{id, nama, jabatan, upahHarian, noHP}` |
| `addAbsensi` | `[{tgl, idKaryawan, status, kodeProj, upahHariIni, ket}]` |
| `deleteAbsensi` | `{tgl, idKaryawan}` |
| `addKasbon` | `[{tgl, idKaryawan, tipe, nominal, ket}]` |
| `addPembayaran` | `[{tgl, kodeProj, nominal, metode, bank, ket, ref}]` |
| `finalizeClosing` | `{dari, sampai, tglBayar, noClosing, selectedIds[], kasbonItems[]}` |

### Sheet → Kolom Kunci
| Sheet | Kolom penting |
|---|---|
| MASTER PROJECT | B=kode, C=nama, F=nilaiKontrak |
| PEMBELIAN | B=tgl, C=kodeProj, D=namaBarang, G=qty, H=harga |
| MASTER KARYAWAN | B=id, C=nama, E=upahHarian |
| LOG ABSENSI | B=tgl, C=idKaryawan, E=status, I=statusBayar |
| LOG KASBON | B=tgl, C=idKaryawan, D=tipe, E=nominal |
| LOG PEMBAYARAN | B=tgl, C=kodeProj, E=nominal |

---

## ATURAN CODING — WAJIB DIIKUTI

```
✅ Pure vanilla JS — ZERO external CDN
✅ Semua UI = innerHTML + template string
✅ Tanggal: pakai today() bukan new Date().toISOString()
✅ Setelah save lokal → doSync(action, payload)
✅ Setelah doSync berhasil → go(S.page)

❌ Jangan tambah React/Tailwind/Babel/jQuery
❌ Jangan pakai new Date().toISOString() untuk tanggal
```

### Pola Tambah Data (ikuti urutan ini)
```javascript
S.array.push(newItem);          // 1. update state
ss(KS.key, S.array);            // 2. simpan localStorage
showToast('✅ ...');             // 3. feedback
go(S.page);                     // 4. re-render
doSync('action', payload);      // 5. sync GSheet (background)
```

### CSS Class Tersedia
```
Layout:  card, sub-card, row, g2, g3, g4
Text:    item-name, item-sub, sec-title, empty
Chip:    chip, chip-lbl, chip-val
Button:  btn btn-p/d/g/o, btn-sm, btn-w
Badge:   bdg bdg-blue/green/yellow/red/gray/orange/purple
KPI:     kpi, kpi-grid, kpi-lbl, kpi-val
Form:    fg, fl, req, fc
Tab:     tabs, tab tab-on/tab-off
```

---

## KNOWN BUGS & FIX

| Issue | Root Cause | Fix |
|---|---|---|
| Tanggal shift + ada jam di GSheet | `new Date(yr,mo,dy)` pakai timezone Script bukan Spreadsheet | `Utilities.parseDate(s, sstz, "yyyy-MM-dd")` ✅ v1.6b |
| POST ke Apps Script gagal | CORS redirect | Gunakan GET dengan `?action=X&payload=Y` ✅ |
| Tanggal shift 1 hari di app | `toISOString()` pakai UTC | `today()` dengan local time ✅ |

---

## VERSI AKTIF: v1.10
Perubahan terakhir (2026-05-26):
- ✅ Progress % per Proyek (0-100%) dengan color-coded progress bar
- ✅ Alert System: Upah Menumpuk & Biaya Mendekati RAB
- ✅ Dashboard filtering & Rekap modal improvements
- ✅ Backup & deployment system (automated scripts)
- ✅ Reorganized project structure (backend/, docs/ folders)

**Lihat:** `docs/CHANGELOG.md` untuk riwayat lengkap app development & deployment history

---

*Update file ini setiap ada perubahan arsitektur atau fungsi baru.*
*Arthabumi © 2026 — Eddy Santoso*
