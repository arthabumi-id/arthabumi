// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI WEB API — Tambahkan ke Apps Script yang sudah ada
// ════════════════════════════════════════════════════════════════════════
// CARA DEPLOY:
// 1. Buka Google Sheets → Extensions → Apps Script
// 2. Copy-paste kode ini di bawah kode yang sudah ada (jangan hapus yang lama)
// 3. Klik Deploy → New deployment → pilih "Web app"
// 4. Execute as: Me
// 5. Who has access: Anyone
// 6. Klik Deploy → izinkan akses → copy URL yang muncul
// 7. Paste URL tersebut di settings app React
// ════════════════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : "getAllData";

    // Kalau ada payload di GET (write via GET fallback)
    if (action !== "getAllData") {
      var payload = {};
      try { payload = JSON.parse(e.parameter.payload || "{}"); } catch(pe) {}
      _apiHandleAction(ss, action, payload);
    }

    var result = {
      ok: true,
      data: {
        projects:      _apiReadProjects(ss),
        pembelian:     _apiReadPembelian(ss),
        karyawan:      _apiReadKaryawan(ss),
        logAbsensi:    _apiReadLogAbsensi(ss),
        logKasbon:     _apiReadLogKasbon(ss),
        logPembayaran: _apiReadLogPembayaran(ss),
        barang:        _apiReadBarang(ss),
        toko:          _apiReadToko(ss),
      }
    };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message + " (line " + (err.lineNumber || "?") + ")" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = (e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var parsed = JSON.parse(body);
    var action = parsed.action || "";
    var data   = parsed.data   || {};

    _apiHandleAction(ss, action, data);

    // Return updated full data after write
    var result = {
      ok: true,
      data: {
        projects:      _apiReadProjects(ss),
        pembelian:     _apiReadPembelian(ss),
        karyawan:      _apiReadKaryawan(ss),
        logAbsensi:    _apiReadLogAbsensi(ss),
        logKasbon:     _apiReadLogKasbon(ss),
        logPembayaran: _apiReadLogPembayaran(ss),
        barang:        _apiReadBarang(ss),
        toko:          _apiReadToko(ss),
      }
    };
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message + " (line " + (err.lineNumber || "?") + ")" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Router ──────────────────────────────────────────────────────────────
function _apiHandleAction(ss, action, data) {
  switch(action) {
    case "addProject":      _apiAddProject(ss, data);      break;
    case "updateProject":   _apiUpdateProject(ss, data);   break;
    case "deleteProject":   _apiDeleteProject(ss, data);   break;
    case "addPembelian":    _apiAddPembelian(ss, data);    break;
    case "addKaryawan":     _apiAddKaryawan(ss, data);     break;
    case "updateKaryawan":  _apiUpdateKaryawan(ss, data);  break;
    case "deleteKaryawan":  _apiDeleteKaryawan(ss, data);  break;
    case "addAbsensi":      _apiAddAbsensi(ss, data);      break;
    case "addKasbon":       _apiAddKasbon(ss, data);       break;
    case "addPembayaran":   _apiAddPembayaran(ss, data);   break;
    case "finalizeClosing": _apiFinalizeClosing(ss, data); break;
    case "deleteAbsensi":   _apiDeleteAbsensi(ss, data);   break;
    default: throw new Error("Unknown action: " + action);
  }
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: DELETE ABSENSI
// ════════════════════════════════════════════════════════════════════════

function _apiDeleteAbsensi(ss, d) {
  // Hapus baris LOG ABSENSI berdasarkan tgl + idKaryawan
  var ws = ss.getSheetByName("LOG ABSENSI");
  if (!ws) return;
  var data = ws.getRange("B4:C1003").getValues();
  var tglTarget = String(d.tgl || "").trim();
  var idTarget  = String(d.idKaryawan || "").trim();
  for (var i = 0; i < data.length; i++) {
    var rowTgl = _apiSerDate(data[i][0]);
    var rowId  = String(data[i][1]).trim();
    if (rowTgl === tglTarget && rowId === idTarget) {
      ws.getRange(i + 4, 1, 1, 12).clearContent();
      return; // hapus match pertama saja
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════

function _apiSerDate(v) {
  if (!v || v === "") return "";
  if (v instanceof Date) {
    if (v.getTime() < 86400000) return "";
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(v);
}

function _apiParseDate(s) {
  if (!s || s === "") return null;
  try {
    // Parse YYYY-MM-DD secara lokal (bukan UTC) — fix timezone offset WIB
    var parts = String(s).split('-');
    if (parts.length === 3) {
      var yr=parseInt(parts[0]), mo=parseInt(parts[1])-1, dy=parseInt(parts[2]);
      if (!isNaN(yr) && !isNaN(mo) && !isNaN(dy)) return new Date(yr, mo, dy);
    }
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch(e) { return null; }
}

function _apiFindNext(ws, col, s, e) {
  var vals = ws.getRange(col + s + ":" + col + e).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === "") return s + i;
  }
  return e + 1;
}

function _apiFindRow(ws, col, s, e, key) {
  var vals = ws.getRange(col + s + ":" + col + e).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(key).trim()) return s + i;
  }
  return -1;
}

// ════════════════════════════════════════════════════════════════════════
// READ FUNCTIONS
// ════════════════════════════════════════════════════════════════════════

function _apiReadProjects(ss) {
  var ws = ss.getSheetByName("MASTER PROJECT");
  if (!ws) return [];
  var data = ws.getRange("B4:N53").getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue;
    out.push({
      kode:         String(r[0]),
      nama:         String(r[1] || ""),
      jenis:        String(r[2] || ""),
      status:       String(r[3] || "Berjalan"),
      nilaiKontrak: Number(r[4])  || 0,
      biayaMat:     Number(r[5])  || 0,
      biayaUpah:    Number(r[6])  || 0,
      totalBiaya:   Number(r[7])  || 0,
      laba:         Number(r[8])  || 0,
      margin:       Number(r[9])  || 0,
      tglMulai:     _apiSerDate(r[10]),
      pembayaran:   Number(r[11]) || 0,
      piutang:      Number(r[12]) || 0,
    });
  }
  return out;
}

function _apiReadPembelian(ss) {
  var ws = ss.getSheetByName("PEMBELIAN");
  if (!ws) return [];
  var data = ws.getRange("A4:L303").getValues();
  var out = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[3]).trim() === "") continue; // D = nama barang
    cnt++;
    out.push({
      id:         "BLI-GS-" + cnt,
      tgl:        _apiSerDate(r[1]),
      kodeProj:   String(r[2]  || ""),
      namaBarang: String(r[3]  || ""),
      kategori:   String(r[4]  || ""),
      satuan:     String(r[5]  || "pcs"),
      qty:        Number(r[6])  || 0,
      harga:      Number(r[7])  || 0,
      diskon:     r[8] ? Number(r[8]) * 100 : 0,
      status:     String(r[9]  || "HABIS"),
      toko:       String(r[10] || ""),
      total:      Number(r[11]) || 0,
    });
  }
  return out;
}

