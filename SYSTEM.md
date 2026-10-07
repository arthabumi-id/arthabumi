# 🤖 SYSTEM.md — ARTHABUMI AI BRIEFING
> Paste file ini di awal conversation Claude baru. Tidak perlu paste yang lain kecuali diminta.

---

## IDENTITAS PROYEK
- **Nama:** Arthabumi | **Owner:** Eddy Santoso | **Bisnis:** Kontraktor (besi, interior, renovasi, waterproofing)
- **Versi aktif:** v1.51 — 7 Okt 2026 (Cloudflare live; batas sync 60 dtk; backend config.gs v1.13) (cek `APP_VERSION` di index.html, jangan percaya angka di dok). Backend live: config.gs v1.12 = Apps Script versi 50. Baca bagian **WAJIB TAHU SEJAK OKT 2026** di bawah.
- **App:** Single HTML file, pure vanilla JS, zero dependencies
- **Backend:** Google Apps Script → Google Sheets
- **Deploy frontend:** GitHub Desktop → push ke repo `arthabumi-id/arthabumi` (branch `main`). **LIVE sejak 7 Okt 2026: Cloudflare Pages `https://arthabumi-kontraktor.pages.dev`** (build: `mkdir -p dist && cp -r index.html sw.js fonts icons _headers dist/`, output `dist`) — GitHub Pages lama `arthabumi-id.github.io/arthabumi` dimatikan saat repo privat (11 Okt). File baru yang harus tersaji WAJIB ditambahkan ke build command.
- **Deploy backend:** paste file `.gs` ke editor Google Apps Script (TERPISAH dari GitHub) lalu Deploy → Manage deployments → Edit → New version — ATAU Claude lewat clasp (lihat WAJIB TAHU).

---

## FILE STRUKTUR
```
arthabumi/
├── index.html                    ← App utama (cek `APP_VERSION` di dalamnya, jangan percaya angka di dok)
├── sw.js                         ← Service worker (v1.46) — naikkan CACHE tiap rilis
├── fonts/ icons/                 ← Huruf & ikon app (v1.41) — ikut di-push
├── tests/                        ← Uji otomatis Playwright + data contoh (lihat tests/README.md)
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
    ├── HANDOFF.md                ← (USANG, arsip v1.11)
    ├── PRD-*.md                  ← PRD yang sudah disetujui
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

## ⚠️ WAJIB TAHU SEJAK OKT 2026 (v1.41–v1.49)
Ringkas — rinciannya di `docs/CHANGELOG.md` (Session 25–33), PRD di `docs/PRD-redesain-b-v1.41.md` & `docs/PRD-perbaikan-v1.45.md`.

**Tampilan (gaya B, sama dengan FCC)**
- Warna HANYA lewat token CSS (`var(--bg2)`, `--text`, `--accent`, `--green`, `--ic-amber`, …): `:root` = terang, `:root.dark` = gelap
  (pilihan di localStorage `ab3-theme`). Jangan tulis warna hex di kode layar. Pengecualian: dokumen cetak/laporan/Excel
  (fungsi `_loadXlsx` … `printRekapProyek`) sengaja tidak memakai token.
- Huruf di `fonts/` (Plus Jakarta Sans + Fraunces), ikon app di `icons/`.
- **Tanpa emoji di layar.** Ikon lewat `ic('nama')` (SVG garis, daftar di `ICONS` paling atas skrip); `ic('nama','b')` untuk tombol tanpa teks.
  `showToast()` otomatis menambah ikon sesuai jenis (ok/err/info).
- Konfirmasi: `await askConfirm(pesan,{ok:'Hapus',danger:1})` — JANGAN `confirm()`. Selama dialog terbuka, hasil sync ditahan (`_cfmHold`).
- PC ≥ 1024px: menu samping (`.nav-side` di `buildNav()`), `#content[data-page]` mengatur lebar, modal jadi panel kanan.
- Dropdown ≥ 7 pilihan otomatis jadi kotak cari (`cbxEnhance`, MutationObserver). `<select>` asli tetap ada (disembunyikan) —
  `onchange`/`.value` lama tetap jalan. Kecualikan dengan atribut `data-nocbx`.

