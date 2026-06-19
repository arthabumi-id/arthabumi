// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — read.gs  v2.0
// Semua fungsi READ: ambil data dari GSheet → kirim ke app
//
// v2.0 UNLIMITED: Semua getRange() kini pakai ws.getLastRow() dinamis
//                 Tidak ada hardcoded end row — sheet tumbuh bebas
// ════════════════════════════════════════════════════════════════════════
//
// Peta Sheet → Kolom (index 0 = kolom pertama range):
//
//  MASTER PROJECT   : B=kode  C=nama   D=jenis  E=status  F=nilaiKontrak
//                     G=biayaMat  H=biayaUpah  I=totalBiaya  J=laba  K=margin
//                     L=tglMulai  M=pembayaran  N=piutang  O=catatan  P=progress
//  PEMBELIAN        : B=tgl  C=kodeProj  D=namaBarang  E=kategori  F=satuan
//                     G=qty  H=harga  I=diskon  J=status  K=toko  L=total
//  MASTER KARYAWAN  : B=id   C=nama   D=jabatan  E=upahHarian  F=noHP
//                     G=totalHari  H=totalUpah  I=kasAmbil  J=kasPotong  K=sisaKasbon  L=catatan
//  LOG ABSENSI      : B=tgl  C=idKaryawan  D=nama  E=status  F=kodeProj
//                     G=namaProj  H=upahHariIni  I=statusBayar  J=noClosing  K=tglBayar  L=ket
//                     M=jamLembur  N=upahLembur
//  LOG KASBON       : A=no  B=tgl  C=idKaryawan  D=tipe  E=nominal  F=nama
//                     G=noClosing  H=ket  I=kodeProj
//  LOG PEMBAYARAN   : A=no  B=tgl  C=kodeProj  D=namaProj  E=nominal
//                     F=metode  G=bank  H=ket  I=ref
//  MASTER BARANG    : B=id   C=nama   D=kategori  E=satuan  F=hargaAwal  G=hargaTerakhir
//  MASTER TOKO      : B=nama
//  RAB              : B=kodeProj  C=material  D=upah  E=subkon  F=overhead  G=total  H=tglUpdate
//                     I=labelMat  J=labelUpah  K=labelSubkon  L=labelOverhead
//  MASTER SUBKON    : B=id  C=nama  D=spesialisasi  E=noHP  F=alamat
//  LOG SUBKON       : A=id  B=tgl  C=kodeProj  D=namaProj  E=idSubkon  F=namaSubkon
//                     G=uraian  H=nilaiKontrak  I=statusBayar  J=nominalBayar  K=tglBayar  L=ket
// ════════════════════════════════════════════════════════════════════════

function _apiParseVariasi(v) {
  try { var a = JSON.parse(String(v || "")); return (a && a.length) ? a : []; }
  catch (e) { return []; }
}

// ── Helper: end row dinamis ────────────────────────────────────────────
// Ambil last row dari sheet, pastikan >= start (jika sheet kosong, return start-1 → skip)
function _endRow(ws, start) {
  var last = ws.getLastRow();
  return (last < start) ? start - 1 : last;
}

function _apiReadProjects(ss) {
  var ws = ss.getSheetByName(SHEET.PROJECT);
  if (!ws) return [];
  var s = ROWS.PROJECT.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":Q" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue; // B = kode
    out.push({
      kode:         String(r[0]),
      nama:         String(r[1]  || ""),
      jenis:        String(r[2]  || ""),
      status:       String(r[3]  || "Berjalan"),
      nilaiKontrak: Number(r[4]) || 0,
      biayaMat:     Number(r[5]) || 0,
      biayaUpah:    Number(r[6]) || 0,
      totalBiaya:   Number(r[7]) || 0,
      laba:         Number(r[8]) || 0,
      margin:       Number(r[9]) || 0,
      tglMulai:     _apiSerDate(r[10]),
      pembayaran:   Number(r[11]) || 0,
      piutang:      Number(r[12]) || 0,
      catatan:      String(r[13] || ""),    // O
      progress:     Number(r[14]) || 0,     // P
      variasi:      _apiParseVariasi(r[15]) // Q
    });
  }
  return out;
}

function _apiReadPembelian(ss) {
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return [];
  var s = ROWS.PEMBELIAN.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("A" + s + ":L" + e).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[3]).trim() === "") continue; // D = namaBarang (index 3 dari A)
    cnt++;
    out.push({
      id:         "BLI-GS-" + cnt,
      tgl:        _apiSerDate(r[1]),
      kodeProj:   String(r[2]  || ""),
      namaBarang: String(r[3]  || ""),
      kategori:   String(r[4]  || ""),
      satuan:     String(r[5]  || "pcs"),
      qty:        Number(r[6]) || 0,
      harga:      Number(r[7]) || 0,
      diskon:     Number(r[8]) || 0,
      status:     String(r[9]  || "HABIS"),
      toko:       String(r[10] || ""),
      total:      Number(r[11]) || 0
    });
  }
  return out;
}

function _apiReadKaryawan(ss) {
  var ws = ss.getSheetByName(SHEET.KARYAWAN);
  if (!ws) return [];
  var s = ROWS.KARYAWAN.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":L" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue; // B = id
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
      catatan:    String(r[10] || "")
    });
  }
  return out;
}

