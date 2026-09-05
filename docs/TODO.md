# ARTHABUMI — TODO & Feature Backlog

Terakhir diupdate: **2026-09-04**
Versi kode saat ini: **v1.36**
> ⚠️ Jangan percaya angka versi di dokumen mana pun. Sumber kebenaran = `APP_VERSION` di `index.html`.

---

## ✅ DEPLOY v1.36 — SELESAI 2026-09-05

- Frontend: commit `77f8055` sudah di-push, live di GitHub Pages.
- Backend: `write.gs`, `setup.gs`, `rekap.gs` sudah di-paste ke Apps Script "AKuntansi Kontraktor"
  dan di-deploy sebagai **Version 46** (5 Sep 2026, 13:45). Deployment ID & URL web app TIDAK berubah,
  jadi app tidak perlu setting ulang.
- `backfillNilaiFinal()` dijalankan → **24 proyek diisi, 3 punya kerja tambah/kurang**.
- `fixAllProjectFormulas()` dijalankan → **24 proyek diupdate**.
- Verifikasi MASTER PROJECT (cocok dengan hitungan manual):

  | Kode | Kontrak awal (F) | Nilai Final (R) | Laba (J) | Piutang (N) |
  |---|---|---|---|---|
  | SPL-01 | 165.000.000 | 225.000.000 | 85.680.063 | 0 |
  | PRJ-007 | 120.000.000 | 139.000.000 | 60.896.317 | 0 |
  | PRJ-008 | 1.000.000.000 | 1.010.000.000 | 942.837.882 | 700.000.000 |

- ⏳ **Sisa satu langkah manual Eddy:** buka app → tekan **📊 Update Rekap ke GSheet**
  supaya tab REKAP ikut terbarui (isinya masih potret 13 Agustus, 19 proyek — sekarang ada 24).

---

## ✅ SELESAI

- **v1.36** Nilai Final (kolom R) — sheet & app sudah satu angka. *(dulu 🟡 FOLLOW-UP terbesar)*
- **v1.36** Rekap Tenaga Kerja per proyek (hari, lembur, upah, sudah/belum bayar, rincian tanggal)
- **v1.36** Indikator proses: progress bar + kunci tombol + skeleton muat pertama
- **v1.36** Fix `_apiDeleteProject` (A..R), fix `fixAllProjectFormulas()` (`getLastRow`),
  formula `_apiAddProject` diselaraskan, `setupRekapSheet()` dipensiunkan
