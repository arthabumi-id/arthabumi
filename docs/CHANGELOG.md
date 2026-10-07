# 📝 CHANGELOG — Arthabumi Project

Riwayat lengkap pengembangan aplikasi (v1.1-v1.6b) dan backup/deployment (v1.10 onwards).

---

## 📊 STRUKTUR CHANGELOG

**Bagian 1:** App Development History (v1.1 → v1.6b)  
**Bagian 2:** Backup & Deployment History (v1.10 onwards)

Untuk dokumentasi teknis & arsitektur → baca `SYSTEM.md`

---

# ☁️ SESSION 34 (v1.50) — 2026-10-07 — Siap pindah ke Cloudflare Pages (PRD docs/PRD-cloudflare-v1.50.md)

- `salinPengaturan()` / `tempelPengaturan()` (Pengaturan → Pindah perangkat / alamat): paket teks `ARTHABUMI-PENGATURAN:1:<base64>` lewat clipboard (bukan URL) berisi `PINDAH_KUNCI` = ab3-url, ab3-tok, ab3-poll, ab3-nav, ab3-co, ab3-theme, **ab3-rbsk (riwayat cicilan subkon — hanya ada di HP)**. Salin ditolak bila ada antrean kirim / data pending. Tempel → simpan → muat ulang → data diunduh dari Sheet. Cadangan: kotak teks bila clipboard tidak bisa dipakai.
- `_bannerPindah()` di Dashboard hanya di alamat *.github.io → tombol "Salin pengaturan & buka alamat baru" (`ALAMAT_BARU`).
- `_headers` (Cloudflare): X-Frame-Options DENY, nosniff, no-referrer, index.html & sw.js no-cache.
- Build Cloudflare: `mkdir -p dist && cp -r index.html sw.js fonts icons _headers dist/`, output `dist` → backend/docs/tests/backups TIDAK tersaji.
- Uji: tests/interact150.js 13 uji (dua origin = dua localStorage) + semua uji lama lulus.

---

# ⬆️ SESSION 33 (v1.49) — 2026-10-06 — Tombol Ke atas

- Pil `#toTop` "Ke atas" di tengah bawah (PC: tengah area isi), muncul bila `#content` digulir > 400px; ketuk → gulir halus ke atas. Di tengah supaya tidak menimpa tombol ubah/hapus di kanan kartu. sw.js CACHE ab-v1.49. Uji HP & PC lulus.

---

# ⚡ SESSION 32 (v1.48) — 2026-10-06 — Sync ringan (keluhan Eddy: lemot saat dipakai & sync)

### Diagnosa
- GitHub Pages bukan penyebab (373 KB, 0,3–0,9 dtk dari cache Singapura). Setiap sync 60 dtk & setiap simpan membaca **12 sheet penuh** (`_apiResponse`), padahal Apps Script yang sama juga melayani FCC.

### Backend config.gs v1.12 — ✅ DEPLOYED 6 Okt 2026 17.17 lewat clasp oleh Claude (Proceed Eddy): Apps Script versi **50**, deployment web app yang sama (URL tetap). Isi editor sebelum deploy dicek = repo (kecuali config.gs). Rollback: update deployment ke versi 49.
- Script Property `DATA_VERSI` naik setiap `_apiHandleAction` berhasil (dari app maupun FCC, doGet & doPost). `?action=versi` menjawab versi tanpa membaca sheet. Tulis dengan `ringan=1` dijawab `{ok,versi}`. `_apiResponse` menyertakan versi (dibaca sebelum sheet).

### Frontend
- `doFetch(url,full)`: cek versi dulu; unduh lengkap hanya bila versi beda, Sync manual, muat pertama, atau unduhan lengkap terakhir > 10 menit (jaga perubahan langsung di Sheet). Versi disimpan `ab3-ver`.
- `gsWrite` mengirim `ringan=1`; bila dijawab ringkas → unduh lengkap di belakang layar (tombol tidak terkunci). Backend lama tetap didukung (versi ditolak → kembali ke cara lama; simpan dijawab data lengkap → dipakai langsung).
- Pengaturan: kotak "Kecepatan sync" (cek perubahan & unduh lengkap: detik, KB, jam).
- sw.js CACHE ab-v1.48.
- Uji: router config.gs 8 uji (Node, Google tiruan); app 12 uji dengan Apps Script tiruan (3x sync tanpa perubahan = 0 unduh lengkap; kiriman FCC terdeteksi; simpan ringkas; Sync manual; batas 10 menit; backend lama); uji v1.41–v1.47 lulus; teks 46 layar sama.

---

# 🔎 SESSION 31 (v1.47) — 2026-10-06 — Dropdown bisa diketik, reset, tanggal custom mulus (permintaan Eddy)