**Data & sync**
- Data kiriman FCC (ID diawali `BLI-FCC-`, `KSB-FCC-`, `PAY-FCC-`) **dikunci**: `_isFCC()` / `_fccLock()`; ubah/hapus lewat FCC.
- Hari kerja: `_hariAbs(a)` (Hadir 1, Setengah Hari 0,5, lainnya 0) + `fHari()` di semua hitungan hari.
- **Sync ringan (v1.48):** backend menyimpan Script Property `DATA_VERSI` (naik setiap `_apiHandleAction` berhasil, dari app maupun FCC).
  `doFetch()` tanya `?action=versi` dulu; unduh 12 sheet hanya bila versi beda / Sync manual / > 10 menit. Tulis kirim `ringan=1` →
  dijawab `{ok,versi}` lalu unduh lengkap di belakang layar. Kecepatan tercatat di Pengaturan (`_spdTeks`).
- `doFetch` render ulang otomatis hanya bila aman (`_bolehRenderUlang`: tidak ada modal/dialog/isian aktif).
- **Service worker `sw.js`** (bisa dibuka tanpa sinyal): **setiap rilis naikkan `CACHE` di sw.js = APP_VERSION.**

**Cara kerja di repo ini**
- File repo **LF**. Git `core.autocrlf=true` → **JANGAN `git stash`/`git checkout -- file`** (working copy jadi CRLF). Untuk pembanding versi lama
  pakai `git show HEAD:index.html > folder-temp/...`. Patch lewat skrip Node dengan hitungan anchor (berhenti kalau jumlah tidak cocok).
- **Uji otomatis** di `tests/` (Playwright dengan data contoh — tidak menyentuh Sheet asli). Lihat `tests/README.md`.
- **Deploy backend bisa oleh Claude lewat clasp** (login akun Google bisnis Eddy — lihat memori Claude, jangan ditulis di repo publik): clone Script ID project ke folder sementara
  (BUKAN di repo — repo publik), bandingkan dengan `backend/*.gs`, ganti file yang berubah, `clasp push` → `clasp create-version` →
  `clasp update-deployment <deploymentId yang dipakai app> -V <n>` (URL tetap). Script ID & deployment ID JANGAN ditulis di repo.
  Tetap tunjukkan rencana & tunggu Eddy ketik **"Proceed"**. Terakhir: v1.48 → Apps Script versi **50** (rollback: 49).

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
| beli | `pgBeli()` (tab: Input/Log/Cek Harga/Hutang Toko) | `beliInput()`, `beliLog()` → `_beliFiltered()` (filter tunggal) + `_beliGroupTanggal()` (sub-grup per toko, lipat via `toggleBeliDT()`)/`_beliGroupToko()` (toggle `setBeliView()`), `beliHutang()`, `beliCekHarga()`, `submitBeli()`, `openEditBeli()`, `delPembelian()`, `openPasteBeli()` |
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
| `addAbsensi` | `[{id, tgl, idKaryawan, status, kodeProj, upahHariIni, jamLembur, upahLembur, ket}]` |
| `updateAbsensi` (v1.32) | `{id, oldTgl, oldIdKaryawan, tgl, status, kodeProj, namaProj, upahHariIni, jamLembur, upahLembur, ket, locked}` — `locked:true` (sudah closing) hanya ubah F/G/L |
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
❌ Jangan pakai emoji di layar (pakai ic()), jangan confirm() (pakai askConfirm), jangan warna hex (pakai token)
```

### Pola Tambah Data (ikuti urutan ini)
```javascript
S.array.push(newItem);          // 1. update state
ss(KS.key, S.array);            // 2. simpan localStorage
showToast('...');               // 3. feedback (tanpa emoji — ikon otomatis)
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

