// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — setup.gs  v1.8
// Setup & format semua sheet Google Sheets
// Diekstrak dari config.gs
//
// ✅ AMAN dijalankan kapan saja — hanya ubah format/warna/lebar kolom
// ✅ DATA TIDAK TERHAPUS
// ════════════════════════════════════════════════════════════════════════

// ── Jalankan ini untuk format SEMUA sheet sekaligus ───────────────────
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("🎨 Mulai setup format semua sheet Arthabumi...");
  Logger.log("✅ DATA AMAN — hanya format (warna/font/lebar kolom) yang diubah");

  ss.setSpreadsheetTimeZone(TZ);

  _setupSheetMasterProject(ss);
  _setupSheetPembelian(ss);
  _setupSheetMasterKaryawan(ss);
  _setupSheetLogAbsensi(ss);
  _setupSheetLogKasbon(ss);
  _setupSheetLogPembayaran(ss);
  _setupSheetMasterBarang(ss);
  _setupSheetMasterToko(ss);
  _setupSheetRAB(ss);
  _setupSheetMasterSubkon(ss);
  _setupSheetLogSubkon(ss);
  setupRekapSheet();  // v1.13: sheet REKAP dengan formula otomatis

  SpreadsheetApp.flush();
  Logger.log("════════════════════════════════════════");
  Logger.log("✅ SELESAI! Semua 12 sheet sudah diformat (v1.13).");
  Logger.log("   Timezone: " + TZ);
  Logger.log("   Langkah berikutnya:");
  Logger.log("   → Jalankan fixAllProjectFormulas() untuk perbaiki formula MASTER PROJECT");
}

// ── Jalankan ini untuk setup 3 sheet baru saja (RAB, SUBKON, LOG SUBKON)
function setupNewSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  _setupSheetRAB(ss);
  _setupSheetMasterSubkon(ss);
  _setupSheetLogSubkon(ss);
  SpreadsheetApp.flush();
  Logger.log("✅ 3 sheet baru sudah dibuat (RAB, MASTER SUBKON, LOG SUBKON).");
}

// ── Set timezone & locale Indonesia ──────────────────────────────────
// Jalankan SEKALI dari Apps Script Editor untuk set timezone & locale
function setIndonesiaLocale() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  Logger.log("✅ Timezone diset ke " + TZ + " (WIB)");
  Logger.log("   Format angka Indonesia: 1.500.000");
  Logger.log("   Format persen Indonesia: 15,5%");
  Logger.log("   Format tanggal: dd/MM/yyyy");
  Logger.log("ℹ️  Catatan: Jalankan setupAllSheets() untuk menerapkan style ke semua sheet.");
}

// ════════════════════════════════════════════════════════════════════════
// HELPER STYLE — dipakai semua fungsi setup di bawah
// ════════════════════════════════════════════════════════════════════════

function _getOrCreateSheet(ss, name) {
  var ws = ss.getSheetByName(name);
  if (!ws) ws = ss.insertSheet(name);
  // ⚠️ JANGAN clearContents — data TIDAK dihapus, hanya format yang direset
  ws.clearFormats();
  ws.clearConditionalFormatRules();
  return ws;
}

function _formatTitle(ws, title, subtitle, lastCol) {
  ws.getRange(1, 1, 1, lastCol).merge()
    .setValue(title)
    .setBackground("#0f172a").setFontColor("#10b981")
    .setFontWeight("bold").setFontSize(12).setFontFamily("Arial")
    .setVerticalAlignment("middle").setHorizontalAlignment("left");
  ws.setRowHeight(1, 36);

  ws.getRange(2, 1, 1, lastCol).merge()
    .setValue(subtitle)
    .setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(9).setFontFamily("Arial")
    .setVerticalAlignment("middle").setHorizontalAlignment("left");
  ws.setRowHeight(2, 22);
}

function _formatHeaders(ws, headers) {
  var lastCol = headers.length;
  ws.getRange(3, 1, 1, lastCol)
    .setValues([headers])
    .setBackground("#334155").setFontColor("#f1f5f9")
    .setFontWeight("bold").setFontSize(10).setFontFamily("Arial")
    .setVerticalAlignment("middle").setHorizontalAlignment("center")
    .setBorder(true, true, true, true, true, true, "#475569", SpreadsheetApp.BorderStyle.SOLID);
  ws.setRowHeight(3, 30);
  ws.setFrozenRows(3);
}

