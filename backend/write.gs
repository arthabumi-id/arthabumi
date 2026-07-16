// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — write.gs  v1.9
// FIX: setFormulaLocal() → setFormula() — lebih stabil di semua environment
//      Formula pakai koma (,) — English locale, tidak bergantung _getSep()
// BARU: Tambah field progress (kolom P) — Session 3
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// MASTER PROJECT
// ════════════════════════════════════════════════════════════════════════

function _apiVariasiStr(v) {
  try { return JSON.stringify(v || []); } catch (e) { return "[]"; }
}

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
  ws.getRange(r,17).setValue(_apiVariasiStr(d.variasi)); // Q = kerja tambah/kurang (JSON)

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
  ws.getRange(r,17).setValue(_apiVariasiStr(d.variasi)); // Q = kerja tambah/kurang (JSON)
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
  // Idempotency guard: ID yang sudah ada di kolom A di-skip (retry setelah timeout tidak bikin baris dobel)
  var existBeli = _collectExistingIds(ws, R, "BLI-");
  var writtenB = 0;

  for (var i = 0; i < items.length; i++) {
    var it   = items[i];
    var itIdB = _sanitizeStr(it.id) || "";
    if (itIdB && existBeli[itIdB]) continue;
    if (itIdB) existBeli[itIdB] = true;
    var r  = nextRow + writtenB;
    writtenB++;
    // Kolom A = ID unik dari app (pola LOG SUBKON) — fallback nomor urut utk kompatibilitas
    ws.getRange(r, 1).setValue(itIdB || (r - 3));
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
    ws.getRange(r,13).setValue(_sanitizeStr(it.bayarToko) || "Lunas");
    // Formula total — MAX(0, qty*harga - diskon)
    ws.getRange(r,12).setFormula(
      "=IF(OR(D"+r+"=\"\",G"+r+"=\"\",H"+r+"=\"\"),\"\",IF(J"+r+"=\"ASET\",0,MAX(0,G"+r+"*H"+r+"-IFERROR(I"+r+",0))))"
    ).setNumberFormat("#,##0");
  }

  // Update MASTER BARANG (harga terakhir)
  if (!wsBarang) return;
  var Rb         = ROWS.BARANG;
  var barangData = wsBarang.getRange("C" + Rb.start + ":G" + wsBarang.getLastRow()).getValues();

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
      // Unlimited v2.0: append langsung setelah baris terakhir (tidak cari baris kosong)
      var nextBrg = wsBarang.getLastRow() + 1;
      var nBrg    = nextBrg - Rb.start + 1;
      wsBarang.getRange(nextBrg, 1, 1, 7).setValues([[
        nBrg, "BRG-" + _padNum(nBrg, 3),
        itb.namaBarang || "", itb.kategori || "",
        itb.satuan     || "pcs", itb.harga || 0, itb.harga || 0
      ]]);
    }
  }

  // Update MASTER TOKO — tambah toko baru jika belum ada (v1.13)
  var wsToko = ss.getSheetByName(SHEET.TOKO);
  if (wsToko) {
    var Rt       = ROWS.TOKO;
    var tokoData = wsToko.getRange("B" + Rt.start + ":B" + wsToko.getLastRow()).getValues();
    var tokoList = tokoData.map(function(row){ return String(row[0]).trim().toLowerCase(); });
    for (var ti = 0; ti < items.length; ti++) {
      var tokoName = String(items[ti].toko || "").trim();
      if (!tokoName) continue;
      if (tokoList.indexOf(tokoName.toLowerCase()) >= 0) continue; // sudah ada
      // Unlimited v2.0: append langsung setelah baris terakhir
      var nextToko = wsToko.getLastRow() + 1;
      wsToko.getRange(nextToko, 2).setValue(tokoName);
      tokoList.push(tokoName.toLowerCase()); // hindari duplikat dalam batch yang sama
    }
  }
}

// Cari baris pembelian by ID unik (kolom A). Return -1 kalau tidak ketemu / id kosong / id legacy (BLI-GS-).
function _findBeliRowById(ws, R, id) {
  var idT = String(id || "").trim();
  if (!idT || idT.indexOf("BLI-") !== 0 || idT.indexOf("BLI-GS-") === 0) return -1;
  var endRow = ws.getLastRow();
  if (endRow < R.start) return -1;
  var ids = ws.getRange("A" + R.start + ":A" + endRow).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === idT) return i + R.start;
  }
  return -1;
}