> ✅ **SELESAI v1.36:** Sheet & tab REKAP kini ikut kerja tambah/kurang lewat **kolom R = Nilai Final**
> (ditulis app sebagai angka setiap proyek disimpan). Formula J/K/N pakai `IF($R="",$F,$R)`, `rekap.gs` hitung
> nilai final dari kolom Q. Kolom F tetap **nilai kontrak awal** — jangan pernah ditimpa, nanti dobel hitung.

---

## SKEMA MASTER PROJECT (live)
```
A=No  B=Kode  C=Nama  D=Jenis  E=Status  F=Nilai Kontrak AWAL
G=Material(f)  H=Upah(f)  I=Total Biaya(f)  J=Laba(f)  K=Margin(f)
L=Tgl Mulai  M=Pembayaran(f)  N=Piutang(f)  O=Catatan  P=Progress
Q=Variasi kerja tambah/kurang (JSON, ditulis app)
R=NILAI FINAL (angka, ditulis app) = F + Σtambah − Σkurang     ← v1.36
```
(f) = formula. J/K/N memakai R dengan fallback ke F untuk baris lama.

---

## VERSI AKTIF: v1.49 — 2026-10-06
v1.41–44 redesain gaya B (warna/huruf/tema gelap, ikon, Dashboard & kartu proyek, tampilan PC) · v1.45 data FCC dikunci, absensi cepat,
pengingat input kasbon/bayar, U1/U2/U5 · v1.46 pengingat Dashboard, offline (sw.js), slip closing → bagikan · v1.47 dropdown cari, Reset filter,
Kosongkan isian, tanggal custom mulus · v1.48 sync ringan (backend config.gs v1.12) · v1.49 tombol Ke atas. Rincian: docs/CHANGELOG.md.

## (sebelumnya) v1.40 — 2026-09-30
Perubahan v1.40 (Tahap 4 integrasi FCC): FCC membaca closing (`action=closing`, read.gs `_apiClosingFCC`) dan mencatat
bayar subkon lewat sheet **LOG BAYAR SUBKON** (`bayarSubkonFCC`/`hapusBayarSubkonFCC`, write.gs). `S.riwayatBayarSubkon`
kini juga berisi pembayaran dari FCC (`fcc:true`, dari `_apiResponse.bayarSubkonFCC`).

## (sebelumnya) v1.38 — 2026-09-29
Perubahan v1.38 (Tahap 0 integrasi FCC — lihat PRD di repo FCC `docs/PRD-integrasi-kontraktor-v50.md`):
- 🔒 **Token keamanan.** Backend membaca token dari **Script Properties `API_TOKEN`** (`_apiToken()` di config.gs) —
  JANGAN tulis token di file .gs (repo publik). Kosong = terbuka. `buatToken()` = buat token acak (lihat log).
- App: Pengaturan → **🔒 Token Keamanan** (`S.apiToken`, localStorage `ab3-tok`); `_tokQ()` menambah `&token=` di
  `gsFetch`/`gsWrite`, `gsPost` mengirim field `token`. Setiap fungsi baru yang memanggil backend WAJIB lewat 3 fungsi ini.

Backend config.gs v1.10 (29 Sep 2026): jalur ringan untuk FCC — POST `ringan:true` → `{ok}` saja; GET `action=ringkas` →
projects/karyawan/barang/toko saja. Dipakai backend FCC (integrasi, lihat PRD di repo FCC).

Perubahan v1.37:
- 🏪 **Log Pembelian "Per Tanggal" kini bertingkat: tanggal → toko → item.** `_beliGroupTanggal()`
  mengelompokkan item tiap tanggal ke dalam sub-grup per nama toko, urut abjad, dan grup
  **(Tanpa Toko)** selalu di paling bawah. Header tanggal menampilkan jumlah item, jumlah toko,
  dan total hari itu; header toko menampilkan jumlah item + subtotal toko.
  Sub-grup bisa dilipat (default terbuka) lewat `toggleBeliDT(key)` dengan key `tgl|toko`,
  state di `S.tab.beliClosedDT` (daftar yang TERTUTUP). Toggle memanggil `_renderBeliItems()`
  saja, bukan `go('beli')`, supaya kotak pencarian tidak kehilangan fokus.