function _formatDataArea(ws, startRow, endRow, lastCol) {
  // v1.45 (U1): ROWS.*.end sudah dihapus di constants v2.0 → baris akhir dihitung dari isi sheet.
  // Warna selang-seling ditulis sekali (setBackgrounds) supaya sheet besar tidak kehabisan waktu.
  if (!(endRow >= startRow)) endRow = Math.max(ws.getLastRow(), startRow);
  var n = endRow - startRow + 1;
  var dataRange = ws.getRange(startRow, 1, n, lastCol);
  dataRange
    .setFontColor("#1e293b")
    .setFontSize(10).setFontFamily("Arial")
    .setVerticalAlignment("middle")
    .setBorder(false, true, false, true, false, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
  var bg = [];
  for (var r = 0; r < n; r++) {
    var c = (r % 2 === 0) ? "#f8fafc" : "#ffffff", row = [];
    for (var k = 0; k < lastCol; k++) row.push(c);
    bg.push(row);
  }
  dataRange.setBackgrounds(bg);
  ws.getRange(endRow, 1, 1, lastCol)
    .setBorder(false, false, true, false, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function _addStatusCF(ws, range, rulesMap) {
  var rules = ws.getConditionalFormatRules();
  Object.keys(rulesMap).forEach(function (text) {
    var colors = rulesMap[text];
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(text)
      .setBackground(colors.bg).setFontColor(colors.fg)
      .setRanges([range]).build());
  });
  ws.setConditionalFormatRules(rules);
}

// ════════════════════════════════════════════════════════════════════════
// SETUP PER SHEET
// ════════════════════════════════════════════════════════════════════════

function _setupSheetMasterProject(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.PROJECT);
  var lastCol = 16; // v1.13: tambah O=Catatan, P=Progress
  _formatTitle(ws,
    "  🏗️  MASTER PROJECT",
    "  Daftar semua proyek — max 50 proyek (baris 4–53)  |  Kolom G-K, M-N otomatis dari formula", lastCol);
  _formatHeaders(ws, [
    "No","Kode Proyek","Nama Proyek","Jenis","Status","Nilai Kontrak (Rp)",
    "Biaya Material (Rp)","Biaya Upah (Rp)","Total Biaya (Rp)","Est. Laba (Rp)","Margin %",
    "Tgl Mulai","Pembayaran (Rp)","Piutang (Rp)","Catatan","Progress (%)"
  ]);
  // v1.45 (U1): area data MASTER PROJECT TIDAK diformat ulang — ada blok RINGKASAN TOTAL buatan tangan
  // di baris 54–60 dan proyek sesudahnya (lihat docs/TODO.md U6). Judul & header tetap diformat.

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 110); ws.setColumnWidth(3, 220);
  ws.setColumnWidth(4, 120); ws.setColumnWidth(5, 100); ws.setColumnWidth(6, 150);
  ws.setColumnWidth(7, 155); ws.setColumnWidth(8, 145); ws.setColumnWidth(9, 155);
  ws.setColumnWidth(10,145); ws.setColumnWidth(11, 90); ws.setColumnWidth(12,110);
  ws.setColumnWidth(13,150); ws.setColumnWidth(14,140); ws.setColumnWidth(15,220);
  ws.setColumnWidth(16, 90);

  ws.getRange("F4:F53").setNumberFormat("#,##0");
  ws.getRange("G4:I53").setNumberFormat("#,##0");
  ws.getRange("J4:J53").setNumberFormat('#,##0;[Red](#,##0);"-"');
  ws.getRange("K4:K53").setNumberFormat("0.0%").setHorizontalAlignment("center");
  ws.getRange("L4:L53").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("M4:N53").setNumberFormat("#,##0");
  ws.getRange("P4:P53").setNumberFormat("#,##0").setHorizontalAlignment("center"); // Progress 0-100
  ws.getRange("A4:B53").setHorizontalAlignment("center");
  ws.getRange("D4:E53").setHorizontalAlignment("center");

  // Highlight kolom formula dengan background beda (read-only visual cue)
  ws.getRange("G3:N3").setBackground("#1e3a5f"); // header formula area lebih gelap
  ws.getRange("G4:N53").setBackground("#f0f7ff"); // data formula area biru muda

  _addStatusCF(ws, ws.getRange("E4:E53"), {
    "Berjalan": {bg:"#dbeafe", fg:"#1d4ed8"},
    "Selesai":  {bg:"#dcfce7", fg:"#15803d"},
    "Hold":     {bg:"#fef9c3", fg:"#854d0e"},
    "Batal":    {bg:"#fee2e2", fg:"#b91c1c"}
  });
  Logger.log("  ✓ MASTER PROJECT (v1.13 — 16 kolom A-P)");
}

function _setupSheetPembelian(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.PEMBELIAN);
  var lastCol = 12;
  _formatTitle(ws,
    "  🛒  PEMBELIAN MATERIAL",
    "  Log semua pembelian bahan per proyek — max 300 baris (baris 4–303)", lastCol);
  _formatHeaders(ws, ["No","Tanggal","Kode Proyek","Nama Barang","Kategori","Satuan",
    "Qty","Harga Satuan (Rp)","Diskon (Rp)","Status","Toko / Supplier","Total (Rp)"]);
  _formatDataArea(ws, ROWS.PEMBELIAN.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 110);
  ws.setColumnWidth(4, 200); ws.setColumnWidth(5, 110); ws.setColumnWidth(6, 80);
  ws.setColumnWidth(7, 60);  ws.setColumnWidth(8, 150); ws.setColumnWidth(9, 120);
  ws.setColumnWidth(10,100); ws.setColumnWidth(11,160); ws.setColumnWidth(12,140);

  ws.getRange("B4:B303").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("H4:H303").setNumberFormat("#,##0");
  ws.getRange("I4:I303").setNumberFormat("#,##0").setFontColor("#16a34a"); // Diskon nominal Rp (v1.6+)
  ws.getRange("L4:L303").setNumberFormat("#,##0").setFontWeight("bold");
  ws.getRange("A4:C303").setHorizontalAlignment("center");
  ws.getRange("F4:G303").setHorizontalAlignment("center");

  _addStatusCF(ws, ws.getRange("J4:J303"), {
    "HABIS": {bg:"#dcfce7", fg:"#15803d"},
    "ASET":  {bg:"#dbeafe", fg:"#1d4ed8"},
    "SISA":  {bg:"#fef9c3", fg:"#854d0e"}
  });
  Logger.log("  ✓ PEMBELIAN");
}

