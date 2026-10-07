# PRD — Pindah App Kontraktor ke Cloudflare Pages · v1.50

Status: **DISETUJUI** (7 Okt 2026 — "setuju ikut saran, hari H besok jam 11 pagi")

## Problem
- App di-host di GitHub Pages dari repo **publik** `arthabumi-id/arthabumi` → kode app + backend + seluruh riwayat commit bisa dibaca
  siapa saja (riwayat Mei 2026 bahkan memuat Gemini API key — sudah diminta dimatikan). Data aman karena token, tapi struktur app terbuka.
- GitHub Pages gratis **mewajibkan repo publik**. Cloudflare Pages gratis bisa dari repo **privat** (sama seperti FCC).
- Catatan: kecepatan **tidak** jadi alasan utama — lemot ada di Apps Script (sudah ditangani v1.48), bukan hosting.

## Success Criteria
1. App terbuka di alamat Cloudflare (mis. `https://arthabumi-kontraktor.pages.dev`), semua fitur & sync jalan seperti sekarang.
2. Repo `arthabumi-id/arthabumi` jadi **privat**; yang disajikan ke internet **hanya** file app (index.html, sw.js, fonts, icons) —
   bukan backend/, docs/, tests/, backups/.
3. Pindah perangkat cukup ±1 menit per HP/PC: **Salin pengaturan** di app lama → **Tempel pengaturan** di app baru
   (URL Apps Script, token, menu, tema, interval sync). Tidak ada data yang hilang (antrean kirim harus kosong dulu).
4. FCC tetap jalan tanpa diubah (FCC bicara langsung ke Apps Script, bukan ke alamat app).
5. Header keamanan seperti FCC (`_headers`): larang dibuka di iframe, no-referrer, index.html & sw.js tidak di-cache lama.

## Scope
**Masuk (v1.50, kode):** build Cloudflare yang menyalin file app saja ke folder `dist/` (repo tidak perlu dirombak, GitHub Pages
tetap jalan selama masa pindah) · `_headers` · Pengaturan → **Salin pengaturan** / **Tempel pengaturan** (lewat clipboard, tidak lewat URL) ·
pengingat di app lama (alamat github.io) "App sudah pindah ke … — salin pengaturan lalu buka alamat baru" · dokumen & uji.
**Langkah Eddy:** hubungkan repo di Cloudflare (±10 menit, dipandu) · pindahkan tiap perangkat (±1 menit/HP) · jadikan repo privat.
**Tidak masuk:** domain sendiri (bisa menyusul), Cloudflare Access/login tambahan, perubahan backend/Apps Script.

## Constraints
- **Token tidak boleh lewat URL** (riwayat browser/log). Salin–tempel lewat clipboard di perangkat yang sama.
- Data di HP tersimpan per alamat → di alamat baru data proyek diunduh ulang dari Sheet (otomatis). Isian yang belum terkirim
  (antrean) **harus kosong** sebelum pindah — tombol Salin pengaturan menolak kalau masih ada antrean.
- Saat repo dijadikan privat, alamat github.io **mati** (GitHub Pages gratis tidak melayani repo privat) → privat-kan **setelah**
  semua perangkat pindah.
- Rilis seperti biasa: APP_VERSION + CHANGELOG + `CACHE` sw.js, uji `tests/`, file LF.

## Execution Plan & Jadwal
| Kapan | Siapa | Langkah |
|---|---|---|
| **Hari 1** (setelah "setuju") | Claude | Kode v1.50 (build, `_headers`, Salin/Tempel pengaturan, pengingat pindah) + uji → commit; Eddy push. |
| **Hari 1** | Eddy (±10 mnt, dipandu Claude) | Cloudflare → Workers & Pages → Create → Pages → Connect to Git → repo `arthabumi` → build command & output dari Claude → Deploy → kirim alamatnya. Claude cek alamat baru & isi alamat itu di pengingat app lama. |
| **Hari H** (pilihan Eddy) | Eddy (±1 mnt/perangkat) | Tiap HP & PC: buka app lama → Pengaturan → **Salin pengaturan** → buka alamat baru → Pengaturan → **Tempel pengaturan** → pasang shortcut baru, hapus shortcut lama. |
| **H + 1–7 hari** | Eddy | Setelah yakin semua perangkat pakai alamat baru: GitHub → repo `arthabumi` → Settings → **Change visibility → Private**. |

## Open Questions — terjawab (7 Okt 2026)
Ikut semua saran: alamat arthabumi-kontraktor.pages.dev · akun Cloudflare sama dengan FCC · **Hari H = Kamis 8 Okt 2026 11.00** · repo privat H+3 = **Minggu 11 Okt 2026**.

### Pertanyaan asli
1. **Nama alamat**: `arthabumi-kontraktor.pages.dev`? *Saran: ya (sejajar dengan `arthabumi-fcc.pages.dev`).*
2. **Akun Cloudflare**: pakai akun yang sama dengan FCC? *Saran: ya.*
3. **Hari H** pindah perangkat: tanggal & jam berapa? (Saya masukkan ke Google Calendar dengan pengingat.)
   *Saran: pagi sebelum ke lapangan, saat HP ada sinyal.*
4. **Repo privat** H+3 setelah Hari H? *Saran: ya — cukup waktu untuk cek semua perangkat.*
