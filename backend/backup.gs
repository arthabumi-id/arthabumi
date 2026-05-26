// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — backup.gs  v1.0
// Backup & Restore semua data GSheet ↔ JSON di Google Drive
//
// CARA PAKAI:
//   Backup  → Jalankan backupToJSON()   dari Apps Script Editor
//   Restore → Jalankan restoreFromJSON() dari Apps Script Editor
//             (setelah isi FILE_ID_TO_RESTORE di atas fungsi)
//
// File backup disimpan di Google Drive root dengan nama:
//   arthabumi_backup_YYYYMMDD_HHMMSS.json
// ════════════════════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────────────────
// Isi ini kalau mau backup ke folder Drive tertentu (opsional)
// Biarkan "" untuk simpan di root Drive
var BACKUP_FOLDER_ID = "";

// ════════════════════════════════════════════════════════════════════════
// BACKUP — Export semua data ke JSON, simpan ke Google Drive
// ════════════════════════════════════════════════════════════════════════
function backupToJSON() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var sstz = ss.getSpreadsheetTimeZone();

  Logger.log("🔄 Mulai backup Arthabumi...");

  // Kumpulkan semua data
  var payload = {
    meta: {
      version:    "1.0",
      app:        "Arthabumi",
      owner:      "Eddy Santoso",
      createdAt:  Utilities.formatDate(now, sstz, "yyyy-MM-dd HH:mm:ss"),
      timezone:   sstz,
      spreadsheet: ss.getName()
    },
    data: {
      projects:      _apiReadProjects(ss),
      pembelian:     _apiReadPembelian(ss),
      karyawan:      _apiReadKaryawan(ss),
      logAbsensi:    _apiReadLogAbsensi(ss),
      logKasbon:     _apiReadLogKasbon(ss),
      logPembayaran: _apiReadLogPembayaran(ss),
      barang:        _apiReadBarang(ss),
      toko:          _apiReadToko(ss),
      rab:           _apiReadRAB(ss),
      subkon:        _apiReadSubkon(ss),
      logSubkon:     _apiReadLogSubkon(ss)
    }
  };

  // Hitung ringkasan
  var summary = {};
  Object.keys(payload.data).forEach(function(k) {
    var v = payload.data[k];
    summary[k] = Array.isArray(v) ? v.length : 0;
  });
  payload.meta.summary = summary;

  // Serialisasi ke JSON
  var json     = JSON.stringify(payload, null, 2);
  var filename = "arthabumi_backup_" +
    Utilities.formatDate(now, sstz, "yyyyMMdd_HHmmss") + ".json";

  // Simpan ke Google Drive
  var folder = BACKUP_FOLDER_ID
    ? DriveApp.getFolderById(BACKUP_FOLDER_ID)
    : DriveApp.getRootFolder();

  var file = folder.createFile(filename, json, MimeType.PLAIN_TEXT);

  // Log ringkasan
  Logger.log("════════════════════════════════════════");
  Logger.log("✅ BACKUP SELESAI: " + filename);
  Logger.log("   File ID: " + file.getId());
  Logger.log("   URL: " + file.getUrl());
  Logger.log("   Ukuran: " + (json.length / 1024).toFixed(1) + " KB");
  Logger.log("────────────────────────────────────────");
  Logger.log("📊 Ringkasan data:");
  Object.keys(summary).forEach(function(k) {
    Logger.log("   " + k + ": " + summary[k] + " records");
  });
  Logger.log("════════════════════════════════════════");
  Logger.log("💡 Simpan File ID ini untuk restore: " + file.getId());

  // Tampilkan toast di Sheets
  SpreadsheetApp.getActiveSpreadsheet()
    .toast("Backup berhasil! " + filename, "✅ Arthabumi Backup", 8);

  return file.getId();
}

// ════════════════════════════════════════════════════════════════════════
// RESTORE — Import data dari file JSON backup ke GSheet
//
// ⚠️  PERHATIAN: Restore akan MENIMPA data yang ada di GSheet!
//    - Baris baru ditambahkan di bawah data yang ada
//    - Tidak ada duplikasi check otomatis
//    - DISARANKAN: Buat backup dulu sebelum restore
//
// CARA PAKAI:
// 1. Cari File ID dari log backup sebelumnya
// 2. Isi FILE_ID di bawah
// 3. Jalankan restoreFromJSON()
// ════════════════════════════════════════════════════════════════════════
var RESTORE_FILE_ID = ""; // ← ISI FILE ID DARI BACKUP

