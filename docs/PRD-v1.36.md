# PRD — Arthabumi v1.36

Status: **MENUNGGU SIGN-OFF EDDY**
Disusun: 2026-09-04
Versi sekarang: v1.35 (commit e18d07d, 4 Agustus 2026) → target v1.36

---

## 1. PROBLEM

**P1 — Angka di Google Sheet beda dengan angka di app.**
Fitur Kerja Tambah/Kurang menyimpan variasi sebagai JSON di kolom Q MASTER PROJECT.
App sudah hitung Nilai Final (`vSum(p).final`) di Dashboard, Piutang, dan Rekap Proyek.
Tapi di Google Sheet, kolom J (Laba), K (Margin), N (Piutang) — dan tab REKAP —
masih pakai kolom F (nilai kontrak awal). Satu file, dua angka berbeda.
Risiko: salah baca saat cek laba/piutang langsung dari sheet.

**P2 — Tidak ada cara cepat lihat biaya tenaga per proyek.**
Eddy tidak bisa menjawab "di proyek A, si Budi kerja berapa hari dan habis berapa"
tanpa menyortir Log Absensi manual. Rekap Proyek yang ada hanya menampilkan
upah yang BELUM dibayar — tidak menampilkan total tenaga kerja proyek.

**P3 — Tidak ada indikator proses per bagian.**
Kata "loading" tidak ada sama sekali di index.html. Saat sync/simpan berjalan,
layar diam — Eddy tidak tahu apakah aplikasi bekerja atau menggantung, sehingga
tombol bisa ditekan dua kali.

**P4 — Dokumen internal basi.**
`docs/TODO.md` masih menulis "Versi kode saat ini: v1.20" padahal app sudah v1.35.
Session Claude berikutnya akan salah konteks.

**P5 — Bug: hapus proyek meninggalkan sampah.**
`_apiDeleteProject` (write.gs) hanya membersihkan kolom A–N. Kolom O (catatan),
P (progress), Q (variasi) tertinggal di baris itu. Kalau baris dipakai proyek baru,
data proyek lama ikut nempel.

---

## 2. SUCCESS CRITERIA

| # | Kriteria | Cara verifikasi |
|---|---|---|
| S1 | Buka proyek yang punya kerja tambah → angka Laba & Piutang di MASTER PROJECT, tab REKAP, dan di app **sama persis** | Bandingkan 1 proyek ber-variasi di 3 tempat |
| S2 | Buka Rekap Proyek → terlihat daftar tukang, jumlah hari (desimal), upah, dipecah Sudah/Belum Dibayar | Cek 1 proyek yang ada absensinya |
| S3 | Total upah di section tenaga = angka "Upah Tenaga (gross)" di Breakdown Biaya | Selisih harus Rp 0 |
| S4 | Saat simpan/sync, bagian yang sedang diproses menunjukkan indikator, tombol submit terkunci | Tekan simpan 2× cepat → hanya 1 data masuk |
| S5 | TODO.md & SYSTEM.md menyebut v1.36 dan backlog yang benar | Baca file |
| S6 | Hapus proyek → kolom A sampai R baris itu bersih total | Cek sheet setelah hapus |

---

## 3. SCOPE

### ✅ MASUK

**A. Nilai Final masuk ke Google Sheet — kolom R baru**
- Kolom **R MASTER PROJECT = "Nilai Final"**, ditulis app sebagai **angka** (bukan formula),
  setiap kali addProject/updateProject jalan (di tempat yang sama dengan penulisan kolom Q).
  Rumus: `R = F + Σ(variasi tambah) − Σ(variasi kurang)`.
- Formula MASTER PROJECT diarahkan ke R, dengan pengaman baris lama:
  - `J (Laba)   = IF(R="",F,R) − I`
  - `K (Margin) = J / IF(R="",F,R)`
  - `N (Piutang)= IF(R="",F,R) − M`
- `rekap.gs` (`_apiUpdateRekap`) menghitung `nilaiFinal` dari `p.variasi` di JS —
  dipakai untuk laba, margin, piutang, dan KPI total.
- Fungsi baru `backfillNilaiFinal()` di setup.gs — sekali jalan, isi kolom R
  untuk semua proyek yang sudah ada.
- Kolom F tetap = **nilai kontrak awal** dan tetap jadi field yang diedit di app.
  Tidak pernah ditimpa, supaya variasi tidak dobel hitung.

**B. Section "👷 TENAGA KERJA PROYEK INI" di modal Rekap Proyek** (frontend-only)
- Sumber: `S.logAbsensi` difilter `kodeProj`.
- Per karyawan (urut upah terbesar): nama · **total hari** · **total upah**.
- Hitung hari: Hadir = 1; **Setengah Hari = 0,5**; ditampilkan desimal (mis. `12,5 hari`).
- Pecah status: baris kecil `✅ Sudah dibayar Rp X (n hari) · ⏳ Belum Rp Y (m hari)`.
- Tampilkan juga total jam lembur per orang bila > 0.
- Baris total di bawah = total hari-orang + total upah gross, harus sama dengan
  angka "Upah Tenaga (gross)" di Breakdown Biaya (S3).
- Ketuk nama karyawan → buka rincian tanggal kerjanya di proyek itu (collapse/expand).