- **v1.35** Hint harga terendah di input pembelian
- **v1.34** Auto-isi harga dari Master Barang
- **v1.33** Detail Closing per proyek
- **v1.32** Edit absensi
- **v1.31** Bottom nav sheet + Atur Menu
- **v1.30** ID unik + idempotent di semua log; upload bukti bayar subkon
- **v1.29** Log Pembelian: toggle Per Tanggal / Per Toko
- **v1.20** Filter nama proyek di Log Pembelian & Absensi *(TODO #1 lama)*
- **v1.19** Dropdown proyek tampil "Nama (KODE)" *(TODO #2 lama)*
- **v1.15** Cleanup monolit `arthabumi-webapi.gs` — backend live = file terpisah, router `config.gs`

---

## 🟠 UTANG TEKNIS YANG DITEMUKAN, BELUM DIKERJAKAN

**U1 — `setup.gs` masih banyak memakai `ROWS.*.end` yang sudah dihapus di `constants.gs` v2.0.**
`fixAllProjectFormulas()` sudah diperbaiki di v1.36, tapi `_setupSheetMasterProject()` dan
teman-temannya (dipanggil `setupAllSheets()`) masih pakai `R.end` → kemungkinan besar **error
kalau dijalankan**. Selama sheet sudah terbentuk, `setupAllSheets()` tidak perlu dipanggil lagi,
jadi ini belum menggigit. Perlu dirapikan sebelum ada yang menjalankannya tanpa sadar.

**U2 — Polling 60 detik tidak me-render ulang halaman.**
Data di `S` diperbarui, tapi tampilan baru ikut setelah pindah halaman. Sengaja dibiarkan di v1.36
supaya form yang sedang diisi tidak terhapus. Perbaikan yang benar: render ulang hanya kalau tidak
ada modal terbuka dan tidak ada input yang sedang difokus.

**U3 — `confirm()` bawaan browser dipakai di 13 titik hapus.**
Berfungsi, tapi tampilannya di luar gaya app dan bisa diblokir di sebagian PWA.
Kandidat diganti modal in-app. Prioritas rendah.

**U6 — Struktur MASTER PROJECT berlubang — ⛔ EDDY MEMUTUSKAN TIDAK DIPERBAIKI (2026-09-05).**
Tata letak sebenarnya: baris 4–52 slot proyek, **baris 54–60 blok RINGKASAN TOTAL buatan tangan**
(`F55 =SUM(F4:F52)` dst), baris 61–78 proyek PRJ-010…PRJ-023.
Sebabnya `_apiFindNext()` memakai `getLastRow()`, yang membaca blok ringkasan sebagai baris terakhir —
jadi sejak PRJ-010 setiap proyek baru mendarat DI BAWAH blok itu.
Konsekuensi yang diterima Eddy:
- Blok RINGKASAN TOTAL & tab **DASHBOARD hanya menghitung 10 proyek** (1.344.026.200 dari 2.404.386.100).
  Selisih 1.060.359.900 tidak terhitung di dua tempat itu.
- Proyek baru berikutnya akan terus mendarat di baris 79 ke bawah.
- **Tidak berpengaruh ke app maupun tab REKAP** — keduanya membaca sampai `getLastRow()`, jadi 24 proyek
  tetap lengkap dan angkanya benar. Ini sebabnya keputusan "abaikan" masuk akal.
Kalau suatu saat mau dikerjakan: pindahkan baris 61–78 ke slot kosong 14–27, kosongkan 61–78,
nomori ulang kolom A, lalu ubah pencarian baris kosong khusus MASTER PROJECT (scan B4:B53) di `write.gs`.
Jangan ditawarkan lagi kecuali Eddy yang menyinggung.

**U5 — Cara hitung "hari kerja" belum seragam di seluruh app.**
Di modal **Rekap Proyek** (section Tenaga Kerja + Upah Belum Dibayar) sudah pakai
`Setengah Hari = 0,5` lewat `fHari()` sejak v1.36. Tapi **Dashboard Hutang Upah** (`pgHutang`,
sekitar baris 1076) dan **Detail Closing** (`buildClsRekap`/`openClosingDetail`, sekitar baris
2575 & 2578) masih menghitung `hari++` per baris absensi — jadi setengah hari terhitung 1 hari.
Angka upah tetap benar di semua tempat; yang beda hanya angka "hari".
Sengaja belum diubah di v1.36 karena Detail Closing menyangkut dokumen pembayaran yang sudah
biasa dibaca Eddy. Perlu keputusan: seragamkan ke 0,5 atau tetap "jumlah kehadiran".

**U4 — Kolom R basi kalau kolom Q diedit manual di sheet.**
R ditulis oleh app. Kalau seseorang mengubah JSON kolom Q langsung di Google Sheet, R tidak ikut
berubah sampai proyek itu disimpan lagi dari app. Kolom Q memang tidak untuk diedit manual —
kalau perlu, jalankan ulang `backfillNilaiFinal()`.

---

## 📋 BACKLOG FITUR (urut prioritas)

| # | Fitur | Prioritas | Catatan |
|---|---|---|---|
| B1 | **Stok Material SISA** | 🔴 Tinggi | Barang dibeli vs terpakai per proyek; butuh field "terpakai" atau opname |
| B2 | **Print / Export Rekap Tenaga per Proyek** | 🟡 Sedang | Section v1.36 sudah ada di layar; tinggal masuk ke `printRekapProyek` & `exportDetailProyek` |
| B3 | **Rekap Cash Flow Bulanan** | 🟡 Sedang | Uang masuk (pembayaran klien) vs keluar (material, upah, subkon) per bulan |
| B4 | **Hutang ke Toko — pelaporan** | 🟡 Sedang | Tandai lunas sudah ada sejak v1.28; yang kurang laporan umur hutang |
| B5 | **Duplikasi RAB** | 🟢 Rendah | Salin RAB proyek lama jadi titik mulai proyek baru |
| B6 | **Validasi inline (field merah)** | 🟢 Rendah | Validasi via toast sudah jalan di 49 titik; ini kosmetik |

---

## 📋 Cara Gunakan TODO ini di Session Claude Baru

```
Buka Claude baru (folder E:\Mirror\Claude Cowork\Apps Arthabumi sudah tersambung)
→ "Baca SYSTEM.md dan docs/TODO.md, kerjakan B1"
```

Wajib dibaca dulu: `SYSTEM.md` (arsitektur + skema kolom), `docs/TODO.md` (file ini).
Cek `APP_VERSION` di `index.html` sebelum percaya angka versi mana pun.
