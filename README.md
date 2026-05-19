# Arthabumi — Sistem Keuangan Proyek

Aplikasi manajemen keuangan untuk bisnis kontraktor Arthabumi.  
Dibangun sebagai **single HTML file**, berjalan di browser tanpa instalasi.

## 🔗 Links

- **App:** [GitHub Pages URL]
- **GSheet:** Akuntansi_Kontraktor_GSheets (Google Drive arthabumi.id@gmail.com)
- **Apps Script URL:** [isi setelah deploy]

## 📱 Fitur

| Modul | Fungsi |
|---|---|
| Dashboard | KPI + rekap per proyek, filter by status |
| Master Proyek | CRUD proyek, nilai kontrak |
| Pembelian | Input material per nota, log pembelian |
| Master Karyawan | Data karyawan, upah harian, sisa kasbon |
| Absensi Harian | Input absensi semua karyawan, tap status cepat |
| Kasbon | AMBIL / POTONG kasbon, rekap per karyawan |
| Closing Gaji | Generate rekap, finalize pembayaran gaji |
| Pembayaran Klien | Catat pembayaran masuk per proyek |

## 🔄 GSheet Sync

Data otomatis tersimpan ke Google Sheets:
- Input di app → langsung masuk GSheet
- Edit di GSheet → app refresh sesuai interval
- Offline → data tersimpan lokal, sync saat online

## 🤖 AI Development

Lihat `SYSTEM.md` untuk briefing AI assistant (Claude/ChatGPT).  
Lihat `TODO.md` untuk backlog fitur.

## 📁 File Structure

```
arthabumi/
├── index.html            ← Aplikasi utama (buka di browser)
├── arthabumi-webapi.gs   ← Copy ke Google Apps Script
├── SYSTEM.md             ← Briefing untuk AI assistant
├── CHANGELOG.md          ← Riwayat perubahan
├── TODO.md               ← Backlog fitur
└── README.md             ← File ini
```

## 🚀 Setup

1. **App:** Buka `index.html` di browser, atau akses via GitHub Pages URL
2. **GSheet:** Copy `arthabumi-webapi.gs` ke Apps Script → Deploy → Web App
3. **Hubungkan:** Buka app → ⚙️ → paste URL → Test → Simpan

---

*Arthabumi © 2026 — Eddy Santoso*