function _apiReadKaryawan(ss) {
  var ws = ss.getSheetByName("MASTER KARYAWAN");
  if (!ws) return [];
  var data = ws.getRange("B4:L53").getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue;
    out.push({
      id:         String(r[0]),
      nama:       String(r[1]  || ""),
      jabatan:    String(r[2]  || ""),
      upahHarian: Number(r[3]) || 0,
      noHP:       String(r[4]  || ""),
      totalHari:  Number(r[5]) || 0,
      totalUpah:  Number(r[6]) || 0,
      kasAmbil:   Number(r[7]) || 0,
      kasPotong:  Number(r[8]) || 0,
      sisaKasbon: Number(r[9]) || 0,
      catatan:    String(r[10] || ""),
    });
  }
  return out;
}

function _apiReadLogAbsensi(ss) {
  var ws = ss.getSheetByName("LOG ABSENSI");
  if (!ws) return [];
  var data = ws.getRange("A4:L1003").getValues();
  var out = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = ID Karyawan
    cnt++;
    out.push({
      id:          "ABS-GS-" + cnt,
      tgl:         _apiSerDate(r[1]),
      idKaryawan:  String(r[2]  || ""),
      nama:        String(r[3]  || ""),
      status:      String(r[4]  || ""),
      kodeProj:    String(r[5]  || ""),
      namaProj:    String(r[6]  || ""),
      upahHariIni: Number(r[7]) || 0,
      statusBayar: String(r[8]  || "Belum Dibayar"),
      noClosing:   String(r[9]  || ""),
      tglBayar:    _apiSerDate(r[10]),
      ket:         String(r[11] || ""),
    });
  }
  return out;
}

