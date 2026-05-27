// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — write.gs  v1.9
// FIX: setFormulaLocal() → setFormula() — lebih stabil di semua environment
//      Formula pakai koma (,) — English locale, tidak bergantung _getSep()
// BARU: Tambah field progress (kolom P) — Session 3
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// MASTER PROJECT
// ════════════════════════════════════════════════════════════════════════

function _apiAddProject(ss, d) {
  var ws = ss.getSheetByName(SHEET.PROJECT);
  var R  = ROWS.PROJECT;
  var r  = _apiFindNext(ws, "B", R.start, R.end);

  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(_sanitizeStr(d.kode)        || "");
  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)        || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.jenis)       || "");
  ws.getRange(r, 5).setValue(_sanitizeStr(d.status)      || "Berjalan");
  ws.getRange(r, 6).setValue(_sanitizeNum(d.nilaiKontrak)).setNumberFormat("#,##0");
  ws.getRange(r,15).setValue(_sanitizeStr(d.catatan) || ""); // O = catatan
  ws.getRange(r,16).setValue(_sanitizeNum(d.progress || 0)).setNumberFormat("0"); // P = progress (%)

  var tgl = _apiParseDate(d.tglMulai);
  if (tgl) ws.getRange(r, 12).setValue(tgl).setNumberFormat("dd/MM/yyyy");

  // Formula otomatis — pakai setFormula (English locale, koma sebagai separator)
  ws.getRange(r, 7).setFormula(
    "=IFERROR(SUMIF(PEMBELIAN!$C:$C,B"+r+",PEMBELIAN!$L:$L),0)"
  ).setNumberFormat("#,##0");
  ws.getRange(r, 8).setFormula(
    "=IFERROR(SUMIFS('LOG ABSENSI'!$H:$H,'LOG ABSENSI'!$F:$F,B"+r+"),0)"
  ).setNumberFormat("#,##0");
  ws.getRange(r, 9).setFormula(
    "=G"+r+"+H"+r+"+IFERROR(SUMIF('LOG SUBKON'!$C:$C,B"+r+",'LOG SUBKON'!$H:$H),0)"
  ).setNumberFormat("#,##0");
  ws.getRange(r,10).setFormula(
    "=IF(F"+r+"=\"\",\"\",(F"+r+"-I"+r+"))"
  ).setNumberFormat('#,##0;[Red](#,##0);"-"');
  ws.getRange(r,11).setFormula(
    "=IF(OR(F"+r+"=0,F"+r+"=\"\"),\"\",J"+r+"/F"+r+")"
  ).setNumberFormat("0.0%");
  ws.getRange(r,13).setFormula(
    "=IFERROR(SUMIF('LOG PEMBAYARAN'!$C:$C,B"+r+",'LOG PEMBAYARAN'!$E:$E),0)"
  ).setNumberFormat("#,##0");
  ws.getRange(r,14).setFormula(
    "=IF(F"+r+"=\"\",\"\",F"+r+"-IF(M"+r+"=\"\",0,M"+r+"))"
  ).setNumberFormat('#,##0;[Red](#,##0);"-"');
}

function _apiUpdateProject(ss, d) {
  var ws = ss.getSheetByName(SHEET.PROJECT);
  var R  = ROWS.PROJECT;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.kode);
  if (r < 0) { _apiAddProject(ss, d); return; }

  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)        || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.jenis)       || "");
  ws.getRange(r, 5).setValue(_sanitizeStr(d.status)      || "Berjalan");
  ws.getRange(r, 6).setValue(_sanitizeNum(d.nilaiKontrak)).setNumberFormat("#,##0");
  ws.getRange(r,15).setValue(_sanitizeStr(d.catatan)     || ""); // O = catatan
  ws.getRange(r,16).setValue(_sanitizeNum(d.progress || 0)).setNumberFormat("0"); // P = progress (%)
  var tgl = _apiParseDate(d.tglMulai);
  if (tgl) ws.getRange(r, 12).setValue(tgl).setNumberFormat("dd/MM/yyyy");
}