### Frontend saja
- **Tanggal Custom** di Log Pembelian & Log Absensi: onchange kini hanya `_renderBeliItems()`/`_renderAbsItems()` (dulu `go()` → kolom tanggal digambar ulang di tengah ketikan; terbukti di versi lama tahun tersimpan "0002" & fokus hilang).
- **Dropdown cari**: `<select>` dengan ≥ 7 pilihan otomatis diberi kotak ketik (`cbxEnhance`, MutationObserver). Select asli disembunyikan & tetap dipakai: pilih → `sel.value` + event change (onchange lama jalan). Setter `value/selectedIndex` disinkronkan ke kotak ketik. Saring semua kata (urutan bebas, juga kode). Enter/↑↓/Esc, tombol × = pilihan kosong. `data-nocbx` untuk mengecualikan.
- **Reset filter** (`_resetFilterBtn`) di Log Pembelian & Log Absensi; **Kosongkan isian** (`kosongkanForm`, dengan konfirmasi) di form Pembelian, Absensi, Kasbon, Bayar, Subkon, Closing baru — hanya state form, data tersimpan tidak disentuh.
- sw.js CACHE ab-v1.47.
- Uji: teks 46 layar beda hanya tombol baru & dropdown yang kini tersembunyi; 22 uji alur v1.47 + uji v1.41/v1.45/v1.46 lulus, 0 error.

---

# 📶 SESSION 30 (v1.46) — 2026-10-05 — Pengingat Dashboard, tanpa sinyal, slip closing (PRD docs/PRD-perbaikan-v1.45.md bagian 2)

### Frontend saja — backend tidak berubah
- **Pengingat Dashboard** `_pengingatDash()`: (1) absensi hari ini kosong padahal hari kerja terakhir ≤ 7 hari lalu & proyeknya Berjalan → tombol Isi absensi; (2) absensi Belum Dibayar tertua > 7 hari → "Upah belum di-closing n hari" + total (= Hutang Upah) → tombol Buat closing.
- **Tanpa sinyal**: file baru `sw.js` (cache `ab-v1.46`, network-first, cadangan cache bila gagal/>4 dtk; hanya file app sendiri — Apps Script/CDN tidak disentuh). Didaftarkan di DOMContentLoaded. **Naikkan CACHE di sw.js tiap rilis.**
- **Slip closing**: `slipText(no,id)` (rumus sama dengan Detail Closing: upah + bonus − potong, rincian per proyek dengan `_hariAbs`) + tombol Bagikan slip per karyawan → `navigator.share` (WA dll.), cadangan salin ke clipboard, cadangan terakhir kotak teks.
- Uji: teks 46 layar — beda hanya pengingat absensi (data contoh), tombol slip, catatan versi; 12 uji alur v1.46 (isi slip Darto/Yanto, share & clipboard, 2 pengingat & tombolnya, service worker + buka tanpa sinyal) + uji v1.45 & v1.41 lulus, 0 error.

---

# 🔧 SESSION 29 (v1.45) — 2026-10-05 — Perbaikan kecil + pengaman integrasi FCC (PRD docs/PRD-perbaikan-v1.45.md)

### Frontend (index.html)
- **U5** `_hariAbs(a)` (Hadir 1, Setengah Hari 0,5, lainnya 0) dipakai Dashboard Hutang Upah, daftar & Detail Closing (per karyawan & per proyek). `jmlRecord` tetap untuk teks batalkan closing (jumlah baris absensi). Upah tidak berubah.
- **U2** `doFetch`: bila data berubah (`_dataSig`) dan `_bolehRenderUlang()` (tidak ada modal/dialog/sheet/isian aktif; halaman Dashboard/Proyek/Karyawan atau tab log/hutang/rekap/master/perband) → render ulang, posisi gulir dipertahankan.
- **Kunci data FCC**: `_isFCC` (ID BLI-/KSB-/PAY-FCC-) → label "dari FCC" menggantikan tombol ubah/hapus; `_fccLock` di openEditBeli/delPembelian/tandaiLunasBeli/delKasbon/delPembayaran.
- **Pengingat** di Input Kasbon & Input Bayar + konfirmasi "Tetap simpan" (`submitKasbon`/`submitPay` jadi async).
- **Absensi cepat**: `absSalinTerakhir()` (status + proyek dari tanggal absensi terakhir sebelum tanggal dipilih; lembur tidak ikut) & `absSemuaHadir()`.

### Backend (backend/setup.gs) — paste ke editor Apps Script lalu Simpan (web app tidak berubah, tidak perlu versi baru)
- **U1** `_formatDataArea`: baris akhir dari `getLastRow()` bila tidak diberikan, zebra lewat satu `setBackgrounds`; 10 pemanggil `ROWS.*.end` → null; area data MASTER PROJECT tidak diformat ulang (blok ringkasan buatan tangan, U6). Diuji dengan Sheet tiruan: versi lama gagal (`getRange(,1,1,12)`), versi baru 0 argumen salah.

### Uji
- Teks 46 layar vs v1.44: beda hanya tombol absensi cepat, pengingat FCC, angka hari Hutang Upah (setengah = 0,5; tidak hadir = 0) & catatan versi. 18 uji alur v1.45 + uji dialog/tema/toast lulus, 0 error.

---

# 🖥️ SESSION 28 (v1.44) — 2026-10-03 — Redesain gaya B, Fase 4 Tampilan PC (redesain SELESAI)