function _apiReadLogAbsensi(ss) {
  var ws = ss.getSheetByName(SHEET.ABSENSI);
  if (!ws) return [];
  var s = ROWS.ABSENSI.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("A" + s + ":N" + e).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = idKaryawan
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
      jamLembur:   Number(r[12]) || 0,
      upahLembur:  Number(r[13]) || 0
    });
  }
  return out;
}

function _apiReadLogKasbon(ss) {
  var ws = ss.getSheetByName(SHEET.KASBON);
  if (!ws) return [];
  var s = ROWS.KASBON.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("A" + s + ":I" + e).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = idKaryawan
    cnt++;
    out.push({
      id:         "KSB-GS-" + cnt,
      tgl:        _apiSerDate(r[1]),
      idKaryawan: String(r[2] || ""),
      tipe:       String(r[3] || ""),
      nominal:    Number(r[4]) || 0,
      nama:       String(r[5] || ""),
      noClosing:  String(r[6] || ""),
      ket:        String(r[7] || ""),
      kodeProj:   String(r[8] || "")
    });
  }
  return out;
}

function _apiReadLogPembayaran(ss) {
  var ws = ss.getSheetByName(SHEET.PEMBAYARAN);
  if (!ws) return [];
  var s = ROWS.PEMBAYARAN.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("A" + s + ":I" + e).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = kodeProj
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
      ref:      String(r[8] || "")
    });
  }
  return out;
}

function _apiReadBarang(ss) {
  var ws = ss.getSheetByName(SHEET.BARANG);
  if (!ws) return [];
  var s = ROWS.BARANG.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":G" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === "") continue; // C = nama (index 1 dari B)
    out.push({
      id:            String(data[i][0] || "BRG-" + (i + 1)),
      nama:          String(data[i][1] || ""),
      kategori:      String(data[i][2] || ""),
      satuan:        String(data[i][3] || "pcs"),
      hargaTerakhir: Number(data[i][5]) || 0  // G (index 5 dari B)
    });
  }
  return out;
}

function _apiReadToko(ss) {
  var ws = ss.getSheetByName(SHEET.TOKO);
  if (!ws) return [];
  var s = ROWS.TOKO.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":B" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    var v = String(data[i][0]).trim();
    if (v !== "") out.push(v);
  }
  return out;
}

// ── RAB ────────────────────────────────────────────────────────────────
// Sheet: A=No B=kodeProj C=material D=upah E=subkon F=overhead G=total H=tglUpdate
//        I=labelMat J=labelUpah K=labelSubkon L=labelOverhead
function _apiReadRAB(ss) {
  var ws = ss.getSheetByName(SHEET.RAB);
  if (!ws) return [];
  var s = ROWS.RAB.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":L" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue; // B = kodeProj
    out.push({
      kodeProj:      String(r[0]),
      material:      Number(r[1]) || 0,
      upah:          Number(r[2]) || 0,
      subkon:        Number(r[3]) || 0,
      overhead:      Number(r[4]) || 0,
      total:         Number(r[5]) || 0,
      tglUpdate:     _apiSerDate(r[6]),
      labelMat:      String(r[7]  || ""),
      labelUpah:     String(r[8]  || ""),
      labelSubkon:   String(r[9]  || ""),
      labelOverhead: String(r[10] || "")
    });
  }
  return out;
}

// ── Subkontraktor ─────────────────────────────────────────────────────
function _apiReadSubkon(ss) {
  var ws = ss.getSheetByName(SHEET.SUBKON);
  if (!ws) return [];
  var s = ROWS.SUBKON.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("B" + s + ":F" + e).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]).trim() === "") continue; // B = id
    out.push({
      id:           String(r[0]),
      nama:         String(r[1] || ""),
      spesialisasi: String(r[2] || ""),
      noHP:         String(r[3] || ""),
      alamat:       String(r[4] || "")
    });
  }
  return out;
}

// Sheet: A=id(no) B=tgl C=kodeProj D=namaProj E=idSubkon F=namaSubkon
//        G=uraian H=nilaiKontrak I=statusBayar J=nominalBayar K=tglBayar L=ket
function _apiReadLogSubkon(ss) {
  var ws = ss.getSheetByName(SHEET.LOG_SUBKON);
  if (!ws) return [];
  var s = ROWS.LOG_SUBKON.start;
  var e = _endRow(ws, s); if (e < s) return [];
  var data = ws.getRange("A" + s + ":L" + e).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = kodeProj
    cnt++;
    out.push({
      id:           String(r[0]).trim() || ("LSK-GS-" + cnt),
      tgl:          _apiSerDate(r[1]),
      kodeProj:     String(r[2]  || ""),
      namaProj:     String(r[3]  || ""),
      idSubkon:     String(r[4]  || ""),
      namaSubkon:   String(r[5]  || ""),
      uraian:       String(r[6]  || ""),
      nilaiKontrak: Number(r[7]) || 0,
      statusBayar:  String(r[8]  || "Belum Dibayar"),
      nominalBayar: Number(r[9]) || 0,
      tglBayar:     _apiSerDate(r[10]),
      ket:          String(r[11] || "")
    });
  }
  return out;
}