- `beliItemCard(b, showToko, hideTgl)` — parameter ketiga baru untuk menyembunyikan tanggal
  pada item di dalam sub-grup (tanggal & toko sudah ada di header).
- Tampilan tab 🏪 **Per Toko** tidak diubah.

Perubahan v1.36:
- 🧮 **Nilai Final masuk Google Sheet (kolom R)** — `_apiNilaiFinal()` di write.gs; ditulis di `_apiAddProject` & `_apiUpdateProject`. Formula J/K/N di `fixAllProjectFormulas()` + `_apiAddProject` diarahkan ke R. `rekap.gs` hitung nilai final dari `p.variasi`. Fungsi sekali-jalan: **`backfillNilaiFinal()`**.
- 👷 **Rekap Tenaga Kerja per proyek** — section baru di `openRekapProyek()`: per tukang → jumlah hari (Setengah Hari = 0,5 lewat `fHari()`), jam lembur, total upah, dipecah Sudah/Belum Dibayar; ketuk nama → rincian tanggal (`toggleTk()`). Peringatan kalau ada absensi tanpa proyek.
- ⏳ **Indikator proses** — `setBusy(on,lock)`: garis progres `#busybar` di atas layar + `body.is-busy` mengunci tombol `.btn-p`/`.btn-d` saat menulis ke GSheet. Skeleton `skel()` saat muat pertama. `doFetch` render ulang **hanya** saat muat pertama (polling tidak render ulang, supaya form yang sedang diisi tidak hilang).
- 🐛 **Fix `_apiDeleteProject`** — `clearContent` A..R (dulu A..N: kolom O/P/Q tertinggal jadi sampah di baris bekas).
- 🐛 **Fix `fixAllProjectFormulas()`** — dulu error karena `ROWS.PROJECT.end` sudah dihapus di constants v2.0; kini pakai `getLastRow()`.
- 🐛 **Formula `_apiAddProject` diselaraskan** dgn `fixAllProjectFormulas()` — G exclude ASET, I termasuk kasbon BONUS (sebelumnya proyek baru dapat formula lama yang beda).
- ⛔ **`setupRekapSheet()` dipensiunkan** (flag `ALLOW_LEGACY_SETUP_REKAP=false`) — bentrok dgn `rekap.gs`; sheet REKAP hanya dari tombol 📊 di app.

### Perubahan v1.29 → v1.35 (satu paket deploy)
- 📉 **Harga terendah (v1.35)** — hint input pembelian juga menampilkan harga terendah sepanjang riwayat + toko + selisih vs harga sekarang (`_beliHargaInfo()`).
- 💰 **Auto-isi harga (v1.34)** — `beliAutoHarga()`: nama barang cocok dgn MASTER BARANG → harga terakhir + satuan + kategori terisi otomatis, hint tgl & toko terakhir. Flag `hargaAuto` jaga agar harga manual tidak ditimpa. Paste Daftar: kolom harga opsional.
- 🏗️ **Detail Closing per Proyek (v1.33)** — toggle 👷 Per Karyawan / 🏗️ Per Proyek di modal detail closing; biaya tenaga kerja per lokasi proyek (upah + bonus, potongan sbg info), absensi tanpa proyek muncul sbg `(Tanpa Proyek)`.
- ✏️ **Edit absensi (v1.32)** — koreksi proyek/tanggal/status/lembur dari Log Absensi; upah dihitung ulang otomatis. Entri sudah-closing: proyek & ket tetap bisa dikoreksi, sisanya dikunci (`_apiUpdateAbsensi` + flag `locked`).
- 🧭 **Bottom nav baru (v1.31)** — ··· membuka bottom sheet grid (backdrop + animasi + tap luar tutup, ganti model swap); **⚙️ Atur Menu**: user pilih & susun sendiri max 5 menu utama, tersimpan di localStorage `ab3-nav` (`getNavMain()`, `buildNavSheet()`, `openAturMenu()`).
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