// Fallback legacy: cari baris by tgl+kodeProj+namaBarang (match pertama)
function _findBeliRowByKey(ws, R, tgl, kodeProj, namaBarang) {
  var endRow = ws.getLastRow();
  if (endRow < R.start) return -1;
  var data  = ws.getRange("B" + R.start + ":D" + endRow).getValues();
  var tglT  = String(tgl        || "").trim();
  var projT = String(kodeProj   || "").trim();
  var namaT = String(namaBarang || "").trim().toLowerCase();
  for (var i = 0; i < data.length; i++) {
    if (_apiSerDate(data[i][0]) === tglT &&
        String(data[i][1]).trim() === projT &&
        String(data[i][2]).trim().toLowerCase() === namaT) {
      return i + R.start;
    }
  }
  return -1;
}

function _apiDeletePembelian(ss, d) {
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return;
  var R = ROWS.PEMBELIAN;
  var rowNum = _findBeliRowById(ws, R, d.id);
  if (rowNum < 0) rowNum = _findBeliRowByKey(ws, R, d.tgl, d.kodeProj, d.namaBarang);
  if (rowNum < 0) return;
  ws.getRange(rowNum, 1, 1, 13).clearContent(); // 13 kolom termasuk M=bayarToko
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
  // Idempotency guard: kumpulkan ID (kolom A) yang sudah ada — retry/duplikat di-skip, tidak dobel
  var existAbs = _collectExistingIds(ws, R, "ABS-");
  var written = 0;
  for (var i = 0; i < items.length; i++) {
    var it   = items[i];
    var itId = _sanitizeStr(it.id) || "";
    if (itId && existAbs[itId]) continue; // sudah pernah tertulis (retry setelah timeout) → skip
    if (itId) existAbs[itId] = true;
    var r   = nextRow + written;
    written++;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(itId || (r - 3));
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

// Kumpulkan ID app yang sudah ada di kolom A (untuk idempotency & lookup)
function _collectExistingIds(ws, R, prefix) {
  var out = {};
  var endRow = ws.getLastRow();
  if (endRow < R.start) return out;
  var vals = ws.getRange("A" + R.start + ":A" + endRow).getValues();
  for (var i = 0; i < vals.length; i++) {
    var v = String(vals[i][0]).trim();
    if (v.indexOf(prefix) === 0 && v.indexOf(prefix + "GS-") !== 0) out[v] = true;
  }
  return out;
}

// Cari baris absensi by ID unik (kolom A). Return -1 kalau tidak ketemu / id legacy (ABS-GS-).
function _findAbsRowById(ws, R, id) {
  var idT = String(id || "").trim();
  if (!idT || idT.indexOf("ABS-") !== 0 || idT.indexOf("ABS-GS-") === 0) return -1;
  var endRow = ws.getLastRow();
  if (endRow < R.start) return -1;
  var ids = ws.getRange("A" + R.start + ":A" + endRow).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === idT) return i + R.start;
  }
  return -1;
}

function _apiDeleteAbsensi(ss, d) {
  var ws = ss.getSheetByName(SHEET.ABSENSI);
  if (!ws) return;
  var R = ROWS.ABSENSI;
  var rowNum = _findAbsRowById(ws, R, d.id);
  if (rowNum < 0) {
    // Fallback legacy: match pertama by tgl + idKaryawan
    var data = ws.getRange("B" + R.start + ":C" + ws.getLastRow()).getValues();
    var tglT = String(d.tgl        || "").trim();
    var idT  = String(d.idKaryawan || "").trim();
    for (var i = 0; i < data.length; i++) {
      if (_apiSerDate(data[i][0]) === tglT && String(data[i][1]).trim() === idT) {
        rowNum = i + R.start;
        break;
      }
    }
  }
  if (rowNum < 0) return;
  ws.getRange(rowNum, 1, 1, 14).clearContent(); // 14 kolom termasuk M=jamLembur, N=upahLembur
}

// ════════════════════════════════════════════════════════════════════════
// LOG KASBON
// ════════════════════════════════════════════════════════════════════════

