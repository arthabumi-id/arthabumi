# 🤖 SYSTEM.md — ARTHABUMI AI BRIEFING
> Paste file ini di awal conversation Claude baru. Tidak perlu paste yang lain kecuali diminta.

---

## IDENTITAS PROYEK
- **Nama:** Arthabumi | **Owner:** Eddy Santoso | **Bisnis:** Kontraktor (besi, interior, renovasi, waterproofing)
- **Versi aktif:** v1.30 (Latest) — 2026-07-05
- **App:** Single HTML file, pure vanilla JS, zero dependencies
- **Backend:** Google Apps Script → Google Sheets
- **Deploy frontend:** GitHub Desktop → push ke repo `arthabumi-id/arthabumi` (branch `main`) → live di GitHub Pages `https://arthabumi-id.github.io/arthabumi/`. Setelah push, refresh PWA (hapus & tambah ulang shortcut) karena cache.
- **Deploy backend:** paste file `.gs` ke editor Google Apps Script (TERPISAH dari GitHub), lalu Deploy → New version.

---

## FILE STRUKTUR
```
arthabumi/
├── index.html                    ← App utama (v1.15)
├── SYSTEM.md                     ← File ini (briefing Claude)
├── backend/                      ← Backend LIVE = kumpulan file terpisah (paste SEMUA ke Apps Script)
│   ├── config.gs                 ← ROUTER (doGet + _apiHandleAction switch) — entry point API
│   ├── read.gs                   ← Semua fungsi _apiRead* (GSheet → app)
│   ├── write.gs                  ← Semua fungsi _apiAdd/_apiUpdate/_apiDelete* (app → GSheet)
│   ├── constants.gs              ← SHEET.* + ROWS.* (nama sheet & batas baris)
│   ├── helpers.gs                ← _sanitizeStr/_sanitizeNum/_apiParseDate/_apiSerDate dll
│   ├── setup.gs                  ← setupAllSheets() + perbaikan formula
│   ├── rekap.gs                  ← Sheet REKAP ringkasan (action updateRekap)
│   ├── backup.gs                 ← backupToJSON / restore
│   └── diagnostic.gs             ← cek fungsi
└── docs/
    ├── CHANGELOG.md              ← Riwayat versi lengkap
    ├── HANDOFF.md                ← Project status & TODO
    └── TODO.md                   ← Backlog fitur + cleanup notes
```
> ⚠️ **PENTING soal backend:** yang LIVE adalah file terpisah di atas, dengan **`config.gs` sebagai router**.
> File `arthabumi-webapi.gs` (monolit lama, skema beda) sudah DIHAPUS — jangan dipakai/di-paste lagi.

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
| dashboard | `pgDashboard()` | `setDashFilter(v)`, `pgPiutang()`, `pgHutang()` — semua pakai `vSum(p).final` |
| project | `pgProject()` | `openAddProject()`, `saveProject()`, `delProject()`, `openRekapProyek()`, `openVariasiForm()`, `saveVariasi()`, `delVariasi()` |
| beli | `pgBeli()` (tab: Input/Log/Cek Harga/Hutang Toko) | `beliInput()`, `beliLog()` → `_beliFiltered()` (filter tunggal) + `_beliGroupTanggal()`/`_beliGroupToko()` (toggle `setBeliView()`), `beliHutang()`, `beliCekHarga()`, `submitBeli()`, `openEditBeli()`, `delPembelian()`, `openPasteBeli()` |
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
| `vSum(p)` | **Hitung kerja tambah/kurang.** Return `{tambah,kurang,n,final}`. `final = nilaiKontrak(awal) + Σtambah − Σkurang`. SUMBER TUNGGAL nilai kontrak efektif — dipakai di Dashboard, Piutang, Rekap proyek, kartu proyek. ⚠️ `p.nilaiKontrak` tetap = nilai AWAL (editable); jangan ditimpa global. |
| `_projPayload(p)` | Bentuk payload bersih utk `doSync('updateProject', ...)` termasuk `variasi`. |

---

## GSHEET API — WEBAPI.GS