function restoreFromJSON() {
  if (!RESTORE_FILE_ID) {
    Logger.log("❌ RESTORE_FILE_ID kosong! Isi dulu File ID dari backup.");
    SpreadsheetApp.getActiveSpreadsheet()
      .toast("Isi RESTORE_FILE_ID dulu di backup.gs!", "❌ Error", 5);
    return;
  }

  Logger.log("🔄 Memulai restore dari file: " + RESTORE_FILE_ID);

  // Baca file dari Drive
  var file;
  try {
    file = DriveApp.getFileById(RESTORE_FILE_ID);
  } catch(e) {
    Logger.log("❌ File tidak ditemukan: " + e.message);
    return;
  }

  var json;
  try {
    json = JSON.parse(file.getBlob().getDataAsString());
  } catch(e) {
    Logger.log("❌ File bukan JSON valid: " + e.message);
    return;
  }

  if (!json.data || !json.meta) {
    Logger.log("❌ Format backup tidak dikenal.");
    return;
  }

  Logger.log("📦 File backup: " + json.meta.createdAt);
  Logger.log("   App: " + json.meta.app + " v" + json.meta.version);

  // Konfirmasi restore (akan overwrite!)
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert(
    "⚠️  Konfirmasi Restore",
    "Ini akan MENAMBAHKAN data dari backup " + json.meta.createdAt +
    " ke GSheet yang ada.\n\n" +
    "Data backup:\n" +
    "• " + (json.data.projects      || []).length + " proyek\n" +
    "• " + (json.data.karyawan      || []).length + " karyawan\n" +
    "• " + (json.data.pembelian     || []).length + " pembelian\n" +
    "• " + (json.data.logAbsensi    || []).length + " absensi\n" +
    "• " + (json.data.logPembayaran || []).length + " pembayaran\n\n" +
    "Lanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) {
    Logger.log("ℹ️  Restore dibatalkan oleh user.");
    return;
  }

  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var ok  = 0;
  var err = 0;

  // Restore Projects
  try {
    var projects = json.data.projects || [];
    projects.forEach(function(d) {
      try { _apiAddProject(ss, d); ok++; }
      catch(e) { Logger.log("⚠️  Skip project " + d.kode + ": " + e.message); err++; }
    });
    Logger.log("✅ Projects: " + ok + " restored");
  } catch(e) { Logger.log("❌ Projects error: " + e.message); err++; }

  // Restore Karyawan
  var krOk = 0;
  try {
    var karyawan = json.data.karyawan || [];
    karyawan.forEach(function(d) {
      try { _apiAddKaryawan(ss, d); krOk++; }
      catch(e) { Logger.log("⚠️  Skip karyawan " + d.id + ": " + e.message); err++; }
    });
    Logger.log("✅ Karyawan: " + krOk + " restored");
  } catch(e) { Logger.log("❌ Karyawan error: " + e.message); err++; }

  // Restore Pembelian (batch)
  var beliOk = 0;
  try {
    var pembelian = json.data.pembelian || [];
    if (pembelian.length > 0) {
      _apiAddPembelian(ss, pembelian);
      beliOk = pembelian.length;
    }
    Logger.log("✅ Pembelian: " + beliOk + " restored");
  } catch(e) { Logger.log("❌ Pembelian error: " + e.message); err++; }

  // Restore Absensi (batch)
  var absOk = 0;
  try {
    var absensi = json.data.logAbsensi || [];
    if (absensi.length > 0) {
      _apiAddAbsensi(ss, absensi);
      absOk = absensi.length;
    }
    Logger.log("✅ Absensi: " + absOk + " restored");
  } catch(e) { Logger.log("❌ Absensi error: " + e.message); err++; }

  // Restore Kasbon (batch)
  var ksbOk = 0;
  try {
    var kasbon = json.data.logKasbon || [];
    if (kasbon.length > 0) {
      _apiAddKasbon(ss, kasbon);
      ksbOk = kasbon.length;
    }
    Logger.log("✅ Kasbon: " + ksbOk + " restored");
  } catch(e) { Logger.log("❌ Kasbon error: " + e.message); err++; }

  // Restore Pembayaran (batch)
  var bayOk = 0;
  try {
    var pembayaran = json.data.logPembayaran || [];
    if (pembayaran.length > 0) {
      _apiAddPembayaran(ss, pembayaran);
      bayOk = pembayaran.length;
    }
    Logger.log("✅ Pembayaran: " + bayOk + " restored");
  } catch(e) { Logger.log("❌ Pembayaran error: " + e.message); err++; }

  // Restore Subkon
  var skOk = 0;
  try {
    var subkon = json.data.subkon || [];
    subkon.forEach(function(d) {
      try { _apiAddSubkon(ss, d); skOk++; }
      catch(e) { Logger.log("⚠️  Skip subkon " + d.id + ": " + e.message); err++; }
    });
    Logger.log("✅ Subkon: " + skOk + " restored");
  } catch(e) { Logger.log("❌ Subkon error: " + e.message); err++; }

  // Restore Log Subkon
  var lskOk = 0;
  try {
    var logSubkon = json.data.logSubkon || [];
    logSubkon.forEach(function(d) {
      try { _apiAddLogSubkon(ss, d); lskOk++; }
      catch(e) { Logger.log("⚠️  Skip logSubkon: " + e.message); err++; }
    });
    Logger.log("✅ Log Subkon: " + lskOk + " restored");
  } catch(e) { Logger.log("❌ Log Subkon error: " + e.message); err++; }

  // Restore RAB
  var rabOk = 0;
  try {
    var rab = json.data.rab || [];
    rab.forEach(function(d) {
      try { _apiSaveRAB(ss, d); rabOk++; }
      catch(e) { Logger.log("⚠️  Skip RAB " + d.kodeProj + ": " + e.message); err++; }
    });
    Logger.log("✅ RAB: " + rabOk + " restored");
  } catch(e) { Logger.log("❌ RAB error: " + e.message); err++; }

  SpreadsheetApp.flush();

  Logger.log("════════════════════════════════════════");
  if (err === 0) {
    Logger.log("✅ RESTORE SELESAI — semua data berhasil");
    SpreadsheetApp.getActiveSpreadsheet()
      .toast("Restore selesai! Semua data berhasil.", "✅ Restore OK", 8);
  } else {
    Logger.log("⚠️  RESTORE SELESAI dengan " + err + " error — cek log di atas");
    SpreadsheetApp.getActiveSpreadsheet()
      .toast("Restore selesai dengan " + err + " warning. Cek log.", "⚠️  Restore", 8);
  }
  Logger.log("════════════════════════════════════════");
}