function _setupSheetMasterKaryawan(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.KARYAWAN);
  var lastCol = 12;
  _formatTitle(ws,
    "  👷  MASTER KARYAWAN",
    "  Daftar karyawan & ringkasan upah/kasbon otomatis — max 50 orang", lastCol);
  _formatHeaders(ws, ["No","ID Karyawan","Nama","Jabatan","Upah Harian (Rp)","No HP",
    "Total Hari","Total Upah (Rp)","Kas Diambil (Rp)","Kas Dipotong (Rp)","Sisa Kasbon (Rp)","Catatan"]);
  _formatDataArea(ws, ROWS.KARYAWAN.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 180);
  ws.setColumnWidth(4, 120); ws.setColumnWidth(5, 150); ws.setColumnWidth(6, 130);
  ws.setColumnWidth(7, 90);  ws.setColumnWidth(8, 150); ws.setColumnWidth(9, 150);
  ws.setColumnWidth(10,150); ws.setColumnWidth(11,150); ws.setColumnWidth(12,200);

  ws.getRange("E4:E53").setNumberFormat("#,##0");
  ws.getRange("H4:H53").setNumberFormat("#,##0").setFontColor("#16a34a");
  ws.getRange("I4:I53").setNumberFormat("#,##0").setFontColor("#c2410c");
  ws.getRange("J4:J53").setNumberFormat("#,##0").setFontColor("#7c3aed");
  ws.getRange("K4:K53").setNumberFormat('#,##0;[Red](#,##0);"-"').setFontWeight("bold");
  ws.getRange("G4:G53").setNumberFormat("#,##0.0").setHorizontalAlignment("center");
  ws.getRange("A4:B53").setHorizontalAlignment("center");
  ws.getRange("D4:D53").setHorizontalAlignment("center");
  ws.getRange("F4:F53").setHorizontalAlignment("center");
  Logger.log("  ✓ MASTER KARYAWAN");
}

function _setupSheetLogAbsensi(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.ABSENSI);
  var lastCol = 14; // v1.12: tambah M=Jam Lembur, N=Upah Lembur
  _formatTitle(ws,
    "  📋  LOG ABSENSI HARIAN",
    "  Rekap absensi harian karyawan — max 1000 baris (baris 4–1003)  |  M-N = data lembur (v1.12)", lastCol);
  _formatHeaders(ws, [
    "No","Tanggal","ID Karyawan","Nama","Status Hadir","Kode Proyek",
    "Nama Proyek","Upah Hari Ini (Rp)","Status Bayar","No Closing",
    "Tgl Bayar","Keterangan","Jam Lembur","Upah Lembur (Rp)"
  ]);
  _formatDataArea(ws, ROWS.ABSENSI.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 110);
  ws.setColumnWidth(4, 180); ws.setColumnWidth(5, 110); ws.setColumnWidth(6, 110);
  ws.setColumnWidth(7, 200); ws.setColumnWidth(8, 150); ws.setColumnWidth(9, 120);
  ws.setColumnWidth(10,120); ws.setColumnWidth(11,100); ws.setColumnWidth(12,200);
  ws.setColumnWidth(13, 90); ws.setColumnWidth(14,140);

  ws.getRange("B4:B1003").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("H4:H1003").setNumberFormat("#,##0").setFontWeight("bold").setFontColor("#16a34a");
  ws.getRange("K4:K1003").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("M4:M1003").setNumberFormat("0.0").setHorizontalAlignment("center").setFontColor("#7c3aed");
  ws.getRange("N4:N1003").setNumberFormat("#,##0").setFontColor("#7c3aed");
  ws.getRange("A4:C1003").setHorizontalAlignment("center");
  ws.getRange("E4:F1003").setHorizontalAlignment("center");
  ws.getRange("J4:J1003").setHorizontalAlignment("center");

  _addStatusCF(ws, ws.getRange("E4:E1003"), {
    "Hadir":         {bg:"#dcfce7", fg:"#15803d"},
    "Setengah Hari": {bg:"#fef9c3", fg:"#854d0e"},
    "Tidak Hadir":   {bg:"#fee2e2", fg:"#b91c1c"},
    "Libur":         {bg:"#f1f5f9", fg:"#475569"}
  });
  _addStatusCF(ws, ws.getRange("I4:I1003"), {
    "Sudah Dibayar": {bg:"#dcfce7", fg:"#15803d"},
    "Belum Dibayar": {bg:"#fee2e2", fg:"#b91c1c"}
  });
  Logger.log("  ✓ LOG ABSENSI (v1.12 — 14 kolom A-N)");
}

function _setupSheetLogKasbon(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.KASBON);
  var lastCol = 9; // v1.13: tambah I=Kode Proyek
  _formatTitle(ws,
    "  💸  LOG KASBON",
    "  Riwayat kasbon & potongan karyawan — max 1000 baris (baris 4–1003)  |  I = kode proyek untuk AMBIL & BONUS (v1.13)", lastCol);
  _formatHeaders(ws, [
    "No","Tanggal","ID Karyawan","Tipe","Nominal (Rp)","Nama","No Closing","Keterangan","Kode Proyek"
  ]);
  _formatDataArea(ws, ROWS.KASBON.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 110);
  ws.setColumnWidth(4, 90);  ws.setColumnWidth(5, 150); ws.setColumnWidth(6, 180);
  ws.setColumnWidth(7, 140); ws.setColumnWidth(8, 250); ws.setColumnWidth(9, 110);

  ws.getRange("B4:B1003").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("E4:E1003").setNumberFormat("#,##0").setFontWeight("bold");
  ws.getRange("A4:D1003").setHorizontalAlignment("center");
  ws.getRange("G4:G1003").setHorizontalAlignment("center");
  ws.getRange("I4:I1003").setHorizontalAlignment("center").setFontColor("#1d4ed8");

  _addStatusCF(ws, ws.getRange("D4:D1003"), {
    "AMBIL":  {bg:"#fed7aa", fg:"#c2410c"},
    "POTONG": {bg:"#ede9fe", fg:"#7c3aed"},
    "BONUS":  {bg:"#fef9c3", fg:"#854d0e"}
  });
  Logger.log("  ✓ LOG KASBON (v1.13 — 9 kolom A-I)");
}