**C. Loading state per-section** (frontend-only, sisa TODO #3)
- Helper `setBusy(id, on)`: kunci tombol submit + label jadi "⏳ Menyimpan…" saat
  `doSync`/`gsPost` berjalan, kembali normal setelah selesai/gagal.
- Skeleton/placeholder ringan di daftar yang sedang di-fetch pertama kali.
- Dipasang di jalur tulis utama: pembelian, absensi, kasbon, pembayaran, subkon,
  closing, RAB, upload bukti.

**D. Refresh dokumen**
- `docs/TODO.md` ditulis ulang: versi benar, hapus TODO yang sudah selesai,
  backlog disusun ulang sesuai prioritas terbaru.
- `SYSTEM.md`: versi aktif v1.36, tambah kolom R ke skema MASTER PROJECT,
  perbaiki baris "index.html (v1.15)" yang salah.
- `docs/CHANGELOG.md`: entri v1.36. Tanggal pakai tanggal riil.
- Header app + `APP_CHANGELOG` di index.html → v1.36.

**E. Bug fix**
- `_apiDeleteProject`: `clearContent()` diperluas dari kolom 1–14 menjadi 1–18 (A–R).

### ❌ TIDAK MASUK (dibahas terpisah)
- Mengganti `confirm()` native dengan modal in-app — sudah berfungsi, kosmetik saja.
- Validasi inline (highlight field merah) — validasi via toast sudah jalan di 49 titik.
- Backlog besar: Stok Material SISA, Print Rekap Proyek, Hutang ke Toko, Cash Flow bulanan.

---

## 4. CONSTRAINTS

- Frontend tetap **satu file HTML, vanilla JS, tanpa dependency**.
- **Backward compatible**: proyek lama tanpa kolom R harus tetap tampil benar.
- Tidak ada perubahan skema yang merusak: kolom A–Q tidak digeser, hanya menambah R.
- Deploy backend manual ke Apps Script (terpisah dari GitHub) — 3 file: `write.gs`,
  `rekap.gs`, `setup.gs`.
- Absensi legacy dari GSheet punya id `ABS-GS-n`; jangan andalkan id untuk grouping,
  pakai `idKaryawan`.
- Kolom R adalah **nilai tulisan app**. Kalau kolom Q diubah manual langsung di sheet,
  R jadi basi sampai proyek itu disentuh lagi dari app. Q memang tidak untuk diedit manual.

---

## 5. EXECUTION PLAN

| Tahap | Isi | File | Risiko |
|---|---|---|---|
| 0 | Backup index.html + 3 .gs ke `backups/` | — | aman |
| 1 | Fix A backend: tulis kolom R, formula J/K/N, `backfillNilaiFinal()`, rekap.gs pakai nilai final | `write.gs`, `setup.gs`, `rekap.gs` | sedang |
| 2 | Fix E: `_apiDeleteProject` bersihkan A–R | `write.gs` | aman |
| 3 | Fitur B: section Tenaga Kerja di `openRekapProyek` | `index.html` | aman |
| 4 | Fitur C: helper `setBusy` + pasang di jalur tulis | `index.html` | sedang |
| 5 | Bump versi + tulis ulang TODO.md, SYSTEM.md, CHANGELOG.md | docs | aman |
| 6 | Verifikasi: cek sintaks JS, hitung ulang S3 manual dari data riil | — | — |
| 7 | Commit + push GitHub (frontend live) | — | reversible via git |
| 8 | **Deploy backend ke Apps Script** — paste 3 file, Deploy → New version | — | ⚠️ lihat bawah |
| 9 | **Jalankan `backfillNilaiFinal()` lalu `fixAllProjectFormulas()`** sekali | — | ⚠️ lihat bawah |
| 10 | Tekan tombol 📊 Update Rekap di app, bandingkan angka di 3 tempat (S1) | — | — |

### ⚠️ LANGKAH YANG SULIT DIBATALKAN
- **Tahap 9 — `fixAllProjectFormulas()` menimpa formula kolom G–N seluruh proyek.**
  Bisa dipulihkan dengan menjalankan ulang fungsinya, tapi kalau ada formula yang
  pernah diutak-atik manual di sheet, itu hilang.
- **Tahap 9 — `backfillNilaiFinal()` menulis ke kolom R.** Kolom R sekarang kosong,
  jadi tidak menimpa apa pun. Aman, asalkan kolom R memang belum dipakai untuk hal lain.
  → **Perlu konfirmasi Eddy: kolom R MASTER PROJECT benar-benar kosong?**
- **Tahap 8 — Deploy New version Apps Script.** Reversible: versi lama masih tersimpan
  di riwayat deploy Apps Script.
- Sebelum tahap 8–9: **backup Google Sheet dulu** (File → Buat salinan).

### Cara deploy (Eddy minta Claude yang kerjakan)
Pilihan paling ringan: lewat **Claude in Chrome** — buka editor Apps Script di Chrome
Eddy, paste isi file, klik Deploy → New version, lalu jalankan 2 fungsi tadi.
Tidak perlu ambil alih seluruh PC. Perlu persetujuan situs sekali di ekstensi.

---

## 6. OPEN QUESTIONS

1. **Kolom R MASTER PROJECT sekarang kosong, benar?** Kalau sudah dipakai, saya geser ke S.
2. **Dua pembuat sheet REKAP saling timpa.** `setupRekapSheet()` (setup.gs, berbasis formula)
   dan `_apiUpdateRekap()` (rekap.gs, dipanggil tombol 📊 di app) menulis ke sheet yang sama.
   Usul saya: pensiunkan `setupRekapSheet()` — beri penjaga supaya tidak bisa jalan
   tanpa sengaja, dan REKAP hanya dibuat lewat tombol di app. Setuju?
3. **Absensi tanpa kodeProj** (lupa isi proyek) tidak akan muncul di section tenaga
   proyek mana pun. Perlu saya tambahkan peringatan di Rekap Proyek kalau ada
   absensi menggantung tanpa proyek?

---

## 7. SIGN-OFF

- [ ] Eddy menyetujui PRD ini → balas **"Proceed"**