### Frontend saja — backend tidak berubah
- `@media (min-width:1024px)`: #app jadi grid (header penuh di atas, menu samping 244px, isi). `buildNav()` kini juga merender `.nav-side` (menu utama sesuai Atur Menu + label LAINNYA + sisanya), tersembunyi di HP. `go()` menandai `#content[data-page]` → halaman input/log selebar 860px, Dashboard/Proyek 1200px.
- Dashboard PC: hero 2 kolom (angka kiri, rincian kanan), kartu proyek 2 kolom (3 di ≥1500px); Master Proyek & Piutang ikut `.pj-list`. Modal tampil sebagai panel kanan; toast di pojok kanan bawah.
- Catatan PRD: "tabel lebar untuk Log Pembelian/Absensi" tidak dibuat sebagai tabel (butuh render ulang daftar = risiko logika); diganti kolom isi yang lebar & rapi.
- Uji: teks 46 layar HP identik dengan v1.43 (kecuali catatan versi); 46 layar PC 1280px 0 error; uji dialog/tema/toast lulus.

---

# 🎨 SESSION 27 (v1.43) — 2026-10-03 — Redesain gaya B, Fase 3 Dashboard & Proyek

### Frontend saja — backend tidak berubah
- Dashboard (tampilan Proyek): kotak ringkasan `.hero` (est. laba filter aktif, margin = tL/tK, jumlah proyek ber-peringatan, Kontrak/Total biaya/Diterima). Kartu `.pj`: kepala (nama, jenis · kode, status, Rekap), peringatan lengkap dengan penjelasan (upah belum dibayar & % kontrak; % biaya dari RAB + progres), Kontrak/Total biaya/Est. laba, bar Biaya vs RAB & Progres, tombol Buat RAB bila belum ada, kaki Diterima/Piutang/Cashflow. Proyek berperingatan diurutkan di atas (urutan lain tetap). Baris hitung disalin apa adanya (dicek patch).
- Piutang & Hutang: ringkasan jadi hero; garis kiri kartu dibuang (piutang ≥ 50% kini ditulis). Master Proyek: kartu baru (kontrak, progres, catatan, Rekap/Edit/Hapus).
- Perbaikan tampilan: tab Proyek di Dashboard kini tampak aktif (dulu tidak, karena `go()` mengisi S.tab.dashboard='input').
- Uji: semua nominal Rp di Dashboard (Berjalan, Semua, skenario peringatan), Piutang, Hutang, Proyek sama dengan v1.42 (nominal baru hanya angka upah belum dibayar di teks peringatan); 46 layar 0 error; uji dialog/tema/toast lulus.

---

# 🎨 SESSION 26 (v1.42) — 2026-10-03 — Redesain gaya B, Fase 2 Ikon & halaman input

### Frontend saja — backend tidak berubah
- `ic(nama)` + `ICONS` (ikon garis SVG inline, ukuran 1.15em, warna currentColor) di awal skrip. 218 emoji di teks template/string → ikon (lexer string/template; tombol tanpa teks → `ic(n,'b')` min 40px). 65 emoji di toast/askConfirm/textContent/option/placeholder dibuang (teks tetap teks biasa). Changelog app & bagian cetak/Excel tidak disentuh (dicek identik).
- Menu bawah & sheet Lainnya: nama ikon di NAV, pil aktif; toast berikon sesuai jenis; status sync pakai titik warna; antrean retry "Antre n".
- Tab halaman (.tabs) jadi segmen; chip filter tetap pil. Target sentuh: .btn ≥44px, .btn-sm ≥36px, input ≥46px.
- Uji: 44 layar — teks identik dengan v1.41 setelah emoji dihilangkan (beda hanya ••• → ikon & catatan versi); 0 error; uji dialog/tema/toast lulus.

---

# 🎨 SESSION 25 (v1.41) — 2026-10-03 — Redesain gaya B, Fase 1 Fondasi (PRD docs/PRD-redesain-b-v1.41.md)

### Frontend saja (index.html + folder baru fonts/ & icons/) — backend TIDAK berubah, tidak perlu paste/deploy Apps Script
- Palet gaya B sama dengan FCC sebagai token CSS: `:root` = terang (bawaan), `:root.dark` = gelap. Huruf Plus Jakarta Sans + Fraunces disimpan di `fonts/` (lisensi OFL).
- 672 warna yang ditulis langsung di kode layar diganti token (peta per warna; `#fff` di `color:` → `--on`, selain itu → `--bg2`; pilihan aktif/aksen → `--accent`; kotak ringkasan closing gelap → `--hero`). Dokumen cetak, laporan HTML & Excel (baris _loadXlsx…printRekapProyek) **tidak disentuh**.
- Header baru: logo, status sync, tombol Sync/Tema/Pengaturan (ikon garis). Tema disimpan per perangkat (`ab3-theme`), diterapkan sebelum halaman tampil.
- 14 `confirm()` → `askConfirm()` (dialog di dalam app; fungsi pemanggil jadi async). Selama dialog terbuka hasil sync ditahan (`_cfmHold`) supaya index data tidak bergeser; Ya → dibuang, Batal → diterapkan.
- Ikon app & manifest baru (`icons/`) → hapus & tambah ulang shortcut di HP.
- Uji (Playwright, data contoh di localStorage, tanpa GSheet): 44 layar/tab/modal — teks semua layar **sama persis** dengan v1.40 (kecuali catatan versi); 0 error; dialog Batal/Esc/Ya + penahan sync; tema tersimpan; kontras pasangan warna utama ≥ 4,5:1 terang & gelap.
- Backup: `backups/index-v1.40-20261003-124436.html`.