function _apiReadLogKasbon(ss) {
  var ws = ss.getSheetByName("LOG KASBON");
  if (!ws) return [];
  var data = ws.getRange("A4:H1003").getValues();
  var out = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = ID Karyawan
    cnt++;
    out.push({
      id:          "KSB-GS-" + cnt,
      tgl:         _apiSerDate(r[1]),
      idKaryawan:  String(r[2] || ""),
      tipe:        String(r[3] || ""),
      nominal:     Number(r[4]) || 0,
      nama:        String(r[5] || ""),
      noClosing:   String(r[6] || ""),
      ket:         String(r[7] || ""),
    });
  }
  return out;
}

function _apiReadLogPembayaran(ss) {
  var ws = ss.getSheetByName("LOG PEMBAYARAN");
  if (!ws) return [];
  var data = ws.getRange("A4:I503").getValues();
  var out = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = Kode Project
    cnt++;
    out.push({
      id:       "PAY-GS-" + cnt,
      tgl:      _apiSerDate(r[1]),
      kodeProj: String(r[2] || ""),
      namaProj: String(r[3] || ""),
      nominal:  Number(r[4]) || 0,
      metode:   String(r[5] || ""),
      bank:     String(r[6] || ""),
      ket:      String(r[7] || ""),
      ref:      String(r[8] || ""),
    });
  }
  return out;
}

function _apiReadBarang(ss) {
  var ws = ss.getSheetByName("MASTER BARANG");
  if (!ws) return [];
  var data = ws.getRange("B5:G104").getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === "") continue; // C = nama (index 1 from B)
    out.push({
      id:            String(data[i][0] || "BRG-" + (i+1)),
      nama:          String(data[i][1] || ""),
      kategori:      String(data[i][2] || ""),
      satuan:        String(data[i][3] || "pcs"),
      hargaTerakhir: Number(data[i][5]) || 0,
    });
  }
  return out;
}