// ════════════════════════════════════════════════════════════════════════
// LIST BACKUP — Tampilkan semua file backup di Drive
// ════════════════════════════════════════════════════════════════════════
function listBackups() {
  var folder = BACKUP_FOLDER_ID
    ? DriveApp.getFolderById(BACKUP_FOLDER_ID)
    : DriveApp.getRootFolder();

  var files = folder.getFilesByType(MimeType.PLAIN_TEXT);
  var found = [];

  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().startsWith("arthabumi_backup_")) {
      found.push({
        name: f.getName(),
        id:   f.getId(),
        size: (f.getSize() / 1024).toFixed(1) + " KB",
        date: f.getLastUpdated()
      });
    }
  }

  // Sort terbaru dulu
  found.sort(function(a, b) { return b.date - a.date; });

  Logger.log("════════════════════════════════════════");
  Logger.log("📦 DAFTAR BACKUP ARTHABUMI");
  Logger.log("════════════════════════════════════════");
  if (found.length === 0) {
    Logger.log("   Belum ada file backup.");
  } else {
    found.forEach(function(f, i) {
      Logger.log((i+1) + ". " + f.name);
      Logger.log("   File ID: " + f.id);
      Logger.log("   Ukuran:  " + f.size);
    });
  }
  Logger.log("════════════════════════════════════════");
  Logger.log("💡 Copy File ID ke RESTORE_FILE_ID untuk restore.");
}

// ════════════════════════════════════════════════════════════════════════
// AUTO BACKUP — Bisa dipasang sebagai trigger harian otomatis
// Cara: Apps Script → Triggers → + Add Trigger
//       Function: autoBackup
//       Event: Time-driven → Day timer → pilih jam
// ════════════════════════════════════════════════════════════════════════
function autoBackup() {
  try {
    var fileId = backupToJSON();
    Logger.log("✅ Auto backup selesai. File ID: " + fileId);

    // Hapus backup lama (simpan 7 hari terakhir saja)
    _cleanOldBackups(7);
  } catch(e) {
    Logger.log("❌ Auto backup gagal: " + e.message);
  }
}

// Hapus backup yang lebih tua dari maxDays hari
function _cleanOldBackups(maxDays) {
  var folder = BACKUP_FOLDER_ID
    ? DriveApp.getFolderById(BACKUP_FOLDER_ID)
    : DriveApp.getRootFolder();

  var files   = folder.getFilesByType(MimeType.PLAIN_TEXT);
  var cutoff  = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  var deleted = 0;

  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().startsWith("arthabumi_backup_") && f.getLastUpdated() < cutoff) {
      f.setTrashed(true);
      deleted++;
    }
  }

  if (deleted > 0) Logger.log("🗑️  " + deleted + " backup lama dihapus (> " + maxDays + " hari).");
}