function _apiDeleteProject(ss, d) {
  var ws = ss.getSheetByName(SHEET.PROJECT);
  var R  = ROWS.PROJECT;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.kode);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 14).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// PEMBELIAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddPembelian(ss, items) {
  var ws       = ss.getSheetByName(SHEET.PEMBELIAN);
  var wsBarang = ss.getSheetByName(SHEET.BARANG);
  var R        = ROWS.PEMBELIAN;
  var nextRow  = _apiFindNext(ws, "D", R.start, R.end);

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var r  = nextRow + i;
    ws.getRange(r, 1).setValue(r - 3);
    var tgl = _apiParseDate(it.tgl);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("dd/MM/yyyy");
    ws.getRange(r, 3).setValue(_sanitizeStr(it.kodeProj)   || "");
    ws.getRange(r, 4).setValue(_sanitizeStr(it.namaBarang) || "");
    ws.getRange(r, 5).setValue(_sanitizeStr(it.kategori)   || "");
    ws.getRange(r, 6).setValue(_sanitizeStr(it.satuan)     || "pcs");
    ws.getRange(r, 7).setValue(_sanitizeNum(it.qty));
    ws.getRange(r, 8).setValue(_sanitizeNum(it.harga)).setNumberFormat("#,##0");
    ws.getRange(r, 9).setValue(_sanitizeNum(it.diskon) || "").setNumberFormat("#,##0");
    ws.getRange(r,10).setValue(_sanitizeStr(it.status)     || "HABIS");
    ws.getRange(r,11).setValue(_sanitizeStr(it.toko)       || "");
    // Formula total — MAX(0, qty*harga - diskon)
    ws.getRange(r,12).setFormula(
      "=IF(OR(D"+r+"=\"\",G"+r+"=\"\",H"+r+"=\"\"),\"\",IF(J"+r+"=\"ASET\",0,MAX(0,G"+r+"*H"+r+"-IFERROR(I"+r+",0))))"
    ).setNumberFormat("#,##0");
  }

  // Update MASTER BARANG (harga terakhir)
  if (!wsBarang) return;
  var Rb         = ROWS.BARANG;
  var barangData = wsBarang.getRange("C" + Rb.start + ":G" + Rb.end).getValues();

  for (var k = 0; k < items.length; k++) {
    var itb    = items[k];
    var namaLc = String(itb.namaBarang || "").toLowerCase();
    var found  = false;
    for (var jj = 0; jj < barangData.length; jj++) {
      if (String(barangData[jj][0]).toLowerCase() === namaLc) {
        wsBarang.getRange(jj + Rb.start, 7).setValue(_sanitizeNum(itb.harga)).setNumberFormat("#,##0");
        found = true; break;
      }
    }
    if (!found) {
      for (var jn = 0; jn < barangData.length; jn++) {
        if (String(barangData[jn][0]).trim() === "") {
          var n = jn + 1;
          wsBarang.getRange(jn + Rb.start, 1, 1, 7).setValues([[
            n, "BRG-" + _padNum(n, 3),
            itb.namaBarang || "", itb.kategori || "",
            itb.satuan     || "pcs", itb.harga || 0, itb.harga || 0
          ]]);
          barangData[jn][0] = itb.namaBarang;
          break;
        }
      }
    }
  }
}

