# PRD — Perbaikan kecil + fungsi praktis App Kontraktor · v1.45–v1.46

Status: **DISETUJUI** (5 Okt 2026 — "setuju")
Dasar: utang teknis di `docs/TODO.md` (U1, U2, U5) + pemeriksaan kode v1.44 terhadap cara kerja sekarang
(sejak 29–30 Sep 2026 nota, kasbon, pembayaran klien & bayar subkon dicatat di FCC lalu dikirim ke app ini).

## Problem
**A. Utang kecil yang sudah tercatat**
- **U1** `setupAllSheets()` (backend `setup.gs`) masih memakai `ROWS.*.end` yang sudah dihapus di `constants.gs` v2.0
  (14 tempat) → kalau suatu saat dijalankan, error di tengah jalan dan format sheet setengah jadi.
- **U2** Sync otomatis tiap 60 detik memperbarui data, tapi layar baru ikut berubah setelah pindah halaman
  (sengaja, supaya form yang sedang diisi tidak hilang). Akibatnya angka di layar bisa basi tanpa terasa.
- **U5** "Setengah hari" dihitung **0,5** di Rekap Proyek, tapi **1** di Dashboard Hutang Upah dan Detail Closing.
  Upah tetap benar; yang beda hanya angka "hari".

**B. Temuan dari pemeriksaan (praktis sehari-hari)**
1. **Data kiriman FCC masih bisa diubah/dihapus di app kontraktor.** Nota (ID `BLI-FCC-…`), kasbon (`KSB-FCC-…`) dan
   pembayaran klien (`PAY-FCC-…`) tampil sama seperti data biasa, tombol ✏️/🗑 aktif. Kalau diubah di sini, FCC tidak
   tahu → angka di dua app jadi beda diam-diam (FCC tetap sumber uangnya).
2. **Form Input Kasbon & Input Bayar masih terbuka tanpa keterangan**, padahal keputusan 29 Sep: kasbon (Pinjam/Kembali
   Tunai) dan pembayaran klien cukup di FCC. Sekali lupa → tercatat dobel.
3. **Absensi harian harus diketuk satu-satu** (status per karyawan, mulai dari "belum pilih"), padahal biasanya timnya
   sama dengan hari kerja sebelumnya.
4. **Tidak ada pengingat** di Dashboard: absensi hari ini belum diisi, atau upah sudah lama belum di-closing.
5. **App tidak bisa dibuka tanpa sinyal** (tidak ada service worker) — data tersimpan di HP, tapi halaman app sendiri
   perlu internet untuk terbuka. Di lokasi proyek sinyal sering jelek.
6. **Setelah closing tidak ada slip per karyawan** yang bisa dikirim (mis. lewat WhatsApp) — rincian hari, lembur,
   bonus, potongan kasbon, net dibayar.

## Success Criteria
1. U1: `setupAllSheets()` aman dijalankan ulang (tidak error, tidak menghapus/menimpa data).
2. U2: data baru dari sync muncul sendiri di layar **tanpa** menghapus isian form, dialog, atau modal yang sedang terbuka.
3. U5: angka hari sama di semua tempat (setengah hari = 0,5) — **angka upah tidak berubah sama sekali**.
4. B1: baris dari FCC bertanda "dari FCC"; ✏️/🗑 diganti keterangan "ubah/hapus di FCC". Data biasa tetap seperti sekarang.
5. B2: Input Kasbon & Input Bayar menampilkan pengingat "sekarang dicatat di FCC"; simpan tetap bisa setelah konfirmasi.
6. B3: absensi 5 karyawan bisa selesai dengan ±3 ketukan (Salin hari kerja terakhir / Semua hadir → ubah yang beda → Simpan).
   Cek dobel (v1.3x) tetap jalan.
7. B4: Dashboard menampilkan pengingat kecil hanya bila perlu (absensi hari ini belum ada untuk proyek berjalan yang
   kemarin ada absensinya; upah belum dibayar tertua > 7 hari).