function _setupSheetLogPembayaran(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.PEMBAYARAN);
  var lastCol = 9;
  _formatTitle(ws,
    "  💰  LOG PEMBAYARAN KLIEN",
    "  Riwayat penerimaan pembayaran dari klien — max 500 baris (baris 4–503)", lastCol);
  _formatHeaders(ws, ["No","Tanggal","Kode Proyek","Nama Proyek","Nominal (Rp)",
    "Metode","Bank / Akun","Keterangan","Referensi / No Bukti"]);
  _formatDataArea(ws, ROWS.PEMBAYARAN.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 110);
  ws.setColumnWidth(4, 200); ws.setColumnWidth(5, 160); ws.setColumnWidth(6, 100);
  ws.setColumnWidth(7, 130); ws.setColumnWidth(8, 220); ws.setColumnWidth(9, 180);

  ws.getRange("B4:B503").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("E4:E503").setNumberFormat("#,##0").setFontWeight("bold").setFontColor("#2563eb");
  ws.getRange("A4:C503").setHorizontalAlignment("center");
  ws.getRange("F4:F503").setHorizontalAlignment("center");

  _addStatusCF(ws, ws.getRange("F4:F503"), {
    "Transfer": {bg:"#dbeafe", fg:"#1d4ed8"},
    "Cash":     {bg:"#dcfce7", fg:"#15803d"},
    "Cek":      {bg:"#fef9c3", fg:"#854d0e"},
    "Giro":     {bg:"#ede9fe", fg:"#7c3aed"}
  });
  Logger.log("  ✓ LOG PEMBAYARAN");
}

function _setupSheetMasterBarang(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.BARANG);
  var lastCol = 7;
  _formatTitle(ws,
    "  📦  MASTER BARANG",
    "  Katalog material & harga terakhir — update otomatis saat input pembelian", lastCol);
  _formatHeaders(ws, ["No","ID Barang","Nama Barang","Kategori","Satuan",
    "Harga Awal (Rp)","Harga Terakhir (Rp)"]);
  // Data mulai baris 5 — baris 4 sengaja tidak ditimpa
  _formatDataArea(ws, ROWS.BARANG.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 90);  ws.setColumnWidth(3, 230);
  ws.setColumnWidth(4, 130); ws.setColumnWidth(5, 80);  ws.setColumnWidth(6, 150);
  ws.setColumnWidth(7, 160);

  ws.getRange("F5:G1004").setNumberFormat("#,##0");
  ws.getRange("G5:G1004").setFontWeight("bold").setFontColor("#16a34a");
  ws.getRange("A5:B1004").setHorizontalAlignment("center");
  ws.getRange("D5:E1004").setHorizontalAlignment("center");
  Logger.log("  ✓ MASTER BARANG");
}

function _setupSheetMasterToko(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.TOKO);
  var lastCol = 3;
  _formatTitle(ws,
    "  🏪  MASTER TOKO / SUPPLIER",
    "  Daftar toko & supplier langganan", lastCol);
  _formatHeaders(ws, ["No","Nama Toko / Supplier","Keterangan"]);
  _formatDataArea(ws, ROWS.TOKO.start, null, lastCol);

  ws.setColumnWidth(1, 40);  ws.setColumnWidth(2, 250); ws.setColumnWidth(3, 300);
  ws.getRange("A4:A103").setHorizontalAlignment("center");
  Logger.log("  ✓ MASTER TOKO");
}

function _setupSheetRAB(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.RAB);
  var lastCol = 8;
  _formatTitle(ws,
    "  📐  RAB PROYEK",
    "  Rencana Anggaran Biaya per Proyek — 1 baris per proyek", lastCol);
  _formatHeaders(ws, ["No","Kode Proyek","Material (Rp)","Upah (Rp)",
    "Subkon (Rp)","Overhead (Rp)","Total RAB (Rp)","Tgl Update"]);
  _formatDataArea(ws, ROWS.RAB.start, null, lastCol);

  ws.setColumnWidth(1, 45);  ws.setColumnWidth(2, 110); ws.setColumnWidth(3, 140);
  ws.setColumnWidth(4, 130); ws.setColumnWidth(5, 130); ws.setColumnWidth(6, 130);
  ws.setColumnWidth(7, 145); ws.setColumnWidth(8, 110);

  ws.getRange("C4:G103").setNumberFormat("#,##0");
  ws.getRange("H4:H103").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("A4:B103").setHorizontalAlignment("center");
  ws.getRange("G4:G103").setFontWeight("bold").setFontColor("#16a34a");
  Logger.log("  ✓ RAB");
}

function _setupSheetMasterSubkon(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.SUBKON);
  var lastCol = 6;
  _formatTitle(ws,
    "  🔨  MASTER SUBKONTRAKTOR",
    "  Daftar subkontraktor & tim borongan yang pernah bekerja", lastCol);
  _formatHeaders(ws, ["No","ID","Nama / Tim","Spesialisasi","No HP","Alamat / Catatan"]);
  _formatDataArea(ws, ROWS.SUBKON.start, null, lastCol);

  ws.setColumnWidth(1, 45);  ws.setColumnWidth(2, 90);  ws.setColumnWidth(3, 200);
  ws.setColumnWidth(4, 130); ws.setColumnWidth(5, 130); ws.setColumnWidth(6, 220);
  ws.getRange("A4:B103").setHorizontalAlignment("center");
  ws.getRange("D4:E103").setHorizontalAlignment("center");
  Logger.log("  ✓ MASTER SUBKON");
}