function _apiDeletePembelian(ss, d) {
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return;
  var R     = ROWS.PEMBELIAN;
  var data  = ws.getRange("B" + R.start + ":D" + R.end).getValues();
  var tglT  = String(d.tgl        || "").trim();
  var projT = String(d.kodeProj   || "").trim();
  var namaT = String(d.namaBarang || "").trim().toLowerCase();
  for (var i = 0; i < data.length; i++) {
    if (_apiSerDate(data[i][0]) === tglT &&
        String(data[i][1]).trim() === projT &&
        String(data[i][2]).trim().toLowerCase() === namaT) {
      ws.getRange(i + R.start, 1, 1, 12).clearContent();
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// MASTER KARYAWAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddKaryawan(ss, d) {
  var ws = ss.getSheetByName(SHEET.KARYAWAN);
  var R  = ROWS.KARYAWAN;
  var r  = _apiFindNext(ws, "B", R.start, R.end);

  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(_sanitizeStr(d.id)      || "");
  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)    || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.jabatan) || "");
  ws.getRange(r, 5).setValue(_sanitizeNum(d.upahHarian)).setNumberFormat("#,##0");
  ws.getRange(r, 6).setValue(_sanitizeStr(d.noHP)    || "");

  // Formula otomatis — setFormula, koma
  ws.getRange(r, 7).setFormula(
    "=IF(B"+r+"=\"\",\"\",COUNTIFS('LOG ABSENSI'!$C:$C,B"+r+",'LOG ABSENSI'!$E:$E,\"Hadir\")+COUNTIFS('LOG ABSENSI'!$C:$C,B"+r+",'LOG ABSENSI'!$E:$E,\"Setengah Hari\")*0.5)"
  ).setNumberFormat("#,##0.0");
  ws.getRange(r, 8).setFormula(
    "=IF(B"+r+"=\"\",\"\",SUMIF('LOG ABSENSI'!$C:$C,B"+r+",'LOG ABSENSI'!$H:$H))"
  ).setNumberFormat("#,##0");
  ws.getRange(r, 9).setFormula(
    "=IF(B"+r+"=\"\",\"\",SUMIFS('LOG KASBON'!$E:$E,'LOG KASBON'!$C:$C,B"+r+",'LOG KASBON'!$D:$D,\"AMBIL\"))"
  ).setNumberFormat("#,##0");
  ws.getRange(r,10).setFormula(
    "=IF(B"+r+"=\"\",\"\",SUMIFS('LOG KASBON'!$E:$E,'LOG KASBON'!$C:$C,B"+r+",'LOG KASBON'!$D:$D,\"POTONG\"))"
  ).setNumberFormat("#,##0");
  ws.getRange(r,11).setFormula(
    "=IF(B"+r+"=\"\",\"\",IFERROR(I"+r+"-J"+r+",0))"
  ).setNumberFormat('#,##0;[Red](#,##0);"-"');
}

function _apiUpdateKaryawan(ss, d) {
  var ws = ss.getSheetByName(SHEET.KARYAWAN);
  var R  = ROWS.KARYAWAN;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.id);
  if (r < 0) { _apiAddKaryawan(ss, d); return; }
  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)    || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.jabatan) || "");
  ws.getRange(r, 5).setValue(_sanitizeNum(d.upahHarian)).setNumberFormat("#,##0");
  ws.getRange(r, 6).setValue(_sanitizeStr(d.noHP)    || "");
}

function _apiDeleteKaryawan(ss, d) {
  var ws = ss.getSheetByName(SHEET.KARYAWAN);
  var R  = ROWS.KARYAWAN;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.id);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 12).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// LOG ABSENSI
// ════════════════════════════════════════════════════════════════════════

function _apiAddAbsensi(ss, items) {
  var ws      = ss.getSheetByName(SHEET.ABSENSI);
  var R       = ROWS.ABSENSI;
  var nextRow = _apiFindNext(ws, "C", R.start, R.end);
  for (var i = 0; i < items.length; i++) {
    var it  = items[i];
    var r   = nextRow + i;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(r - 3);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("dd/MM/yyyy");
    ws.getRange(r, 3).setValue(_sanitizeStr(it.idKaryawan) || "");
    ws.getRange(r, 4).setValue(_sanitizeStr(it.nama)       || "");
    ws.getRange(r, 5).setValue(_sanitizeStr(it.status)     || "");
    ws.getRange(r, 6).setValue(_sanitizeStr(it.kodeProj)   || "");
    ws.getRange(r, 7).setValue(_sanitizeStr(it.namaProj || it.kodeProj) || "");
    ws.getRange(r, 8).setValue(_sanitizeNum(it.upahHariIni)).setNumberFormat("#,##0");
    ws.getRange(r, 9).setValue("Belum Dibayar");
    ws.getRange(r,10).setValue("");
    ws.getRange(r,11).setValue("");
    ws.getRange(r,12).setValue(_sanitizeStr(it.ket) || "");
    ws.getRange(r,13).setValue(_sanitizeNum(it.jamLembur || 0)).setNumberFormat("0.#");   // M = jamLembur
    ws.getRange(r,14).setValue(_sanitizeNum(it.upahLembur || 0)).setNumberFormat("#,##0"); // N = upahLembur
  }
}

