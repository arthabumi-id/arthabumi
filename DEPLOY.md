# 🚀 DEPLOY.md — Panduan Deploy Arthabumi

Gunakan file ini setiap kali ada update dari Claude.

---

## 📦 File yang Perlu Di-deploy

| File | Deploy ke | Kapan perlu di-deploy |
|---|---|---|
| `index.html` | GitHub Pages | Ada perubahan UI/fitur/JS |
| `arthabumi-webapi.gs` | Google Apps Script | Ada perubahan GSheet/backend |

---

## STEP 1 — Upload ke GitHub

### Cara A: Edit langsung di browser (paling mudah)

1. Buka `https://github.com/[username]/arthabumi`
2. Klik nama file (`index.html` atau file lain)
3. Klik ikon **✏️ pensil** (kanan atas area kode)
4. **Ctrl+A** → hapus semua → paste kode baru dari Claude
5. Scroll ke bawah → klik **"Commit changes"**
6. Klik **"Commit changes"** sekali lagi (konfirmasi)
7. Tunggu ~1-2 menit → GitHub Pages otomatis update

### Cara B: Upload file (drag & drop)

1. Buka repo di GitHub
2. Klik **"Add file"** → **"Upload files"**
3. Drag file ke sana (boleh beberapa sekaligus)
4. Klik **"Commit changes"**

> ⚠️ Pastikan nama file sama persis: `index.html` bukan `index (1).html`

---

## STEP 2 — Update Apps Script (kalau `arthabumi-webapi.gs` berubah)

> ⚠️ **WAJIB buat New Version** — kalau tidak, GSheet masih pakai kode lama!

1. Buka Google Sheets → **Extensions → Apps Script**
2. Hapus semua kode yang ada → paste kode baru dari Claude
3. Klik 💾 **Save** (Ctrl+S)
4. Klik **Deploy** → **Manage deployments**
5. Klik ✏️ **Edit** (pensil di deployment yang aktif)
6. Di bagian **Version** → pilih **"New version"**
7. Klik **"Deploy"**
8. Copy URL baru (jika berubah) → paste ke app ⚙️ Settings

---

## STEP 3 — Test setelah Deploy

```
✅ Buka app di browser/HP
✅ Cek sync badge → harus ✅ (bukan ⚠️)
✅ Test fitur yang baru di-update
✅ Cek GSheet — data masuk dengan benar
✅ Cek tanggal di GSheet — tidak ada jam (dd/MM/yyyy saja)
```

---

## 🔄 Alur Kerja Update (Ringkasan)

```
1. Ceritakan bug/fitur ke Claude
   → Upload: SYSTEM.md (wajib) + file kode (kalau perlu)

2. Claude kasih file baru
   → Download index.html dan/atau arthabumi-webapi.gs

3. Deploy ke GitHub (Step 1)
   → Kalau webapi.gs berubah: deploy juga ke Apps Script (Step 2)

4. Test (Step 3)

5. Kasih tahu Claude kalau ada yang masih error
```

---

## 📋 Checklist per Update

Centang sebelum tutup conversation dengan Claude:

- [ ] File dari Claude sudah di-download
- [ ] `index.html` sudah di-upload ke GitHub (kalau ada perubahan)
- [ ] `arthabumi-webapi.gs` sudah di-update di Apps Script (kalau ada perubahan)
- [ ] Apps Script sudah di-deploy dengan **New Version**
- [ ] App sudah di-test di HP
- [ ] GSheet sudah di-cek (data masuk + format tanggal benar)
- [ ] `SYSTEM.md`, `CHANGELOG.md`, `TODO.md` sudah di-update di GitHub

---

## ❗ Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| App tidak update setelah upload GitHub | Tunggu 2 menit, hard refresh (Ctrl+Shift+R) |
| GSheet masih error setelah update | Pastikan deploy dengan **New version**, bukan versi lama |
| Sync badge ⚠️ merah | Cek URL di ⚙️ Settings, klik Test dulu |
| Tanggal ada jam di GSheet | Pastikan `arthabumi-webapi.gs` versi v1.6b sudah di-deploy |
| Data tidak masuk GSheet | Buka Apps Script → Executions → lihat error log |

---

*Update file ini kalau ada perubahan alur deploy.*
*Arthabumi © 2026 — Eddy Santoso*