function _setupSheetLogSubkon(ss) {
  var ws      = _getOrCreateSheet(ss, SHEET.LOG_SUBKON);
  var lastCol = 12;
  _formatTitle(ws,
    "  📋  LOG PEKERJAAN SUBKONTRAKTOR",
    "  Riwayat pekerjaan & pembayaran ke subkontraktor per proyek", lastCol);
  _formatHeaders(ws, ["No","Tanggal","Kode Proyek","Nama Proyek","ID Subkon","Nama Subkon",
    "Uraian Pekerjaan","Nilai Kontrak (Rp)","Status Bayar",
    "Nominal Dibayar (Rp)","Tgl Bayar","Keterangan"]);
  _formatDataArea(ws, ROWS.LOG_SUBKON.start, null, lastCol);

  ws.setColumnWidth(1, 45);  ws.setColumnWidth(2, 100); ws.setColumnWidth(3, 100);
  ws.setColumnWidth(4, 180); ws.setColumnWidth(5, 90);  ws.setColumnWidth(6, 170);
  ws.setColumnWidth(7, 250); ws.setColumnWidth(8, 155); ws.setColumnWidth(9, 120);
  ws.setColumnWidth(10,160); ws.setColumnWidth(11,100); ws.setColumnWidth(12,200);

  ws.getRange("B4:B503").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("H4:H503").setNumberFormat("#,##0").setFontWeight("bold");
  ws.getRange("J4:J503").setNumberFormat("#,##0");
  ws.getRange("K4:K503").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  ws.getRange("A4:C503").setHorizontalAlignment("center");
  ws.getRange("E4:E503").setHorizontalAlignment("center");

  _addStatusCF(ws, ws.getRange("I4:I503"), {
    "Lunas":         {bg:"#dcfce7", fg:"#15803d"},
    "DP":            {bg:"#fed7aa", fg:"#c2410c"},
    "Belum Dibayar": {bg:"#fee2e2", fg:"#b91c1c"}
  });
  Logger.log("  ✓ LOG SUBKON");
}

// ════════════════════════════════════════════════════════════════════════
// REKAP SHEET — Formula otomatis, update sendiri setiap data berubah
// Jalankan SEKALI: setupRekapSheet() dari Apps Script Editor
// Setelah itu sheet REKAP langsung live tanpa perlu tombol di app
//
// Kolom REKAP:
//   A=No  B=Kode  C=Nama  D=Jenis  E=Status  F=NilaiKontrak
//   G=Material  H=UpahGross  I=Subkon  J=KasbonPotong  K=KasbonBonus
//   L=TotalBiaya  M=Laba  N=Margin%  O=Bayar  P=Piutang  Q=Progress%
//
// v2: Kasbon POTONG sekarang langsung pakai SUMIFS kolom I LOG KASBON
//    (kodeProj ditulis saat closing — tidak lagi butuh linkage noClosing)
// ════════════════════════════════════════════════════════════════════════
// ⛔ v1.36 — DIPENSIUNKAN. Sheet REKAP kini HANYA dibuat lewat tombol
// "📊 Update Rekap ke GSheet" di app (action updateRekap → rekap.gs/_apiUpdateRekap).
// Fungsi ini berbasis formula dan menulis ke sheet yang SAMA → saling timpa.
// Selain itu ia masih memakai ROWS.PROJECT.end yang sudah dihapus di constants v2.0.
// Dibiarkan sebagai arsip; untuk menjalankannya harus sengaja diaktifkan di bawah.
var ALLOW_LEGACY_SETUP_REKAP = false;

