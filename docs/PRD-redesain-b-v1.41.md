# PRD — Redesain "Gaya B" App Kontraktor · v1.41–v1.44

Status: **DISETUJUI** (3 Okt 2026 — "setuju, ikuti semua saran")
Acuan: gaya B yang sudah live di FCC (v45–v47, `arthabumi-fcc/docs/PRD-redesain-b-v45.md`,
`public/css/app.css`). Mockup khusus app kontraktor dibuat di Fase 0 sebelum kode diubah.

## Problem
FCC sudah memakai gaya B (terang hangat, coral Arthabumi, huruf Plus Jakarta Sans + Fraunces,
tema gelap, tampilan PC). App kontraktor (v1.40) masih gaya lama, jadi dua aplikasi satu usaha
terasa seperti dari dua perusahaan berbeda:
- Header & menu bawah biru dongker gelap (#0f172a) dengan aksen hijau emerald; isi abu-abu kebiruan.
- Huruf bawaan HP; angka besar tidak menonjol.
- **±790 atribut `style="…"`** dengan warna ditulis langsung (mis. #94a3b8 ×91, #10b981 ×45,
  #dc2626 ×40) → mengganti warna = mengedit ratusan tempat; tidak ada tema gelap.
- Banyak emoji sebagai ikon (menu, tombol, judul, peringatan) → kesan kurang profesional.
- 14 titik hapus memakai `confirm()` bawaan browser (gaya beda, bisa diblokir di PWA) — utang U3.
- Di PC tampil seperti layar HP yang diperbesar.
- Ikon app di HP: kotak gelap tulisan "AB" hijau; manifest masih memakai ikon Google & warna #1e3a5f.
- Kartu Dashboard per proyek padat: 7 kotak angka berwarna-warni berbobot sama, sulit melihat
  "proyek mana yang perlu perhatian".

## Success Criteria
1. Semua layar app kontraktor memakai **palet & huruf yang sama dengan FCC** (token warna yang sama,
   Plus Jakarta Sans untuk teks, Fraunces untuk judul & angka besar), sudut & jarak konsisten.
2. **Tema terang B (bawaan) + tema gelap B** (tombol bulan di header), pilihan diingat per perangkat.
3. **Tidak ada warna tertulis langsung** di kode layar — semua lewat token (`var(--…)`).
4. Ikon menu & tombol diganti ikon garis yang seragam; emoji hanya tersisa di catatan/teks buatan Eddy.
5. Konfirmasi hapus memakai dialog di dalam app (menutup U3), teks tombol jelas ("Hapus", "Batal").
6. **Dashboard & kartu proyek** disusun ulang: angka utama (kontrak, biaya, est. laba, piutang) +
   satu kalimat status / tanda peringatan, rincian lain di bawah atau di Rekap.
7. **PC (≥ 1024 px):** menu samping menggantikan menu bawah, daftar proyek 2–3 kolom, modal tampil
   sebagai panel samping. Di HP bentuk & urutan menu tidak berubah.
8. **Tidak ada angka yang berubah** dan semua fungsi tetap jalan (input absensi, pembelian, kasbon,
   closing, bayar, RAB, subkon, sync, integrasi FCC). Kontras teks memenuhi WCAG AA (4,5:1).
9. Ikon app & manifest baru (logo Arthabumi, warna B) — perlu hapus & tambah ulang shortcut di HP sekali.

## Scope
**Masuk:** `index.html` saja — CSS, markup, dan bagian HTML di fungsi `pg…`/`open…` (string template):
splash, header, menu bawah + sheet "Lainnya" + Atur Menu, 13 halaman (Dashboard/Piutang/Hutang,
Proyek, Pembelian, Absensi, Kasbon, Closing, Karyawan, Bayar, RAB, Subkon, Catatan, Pengaturan),
±21 modal, toast, progress bar/skeleton, dialog konfirmasi baru, ikon app & manifest.
File huruf baru di `arthabumi/fonts/` (salinan dari FCC, lisensi SIL OFL).

**Tidak masuk:**
- Dokumen cetak & Excel (`printRekapProyek`, `printAllProyek`, `export…`) — gayanya sendiri, dipakai ke klien.
- Format Google Sheet (`setup.gs`) & seluruh backend `.gs` → **tidak perlu paste/deploy Apps Script**.
- Fungsi hitung, struktur data, nama/urutan menu, fitur baru (B1–B6 tetap di backlog).
- Pindah hosting ke Cloudflare (dikerjakan terpisah, kalau jadi).

## Constraints
- **Logika tidak diubah.** Fungsi hitung (`vSum`, `calcTotal`, `calcKasbonForProj`, dll.) tidak disentuh;
  kartu baru memakai angka yang sama, hanya tata letak. Dicek dengan membandingkan angka yang tampil
  sebelum & sesudah pada data contoh yang sama.
- File repo ini **LF**, satu `index.html` (±4.650 baris) — perubahan lewat skrip dengan hitungan
  kemunculan per pola (berhenti kalau jumlah tidak sesuai, seperti di FCC v45).
- Backup sebelum ubah (`backup-before-update.bat`) + `APP_VERSION` naik tiap rilis + CHANGELOG.
- Uji di browser dengan **server tiruan** (data contoh, tidak menyentuh Sheet asli): semua halaman &
  modal dibuka, screenshot HP 412 px dan PC 1280 px, terang & gelap, nol error konsol.
- Rilis = Eddy push lewat GitHub Desktop dari repo D: → hapus & tambah ulang shortcut PWA.
- Dikerjakan **bertahap**; tiap fase bisa dipakai normal, Eddy bisa berhenti/ubah arah di antara fase.

## Execution Plan
**Fase 0 — Mockup (tanpa kode app).** Satu halaman mockup: Dashboard (HP & PC), kartu proyek, form
Absensi, menu bawah, terang & gelap, dengan angka contoh. Eddy pilih/koreksi → baru Fase 1.

**Fase 1 — v1.41 Fondasi.** Token warna B (terang + gelap) & huruf self-host; gaya komponen dasar
(kartu, tombol, input, chip/badge, tab, header, menu bawah & sheet, modal, toast, splash, progress);
±790 warna langsung diganti token; dialog konfirmasi in-app menggantikan 14 `confirm()`; tombol tema;
ikon app & manifest. Semua halaman otomatis berganti gaya; tata letak belum berubah.

**Fase 2 — v1.42 Ikon & halaman input.** Emoji di menu/tombol/judul → ikon garis (SVG inline, tanpa
library dari internet); rapikan Pembelian, Absensi, Kasbon, Closing, Bayar (halaman yang paling sering
dipakai di lapangan) — jarak, ukuran sentuh ≥ 44 px, ringkasan di atas daftar.

**Fase 3 — v1.43 Dashboard & Proyek.** Kartu proyek baru (angka utama + status/peringatan + bar
realisasi RAB & progress), ringkasan atas (Kontrak/Biaya/Est. Laba/Diterima) gaya FCC, Piutang &
Hutang menyesuaikan.

**Fase 4 — v1.44 Tampilan PC.** Menu samping, Dashboard/daftar multi-kolom, modal jadi panel samping,
tabel lebar untuk Log Pembelian/Absensi.

Tiap fase: screenshot semua layar HP & PC (terang & gelap) untuk diperiksa Eddy, cek kontras otomatis
pasangan warna utama, lalu commit; push oleh Eddy.

## Open Questions — terjawab (3 Okt 2026)
1. Hanya Eddy. 2. Tema gelap ya (bawaan terang). 3. Urutan sesuai saran. 4. Tampilan PC perlu (Fase 4 tetap).
5. Header tetap "Arthabumi". 6. Utang U2 dkk. PRD terpisah — **ingatkan Eddy setelah redesain selesai**.

### Pertanyaan asli
1. **Siapa saja yang memakai app kontraktor?** Kalau mandor/tukang ikut input (mis. absensi) di HP
   mereka, perubahan tampilan perlu diberi tahu dan huruf/tombol dibuat lebih besar. Atau hanya Eddy?
2. **Tema gelap** ikut dibuat seperti FCC? Saran: ya, dan bawaan = terang (sama dengan FCC).
3. **Urutan fase:** saran di atas (fondasi → ikon & input → Dashboard → PC). Atau Dashboard lebih dulu?
4. **Tampilan PC** dibutuhkan? Kalau app kontraktor praktis hanya dibuka di HP, Fase 4 bisa dilewati.
5. **Nama di header**: tetap "Arthabumi" (dari `companyName`) + logo, sama seperti FCC?
6. Boleh sekalian **membereskan utang kecil yang kelihatan di layar** selama tidak mengubah angka —
   mis. U2 (tampilan ikut terbarui saat polling bila tidak ada form terbuka)? Saran: tidak, tetap PRD
   terpisah supaya redesain murni tampilan.