### Actions yang tersedia
| Action | Payload |
|---|---|
| `addProject` / `updateProject` / `deleteProject` | `{kode, nama, jenis, status, nilaiKontrak, tglMulai, catatan, progress, variasi[]}` |
| `addPembelian` | `[{tgl, kodeProj, namaBarang, kategori, satuan, qty, harga, diskon, status, toko}]` |
| `deletePembelian` | `{tgl, kodeProj, namaBarang}` |
| `addKaryawan` / `updateKaryawan` / `deleteKaryawan` | `{id, nama, jabatan, upahHarian, noHP}` |
| `addAbsensi` | `[{tgl, idKaryawan, status, kodeProj, upahHariIni, ket}]` |
| `deleteAbsensi` | `{tgl, idKaryawan}` |
| `addKasbon` | `[{tgl, idKaryawan, tipe, nominal, ket}]` |
| `addPembayaran` | `[{id, tgl, kodeProj, nominal, metode, bank, ket, ref}]` |
| `uploadBuktiSubkon` (via **POST**, bukan GET) | `{idLog, b64, mime, filename}` → simpan foto ke Drive, link ke kolom P LOG SUBKON |
| `finalizeClosing` | `{dari, sampai, tglBayar, noClosing, selectedIds[], kasbonItems[]}` |

### Sheet → Kolom Kunci
| Sheet | Kolom penting |
|---|---|
| MASTER PROJECT | B=kode, C=nama, F=nilaiKontrak(awal), O=catatan, P=progress, **Q=variasi (JSON kerja tambah/kurang)** |
| PEMBELIAN | **A=ID app (BLI-..., v1.29; baris legacy = nomor urut)**, B=tgl, C=kodeProj, D=namaBarang, G=qty, H=harga, I=diskon(Rp), K=toko, L=total(formula), M=bayarToko |
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
| Dashboard/Piutang tidak ikut kerja tambah/kurang | `pgDashboard`/`pgPiutang` hitung di app dari `p.nilaiKontrak` (awal), BUKAN bug rumus GSheet | Pakai `vSum(p).final` di semua tampilan ✅ v1.15 |

> 🟡 **Belum diperbaiki (lihat docs/TODO.md):** Sheet/tab REKAP & formula M/N (piutang/laba) masih pakai nilai AWAL — belum baca variasi kolom Q. App sudah final; sheet-side perlu ubah `rekap.gs`.

---

## VERSI AKTIF: v1.30 — 2026-07-05
Perubahan terakhir (v1.29 + v1.30, satu paket deploy):
- 📷 **Upload bukti bayar subkon** — foto/screenshot dikompres di browser, kirim via `gsPost()` (POST text/plain), simpan ke Drive "Arthabumi Bukti Pembayaran", link di kolom P LOG SUBKON, chip 📎 di Log Subkon. Redeploy minta izin Drive sekali.
- ✅ **ID unik + add idempotent di SEMUA log** (BLI/ABS/KSB/PAY/LSK di kolom A) — retry setelah timeout tidak lagi bikin baris dobel; delete/update lookup by ID dulu. Fix kasus absensi dobel di closing.
- ✅ **Fix form reset** — Absensi (tgl+proyek default), Kasbon (semua field), Pembayaran (tgl), Subkon (semua field), Closing (periode+no) sekarang state-backed; tidak hilang saat re-render.
- ✅ **Guard absensi duplikat** + fix `numInp` oninput dobel (dropdown karyawan potongan tidak muncul) + fix prefix merge `ABN-GS-`→`ABS-GS-` + auto No Closing pakai `today()` bukan UTC.
- ✅ **Log Pembelian**: toggle 📅 Per Tanggal / 🏪 Per Toko kembali, ringkasan total sesuai filter, fix filter Custom satu sisi, info tanggal/proyek/toko di modal konfirmasi.

### Versi sebelumnya
- v1.28 (2026-07-02) — Hutang ke Toko (tab + tandai lunas), sync merge aman, filter absensi per karyawan
- v1.26 (2026-06-27) — Unified filter + grouped by toko di Log Pembelian, real-time search
- v1.20 (2026-06-17) — Nav swap + bug fix form pembelian
- v1.15 (2026-06-09) — Log Per Toko + Kerja Tambah/Kurang (kolom Q) + cleanup monolit

**Lihat:** `docs/CHANGELOG.md` untuk riwayat lengkap.

---

*Update file ini setiap ada perubahan arsitektur atau fungsi baru.*
*Arthabumi © 2026 — Eddy Santoso*