function setupRekapSheet() {
  if (!ALLOW_LEGACY_SETUP_REKAP) {
    Logger.log("⛔ setupRekapSheet() dipensiunkan sejak v1.36 — pakai tombol 📊 Update Rekap di app.");
    return;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var wsRekap = ss.getSheetByName(SHEET.REKAP);
  if (!wsRekap) {
    wsRekap = ss.insertSheet(SHEET.REKAP, 0); // taruh di posisi pertama
  }
  wsRekap.clearFormats();
  wsRekap.clearConditionalFormatRules();

  var R          = ROWS.PROJECT;
  var DATA_START = 4;
  var NUM_ROWS   = R.end - R.start + 1; // 50 baris (max 50 proyek)
  var LAST_DATA  = DATA_START + NUM_ROWS - 1; // baris 53
  var TOTAL_ROW  = LAST_DATA + 1;             // baris 54 = total
  var LAST_COL   = 17; // kolom A-Q

  // Bersihkan area isi (aman — hanya range rekap, bukan sheet lain)
  wsRekap.getRange(1, 1, TOTAL_ROW + 2, LAST_COL).clearContent();

  // ── Judul & Subtitle ──────────────────────────────────────────────────
  _formatTitle(wsRekap,
    "  📊  REKAP PROYEK ARTHABUMI",
    "  Kalkulasi otomatis via rumus SUMIF — update real-time  |  Kasbon POTONG dibebankan langsung per proyek (v2)",
    LAST_COL);

  // ── Header ────────────────────────────────────────────────────────────
  _formatHeaders(wsRekap, [
    "No","Kode","Nama Proyek","Jenis","Status",
    "Nilai Kontrak","Material","Upah Gross","Subkon",
    "Kasbon Potong (info)","Kasbon Bonus","Total Biaya",
    "Est. Laba","Margin %","Sudah Bayar","Piutang","Progress %"
  ]);

  // ── Bangun array formula (50 baris sekaligus, 1 API call) ─────────────
  var formulas = [];
  for (var i = 0; i < NUM_ROWS; i++) {
    var pr = R.start + i;        // baris di MASTER PROJECT (4..53)
    var rr = DATA_START + i;     // baris di REKAP (4..53)
    var b  = "$B" + rr;          // ref ke kolom kode

    formulas.push([
      // A: No
      "=IF('MASTER PROJECT'!B" + pr + "=\"\",\"\"," + (i+1) + ")",
      // B: Kode Proyek
      "=IF('MASTER PROJECT'!B" + pr + "=\"\",\"\",'MASTER PROJECT'!B" + pr + ")",
      // C: Nama Proyek
      "=IF(" + b + "=\"\",\"\",'MASTER PROJECT'!C" + pr + ")",
      // D: Jenis
      "=IF(" + b + "=\"\",\"\",'MASTER PROJECT'!D" + pr + ")",
      // E: Status
      "=IF(" + b + "=\"\",\"\",'MASTER PROJECT'!E" + pr + ")",
      // F: Nilai Kontrak
      "=IF(" + b + "=\"\",\"\",'MASTER PROJECT'!F" + pr + ")",
      // G: Material — SUMIFS exclude ASET
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIFS(PEMBELIAN!$L:$L,PEMBELIAN!$C:$C," + b + ",PEMBELIAN!$J:$J,\"<>ASET\"),0))",
      // H: Upah Gross — dari LOG ABSENSI (inklusif lembur v1.12)
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIF('LOG ABSENSI'!$F:$F," + b + ",'LOG ABSENSI'!$H:$H),0))",
      // I: Subkon
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIF('LOG SUBKON'!$C:$C," + b + ",'LOG SUBKON'!$H:$H),0))",
      // J: Kasbon POTONG dipotong dari upah (v2 — kodeProj di kolom I LOG KASBON)
      //    Ini adalah PENGURANG upah, ditampilkan positif tapi dikurangi di Total Biaya
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIFS('LOG KASBON'!$E:$E,'LOG KASBON'!$I:$I," + b + ",'LOG KASBON'!$D:$D,\"POTONG\"),0))",
      // K: Kasbon BONUS
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIFS('LOG KASBON'!$E:$E,'LOG KASBON'!$I:$I," + b + ",'LOG KASBON'!$D:$D,\"BONUS\"),0))",
      // L: Total Biaya = G + H + I + K = Mat + UpahGross + Subkon + Bonus
      //    J (Kasbon Potong) TIDAK dikurangi — hanya informatif, bukan pengurang biaya
      "=IF(" + b + "=\"\",\"\",$G" + rr + "+$H" + rr + "+$I" + rr + "+$K" + rr + ")",
      // M: Est. Laba = Kontrak - TotalBiaya
      "=IF(" + b + "=\"\",\"\",$F" + rr + "-$L" + rr + ")",
      // N: Margin %
      "=IF(OR(" + b + "=\"\",$F" + rr + "=0),\"\",$M" + rr + "/$F" + rr + ")",
      // O: Sudah Bayar (dari klien)
      "=IF(" + b + "=\"\",\"\",IFERROR(SUMIF('LOG PEMBAYARAN'!$C:$C," + b + ",'LOG PEMBAYARAN'!$E:$E),0))",
      // P: Piutang = Kontrak - Bayar
      "=IF(" + b + "=\"\",\"\",$F" + rr + "-$O" + rr + ")",
      // Q: Progress % (ditulis app, 0-100)
      "=IF(" + b + "=\"\",\"\",'MASTER PROJECT'!P" + pr + ")"
    ]);
  }
  // Set semua formula sekaligus (efisien)
  wsRekap.getRange(DATA_START, 1, NUM_ROWS, LAST_COL).setFormulas(formulas);

  // ── Baris Total (SUM) ─────────────────────────────────────────────────
  wsRekap.getRange(TOTAL_ROW, 1, 1, 5).merge()
    .setValue("TOTAL")
    .setBackground("#334155").setFontColor("#ffffff")
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  var sumCols = {6:"F",7:"G",8:"H",9:"I",10:"J",11:"K",12:"L",13:"M",15:"O",16:"P"};
  Object.keys(sumCols).forEach(function(colIdx) {
    var col = sumCols[colIdx];
    wsRekap.getRange(TOTAL_ROW, Number(colIdx))
      .setFormula("=SUMIF($B" + DATA_START + ":$B" + LAST_DATA + ",\"<>\"," +
                  col + DATA_START + ":" + col + LAST_DATA + ")")
      .setFontWeight("bold").setBackground("#f1f5f9");
  });
  wsRekap.getRange(TOTAL_ROW, 14) // Margin% average
    .setFormula("=IFERROR(SUMIF($B" + DATA_START + ":$B" + LAST_DATA + ",\"<>\",$M" + DATA_START + ":$M" + LAST_DATA + ")" +
                "/SUMIF($B" + DATA_START + ":$B" + LAST_DATA + ",\"<>\",$F" + DATA_START + ":$F" + LAST_DATA + "),\"\")")
    .setFontWeight("bold").setBackground("#f1f5f9");

  // ── Format angka ──────────────────────────────────────────────────────
  var rpFmt  = "#,##0";
  var pctFmt = "0.0%";
  var numRange = [6,7,8,9,10,11,12,13,15,16]; // kolom Rp
  numRange.forEach(function(c) {
    wsRekap.getRange(DATA_START, c, NUM_ROWS + 1, 1).setNumberFormat(rpFmt);
  });
  wsRekap.getRange(DATA_START, 14, NUM_ROWS + 1, 1).setNumberFormat(pctFmt); // Margin
  wsRekap.getRange(DATA_START, 17, NUM_ROWS, 1).setNumberFormat("#,##0").setHorizontalAlignment("center"); // Progress

  // Laba warna merah kalau negatif
  wsRekap.getRange(DATA_START, 13, NUM_ROWS, 1)
    .setNumberFormat('#,##0;[Red](#,##0);"-"');
  wsRekap.getRange(DATA_START, 16, NUM_ROWS, 1) // Piutang
    .setNumberFormat('#,##0;[Red](#,##0);"-"');

  // ── Conditional Format ────────────────────────────────────────────────
  _addStatusCF(wsRekap, wsRekap.getRange("E" + DATA_START + ":E" + LAST_DATA), {
    "Berjalan": {bg:"#dbeafe", fg:"#1d4ed8"},
    "Selesai":  {bg:"#dcfce7", fg:"#15803d"},
    "Hold":     {bg:"#fef9c3", fg:"#854d0e"},
    "Batal":    {bg:"#fee2e2", fg:"#b91c1c"}
  });

  // ── Zebra rows + alignment ────────────────────────────────────────────
  _formatDataArea(wsRekap, DATA_START, LAST_DATA, LAST_COL);
  wsRekap.getRange("A" + DATA_START + ":B" + LAST_DATA).setHorizontalAlignment("center");
  wsRekap.getRange("D" + DATA_START + ":E" + LAST_DATA).setHorizontalAlignment("center");
  wsRekap.getRange("A" + TOTAL_ROW + ":E" + TOTAL_ROW).setBackground("#334155");

  // ── Lebar kolom ───────────────────────────────────────────────────────
  wsRekap.setColumnWidth(1, 40);   // No
  wsRekap.setColumnWidth(2, 80);   // Kode
  wsRekap.setColumnWidth(3, 200);  // Nama
  wsRekap.setColumnWidth(4, 110);  // Jenis
  wsRekap.setColumnWidth(5, 85);   // Status
  wsRekap.setColumnWidth(6, 130);  // Kontrak
  wsRekap.setColumnWidth(7, 120);  // Material
  wsRekap.setColumnWidth(8, 120);  // Upah
  wsRekap.setColumnWidth(9, 100);  // Subkon
  wsRekap.setColumnWidth(10, 110); // Kasbon Potong (v2)
  wsRekap.setColumnWidth(11, 105); // Kasbon Bonus
  wsRekap.setColumnWidth(12, 125); // Total Biaya
  wsRekap.setColumnWidth(13, 120); // Laba
  wsRekap.setColumnWidth(14, 75);  // Margin
  wsRekap.setColumnWidth(15, 120); // Bayar
  wsRekap.setColumnWidth(16, 110); // Piutang
  wsRekap.setColumnWidth(17, 80);  // Progress

  wsRekap.setFrozenRows(3);
  SpreadsheetApp.flush();
  Logger.log("  ✓ REKAP (formula otomatis, 17 kolom A-Q)");
}