// Generic: cari baris by ID app di kolom A (prefix mis. "KSB-"; ID legacy "<prefix>GS-" ditolak)
function _findRowByIdColA(ws, R, id, prefix) {
  var idT = String(id || "").trim();
  if (!idT || idT.indexOf(prefix) !== 0 || idT.indexOf(prefix + "GS-") === 0) return -1;
  var endRow = ws.getLastRow();
  if (endRow < R.start) return -1;
  var ids = ws.getRange("A" + R.start + ":A" + endRow).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === idT) return i + R.start;
  }
  return -1;
}

function _apiAddKasbon(ss, items) {
  var ws      = ss.getSheetByName(SHEET.KASBON);
  var R       = ROWS.KASBON;
  var nextRow = _apiFindNext(ws, "C", R.start, R.end);
  // Idempotency guard: ID yang sudah ada di kolom A di-skip (retry tidak bikin kasbon dobel)
  var existKsb = _collectExistingIds(ws, R, "KSB-");
  var writtenK = 0;
  for (var i = 0; i < items.length; i++) {
    var it   = items[i];
    var itIdK = _sanitizeStr(it.id) || "";
    if (itIdK && existKsb[itIdK]) continue;
    if (itIdK) existKsb[itIdK] = true;
    var r   = nextRow + writtenK;
    writtenK++;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(itIdK || (r - 3));
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
  var R = ROWS.KASBON;
  // ID unik dulu (kolom A), fallback legacy match pertama
  var rowNum = _findRowByIdColA(ws, R, d.id, "KSB-");
  if (rowNum < 0) {
    var data = ws.getRange("B" + R.start + ":H" + ws.getLastRow()).getValues();
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
        rowNum = i + R.start;
        break;
      }
    }
  }
  if (rowNum < 0) return;
  ws.getRange(rowNum, 1, 1, 9).clearContent(); // 9 kolom termasuk I=kodeProj
}

// ════════════════════════════════════════════════════════════════════════
// LOG PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════