---

# 🔗 SESSION 24 (v1.40) — 2026-09-30 — Tahap 4 integrasi FCC

### Backend (paste read.gs + write.gs + config.gs, lalu Deploy → Edit → New version)
- `read.gs` `_apiClosingFCC(ss, sejak)` — closing dikelompokkan per No Closing: upah (upahHariIni, sudah termasuk lembur) per karyawan × proyek + hari, POTONG & BONUS ber-No Closing; hanya tanggal bayar ≥ sejak. `_apiSubkonFCC` — pekerjaan subkon ber-ID asli (bukan LSK-GS-). `_apiReadBayarSubkonFCC`.
- `write.gs` sheet baru **LOG BAYAR SUBKON** (dibuat otomatis): `_apiBayarSubkonFCC(items)` (idempoten per ID BSK-FCC-…; menambah Sudah Dibayar LOG SUBKON kol J + status I Belum/DP/Lunas + tgl K; pekerjaan tak ada → error), `_apiHapusBayarSubkonFCC({id})` (mengurangi lagi, hapus baris).
- `config.gs` v1.11: GET `action=closing&sejak=` ; `ringkas` + `subkon` ; `_apiResponse` + `bayarSubkonFCC` ; router `bayarSubkonFCC` / `hapusBayarSubkonFCC`.
### Frontend `index.html` v1.40
- `applyGS`: riwayat cicilan subkon (`S.riwayatBayarSubkon`) ikut memuat pembayaran dari FCC (`fcc:true`) → terlihat di semua HP.
- ⚠️ Bayar subkon & closing tetap dari app ini untuk closing; bayar subkon mulai dicatat di FCC (jangan dobel dari tombol Bayar di sini).

---

# ⚡ SESSION 23b (backend config.gs v1.10) — 2026-09-29

## Jalur ringan untuk FCC (backend saja, index.html TIDAK berubah)
Masalah: setiap kiriman FCC (server ke server) dijawab dengan `_apiResponse` = membaca SELURUH sheet
(12 pembacaan, ±10–15 detik) padahal FCC hanya butuh "ok" → backend sibuk, Sync di HP bisa timeout.
- `doPost`: body `ringan:true` → setelah aksi dijalankan, jawab `_apiOk()` `{ok,ts}` saja.
- `doGet` `action=ringkas` → `_apiRingkas()`: hanya projects, karyawan, barang, toko (Tes sambungan & daftar barang FCC).
- Token tetap wajib di kedua jalur. Pemanggilan app (HP) tidak berubah.
- **Deploy:** paste `config.gs` → Deploy → Manage deployments → Edit → New version.

---

# 🔒 SESSION 23 (v1.38) — 2026-09-29

## [2026-09-29] v1.38 — Token keamanan (Tahap 0 integrasi dengan FCC)

Latar: backend terbuka (`API_TOKEN = ""`) dan kode `.gs` ada di repo GitHub publik — siapa pun yang tahu URL
Web App bisa membaca & mengubah data. Ini prasyarat integrasi FCC ⇄ app kontraktor
(PRD di repo FCC: `docs/PRD-integrasi-kontraktor-v50.md`).

### Backend — `config.gs` saja (v1.9)
- Token dibaca dari **Project Settings → Script Properties → `API_TOKEN`** (`_apiToken()`), bukan dari file.
  `API_TOKEN` di constants.gs tetap ada sebagai cadangan, biarkan kosong.
- `doGet`/`doPost` menolak request tanpa token yang benar (`_apiTokenSalah()`), pesan:
  "Token salah / belum diisi — cek Pengaturan → Token Keamanan". Property kosong = terbuka seperti dulu.
- `buatToken()` — jalankan dari editor untuk membuat token acak (hanya ditampilkan di log, tidak dipasang).

### Frontend — `index.html`
- Pengaturan → Koneksi GSheet: kolom baru **🔒 Token Keamanan** (disimpan per HP di `ab3-tok`).
- Token ikut di semua request: `gsFetch` / `gsWrite` (`&token=` lewat `_tokQ()`) dan `gsPost` (field `token`).
  Tombol 🔍 Test memakai token yang sedang diketik. 🔌 Putus ikut menghapus token.

### Urutan pasang (agar tidak terkunci)
1. Paste `config.gs` → Deploy → Manage deployments → Edit → New version (URL tetap).
2. Push `index.html` → isi token yang sama di Pengaturan **semua** HP/PC → Simpan (masih jalan, belum dikunci).
3. Script Properties → tambah `API_TOKEN` = token → mulai saat ini backend terkunci.

---

# 🔧 SESSION 22 (v1.37) — 2026-09-07

## [2026-09-07] v1.37 — Log Pembelian: kelompok per toko di dalam tiap tanggal