// ════════════════════════════════════════════════════════════════════════
// UTILITY — Perbaiki semua formula di MASTER PROJECT
// Jalankan kalau formula project tiba-tiba hilang atau salah
// ════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════
// fixAllProjectFormulas — v1.13
// Kolom MASTER PROJECT:
//   A=No  B=Kode  C=Nama  D=Jenis  E=Status  F=NilaiKontrak
//   G=BiayaMat(formula)  H=BiayaUpah(formula)  I=TotalBiaya(formula)
//   J=Laba(formula)  K=Margin(formula)  L=TglMulai
//   M=Pembayaran(formula)  N=Piutang(formula)
//   O=Catatan(manual)  P=Progress(manual, 0-100)
//
// ⚠️ Catatan: Formula totalBiaya (I) di GSheet = Material+Upah+Subkon+BONUS
//    Kasbon AMBIL-POTONG tidak bisa dihitung otomatis di GSheet (butuh logika
//    noClosing linkage). Nilai presisi ada di sheet REKAP yang dibuat via app.
// ════════════════════════════════════════════════════════════════════════
function fixAllProjectFormulas() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var ws  = ss.getSheetByName(SHEET.PROJECT);
  if (!ws) { Logger.log("MASTER PROJECT tidak ditemukan"); return; }
  var R    = ROWS.PROJECT;
  // v1.36 FIX: ROWS.PROJECT.end sudah DIHAPUS di constants v2.0 → "B4:Bundefined" bikin error.
  var endRow = ws.getLastRow();
  if (endRow < R.start) { Logger.log("MASTER PROJECT masih kosong"); return; }
  var colB = ws.getRange("B" + R.start + ":B" + endRow).getValues();
  var count = 0;
  for (var i = 0; i < colB.length; i++) {
    if (String(colB[i][0]).trim() === "") continue;
    var r = i + R.start;

    // G = Biaya Material (dari PEMBELIAN, exclude ASET)
    ws.getRange(r, 7).setFormula(
      "=IFERROR(SUMIFS(PEMBELIAN!$L:$L,PEMBELIAN!$C:$C,B" + r + ",PEMBELIAN!$J:$J,\"<>ASET\"),0)"
    ).setNumberFormat("#,##0");

    // H = Biaya Upah Gross (dari LOG ABSENSI — sudah inklusif lembur v1.12)
    ws.getRange(r, 8).setFormula(
      "=IFERROR(SUMIF('LOG ABSENSI'!$F:$F,B" + r + ",'LOG ABSENSI'!$H:$H),0)"
    ).setNumberFormat("#,##0");

    // I = Total Biaya = Material + Upah + Subkon + BONUS
    //     (Kasbon AMBIL-POTONG tidak bisa formula GSheet — lihat sheet REKAP untuk nilai presisi)
    ws.getRange(r, 9).setFormula(
      "=G" + r + "+H" + r +
      "+IFERROR(SUMIF('LOG SUBKON'!$C:$C,B" + r + ",'LOG SUBKON'!$H:$H),0)" +
      "+IFERROR(SUMIFS('LOG KASBON'!$E:$E,'LOG KASBON'!$I:$I,B" + r + ",'LOG KASBON'!$D:$D,\"BONUS\"),0)"
    ).setNumberFormat("#,##0");

    // v1.36 — NF = Nilai Final (kolom R, ditulis app). Baris lama tanpa R → jatuh ke F.
    var NF = 'IF($R' + r + '="",$F' + r + ',$R' + r + ')';

    // J = Laba Estimasi = NilaiFinal - TotalBiaya
    ws.getRange(r, 10).setFormula(
      '=IF($F' + r + '="","",' + NF + '-I' + r + ')'
    ).setNumberFormat('#,##0;[Red](#,##0);"-"');

    // K = Margin %
    ws.getRange(r, 11).setFormula(
      '=IF(OR(' + NF + '=0,$F' + r + '=""),"",J' + r + '/' + NF + ')'
    ).setNumberFormat("0.0%");

    // M = Total Pembayaran dari Klien
    ws.getRange(r, 13).setFormula(
      "=IFERROR(SUMIF('LOG PEMBAYARAN'!$C:$C,B" + r + ",'LOG PEMBAYARAN'!$E:$E),0)"
    ).setNumberFormat("#,##0");

    // N = Piutang = NilaiFinal - Pembayaran
    ws.getRange(r, 14).setFormula(
      '=IF($F' + r + '="","",' + NF + '-IF(M' + r + '="",0,M' + r + '))'
    ).setNumberFormat('#,##0;[Red](#,##0);"-"');

    count++;
  }
  // Header kolom R (sekali saja, kalau masih kosong)
  var hdrR = ws.getRange(3, 18);
  if (String(hdrR.getValue()).trim() === "") {
    hdrR.setValue("Nilai Final (Rp)")
        .setFontWeight("bold").setFontColor("#ffffff").setBackground("#1e3a5f")
        .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
    ws.setColumnWidth(18, 150);
  }
  ws.getRange(R.start, 18, Math.max(1, endRow - R.start + 1), 1).setNumberFormat("#,##0");

  SpreadsheetApp.flush();
  Logger.log("fixAllProjectFormulas (v1.36): " + count + " proyek diupdate");
  Logger.log("  ✅ G=Material  H=Upah  I=Mat+Upah+Subkon+BONUS  J=Laba  K=Margin  M=Bayar  N=Piutang");
  Logger.log("  ✅ J/K/N kini pakai NILAI FINAL kolom R (kontrak awal ± kerja tambah/kurang)");
  Logger.log("  ℹ️  Kolom O (Catatan) & P (Progress) diisi manual oleh app — tidak ada formula");
}