function _apiDeleteAbsensi(ss, d) {
  var ws = ss.getSheetByName(SHEET.ABSENSI);
  if (!ws) return;
  var R    = ROWS.ABSENSI;
  var data = ws.getRange("B" + R.start + ":C" + R.end).getValues();
  var tglT = String(d.tgl        || "").trim();
  var idT  = String(d.idKaryawan || "").trim();
  for (var i = 0; i < data.length; i++) {
    if (_apiSerDate(data[i][0]) === tglT && String(data[i][1]).trim() === idT) {
      ws.getRange(i + R.start, 1, 1, 12).clearContent();
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// LOG KASBON
// ════════════════════════════════════════════════════════════════════════

function _apiAddKasbon(ss, items) {
  var ws      = ss.getSheetByName(SHEET.KASBON);
  var R       = ROWS.KASBON;
  var nextRow = _apiFindNext(ws, "C", R.start, R.end);
  for (var i = 0; i < items.length; i++) {
    var it  = items[i];
    var r   = nextRow + i;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(r - 3);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("dd/MM/yyyy");
    ws.getRange(r, 3).setValue(_sanitizeStr(it.idKaryawan) || "");
    ws.getRange(r, 4).setValue(_sanitizeStr(it.tipe)       || "AMBIL");
    ws.getRange(r, 5).setValue(_sanitizeNum(it.nominal)).setNumberFormat("#,##0");
    ws.getRange(r, 6).setValue(_sanitizeStr(it.nama)       || "");
    ws.getRange(r, 7).setValue(_sanitizeStr(it.noClosing)  || "");
    ws.getRange(r, 8).setValue(_sanitizeStr(it.ket)        || "");
    ws.getRange(r, 9).setValue(_sanitizeStr(it.kodeProj)   || ""); // I = kodeProj (v1.13, untuk BONUS)
  }
}

function _apiDeleteKasbon(ss, d) {
  var ws = ss.getSheetByName(SHEET.KASBON);
  if (!ws) return;
  var R    = ROWS.KASBON;
  var data = ws.getRange("B" + R.start + ":H" + R.end).getValues();
  var tglT  = String(d.tgl        || "").trim();
  var idT   = String(d.idKaryawan || "").trim();
  var tipeT = String(d.tipe       || "").trim();
  var nomT  = _sanitizeNum(d.nominal);
  for (var i = 0; i < data.length; i++) {
    if (_apiSerDate(data[i][0]) === tglT &&
        String(data[i][1]).trim() === idT &&
        String(data[i][2]).trim() === tipeT &&
        _sanitizeNum(data[i][3]) === nomT &&
        String(data[i][5]).trim() === "") {
      ws.getRange(i + R.start, 1, 1, 8).clearContent();
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// LOG PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddPembayaran(ss, items) {
  var ws      = ss.getSheetByName(SHEET.PEMBAYARAN);
  var R       = ROWS.PEMBAYARAN;
  var nextRow = _apiFindNext(ws, "C", R.start, R.end);
  for (var i = 0; i < items.length; i++) {
    var it  = items[i];
    var r   = nextRow + i;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(r - 3);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("dd/MM/yyyy");
    ws.getRange(r, 3).setValue(_sanitizeStr(it.kodeProj)                 || "");
    ws.getRange(r, 4).setValue(_sanitizeStr(it.namaProj || it.kodeProj)  || "");
    ws.getRange(r, 5).setValue(_sanitizeNum(it.nominal)).setNumberFormat("#,##0");
    ws.getRange(r, 6).setValue(_sanitizeStr(it.metode)                   || "Transfer");
    ws.getRange(r, 7).setValue(_sanitizeStr(it.bank)                     || "");
    ws.getRange(r, 8).setValue(_sanitizeStr(it.ket)                      || "");
    ws.getRange(r, 9).setValue(_sanitizeStr(it.ref)                      || "");
  }
}

function _apiDeletePembayaran(ss, d) {
  var ws = ss.getSheetByName(SHEET.PEMBAYARAN);
  if (!ws) return;
  var R    = ROWS.PEMBAYARAN;
  var data = ws.getRange("B" + R.start + ":E" + R.end).getValues();
  var tglT  = String(d.tgl      || "").trim();
  var projT = String(d.kodeProj || "").trim();
  var nomT  = _sanitizeNum(d.nominal);
  for (var i = 0; i < data.length; i++) {
    if (_apiSerDate(data[i][0]) === tglT &&
        String(data[i][1]).trim() === projT &&
        _sanitizeNum(data[i][3]) === nomT) {
      ws.getRange(i + R.start, 1, 1, 9).clearContent();
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// CLOSING GAJI
// ════════════════════════════════════════════════════════════════════════

function _apiFinalizeClosing(ss, d) {
  var wsAbs = ss.getSheetByName(SHEET.ABSENSI);
  var wsKsb = ss.getSheetByName(SHEET.KASBON);
  if (!wsAbs || !wsKsb) return;

  var dari      = d.dari;
  var sampai    = d.sampai;
  var tglBayar  = d.tglBayar;
  var noClosing = _sanitizeStr(d.noClosing) || "";
  var selIds    = d.selectedIds || [];
  var ksbItems  = d.kasbonItems || [];
  if (!dari || !sampai) return;

  var sstz         = ss.getSpreadsheetTimeZone();
  var tglBayarDate = _apiParseDate(tglBayar);
  var Ra           = ROWS.ABSENSI;
  var Rk           = ROWS.KASBON;

  var absData = wsAbs.getRange("A" + Ra.start + ":L" + Ra.end).getValues();
  for (var i = 0; i < absData.length; i++) {
    var row         = absData[i];
    var id          = String(row[2]).trim();
    var statusBayar = String(row[8]).trim();
    var tglRow      = row[1];
    if (!id || statusBayar !== "Belum Dibayar") continue;
    if (selIds.indexOf(id) < 0) continue;
    if (!tglRow) continue;
    var tglStr = (tglRow instanceof Date)
      ? Utilities.formatDate(tglRow, sstz, "yyyy-MM-dd")
      : String(tglRow).substring(0, 10);
    if (!tglStr || tglStr < dari || tglStr > sampai) continue;
    var rN = i + Ra.start;
    wsAbs.getRange(rN, 9).setValue("Sudah Dibayar");
    wsAbs.getRange(rN,10).setValue(noClosing);
    if (tglBayarDate) wsAbs.getRange(rN,11).setValue(tglBayarDate).setNumberFormat("dd/MM/yyyy");
  }

  if (ksbItems.length > 0) {
    var nextRow = _apiFindNext(wsKsb, "C", Rk.start, Rk.end);
    for (var k = 0; k < ksbItems.length; k++) {
      var it = ksbItems[k];
      var r  = nextRow + k;
      wsKsb.getRange(r, 1).setValue(r - 3);
      if (tglBayarDate) wsKsb.getRange(r, 2).setValue(tglBayarDate).setNumberFormat("dd/MM/yyyy");
      wsKsb.getRange(r, 3).setValue(_sanitizeStr(it.idKaryawan) || "");
      wsKsb.getRange(r, 4).setValue("POTONG");
      wsKsb.getRange(r, 5).setValue(_sanitizeNum(it.nominal)).setNumberFormat("#,##0");
      wsKsb.getRange(r, 6).setValue(_sanitizeStr(it.nama) || "");
      wsKsb.getRange(r, 7).setValue(noClosing);
      wsKsb.getRange(r, 8).setValue("Potong kasbon — " + noClosing);
    }
  }
}

function _apiDeleteClosing(ss, d) {
  var noClosing = String(d.noClosing || "").trim();
  if (!noClosing) return;

  var wsAbs = ss.getSheetByName(SHEET.ABSENSI);
  if (wsAbs) {
    var Ra      = ROWS.ABSENSI;
    var absData = wsAbs.getRange("A" + Ra.start + ":L" + Ra.end).getValues();
    for (var i = 0; i < absData.length; i++) {
      if (String(absData[i][9]).trim() !== noClosing) continue;
      var rN = i + Ra.start;
      wsAbs.getRange(rN, 9).setValue("Belum Dibayar");
      wsAbs.getRange(rN,10).setValue("");
      wsAbs.getRange(rN,11).setValue("");
    }
  }

  var wsKsb = ss.getSheetByName(SHEET.KASBON);
  if (wsKsb) {
    var Rk      = ROWS.KASBON;
    var ksbData = wsKsb.getRange("D" + Rk.start + ":G" + Rk.end).getValues();
    for (var j = ksbData.length - 1; j >= 0; j--) {
      if (String(ksbData[j][3]).trim() === noClosing && String(ksbData[j][0]).trim() === "POTONG") {
        wsKsb.getRange(j + Rk.start, 1, 1, 8).clearContent();
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// RAB PROYEK
// ════════════════════════════════════════════════════════════════════════

function _apiSaveRAB(ss, d) {
  var ws       = ss.getSheetByName(SHEET.RAB);
  if (!ws) return;
  var R        = ROWS.RAB;
  var kodeProj = _sanitizeStr(d.kodeProj) || "";
  var r        = _apiFindRow(ws, "B", R.start, R.end, kodeProj);
  if (r < 0) r = _apiFindNext(ws, "B", R.start, R.end);

  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(kodeProj);
  ws.getRange(r, 3).setValue(_sanitizeNum(d.material)).setNumberFormat("#,##0");
  ws.getRange(r, 4).setValue(_sanitizeNum(d.upah)    ).setNumberFormat("#,##0");
  ws.getRange(r, 5).setValue(_sanitizeNum(d.subkon)  ).setNumberFormat("#,##0");
  ws.getRange(r, 6).setValue(_sanitizeNum(d.overhead)).setNumberFormat("#,##0");
  // Formula total — setFormula
  ws.getRange(r, 7).setFormula("=C"+r+"+D"+r+"+E"+r+"+F"+r).setNumberFormat("#,##0");
  var tgl = _apiParseDate(d.tglUpdate);
  if (tgl) ws.getRange(r, 8).setValue(tgl).setNumberFormat("dd/MM/yyyy");
  // Label kategori custom per proyek (I–L)
  ws.getRange(r,  9).setValue(_sanitizeStr(d.labelMat)      || "");
  ws.getRange(r, 10).setValue(_sanitizeStr(d.labelUpah)     || "");
  ws.getRange(r, 11).setValue(_sanitizeStr(d.labelSubkon)   || "");
  ws.getRange(r, 12).setValue(_sanitizeStr(d.labelOverhead) || "");
}

function _apiDeleteRAB(ss, d) {
  var ws = ss.getSheetByName(SHEET.RAB);
  if (!ws) return;
  var R        = ROWS.RAB;
  var kodeProj = _sanitizeStr(d.kodeProj) || "";
  var r        = _apiFindRow(ws, "B", R.start, R.end, kodeProj);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 12).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// MASTER SUBKON
// ════════════════════════════════════════════════════════════════════════

function _apiAddSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.SUBKON);
  if (!ws) return;
  var R  = ROWS.SUBKON;
  var r  = _apiFindNext(ws, "B", R.start, R.end);
  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(_sanitizeStr(d.id)           || "");
  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)         || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.spesialisasi) || "");
  ws.getRange(r, 5).setValue(_sanitizeStr(d.noHP)         || "");
  ws.getRange(r, 6).setValue(_sanitizeStr(d.alamat)       || "");
}

function _apiUpdateSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.SUBKON);
  if (!ws) return;
  var R  = ROWS.SUBKON;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.id);
  if (r < 0) { _apiAddSubkon(ss, d); return; }
  ws.getRange(r, 3).setValue(_sanitizeStr(d.nama)         || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.spesialisasi) || "");
  ws.getRange(r, 5).setValue(_sanitizeStr(d.noHP)         || "");
  ws.getRange(r, 6).setValue(_sanitizeStr(d.alamat)       || "");
}

function _apiDeleteSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.SUBKON);
  if (!ws) return;
  var R  = ROWS.SUBKON;
  var r  = _apiFindRow(ws, "B", R.start, R.end, d.id);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 6).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// LOG SUBKON
// ════════════════════════════════════════════════════════════════════════

function _apiAddLogSubkon(ss, d) {
  var ws  = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R   = ROWS.LOG_SUBKON;
  var r   = _apiFindNext(ws, "C", R.start, R.end);
  var tgl = _apiParseDate(d.tgl);
  ws.getRange(r, 1).setValue(d.id || ("LSK-" + Date.now()));
  if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("dd/MM/yyyy");
  ws.getRange(r, 3).setValue(_sanitizeStr(d.kodeProj)                || "");
  ws.getRange(r, 4).setValue(_sanitizeStr(d.namaProj || d.kodeProj)  || "");
  ws.getRange(r, 5).setValue(_sanitizeStr(d.idSubkon)                || "");
  ws.getRange(r, 6).setValue(_sanitizeStr(d.namaSubkon || d.idSubkon)|| "");
  ws.getRange(r, 7).setValue(_sanitizeStr(d.uraian)                  || "");
  ws.getRange(r, 8).setValue(_sanitizeNum(d.nilaiKontrak)).setNumberFormat("#,##0");
  ws.getRange(r, 9).setValue(_sanitizeStr(d.statusBayar) || "Belum Dibayar");
  ws.getRange(r,10).setValue(_sanitizeNum(d.nominalBayar)).setNumberFormat("#,##0");
  var tglBayar = _apiParseDate(d.tglBayar);
  if (tglBayar) ws.getRange(r,11).setValue(tglBayar).setNumberFormat("dd/MM/yyyy");
  ws.getRange(r,12).setValue(_sanitizeStr(d.ket) || "");
}

function _apiUpdateLogSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R      = ROWS.LOG_SUBKON;
  var rowNum = -1;
  if (d.id) {
    var colA = ws.getRange("A" + R.start + ":A" + R.end).getValues();
    for (var i = 0; i < colA.length; i++) {
      if (String(colA[i][0]).trim() === String(d.id).trim()) { rowNum = i + R.start; break; }
    }
  }
  if (rowNum < 0 && d.kodeProj && d.uraian) {
    var data = ws.getRange("C" + R.start + ":G" + R.end).getValues();
    for (var j = data.length - 1; j >= 0; j--) {
      if (String(data[j][0]).trim() === String(d.kodeProj).trim() &&
          String(data[j][4]).trim().toLowerCase() === String(d.uraian).trim().toLowerCase()) {
        rowNum = j + R.start; break;
      }
    }
  }
  if (rowNum < 0) return;
  ws.getRange(rowNum, 9).setValue(_sanitizeStr(d.statusBayar)   || "");
  ws.getRange(rowNum,10).setValue(_sanitizeNum(d.nominalBayar)).setNumberFormat("#,##0");
  var tglBayar = _apiParseDate(d.tglBayar);
  if (tglBayar) ws.getRange(rowNum,11).setValue(tglBayar).setNumberFormat("dd/MM/yyyy");
}

function _apiDeleteLogSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R      = ROWS.LOG_SUBKON;
  var rowNum = -1;
  if (d.id) {
    var colA = ws.getRange("A" + R.start + ":A" + R.end).getValues();
    for (var i = 0; i < colA.length; i++) {
      if (String(colA[i][0]).trim() === String(d.id).trim()) { rowNum = i + R.start; break; }
    }
  }
  if (rowNum < 0 && d.kodeProj && d.uraian) {
    var data = ws.getRange("C" + R.start + ":G" + R.end).getValues();
    for (var j = data.length - 1; j >= 0; j--) {
      if (String(data[j][0]).trim() === String(d.kodeProj).trim() &&
          String(data[j][4]).trim().toLowerCase() === String(d.uraian).trim().toLowerCase()) {
        rowNum = j + R.start; break;
      }
    }
  }
  if (rowNum < 0) return;
  ws.getRange(rowNum, 1, 1, 12).clearContent();
}