### 🏪 Perubahan (index.html saja — backend TIDAK berubah)
- `_beliGroupTanggal()` dirombak: tiap tanggal kini dipecah lagi per **nama toko**, baru itemnya.
  - Urutan toko: abjad (locale `id`), grup **(Tanpa Toko)** dipaksa ke paling bawah.
  - Header tanggal: `jumlah item · jumlah toko` + total belanja hari itu.
  - Header toko: jumlah item + **subtotal per toko**.
- Sub-grup toko bisa dilipat, **default terbuka**. Fungsi baru `toggleBeliDT(key)`,
  key = `"tgl|toko"`, state disimpan di `S.tab.beliClosedDT` (berisi key yang TERTUTUP,
  jadi grup baru otomatis terbuka). Toggle memanggil `_renderBeliItems()` — bukan `go('beli')` —
  supaya input pencarian tidak reset/kehilangan fokus.
- `beliItemCard(b, showToko, hideTgl)` — argumen ketiga baru; di dalam sub-grup tanggal+toko,
  baris item tidak lagi mengulang tanggal & nama toko, hanya nama proyek.
- Tab 🏪 **Per Toko**, filter, pencarian, dan ringkasan total tidak diubah.

### ✅ Verifikasi
- `node --check` pada blok `<script>` — lolos.
- Uji fungsi terisolasi di Node dengan 5 data contoh: subtotal per toko dan total per tanggal cocok
  (Rp240.000 + Rp725.000 + Rp20.000 = Rp985.000), urutan (Tanpa Toko) di bawah, lipat/buka bekerja.

---

# 🔧 SESSION 21 (v1.36) — 2026-09-04

## [2026-09-04] v1.36 — Nilai Final di GSheet + Rekap Tenaga Kerja + Indikator Proses

### 🧮 Nilai Final masuk Google Sheet (kolom R) — index.html tidak berubah, backend 3 file
- **Masalah:** kerja tambah/kurang disimpan sbg JSON di kolom Q. App sudah pakai nilai final
  (`vSum(p).final`), tapi Google Sheet (J/K/N) & tab REKAP masih pakai kolom F (nilai awal).
  Satu file, dua angka berbeda.
- **Solusi:** kolom **R MASTER PROJECT = "Nilai Final"**, ditulis app sebagai **angka**
  lewat `_apiNilaiFinal(nilaiKontrak, variasi)` di `write.gs`, setiap `addProject`/`updateProject`.
- Formula diarahkan ke R dgn pengaman baris lama: `NF = IF($R{r}="",$F{r},$R{r})`
  → `J = NF − I`, `K = J / NF`, `N = NF − M`. Diterapkan di `fixAllProjectFormulas()` (setup.gs)
  **dan** di `_apiAddProject()` (write.gs) supaya proyek baru langsung benar.
- `rekap.gs` (`_apiUpdateRekap`) menghitung `nilaiFinal` dari `p.variasi`; header kolom 6 jadi
  "Nilai Kontrak (Final)", subtitle menyebut berapa proyek yang punya kerja tambah/kurang.
- Fungsi baru **`backfillNilaiFinal()`** (setup.gs) — jalankan SEKALI setelah deploy untuk mengisi
  kolom R semua proyek lama. Aman diulang.
- ⚠️ Kolom **F tetap nilai kontrak AWAL** dan tetap jadi field yang diedit di app. Jangan ditimpa.

### 👷 Rekap Tenaga Kerja per Proyek (index.html, frontend-only)
- Section baru **👷 TENAGA KERJA PROYEK INI** di `openRekapProyek()`.
- Per tukang (urut upah terbesar): **jumlah hari** — `Hadir = 1`, **`Setengah Hari = 0,5`**
  (helper `fHari()`, tampil desimal spt `12,5 hari`) — **jam lembur**, **total upah**,
  dipecah `✅ sudah dibayar` / `⏳ belum`.
- Ketuk nama → rincian tanggal kerjanya di proyek itu (`toggleTk()`), lengkap dgn status,
  jam lembur, keterangan, upah, dan tanda sudah/belum dibayar.
- Baris total: jumlah orang + total hari + total upah. Ada penjaga: kalau total upah section ini
  tidak sama dgn "Upah Tenaga (gross)" di Breakdown Biaya → muncul peringatan merah.
- Peringatan kuning kalau ada **absensi tanpa proyek** di Log Absensi (tidak masuk biaya proyek mana pun).

### ⏳ Indikator Proses (index.html, frontend-only)
- `setBusy(on,lock)` berbasis penghitung: garis progres hijau `#busybar` di paling atas layar
  selama menulis/membaca GSheet, dan `body.is-busy` **mengunci tombol `.btn-p` / `.btn-d`**
  selama proses tulis (`doSync`, `gsPost`) — cegah tekan dua kali.
- `skel()` — placeholder abu-abu berkedip saat data pertama kali dimuat dari GSheet,
  supaya tidak terbaca sebagai "data hilang". Dipicu flag `S._firstLoad`.
- `doFetch` render ulang halaman **hanya pada muat pertama**. Polling 60 detik sengaja TIDAK
  render ulang, supaya form yang sedang diisi tidak terhapus di tengah jalan.