// ════════════════════════════════════════════════════════════════════════
// backfillNilaiFinal — v1.36  (JALANKAN SEKALI setelah deploy)
// Mengisi kolom R MASTER PROJECT = nilai kontrak awal (F) ± kerja tambah/kurang (Q).
// Setelah ini, app akan menjaga kolom R tetap terbarui setiap kali proyek disimpan.
//
// Aman diulang: menulis ulang nilai yang sama. Tidak menyentuh kolom lain.
// ════════════════════════════════════════════════════════════════════════
function backfillNilaiFinal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName(SHEET.PROJECT);
  if (!ws) { Logger.log("MASTER PROJECT tidak ditemukan"); return; }
  var s = ROWS.PROJECT.start;
  var e = ws.getLastRow();
  if (e < s) { Logger.log("MASTER PROJECT masih kosong"); return; }

  var n = e - s + 1;
  var kode  = ws.getRange(s, 2,  n, 1).getValues();  // B
  var base  = ws.getRange(s, 6,  n, 1).getValues();  // F
  var varQ  = ws.getRange(s, 17, n, 1).getValues();  // Q
  var out   = [];
  var count = 0, adjusted = 0;

  for (var i = 0; i < n; i++) {
    if (String(kode[i][0]).trim() === "") { out.push([""]); continue; }
    var f = Number(base[i][0]) || 0;
    var final = _apiNilaiFinal(f, varQ[i][0]);   // helper ada di write.gs
    out.push([final]);
    count++;
    if (final !== f) adjusted++;
  }

  ws.getRange(s, 18, n, 1).setValues(out).setNumberFormat("#,##0");

  var hdrR = ws.getRange(3, 18);
  if (String(hdrR.getValue()).trim() === "") {
    hdrR.setValue("Nilai Final (Rp)")
        .setFontWeight("bold").setFontColor("#ffffff").setBackground("#1e3a5f")
        .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
    ws.setColumnWidth(18, 150);
  }
  SpreadsheetApp.flush();
  Logger.log("backfillNilaiFinal: " + count + " proyek diisi, " + adjusted + " di antaranya punya kerja tambah/kurang");
}
