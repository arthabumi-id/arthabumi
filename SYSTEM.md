# 🤖 SYSTEM PROMPT — ARTHABUMI AI ASSISTANT

> Dokumen ini adalah briefing untuk AI assistant (Claude / ChatGPT).
> Paste isi file ini di awal conversation baru agar AI langsung paham sistem.

---

## IDENTITAS PROYEK

**Nama:** Arthabumi  
**Pemilik:** Eddy Santoso (Pak Eddy)  
**Bisnis:** Kontraktor — pekerjaan besi, interior, renovasi, waterproofing  
**Tujuan sistem:** Manajemen keuangan proyek (pembelian, absensi, kasbon, closing gaji, pembayaran klien)

---

## STRUKTUR FILE

```
arthabumi/
├── index.html            ← Main app (Single HTML, pure vanilla JS, zero dependencies)
├── arthabumi-webapi.gs   ← Google Apps Script API (backend GSheet)
├── SYSTEM.md             ← Dokumen ini (briefing untuk AI)
├── CHANGELOG.md          ← Riwayat perubahan
└── TODO.md               ← Fitur yang akan dibuat
```

**GitHub Pages URL:** `https://[username].github.io/arthabumi/`  
**Google Sheets:** File `Akuntansi_Kontraktor_GSheets` di Google Drive akun `arthabumi.id@gmail.com`

---

## ARSITEKTUR TEKNIS

### index.html
- **Pure Vanilla JavaScript** — ZERO external dependencies (tidak ada React, Babel, Tailwind CDN)
- **Single file** — semua CSS, JS, HTML dalam 1 file
- **Storage:** `localStorage` untuk data offline
- **GSheet sync:** via `fetch()` ke Apps Script Web App URL

### State Management
Semua state ada di object global `S`:
```javascript
S = {
  page, tab,
  projects, pembelian, karyawan,
  logAbsensi, logKasbon, logPembayaran,
  masterBarang, masterToko,
  webAppUrl, pollInterval,
  syncing, lastSync, syncError,
  countdown, retryQ,
  dashFilter,     // filter dashboard by status
  absRows,        // temp absensi input rows
  formItems,      // temp pembelian input rows
  payItems,       // temp pembayaran input rows
}
```

### Storage Keys (localStorage)
```javascript
KS = {
  p:'ab3-p',          // projects
  beli:'ab3-beli',    // pembelian
  kr:'ab3-kr',        // karyawan
  abs:'ab3-abs',      // logAbsensi
  ksb:'ab3-ksb',      // logKasbon
  bayar:'ab3-bayar',  // logPembayaran
  brg:'ab3-brg',      // masterBarang
  toko:'ab3-toko',    // masterToko
  url:'ab3-url',      // webAppUrl
  poll:'ab3-poll',    // pollInterval
}
```

---

## MODUL-MODUL APLIKASI

| ID Nav | Fungsi Page | Fungsi Sub |
|---|---|---|
| `dashboard` | `pgDashboard()` | Filter: `setDashFilter(status)` |
| `project` | `pgProject()` | `openAddProject()`, `saveProject()`, `delProject()` |
| `beli` | `pgBeli()` | `beliInput()`, `beliLog()`, `submitBeli()` |
| `karyawan` | `pgKaryawan()` | `openAddKaryawan()`, `saveKaryawan()`, `delKaryawan()` |
| `absensi` | `pgAbsensi()` | `absInput()`, `absLog()`, `submitAbsensi()`, `delAbsensi()` |
| `kasbon` | `pgKasbon()` | `kasbonInput()`, `kasbonRekap()`, `kasbonLog()`, `submitKasbon()` |
| `closing` | `pgClosing()` | `genClosing()`, `buildClsRekap()`, `finalizeClosing()` |
| `bayar` | `pgBayar()` | `bayarInput()`, `bayarLog()`, `submitPay()` |

---

## GSHEET API (arthabumi-webapi.gs)

### Endpoint
URL format: `https://script.google.com/macros/s/[ID]/exec`

### Actions READ (doGet)
- `getAllData` → return semua data (projects, pembelian, karyawan, dll)

### Actions WRITE (doGet dengan payload)
| Action | Data |
|---|---|
| `addProject` | `{kode, nama, jenis, status, nilaiKontrak, tglMulai}` |
| `updateProject` | sama seperti addProject |
| `deleteProject` | `{kode}` |
| `addPembelian` | array `[{tgl, kodeProj, namaBarang, kategori, satuan, qty, harga, diskon, status, toko}]` |
| `addKaryawan` | `{id, nama, jabatan, upahHarian, noHP}` |
| `updateKaryawan` | sama seperti addKaryawan |
| `deleteKaryawan` | `{id}` |
| `addAbsensi` | array `[{tgl, idKaryawan, status, kodeProj, upahHariIni, ket}]` |
| `addKasbon` | array `[{tgl, idKaryawan, tipe, nominal, ket}]` |
| `addPembayaran` | array `[{tgl, kodeProj, nominal, metode, bank, ket, ref}]` |
| `finalizeClosing` | `{dari, sampai, tglBayar, noClosing, selectedIds[], kasbonItems[]}` |
| `deleteAbsensi` | `{tgl, idKaryawan}` |