### 🐛 Bug fix
- `_apiDeleteProject`: `clearContent` diperluas **A..N → A..R**. Sebelumnya kolom O (catatan),
  P (progress), Q (variasi) tertinggal di baris bekas dan bisa nempel ke proyek baru.
- `fixAllProjectFormulas()`: dulu **error** karena memakai `ROWS.PROJECT.end` yang sudah dihapus
  di `constants.gs` v2.0 (`"B4:Bundefined"`). Kini pakai `ws.getLastRow()`.
- `_apiAddProject()`: formula G & I diselaraskan dgn `fixAllProjectFormulas()` — G exclude ASET,
  I termasuk kasbon BONUS. Sebelumnya proyek baru dapat formula versi lama yang beda hasilnya.
- `setupRekapSheet()` (setup.gs) **dipensiunkan** lewat flag `ALLOW_LEGACY_SETUP_REKAP=false` —
  bentrok menulis sheet REKAP yang sama dengan `rekap.gs`. Sheet REKAP kini hanya dari tombol 📊 di app.

### Deploy
- Frontend: push `index.html` ke GitHub (GitHub Pages).
- Backend: paste **`write.gs`, `setup.gs`, `rekap.gs`** ke Apps Script → Deploy → New version.
- Lalu jalankan **`backfillNilaiFinal()`**, kemudian **`fixAllProjectFormulas()`**, sekali saja.
- Backup Google Sheet dulu — `fixAllProjectFormulas()` menimpa formula kolom G–N.

---

# 🔧 SESSION 20 (v1.35) — 2026-07-16

## [2026-07-16] v1.35 — Keterangan Harga Terendah (index.html, frontend-only)

- ✨ Helper baru `_beliHargaInfo(nm,h,satuan)` — dipakai autofill & Paste Daftar
- ✨ Baris kedua hint: **📉 Terendah Rp X · toko · tanggal — selisih Rp Y/satuan** (dihitung dari seluruh riwayat `S.pembelian` barang tsb, harga > 0)
- ✨ Kalau harga terakhir = harga terendah → **✅ Ini harga terendah dari N× pembelian**
- Berguna sbg alat tawar: langsung terlihat pernah dapat berapa & di toko mana

---

# 🔧 SESSION 19 (v1.34) — 2026-07-16

## [2026-07-16] v1.34 — Auto-isi Harga dari Master Barang (index.html, frontend-only)

- ✨ `beliAutoHarga(i,val)`: ketik/pilih nama barang yang cocok (case-insensitive) dgn MASTER BARANG → **harga terakhir terisi otomatis**, plus satuan & kategori ikut disamakan dgn katalog
- ✨ Hint hijau di bawah nama barang: `✨ Harga terakhir Rp X/sat · tgl · toko` (diambil dari pembelian terakhir barang tsb)
- 🛡 **Tidak menimpa harga manual**: flag `it.hargaAuto` — begitu Eddy mengetik harga sendiri, autofill berhenti mengganggu baris itu. Ganti nama barang → autofill aktif lagi
- ✨ Datalist barang kini menampilkan harga terakhir sbg label bantu saat memilih
- ✨ **Paste Daftar**: kolom harga jadi opsional — `Cat tembok, 2` cukup, harga diambil dari katalog. Error message spesifik kalau barang belum pernah dibeli
- 🧹 Cleanup: `<datalist id="brg-dl">` & `tk-dl` sebelumnya di-render ulang di SETIAP baris item (duplicate ID, DOM bloat) → sekarang satu kali di root form
- 🧹 Field `hargaAuto`/`hargaInfo` di-strip saat simpan (tidak ikut ke state pembelian & GSheet)

---

# 🔧 SESSION 18 (v1.33) — 2026-07-16

## [2026-07-16] v1.33 — Detail Closing: Rincian per Proyek (index.html, frontend-only)

- ✨ Modal Detail Closing punya toggle **👷 Per Karyawan / 🏗️ Per Proyek** (state `S.clsDetailView`, `setClsDetailView()`)
- ✨ View Per Proyek: absensi di-group by `kodeProj` → total upah, jumlah karyawan, jumlah hari kerja; di dalamnya rincian per karyawan (hari + jam lembur + upah), urut upah terbesar
- ✨ Bonus & potongan kasbon ikut dibebankan ke proyek sesuai `kodeProj`-nya masing-masing; baris **Beban proyek = upah gross + bonus** (konsisten dgn model biaya v1.14 — POTONG = info saja, tidak menambah biaya proyek)
- ✨ Absensi tanpa proyek dikelompokkan sebagai `(Tanpa Proyek)` — memudahkan deteksi salah/lupa input proyek
- Grup proyek diurutkan dari beban terbesar

---

# 🔧 SESSION 17 (v1.32) — 2026-07-16

## [2026-07-16] v1.32 — Edit Absensi (index.html + config.gs + write.gs)

### ✨ Tombol ✏️ di Log Absensi
- Koreksi **proyek** (kasus utama: salah pilih tempat karyawan bekerja), **tanggal**, **status** (Hadir / Setengah Hari), **jam lembur**, dan keterangan
- Upah dihitung ulang otomatis dari `upahHarian` karyawan: `base(status) + round(jamLembur × upahHarian / 8)` — konsisten dgn rumus di `submitAbsensi`
- Guard: tidak bisa pindah ke tanggal yang sudah ada absensi karyawan tsb (cegah dobel)