function _apiAddPembayaran(ss, items) {
  var ws      = ss.getSheetByName(SHEET.PEMBAYARAN);
  var R       = ROWS.PEMBAYARAN;
  var nextRow = _apiFindNext(ws, "C", R.start, R.end);
  // Idempotency guard (retry tidak bikin pembayaran dobel)
  var existPay = _collectExistingIds(ws, R, "PAY-");
  var writtenP = 0;
  for (var i = 0; i < items.length; i++) {
    var it   = items[i];
    var itIdP = _sanitizeStr(it.id) || "";
    if (itIdP && existPay[itIdP]) continue;
    if (itIdP) existPay[itIdP] = true;
    var r   = nextRow + writtenP;
    writtenP++;
    var tgl = _apiParseDate(it.tgl);
    ws.getRange(r, 1).setValue(itIdP || (r - 3));
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
  var R = ROWS.PEMBAYARAN;
  // ID unik dulu (kolom A), fallback legacy match pertama
  var rowNum = _findRowByIdColA(ws, R, d.id, "PAY-");
  if (rowNum < 0) {
    var data = ws.getRange("B" + R.start + ":E" + ws.getLastRow()).getValues();
    var tglT  = String(d.tgl      || "").trim();
    var projT = String(d.kodeProj || "").trim();
    var nomT  = _sanitizeNum(d.nominal);
    for (var i = 0; i < data.length; i++) {
      if (_apiSerDate(data[i][0]) === tglT &&
          String(data[i][1]).trim() === projT &&
          _sanitizeNum(data[i][3]) === nomT) {
        rowNum = i + R.start;
        break;
      }
    }
  }
  if (rowNum < 0) return;
  ws.getRange(rowNum, 1, 1, 9).clearContent();
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

  var absData = wsAbs.getRange("A" + Ra.start + ":L" + wsAbs.getLastRow()).getValues();
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

  // Idempotency guard (retry finalizeClosing tidak boleh tulis POTONG/BONUS dobel):
  // kumpulkan kombinasi noClosing|idKaryawan|tipe yang sudah ada di LOG KASBON
  var existCls = {};
  var endKsb = wsKsb.getLastRow();
  if (endKsb >= Rk.start) {
    var ksbData = wsKsb.getRange("C" + Rk.start + ":G" + endKsb).getValues();
    for (var e2 = 0; e2 < ksbData.length; e2++) {
      var noC2 = String(ksbData[e2][4] || "").trim(); // G = noClosing
      if (!noC2) continue;
      existCls[noC2 + "|" + String(ksbData[e2][0]).trim() + "|" + String(ksbData[e2][1]).trim()] = true;
    }
  }

  if (ksbItems.length > 0) {
    var nextRow = _apiFindNext(wsKsb, "C", Rk.start, Rk.end);
    var wK = 0;
    for (var k = 0; k < ksbItems.length; k++) {
      var it = ksbItems[k];
      if (existCls[noClosing + "|" + String(it.idKaryawan || "").trim() + "|POTONG"]) continue;
      var r  = nextRow + wK;
      wK++;
      wsKsb.getRange(r, 1).setValue(r - 3);
      if (tglBayarDate) wsKsb.getRange(r, 2).setValue(tglBayarDate).setNumberFormat("dd/MM/yyyy");
      wsKsb.getRange(r, 3).setValue(_sanitizeStr(it.idKaryawan) || "");
      wsKsb.getRange(r, 4).setValue("POTONG");
      wsKsb.getRange(r, 5).setValue(_sanitizeNum(it.nominal)).setNumberFormat("#,##0");
      wsKsb.getRange(r, 6).setValue(_sanitizeStr(it.nama) || "");
      wsKsb.getRange(r, 7).setValue(noClosing);
      wsKsb.getRange(r, 8).setValue("Potong kasbon — " + noClosing + (it.kodeProj ? " → " + it.kodeProj : ""));
      wsKsb.getRange(r, 9).setValue(_sanitizeStr(it.kodeProj) || ""); // I = kodeProj (v2: dibebankan ke proyek pilihan user)
    }
  }

  // ── Tulis BONUS kasbon ke GSheet (v1.13) ─────────────────────────────
  var bonusItems = d.bonusItems || [];
  if (bonusItems.length > 0) {
    var nextBonRow = _apiFindNext(wsKsb, "C", Rk.start, Rk.end);
    var wB = 0;
    for (var b = 0; b < bonusItems.length; b++) {
      var bn = bonusItems[b];
      if (existCls[noClosing + "|" + String(bn.idKaryawan || "").trim() + "|BONUS"]) continue;
      var rb = nextBonRow + wB;
      wB++;
      wsKsb.getRange(rb, 1).setValue(rb - 3);
      if (tglBayarDate) wsKsb.getRange(rb, 2).setValue(tglBayarDate).setNumberFormat("dd/MM/yyyy");
      wsKsb.getRange(rb, 3).setValue(_sanitizeStr(bn.idKaryawan) || "");
      wsKsb.getRange(rb, 4).setValue("BONUS");
      wsKsb.getRange(rb, 5).setValue(_sanitizeNum(bn.nominal)).setNumberFormat("#,##0");
      wsKsb.getRange(rb, 6).setValue(_sanitizeStr(bn.nama) || "");
      wsKsb.getRange(rb, 7).setValue(noClosing);
      wsKsb.getRange(rb, 8).setValue("Bonus — " + noClosing + (bn.kodeProj ? " · " + bn.kodeProj : ""));
      wsKsb.getRange(rb, 9).setValue(_sanitizeStr(bn.kodeProj) || ""); // I = kodeProj
    }
  }
}

function _apiDeleteClosing(ss, d) {
  var noClosing = String(d.noClosing || "").trim();
  if (!noClosing) return;

  var wsAbs = ss.getSheetByName(SHEET.ABSENSI);
  if (wsAbs) {
    var Ra      = ROWS.ABSENSI;
    var absData = wsAbs.getRange("A" + Ra.start + ":L" + wsAbs.getLastRow()).getValues();
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
    // Range D:G → index 0=tipe, 1=nominal, 2=nama, 3=noClosing
    var ksbData = wsKsb.getRange("D" + Rk.start + ":G" + wsKsb.getLastRow()).getValues();
    for (var j = ksbData.length - 1; j >= 0; j--) {
      var tipeRow      = String(ksbData[j][0]).trim();
      var noClosingRow = String(ksbData[j][3]).trim();
      // Hapus POTONG dan BONUS yang terkait closing ini
      if (noClosingRow === noClosing && (tipeRow === "POTONG" || tipeRow === "BONUS")) {
        wsKsb.getRange(j + Rk.start, 1, 1, 9).clearContent(); // 9 kolom (A:I)
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

// ════════════════════════════════════════════════════════════════════════
// UPLOAD BUKTI PEMBAYARAN SUBKON (v1.29)
// Dipanggil via doPost (foto terlalu besar untuk GET). Simpan ke Drive,
// link ditulis ke kolom P LOG SUBKON (bisa lebih dari satu, dipisah newline).
// ════════════════════════════════════════════════════════════════════════
function _apiUploadBuktiSubkon(ss, d) {
  if (!d || !d.b64 || !d.idLog) return;
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R = ROWS.LOG_SUBKON;
  // Cari baris dulu — jangan buat file kalau baris tidak ketemu (hindari file yatim di Drive)
  var rowNum = _findRowByIdColA(ws, R, d.idLog, "LSK-");
  if (rowNum < 0) return;

  var folderName = "Arthabumi Bukti Pembayaran";
  var fIter  = DriveApp.getFoldersByName(folderName);
  var folder = fIter.hasNext() ? fIter.next() : DriveApp.createFolder(folderName);

  var mime = String(d.mime || "image/jpeg");
  var name = _sanitizeStr(d.filename) || ("bukti-" + d.idLog + "-" + new Date().getTime() + ".jpg");
  var blob = Utilities.newBlob(Utilities.base64Decode(String(d.b64)), mime, name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url  = "https://drive.google.com/file/d/" + file.getId() + "/view";

  var cell = ws.getRange(rowNum, 16); // P = buktiUrls
  var cur  = String(cell.getValue() || "").trim();
  cell.setValue(cur ? cur + "\n" + url : url);
}

function _apiAddLogSubkon(ss, d) {
  var ws  = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R   = ROWS.LOG_SUBKON;
  // Idempotency guard: kalau ID sudah ada (retry setelah timeout), jangan tulis baris kedua
  if (d.id && _findRowByIdColA(ws, R, d.id, "LSK-") > 0) return;
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

// ════════════════════════════════════════════════════════════════════════
// EDIT LOG SUBKON — v1.27 (Session 20)
// Edit detail pekerjaan (tgl, proyek, subkon, uraian, nilaiKontrak, ket)
// TIDAK menyentuh kolom bayar (I,J,K) maupun kolom potongan (M,N,O)
// ════════════════════════════════════════════════════════════════════════
function _apiEditLogSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R      = ROWS.LOG_SUBKON;
  var rowNum = -1;
  // Find by ID (column A)
  var colA = ws.getRange("A" + R.start + ":A" + ws.getLastRow()).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === String(d.id).trim()) { rowNum = i + R.start; break; }
  }
  if (rowNum < 0) return;
  // Update cols B-H (2-8): tgl, kodeProj, namaProj, idSubkon, namaSubkon, uraian, nilaiKontrak
  var tgl = _apiParseDate(d.tgl);
  ws.getRange(rowNum, 2, 1, 7).setValues([[
    tgl || String(d.tgl || ""),
    _sanitizeStr(d.kodeProj)                 || "",
    _sanitizeStr(d.namaProj  || d.kodeProj)  || "",
    _sanitizeStr(d.idSubkon)                 || "",
    _sanitizeStr(d.namaSubkon|| d.idSubkon)  || "",
    _sanitizeStr(d.uraian)                   || "",
    _sanitizeNum(d.nilaiKontrak)
  ]]);
  if (tgl) ws.getRange(rowNum, 2).setNumberFormat("dd/MM/yyyy");
  ws.getRange(rowNum, 8).setNumberFormat("#,##0");
  // Update col L (12): ket
  ws.getRange(rowNum, 12).setValue(_sanitizeStr(d.ket) || "");
}

function _apiUpdateLogSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R      = ROWS.LOG_SUBKON;
  var rowNum = -1;
  if (d.id) {
    var colA = ws.getRange("A" + R.start + ":A" + ws.getLastRow()).getValues();
    for (var i = 0; i < colA.length; i++) {
      if (String(colA[i][0]).trim() === String(d.id).trim()) { rowNum = i + R.start; break; }
    }
  }
  if (rowNum < 0 && d.kodeProj && d.uraian) {
    var data = ws.getRange("C" + R.start + ":G" + ws.getLastRow()).getValues();
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

  // ── Potongan kasbon (v1.25) ──────────────────────────────────────────
  // Jika ada potongan, tulis ke LOG SUBKON kolom M/N/O
  // dan tambahkan entri POTONG ke LOG KASBON untuk karyawan terkait
  var potongan = _sanitizeNum(d.potongan);
  if (potongan > 0 && d.idKaryawanPotong) {
    ws.getRange(rowNum,13).setValue(potongan).setNumberFormat("#,##0");          // M = potongan
    ws.getRange(rowNum,14).setValue(_sanitizeStr(d.idKaryawanPotong) || "");     // N = idKaryawanPotong
    var ketPot = _sanitizeStr(d.ketPotongan) || ("Dipotong dari bayar subkon " + (d.kodeProj || ""));
    ws.getRange(rowNum,15).setValue(ketPot);                                      // O = ketPotongan

    // Tambah entri POTONG ke LOG KASBON
    var wsKsb   = ss.getSheetByName(SHEET.KASBON);
    // Idempotency: kalau potId sudah ada di kolom A (retry setelah timeout), jangan tulis POTONG kedua
    if (wsKsb && d.potId && _findRowByIdColA(wsKsb, ROWS.KASBON, d.potId, "KSB-") > 0) wsKsb = null;
    if (wsKsb) {
      var Rk      = ROWS.KASBON;
      var nextKsb = _apiFindNext(wsKsb, "C", Rk.start, Rk.end);
      var tglPot  = tglBayar || new Date();
      wsKsb.getRange(nextKsb, 1).setValue(_sanitizeStr(d.potId) || (nextKsb - 3));
      wsKsb.getRange(nextKsb, 2).setValue(tglPot).setNumberFormat("dd/MM/yyyy");
      wsKsb.getRange(nextKsb, 3).setValue(_sanitizeStr(d.idKaryawanPotong));      // C = idKaryawan
      wsKsb.getRange(nextKsb, 4).setValue("POTONG");                               // D = tipe
      wsKsb.getRange(nextKsb, 5).setValue(potongan).setNumberFormat("#,##0");     // E = nominal
      wsKsb.getRange(nextKsb, 6).setValue(_sanitizeStr(d.namaKaryawanPotong) || ""); // F = nama
      wsKsb.getRange(nextKsb, 7).setValue("");                                     // G = noClosing (kosong)
      wsKsb.getRange(nextKsb, 8).setValue(ketPot);                                 // H = ket
      wsKsb.getRange(nextKsb, 9).setValue(_sanitizeStr(d.kodeProj) || "");        // I = kodeProj
    }
  }
}

function _apiDeleteLogSubkon(ss, d) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return;
  var R      = ROWS.LOG_SUBKON;
  var rowNum = -1;
  if (d.id) {
    var colA = ws.getRange("A" + R.start + ":A" + ws.getLastRow()).getValues();
    for (var i = 0; i < colA.length; i++) {
      if (String(colA[i][0]).trim() === String(d.id).trim()) { rowNum = i + R.start; break; }
    }
  }
  if (rowNum < 0 && d.kodeProj && d.uraian) {
    var data = ws.getRange("C" + R.start + ":G" + ws.getLastRow()).getValues();
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

// ════════════════════════════════════════════════════════════════════════
// UPDATE PEMBELIAN — v1.0 (Session 17)
// Cari baris berdasarkan nilai LAMA (oldTgl + oldKodeProj + oldNamaBarang),
// lalu timpa dengan nilai baru. Update in-place, tidak hapus baris.
// ════════════════════════════════════════════════════════════════════════
function _apiUpdatePembelian(ss, d) {
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return;
  var R      = ROWS.PEMBELIAN;
  var endRow = ws.getLastRow();
  if (endRow < R.start) return;

  // Cari baris: ID unik dulu (kolom A), fallback nilai LAMA (baris legacy)
  var rowNum = _findBeliRowById(ws, R, d.id);
  if (rowNum < 0) rowNum = _findBeliRowByKey(ws, R, d.oldTgl, d.oldKodeProj, d.oldNamaBarang);
  if (rowNum < 0) return; // Row tidak ditemukan (belum sync atau sudah dihapus)
  // Backfill ID ke baris legacy agar operasi berikutnya presisi
  var newId = String(d.id || "").trim();
  if (newId.indexOf("BLI-") === 0 && newId.indexOf("BLI-GS-") !== 0) {
    ws.getRange(rowNum, 1).setValue(newId);
  }

  // Update 11 kolom sekaligus (B:L), kolom A (no urut) dibiarkan
  var tglDate = _apiParseDate(String(d.tgl || ""));
  var qty     = _sanitizeNum(d.qty);
  var harga   = _sanitizeNum(d.harga);
  var diskon  = _sanitizeNum(d.diskon);
  var total   = _sanitizeNum(d.total) || Math.max(0, qty * harga - diskon);

  ws.getRange(rowNum, 2, 1, 12).setValues([[
    tglDate || String(d.tgl || ""),         // B = tgl
    _sanitizeStr(d.kodeProj)   || "",       // C = kodeProj
    _sanitizeStr(d.namaBarang) || "",       // D = namaBarang
    _sanitizeStr(d.kategori)   || "",       // E = kategori
    _sanitizeStr(d.satuan)     || "pcs",    // F = satuan
    qty,                                    // G = qty
    harga,                                  // H = harga
    diskon,                                 // I = diskon
    _sanitizeStr(d.status)     || "HABIS",  // J = status
    _sanitizeStr(d.toko)       || "",       // K = toko
    total,                                  // L = total
    _sanitizeStr(d.bayarToko)  || "Lunas"  // M = bayarToko
  ]]);
  ws.getRange(rowNum,  8).setNumberFormat("#,##0"); // H = harga
  ws.getRange(rowNum,  9).setNumberFormat("#,##0"); // I = diskon
  ws.getRange(rowNum, 12).setNumberFormat("#,##0"); // L = total

  // Update MASTER BARANG: rename entri lama → nama baru + update hargaTerakhir
  var wsBarang = ss.getSheetByName(SHEET.BARANG);
  if (wsBarang) {
    var Rb     = ROWS.BARANG;
    var endBrg = wsBarang.getLastRow();
    if (endBrg >= Rb.start) {
      var brg      = wsBarang.getRange("C" + Rb.start + ":G" + endBrg).getValues();
      var namaOld  = String(d.oldNamaBarang || d.namaBarang || "").toLowerCase();
      var namaNew  = String(d.namaBarang    || "").toLowerCase();
      var nameChanged = namaOld !== namaNew;
      var found = false;
      for (var k = 0; k < brg.length; k++) {
        var cellNama = String(brg[k][0]).toLowerCase();
        // Cari berdasarkan nama LAMA (jika nama berubah) atau nama baru (jika sama)
        if (cellNama === namaOld || (!nameChanged && cellNama === namaNew)) {
          if (nameChanged) {
            wsBarang.getRange(k + Rb.start, 3).setValue(_sanitizeStr(d.namaBarang)); // rename di kolom C
          }
          if (harga > 0) {
            wsBarang.getRange(k + Rb.start, 7).setValue(harga).setNumberFormat("#,##0"); // update hargaTerakhir kolom G
          }
          found = true;
          break;
        }
      }
      // Jika nama baru belum ada di MASTER BARANG sama sekali, tambah entri baru
      if (!found && d.namaBarang && harga > 0) {
        var nextBrg = wsBarang.getLastRow() + 1;
        var nBrg    = nextBrg - Rb.start + 1;
        wsBarang.getRange(nextBrg, 1, 1, 7).setValues([[
          nBrg, "BRG-" + _padNum(nBrg, 3),
          _sanitizeStr(d.namaBarang), _sanitizeStr(d.kategori) || "",
          _sanitizeStr(d.satuan) || "pcs", harga, harga
        ]]);
      }
    }
  }
}

function _apiMarkBayarToko(ss, d) {
  // Mark satu item pembelian sebagai Lunas di kolom M
  // d = { tgl, kodeProj, namaBarang }
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return;
  var R      = ROWS.PEMBELIAN;
  var endRow = ws.getLastRow();
  if (endRow < R.start) return;
  // ID unik dulu (kolom A), fallback tgl+proj+nama (baris legacy)
  var rowNum = _findBeliRowById(ws, R, d.id);
  if (rowNum < 0) rowNum = _findBeliRowByKey(ws, R, d.tgl, d.kodeProj, d.namaBarang);
  if (rowNum < 0) return;
  ws.getRange(rowNum, 13).setValue("Lunas");
}