### Sheet Structure (GSheet)
| Sheet | Kolom Kunci |
|---|---|
| MASTER PROJECT | B=kode, C=nama, F=nilaiKontrak, G=biayaMat(formula), H=biayaUpah(formula) |
| PEMBELIAN | B=tgl, C=kodeProj, D=namaBarang, G=qty, H=harga, I=diskon%, J=status, L=total(formula) |
| MASTER KARYAWAN | B=id, C=nama, E=upahHarian, I=kasbonAmbil(formula), K=sisaKasbon(formula) |
| LOG ABSENSI | B=tgl, C=idKaryawan, E=status, F=kodeProj, H=upahHariIni, I=statusBayar |
| LOG KASBON | B=tgl, C=idKaryawan, D=tipe(AMBIL/POTONG), E=nominal |
| LOG PEMBAYARAN | B=tgl, C=kodeProj, E=nominal, F=metode, G=bank |

---

## ATURAN CODING

### Wajib diikuti
1. **TIDAK BOLEH** tambah external CDN (React, Tailwind, Babel, dll)
2. Semua UI pakai **innerHTML + template string** (bukan React/JSX)
3. Semua style pakai **inline CSS** atau class CSS yang sudah ada di `<style>`
4. Tanggal selalu pakai **local time** bukan UTC:
   ```javascript
   // BENAR:
   const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
   // SALAH:
   const today=()=>new Date().toISOString().split('T')[0]; // ← timezone bug!
   ```
5. Setelah save → panggil `doSync(action, payload)` untuk kirim ke GSheet
6. Setelah `doSync` berhasil → panggil `go(S.page)` untuk re-render

### Pola navigasi
```javascript
go('namaPage')           // navigasi + render
setTab('namaPage','log') // pindah tab dalam page
```

### Pola tambah data
```javascript
S.dataArray.push(newItem);  // 1. update state
ss(KS.key, S.dataArray);    // 2. simpan localStorage
showToast('✅ ...');         // 3. feedback user
go(S.page);                  // 4. re-render
doSync('action', payload);   // 5. sync ke GSheet (async, background)
```

### Pola UI card
```javascript
// Semua page return HTML string
function pgContoh(){
  return `
    <div class="sec-title">Judul</div>
    <div class="card">
      <div class="row">...</div>
    </div>
  `;
}
```

### Class CSS yang tersedia
```
card, sub-card, sec-title, row, g2, g3, g4
item-name, item-sub, chip, chip-lbl, chip-val
btn btn-p, btn-d, btn-g, btn-o, btn-sm, btn-w
bdg bdg-blue/green/yellow/red/gray/orange/purple
kpi, kpi-grid, kpi-lbl, kpi-val
tabs, tab tab-on/tab-off
fg, fl, req, fc (form controls)
empty (empty state)
```

---

## CARA MEMBERIKAN PERINTAH KE AI

### Template perintah yang efektif:

**Tambah fitur baru:**
```
Baca SYSTEM.md dulu.
Tambahkan fitur [nama fitur] di modul [nama modul].
File yang dimodifikasi: index.html / arthabumi-webapi.gs
Ikuti aturan coding di SYSTEM.md.
```

**Fix bug:**
```
Baca SYSTEM.md dulu.
Bug: [deskripsi bug] di fungsi [nama fungsi].
Fix dan berikan str_replace yang spesifik.
```

**Tambah field/kolom:**
```
Baca SYSTEM.md dulu.
Tambahkan field [nama field] di:
- Form input [nama modul]
- Tampilan log/list
- GSheet write (arthabumi-webapi.gs action [nama action])
```

---

## KONVENSI NAMA

| Prefix | Artinya |
|---|---|
| `pg` | Fungsi yang return HTML page (ex: `pgDashboard`) |
| `abs` | Absensi (ex: `absInput`, `absLog`) |
| `ksb` | Kasbon |
| `cls` | Closing gaji |
| `S.` | State global |
| `KS.` | Storage keys |
| `_api` | Fungsi internal Apps Script |
| `doSync` | Kirim data ke GSheet |
| `doFetch` | Ambil data dari GSheet |
| `gsWrite` | HTTP GET ke Apps Script untuk write |
| `gsFetch` | HTTP GET ke Apps Script untuk read |

---

## KNOWN ISSUES & SOLUSI

| Issue | Solusi |
|---|---|
| Tanggal shift 1 hari | Parse dengan local time, bukan `toISOString()` |
| POST ke Apps Script gagal | Gunakan GET dengan `?action=X&payload=Y` |
| Script error saat buka | Biasanya CDN tidak load, pastikan zero dependency |
| Data tidak masuk GSheet | Cek Apps Script deployment version (harus New version) |

---

## CHANGELOG TERAKHIR

Lihat file `CHANGELOG.md` untuk riwayat lengkap.

---

*File ini dibuat otomatis oleh Claude. Update setiap ada perubahan arsitektur besar.*