### 🔒 Perlakuan entri yang sudah di-closing
- Entri `Sudah Dibayar` **tetap bisa dikoreksi proyeknya** (hanya memindahkan beban biaya antar proyek, tidak mengubah jumlah yang dibayar ke karyawan) + keterangan
- Tanggal, status, dan lembur **dikunci** (field disabled + banner penjelasan) supaya total closing yang sudah dibayar tidak jadi tidak cocok
- Backend `_apiUpdateAbsensi` hormati flag `locked`: hanya tulis kolom F/G (proyek) + L (ket); kolom I/J/K (statusBayar, noClosing, tglBayar) tidak pernah disentuh

### Teknis
- Action baru `updateAbsensi` di router `config.gs`
- Lookup baris: ID unik kolom A dulu (`_findAbsRowById`), fallback `oldTgl + oldIdKaryawan` untuk baris legacy, + backfill ID saat edit

---

# 🔧 SESSION 16 (v1.31) — 2026-07-16

## [2026-07-16] v1.31 — Bottom Nav Baru: Sheet Grid + Atur Menu (index.html, frontend-only)

### UX: Menu ··· Lainnya → Bottom Sheet Grid
- ✨ Tap **···** → panel naik dari bawah (backdrop gelap, animasi slide, tutup dgn tap di luar) berisi grid ikon menu sekunder — nav utama tidak lagi "bertukar isi" (model swap v1.20 dihapus)
- ℹ️ Beda dgn panel `#nav-lain` lama yang dihapus di v1.20: sheet baru punya backdrop penuh + animasi + tap-luar-tutup, tidak mengubah tinggi nav

### ✨ Atur Menu (kustomisasi nav bawah)
- Tombol **⚙️ Atur Menu** di sheet → pilih maksimal **5 menu utama**, urutan slot = urutan ketukan, sisanya otomatis ke ···
- Tersimpan di localStorage (`ab3-nav`) per perangkat; tombol ↺ Default utk kembali ke bawaan
- `buildNav()` kini baca `getNavMain()`; state `S.navLain` dihapus

---

# 🔧 SESSION 14–15 (v1.29 → v1.30) — 2026-07-05
> Catatan: v1.29 dan v1.30 dirilis sebagai SATU paket deploy bersama v1.31.

## [2026-07-05] v1.29 — Log Pembelian: View Toggle Kembali + ID Unik Pembelian

### UX: Toggle 📅 Per Tanggal / 🏪 Per Toko (index.html)
- ✨ Toggle view kembali (hilang sejak v1.26): **Per Tanggal** = grup per hari kronologis (baru terbaru dulu, subtotal per hari), **Per Toko** = grup per toko collapsible (▸ tap untuk expand)
- ✨ Baris ringkasan hijau di atas daftar: jumlah item + grand total sesuai kombinasi filter aktif
- ✨ Semua filter (proyek, toko, tanggal, search) berlaku di kedua view; refactor `_beliFiltered()` sebagai satu sumber filter
- 🐛 Fix filter tanggal **Custom**: isi "Dari" saja atau "Sampai" saja sekarang berfungsi sebagai rentang terbuka (sebelumnya filter diam-diam nonaktif dan semua data tampil)
- 🐛 Filter & grouping toko case-insensitive; label seragam `(Tanpa Toko)` di Log & Hutang Toko
- ✨ Modal Konfirmasi Pembelian sekarang menampilkan 📅 Tanggal, 📁 Nama Proyek, 🏪 Toko, dan Status Bayar di atas total — cek dulu sebelum simpan

### DATA INTEGRITY: ID Unik Pembelian (index.html + backend read.gs & write.gs) — pola LOG SUBKON
- 🐛 **Root cause**: baris pembelian di GSheet diidentifikasi via `tgl+kodeProj+namaBarang` (match pertama). Beli barang sama 2× di hari & proyek sama → edit/hapus/tandai-lunas bisa kena baris yang salah.
- ✅ `addPembelian` kirim `id` app (`BLI-<timestamp>-<rand>`) → disimpan di **kolom A** sheet PEMBELIAN (menggantikan nomor urut untuk baris baru)
- ✅ `_apiReadPembelian` baca ID dari kolom A (fallback `BLI-GS-n` untuk baris legacy bernomor)
- ✅ `deletePembelian` / `updatePembelian` / `markBayarToko`: lookup **by ID dulu** (`_findBeliRowById`), fallback legacy key (`_findBeliRowByKey`)
- ✅ `updatePembelian` backfill ID ke kolom A baris legacy saat diedit (migrasi bertahap tanpa setup script)
- ✅ `deletePembelian` clear 13 kolom (A–M, sebelumnya 12 — kolom M bayarToko tertinggal)
- ✅ Sync merge: item lokal baru ditandai `pending:true`; `_mergeArr` pakai flag ini untuk pembelian (mencegah item terhapus di device lain "hidup lagi" setelah ID remote berformat `BLI-...`)

## [2026-07-05] v1.30 — Fix Absensi Dobel + Audit Menyeluruh + Upload Bukti Subkon