function _apiReadToko(ss) {
  var ws = ss.getSheetByName("MASTER TOKO");
  if (!ws) return [];
  var data = ws.getRange("B4:B103").getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var v = String(data[i][0]).trim();
    if (v !== "") out.push(v);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: MASTER PROJECT
// ════════════════════════════════════════════════════════════════════════

function _apiAddProject(ss, d) {
  var ws = ss.getSheetByName("MASTER PROJECT");
  var r  = _apiFindNext(ws, "B", 4, 53);
  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(d.kode || "");
  ws.getRange(r, 3).setValue(d.nama || "");
  ws.getRange(r, 4).setValue(d.jenis || "");
  ws.getRange(r, 5).setValue(d.status || "Berjalan");
  ws.getRange(r, 6).setValue(d.nilaiKontrak || 0).setNumberFormat("#,##0");
  var tgl = _apiParseDate(d.tglMulai);
  if (tgl) ws.getRange(r, 12).setValue(tgl).setNumberFormat("DD/MM/YYYY");
  // Pasang formulas
  ws.getRange(r, 7).setFormula('=IFERROR(SUMIF(PEMBELIAN!$C:$C,B'+r+',PEMBELIAN!$L:$L),0)').setNumberFormat("#,##0");
  ws.getRange(r, 8).setFormula('=IFERROR(SUMIFS(\'LOG ABSENSI\'!$H:$H,\'LOG ABSENSI\'!$F:$F,B'+r+'),0)').setNumberFormat("#,##0");
  ws.getRange(r, 9).setFormula('=G'+r+'+H'+r).setNumberFormat("#,##0");
  ws.getRange(r, 10).setFormula('=IF(F'+r+'="","",(F'+r+'-I'+r+'))').setNumberFormat('#,##0;[Red](#,##0);"-"');
  ws.getRange(r, 11).setFormula('=IF(OR(F'+r+'=0,F'+r+'=""),"",J'+r+'/F'+r+')').setNumberFormat("0.0%");
  ws.getRange(r, 13).setFormula('=IFERROR(SUMIF(\'LOG PEMBAYARAN\'!$C:$C,B'+r+',\'LOG PEMBAYARAN\'!$E:$E),0)').setNumberFormat("#,##0");
  ws.getRange(r, 14).setFormula('=IF(F'+r+'="","",F'+r+'-IF(M'+r+'="",0,M'+r+'))').setNumberFormat('#,##0;[Red](#,##0);"-"');
}

function _apiUpdateProject(ss, d) {
  var ws = ss.getSheetByName("MASTER PROJECT");
  var r  = _apiFindRow(ws, "B", 4, 53, d.kode);
  if (r < 0) { _apiAddProject(ss, d); return; }
  ws.getRange(r, 3).setValue(d.nama || "");
  ws.getRange(r, 4).setValue(d.jenis || "");
  ws.getRange(r, 5).setValue(d.status || "Berjalan");
  ws.getRange(r, 6).setValue(d.nilaiKontrak || 0).setNumberFormat("#,##0");
  var tgl = _apiParseDate(d.tglMulai);
  if (tgl) ws.getRange(r, 12).setValue(tgl).setNumberFormat("DD/MM/YYYY");
}

function _apiDeleteProject(ss, d) {
  var ws = ss.getSheetByName("MASTER PROJECT");
  var r  = _apiFindRow(ws, "B", 4, 53, d.kode);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 14).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: PEMBELIAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddPembelian(ss, items) {
  var ws      = ss.getSheetByName("PEMBELIAN");
  var wsBarang= ss.getSheetByName("MASTER BARANG");
  var nextRow = _apiFindNext(ws, "D", 4, 303);

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var r  = nextRow + i;
    ws.getRange(r, 1).setValue(r - 3);
    var tgl = _apiParseDate(it.tgl);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("DD/MM/YYYY");
    ws.getRange(r, 3).setValue(it.kodeProj   || "");
    ws.getRange(r, 4).setValue(it.namaBarang || "");
    ws.getRange(r, 5).setValue(it.kategori   || "");
    ws.getRange(r, 6).setValue(it.satuan     || "pcs");
    ws.getRange(r, 7).setValue(it.qty        || 0);
    ws.getRange(r, 8).setValue(it.harga      || 0).setNumberFormat("#,##0");
    ws.getRange(r, 9).setValue(it.diskon ? it.diskon / 100 : "").setNumberFormat("0.0%");
    ws.getRange(r, 10).setValue(it.status    || "HABIS");
    ws.getRange(r, 11).setValue(it.toko      || "");
    ws.getRange(r, 12).setFormula(
      '=IF(OR(D'+r+'="",G'+r+'="",H'+r+'=""),"",IF(J'+r+'="ASET",0,G'+r+'*H'+r+'*(1-IF(I'+r+'="",0,I'+r+'))))'
    ).setNumberFormat("#,##0");
  }

  // Update MASTER BARANG
  if (wsBarang) {
    var barangData = wsBarang.getRange("C5:G104").getValues();
    for (var k = 0; k < items.length; k++) {
      var it2  = items[k];
      var found= false;
      for (var j = 0; j < barangData.length; j++) {
        if (String(barangData[j][0]).toLowerCase() === String(it2.namaBarang).toLowerCase()) {
          wsBarang.getRange(j + 5, 7).setValue(it2.harga || 0).setNumberFormat("#,##0");
          found = true; break;
        }
      }
      if (!found) {
        for (var j2 = 0; j2 < barangData.length; j2++) {
          if (String(barangData[j2][0]).trim() === "") {
            var n = j2 + 1;
            wsBarang.getRange(j2+5, 1, 1, 7).setValues([[n, "BRG-"+padNum(n,3), it2.namaBarang, it2.kategori||"", it2.satuan||"pcs", it2.harga||0, it2.harga||0]]);
            barangData[j2][0] = it2.namaBarang;
            break;
          }
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: MASTER KARYAWAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddKaryawan(ss, d) {
  var ws = ss.getSheetByName("MASTER KARYAWAN");
  var r  = _apiFindNext(ws, "B", 4, 53);
  ws.getRange(r, 1).setValue(r - 3);
  ws.getRange(r, 2).setValue(d.id      || "");
  ws.getRange(r, 3).setValue(d.nama    || "");
  ws.getRange(r, 4).setValue(d.jabatan || "");
  ws.getRange(r, 5).setValue(d.upahHarian || 0).setNumberFormat("#,##0");
  ws.getRange(r, 6).setValue(d.noHP    || "");
  if (d.catatan) ws.getRange(r, 12).setValue(d.catatan);
  ws.getRange(r, 7).setFormula('=IF(B'+r+'="","",COUNTIFS(\'LOG ABSENSI\'!$C:$C,B'+r+',\'LOG ABSENSI\'!$E:$E,"Hadir")+COUNTIFS(\'LOG ABSENSI\'!$C:$C,B'+r+',\'LOG ABSENSI\'!$E:$E,"Setengah Hari")*0.5)').setNumberFormat("#,##0.0");
  ws.getRange(r, 8).setFormula('=IF(B'+r+'="","",SUMIF(\'LOG ABSENSI\'!$C:$C,B'+r+',\'LOG ABSENSI\'!$H:$H))').setNumberFormat("#,##0");
  ws.getRange(r, 9).setFormula('=IF(B'+r+'="","",SUMIFS(\'LOG KASBON\'!$E:$E,\'LOG KASBON\'!$C:$C,B'+r+',\'LOG KASBON\'!$D:$D,"AMBIL"))').setNumberFormat("#,##0");
  ws.getRange(r, 10).setFormula('=IF(B'+r+'="","",SUMIFS(\'LOG KASBON\'!$E:$E,\'LOG KASBON\'!$C:$C,B'+r+',\'LOG KASBON\'!$D:$D,"POTONG"))').setNumberFormat("#,##0");
  ws.getRange(r, 11).setFormula('=IF(B'+r+'="","",IFERROR(I'+r+'-J'+r+',0))').setNumberFormat('#,##0;[Red](#,##0);"-"');
}

function _apiUpdateKaryawan(ss, d) {
  var ws = ss.getSheetByName("MASTER KARYAWAN");
  var r  = _apiFindRow(ws, "B", 4, 53, d.id);
  if (r < 0) { _apiAddKaryawan(ss, d); return; }
  ws.getRange(r, 3).setValue(d.nama    || "");
  ws.getRange(r, 4).setValue(d.jabatan || "");
  ws.getRange(r, 5).setValue(d.upahHarian || 0).setNumberFormat("#,##0");
  ws.getRange(r, 6).setValue(d.noHP    || "");
}

function _apiDeleteKaryawan(ss, d) {
  var ws = ss.getSheetByName("MASTER KARYAWAN");
  var r  = _apiFindRow(ws, "B", 4, 53, d.id);
  if (r < 0) return;
  ws.getRange(r, 1, 1, 12).clearContent();
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: LOG ABSENSI
// ════════════════════════════════════════════════════════════════════════

function _apiAddAbsensi(ss, items) {
  var ws      = ss.getSheetByName("LOG ABSENSI");
  var nextRow = _apiFindNext(ws, "C", 4, 1003);
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var r  = nextRow + i;
    ws.getRange(r, 1).setValue(r - 3);
    var tgl = _apiParseDate(it.tgl);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("DD/MM/YYYY");
    ws.getRange(r, 3).setValue(it.idKaryawan || "");
    ws.getRange(r, 4).setFormula('=IFERROR(VLOOKUP(C'+r+',\'MASTER KARYAWAN\'!$B:$C,2,0),"")');
    ws.getRange(r, 5).setValue(it.status     || "");
    ws.getRange(r, 6).setValue(it.kodeProj   || "");
    ws.getRange(r, 7).setFormula('=IFERROR(VLOOKUP(F'+r+',\'MASTER PROJECT\'!$B:$C,2,0),"")');
    ws.getRange(r, 8).setValue(it.upahHariIni || 0).setNumberFormat("#,##0");
    ws.getRange(r, 9).setValue("Belum Dibayar");
    ws.getRange(r, 10).setValue("");
    ws.getRange(r, 11).setValue("");
    ws.getRange(r, 12).setValue(it.ket || "");
  }
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: LOG KASBON
// ════════════════════════════════════════════════════════════════════════

function _apiAddKasbon(ss, items) {
  var ws      = ss.getSheetByName("LOG KASBON");
  var nextRow = _apiFindNext(ws, "C", 4, 1003);
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var r  = nextRow + i;
    ws.getRange(r, 1).setValue(r - 3);
    var tgl = _apiParseDate(it.tgl);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("DD/MM/YYYY");
    ws.getRange(r, 3).setValue(it.idKaryawan || "");
    ws.getRange(r, 4).setValue(it.tipe       || "AMBIL");
    ws.getRange(r, 5).setValue(it.nominal    || 0).setNumberFormat("#,##0");
    ws.getRange(r, 6).setFormula('=IFERROR(VLOOKUP(C'+r+',\'MASTER KARYAWAN\'!$B:$C,2,0),"")');
    ws.getRange(r, 7).setValue(it.noClosing  || "");
    ws.getRange(r, 8).setValue(it.ket        || "");
  }
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: LOG PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddPembayaran(ss, items) {
  var ws      = ss.getSheetByName("LOG PEMBAYARAN");
  var nextRow = _apiFindNext(ws, "C", 4, 503);
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var r  = nextRow + i;
    ws.getRange(r, 1).setValue(r - 3);
    var tgl = _apiParseDate(it.tgl);
    if (tgl) ws.getRange(r, 2).setValue(tgl).setNumberFormat("DD/MM/YYYY");
    ws.getRange(r, 3).setValue(it.kodeProj || "");
    ws.getRange(r, 4).setFormula('=IFERROR(VLOOKUP(C'+r+',\'MASTER PROJECT\'!$B:$C,2,0),"")');
    ws.getRange(r, 5).setValue(it.nominal  || 0).setNumberFormat("#,##0");
    ws.getRange(r, 6).setValue(it.metode   || "Transfer");
    ws.getRange(r, 7).setValue(it.bank     || "");
    ws.getRange(r, 8).setValue(it.ket      || "");
    ws.getRange(r, 9).setValue(it.ref      || "");
  }
}

// ════════════════════════════════════════════════════════════════════════
// WRITE: FINALIZE CLOSING
// ════════════════════════════════════════════════════════════════════════

function _apiFinalizeClosing(ss, d) {
  var wsAbs = ss.getSheetByName("LOG ABSENSI");
  var wsKsb = ss.getSheetByName("LOG KASBON");
  if (!wsAbs || !wsKsb) return;

  var dari       = d.dari;
  var sampai     = d.sampai;
  var tglBayar   = d.tglBayar;
  var noClosing  = d.noClosing  || "";
  var selIds     = d.selectedIds || [];
  var ksbItems   = d.kasbonItems || [];

  if (!dari || !sampai) return;
  var dMs = new Date(dari).getTime();
  var sMs = new Date(sampai).getTime();
  var tglBayarDate = _apiParseDate(tglBayar);

  // Tandai Sudah Dibayar di LOG ABSENSI
  var absData = wsAbs.getRange("A4:L1003").getValues();
  for (var i = 0; i < absData.length; i++) {
    var row        = absData[i];
    var id         = String(row[2]).trim(); // C
    var statusBayar= String(row[8]).trim(); // I
    var tgl        = row[1];               // B
    if (!id || statusBayar !== "Belum Dibayar") continue;
    if (selIds.indexOf(id) < 0) continue;
    if (!tgl) continue;
    var tMs = new Date(tgl).getTime();
    if (isNaN(tMs) || tMs < dMs || tMs > sMs) continue;
    var rN = i + 4;
    wsAbs.getRange(rN, 9).setValue("Sudah Dibayar");
    wsAbs.getRange(rN, 10).setValue(noClosing);
    if (tglBayarDate) wsAbs.getRange(rN, 11).setValue(tglBayarDate).setNumberFormat("DD/MM/YYYY");
  }

  // Tambah record POTONG di LOG KASBON
  if (ksbItems.length > 0) {
    var nextRow = _apiFindNext(wsKsb, "C", 4, 1003);
    for (var k = 0; k < ksbItems.length; k++) {
      var it = ksbItems[k];
      var r  = nextRow + k;
      wsKsb.getRange(r, 1).setValue(r - 3);
      if (tglBayarDate) wsKsb.getRange(r, 2).setValue(tglBayarDate).setNumberFormat("DD/MM/YYYY");
      wsKsb.getRange(r, 3).setValue(it.idKaryawan || "");
      wsKsb.getRange(r, 4).setValue("POTONG");
      wsKsb.getRange(r, 5).setValue(it.nominal || 0).setNumberFormat("#,##0");
      wsKsb.getRange(r, 6).setFormula('=IFERROR(VLOOKUP(C'+r+',\'MASTER KARYAWAN\'!$B:$C,2,0),"")');
      wsKsb.getRange(r, 7).setValue(noClosing);
      wsKsb.getRange(r, 8).setValue("Potong kasbon — " + noClosing);
    }
  }
}
