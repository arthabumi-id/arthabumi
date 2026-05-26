# ARTHABUMI — TODO & Feature Backlog

Terakhir diupdate: 2026-05-22
Versi kode saat ini: v1.8.1

---

## 🔴 TODO #1 — Filter Nama Project di Log Pembelian & Log Absensi (Mobile)

**Permintaan:** Di halaman Log Pembelian dan Log Absensi pada tampilan HP,
tambahkan filter dropdown berdasarkan nama proyek.

**Detail teknis:**
- Filter berupa `<select>` dropdown, opsi diambil dari `state.projects`
- Default: "Semua Proyek"
- Saat dipilih, tabel/list di bawahnya hanya tampilkan baris yang
  `kodeProj` cocok dengan kode proyek yang dipilih
- Filter bersifat client-side (tidak perlu hit API ulang)
- Di mobile: letakkan filter di atas tabel, full-width
- Nama yang ditampilkan di dropdown: **Nama Proyek** (bukan kode)
  contoh: "Pak Wishnu - Atap Rumah" bukan "SPL-01"
- Tetap tampilkan kode proyek kecil di sebelah nama untuk identifikasi

**File yang perlu diubah:** `index.html`

**Fungsi JS yang terdampak:**
- `renderLogPembelian()` — tambah filter state + render ulang
- `renderLogAbsensi()` — tambah filter state + render ulang
- Tambah `filterPembelianProyek` dan `filterAbsensiProyek` ke app state

---

## 🔴 TODO #2 — Input Pembelian: Tampilkan Nama Project, Bukan Kode

**Permintaan:** Di form input pembelian, field "Proyek" saat ini menampilkan
kode proyek (SPL-01, BSI-02 dst). Ubah agar menampilkan nama proyek.

**Detail teknis:**
- Dropdown proyek di form input pembelian: tampilkan **Nama Proyek**
- Value yang disimpan tetap **Kode Proyek** (tidak berubah di GSheet)
- Format opsi dropdown: `"Nama Proyek (KODE)"` 
  contoh: `"Pak Wishnu - Atap Rumah (SPL-01)"`
- Saat submit form, yang dikirim ke API tetap `kodeProj` (value)
- Cek juga: form input absensi, form log subkon — kemungkinan sama

**File yang perlu diubah:** `index.html`

**Fungsi JS yang terdampak:**
- `renderFormPembelian()` atau fungsi yang build `<select>` proyek
- Pola: `<option value="SPL-01">Pak Wishnu - Atap Rumah (SPL-01)</option>`

---

## ⚪ TODO #3 — (Backlog) Pertimbangkan untuk session berikutnya

- Validasi form: field wajib tidak boleh kosong sebelum submit
- Konfirmasi hapus: dialog "Yakin hapus?" sebelum delete data
- Loading state per section (bukan loading global)
- Toast notification setelah berhasil simpan/hapus

---

## 📋 Cara Gunakan TODO ini di Session Claude Baru

```
Buka Claude baru
→ Upload SYSTEM.md (wajib)
→ Upload index.html
→ Upload TODO.md ini
→ Tulis: "Baca SYSTEM.md dan TODO.md, kerjakan TODO #1"
```

Claude akan langsung tahu konteks tanpa perlu dijelaskan ulang.