### BUG FIX: Absensi Dobel di Closing (index.html + read.gs + write.gs)
- 🐛 **Gejala**: input absensi 1 hari + lembur 5 jam → closing menghitung 2 Hadir + 10 jam lembur (upah 2×)
- 🐛 **Root cause**: baris absensi duplikat di GSheet. Dua lubang: (1) `doSync` timeout 45 detik padahal tulis di Apps Script sukses → `retryQ` kirim ulang → baris dobel; (2) tidak ada peringatan saat input absensi 2× untuk karyawan+tanggal yang sama
- ✅ **ID unik absensi** di kolom A LOG ABSENSI (pola sama dgn pembelian): `_apiAddAbsensi` **idempotent** — ID yang sudah ada di-skip, retry tidak lagi bikin baris dobel
- ✅ `_apiAddPembelian` juga idempotent (lubang retry yang sama)
- ✅ **Guard duplikat** di `submitAbsensi`: konfirmasi eksplisit kalau karyawan sudah punya absensi di tanggal itu
- 🐛 **Fix form absensi reset**: Tanggal & Proyek Default balik ke awal setiap klik status karyawan (re-render baca DOM, bukan state — bug yang sama dgn form pembelian v1.20). Sekarang tersimpan di `S.absTgl`/`S.absDefProj`, reset hanya setelah simpan berhasil
- ✅ Fix prefix merge `'ABN-GS-'` → `'ABS-GS-'` (salah ketik lama — absensi yang dihapus di device lain bisa muncul lagi) + flag `pending` seperti pembelian
- ✅ `deleteAbsensi` lookup by ID dulu + clear **14 kolom** (sebelumnya 12 — kolom M jamLembur & N upahLembur tertinggal sebagai residu)
- 🧹 **Cleanup data existing**: cek sheet LOG ABSENSI / tab Log Absensi untuk baris dobel (mis. Rudi), hapus salah satu via tombol 🗑 sebelum closing

### FITUR: Upload Foto Bukti Pembayaran Subkon (index.html + config.gs + read.gs + write.gs)
- ✨ Form Bayar Subkon punya input 📷 foto (screenshot PC / kamera HP). Foto dikompres di browser (canvas → JPEG max 1280px) lalu dikirim via **POST text/plain** (`gsPost()` — bebas limit 50KB GET, tanpa preflight CORS) ke action baru `uploadBuktiSubkon`
- ✨ Backend simpan file ke folder Drive **"Arthabumi Bukti Pembayaran"** (auto-create), sharing "anyone with link view", link ditulis ke **kolom P** LOG SUBKON (multi-link dipisah newline)
- ✨ Tab Log Subkon menampilkan chip 📎 Bukti 1/2/… yang membuka foto di Drive
- ⚠️ `doPost` kini aktif dipakai — saat redeploy, Apps Script akan **minta izin akses Google Drive sekali** (scope baru)

### AUDIT MENYELURUH — 15 temuan diperbaiki
**Form reset (kelas bug yang sama dgn absensi):**
- 🐛 Form Kasbon: SEMUA field (tgl, karyawan, tipe, nominal, proyek, ket) hilang saat re-render → state-backed `S.ksbF`
- 🐛 Form Pembayaran Klien: tanggal reset → `S.payTgl`
- 🐛 Form Input Subkon: semua field reset → `S.skF`
- 🐛 Form Closing: dari/sampai/tglBayar/noClosing reset → `S.clsF`
- 🐛 `numInp()` menghasilkan atribut `oninput` DOBEL saat dipakai dgn handler custom → handler kedua diabaikan browser → preview bayar subkon & dropdown "Karyawan yang Dipotong" tidak pernah muncul saat mengetik potongan (risiko potongan tercatat ke karyawan yang salah!) → numInp skip default oninput jika extra sudah bawa oninput
- 🐛 Auto No Closing pakai `toISOString()` (UTC) — setelah jam 17:00 WIB di akhir bulan, nomor closing bisa pakai bulan berikutnya → ganti `today()`

**Retry dobel (idempotency) — melengkapi absensi & pembelian:**
- ✅ `addKasbon`, `addPembayaran`, `addLogSubkon` idempotent via ID unik kolom A (KSB-/PAY-/LSK-)
- ✅ POTONG kasbon dari bayar subkon (`updateLogSubkon`): frontend kirim `potId`, backend skip jika sudah ada
- ✅ `finalizeClosing`: POTONG & BONUS di-guard per `noClosing+idKaryawan+tipe` — retry tidak menggandakan potongan/bonus
- ✅ `deleteKasbon`/`deletePembayaran` lookup by ID dulu; deleteKasbon clear 9 kolom (I=kodeProj sebelumnya tertinggal)
- ✅ Merge sync: pending flag utk kasbon, pembayaran, logSubkon (anti resurrection + anti drop)

### DEPLOY
- Frontend: push `index.html` (v1.29) ke GitHub
- Backend: paste ulang `config.gs` + `read.gs` + `write.gs` ke Apps Script editor → Deploy → **New version** → authorize izin Drive saat diminta
- Tanpa migrasi sheet: baris lama tetap jalan via fallback, baris baru otomatis pakai ID

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