8. B5: app terbuka tanpa sinyal setelah sekali dibuka online; versi baru tetap masuk saat online (network-first).
9. B6: tombol "Bagikan slip" per karyawan di Detail Closing → teks rapi lewat menu bagikan HP (WA dll.); salin bila tak ada.
10. Semua uji: tampilan & angka layar lain tetap sama (uji teks 46 layar), 0 error.

## Scope
**Masuk:** `index.html` (U2, U5, B1–B4, B6), `sw.js` baru + daftar di `index.html` (B5), `backend/setup.gs` (U1 saja).
**Tidak masuk:** perubahan rumus biaya/laba/upah; struktur Google Sheet; FCC (tidak perlu diubah); backlog B1 lama
"Stok material sisa", print rekap tenaga, umur hutang toko, duplikat RAB (lihat Open Questions 5).

## Constraints
- Logika uang tidak disentuh. U5 hanya mengganti *cara menghitung angka hari* (`fHari`, sudah dipakai Rekap Proyek).
- Data kiriman FCC dikenali dari awalan ID (`BLI-FCC-`, `KSB-FCC-`, `PAY-FCC-`) — tanpa kolom baru di Sheet.
- U2: render ulang hanya bila data berubah, tidak ada modal/dialog terbuka, dan tidak ada kolom yang sedang diketik.
- B5: GitHub Pages, cache bernama versi; tidak menyimpan respons Apps Script (data tetap lewat localStorage seperti sekarang).
- File LF; uji Playwright dengan data contoh (tanpa Sheet asli); backup sebelum ubah; APP_VERSION + CHANGELOG tiap rilis.
- U1 = backend → Eddy paste `setup.gs` ke Apps Script (tidak perlu deploy versi baru karena bukan bagian web app).

## Execution Plan
**v1.45 — Pengaman & absensi cepat (±1 sesi)**: U5, U2, B1 (kunci data FCC), B2 (pengingat Input Kasbon/Bayar),
B3 (Salin hari kerja terakhir + Semua hadir), U1 (`setup.gs`).
**v1.46 — Lapangan (±1 sesi)**: B4 (pengingat Dashboard), B5 (bisa dibuka tanpa sinyal), B6 (slip closing → bagikan).
Tiap rilis: uji teks semua layar + uji alur baru, screenshot HP & PC, commit; push oleh Eddy.

## Open Questions — terjawab (5 Okt 2026)
1. Ya, Detail Closing juga 0,5 (seragam). 2. Data FCC dikunci penuh. 3. Pengingat + konfirmasi. 4. Salin status + proyek saja.
5. Berikutnya **print/export rekap tenaga per proyek** (backlog B2). Stok material sisa **diabaikan** (sisa material rata-rata sedikit).
6. Slip: nama perusahaan + no. closing + rincian per proyek, ringkas.

### Pertanyaan asli
1. **U5 Detail Closing**: hari setengah dihitung 0,5 juga di Detail Closing (dokumen bayar)? *Saran: ya, seragam.*
2. **B1**: data dari FCC dikunci penuh di app ini, atau masih boleh diubah dengan peringatan? *Saran: dikunci penuh.*
3. **B2**: Input Kasbon & Input Bayar cukup diberi pengingat, atau disembunyikan sama sekali?
   *Saran: pengingat + konfirmasi (kadang perlu koreksi manual).*
4. **B3**: "Salin hari kerja terakhir" menyalin status + proyek + jam lembur, atau status + proyek saja (lembur kosong)?
   *Saran: status + proyek saja; lembur jarang sama.*
5. **Backlog fitur** (dikerjakan sesudah ini, PRD sendiri): Stok material sisa (pindah sisa ke proyek lain) /
   print rekap tenaga / umur hutang toko / duplikat RAB — mana yang paling terasa? *Saran: stok material sisa dulu.*
6. **B6**: slip berisi nama perusahaan + no. closing + rincian per proyek? *Saran: ya, ringkas 10–15 baris.*
