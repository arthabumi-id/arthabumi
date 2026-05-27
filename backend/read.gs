// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — read.gs  v1.9
// Semua fungsi READ: ambil data dari GSheet → kirim ke app
//
// BUG FIXES vs versi sebelumnya:
//   ✅ _apiReadRAB: tambah field total (r[5]) yang sebelumnya hilang
//   ✅ Gunakan konstanta SHEET.* dan ROWS.* dari constants.gs
//   ✅ Tambah field progress (kolom P) — Session 3
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
//  LOG KASBON       : B=tgl  C=idKaryawan  D=tipe  E=nominal  F=nama  G=noClosing  H=ket
//  LOG PEMBAYARAN   : B=tgl  C=kodeProj  D=namaProj  E=nominal  F=metode  G=bank  H=ket  I=ref
//  MASTER BARANG    : B=id   C=nama   D=kategori  E=satuan  F=hargaAwal  G=hargaTerakhir
//  MASTER TOKO      : B=nama
//  RAB              : B=kodeProj  C=material  D=upah  E=subkon  F=overhead  G=total  H=tglUpdate
//  MASTER SUBKON    : B=id  C=nama  D=spesialisasi  E=noHP  F=alamat
//  LOG SUBKON       : A=id  B=tgl  C=kodeProj  D=namaProj  E=idSubkon  F=namaSubkon
//                     G=uraian  H=nilaiKontrak  I=statusBayar  J=nominalBayar  K=tglBayar  L=ket
// ════════════════════════════════════════════════════════════════════════

function _apiReadProjects(ss) {
  var ws = ss.getSheetByName(SHEET.PROJECT);
  if (!ws) return [];
  var R    = ROWS.PROJECT;
  var data = ws.getRange("B" + R.start + ":P" + R.end).getValues();
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
      catatan:      String(r[13] || ""),   // O = catatan bebas
      progress:     Number(r[14]) || 0     // P = progress (0-100%)
    });
  }
  return out;
}

function _apiReadPembelian(ss) {
  var ws = ss.getSheetByName(SHEET.PEMBELIAN);
  if (!ws) return [];
  var R    = ROWS.PEMBELIAN;
  var data = ws.getRange("A" + R.start + ":L" + R.end).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[3]).trim() === "") continue; // D = namaBarang (index 3 dari A)
    cnt++;
    out.push({
      id:         "BLI-GS-" + cnt,
      tgl:        _apiSerDate(r[1]),        // B
      kodeProj:   String(r[2]  || ""),      // C
      namaBarang: String(r[3]  || ""),      // D
      kategori:   String(r[4]  || ""),      // E
      satuan:     String(r[5]  || "pcs"),   // F
      qty:        Number(r[6]) || 0,        // G
      harga:      Number(r[7]) || 0,        // H
      diskon:     Number(r[8]) || 0, // I (nominal Rp)
      status:     String(r[9]  || "HABIS"), // J
      toko:       String(r[10] || ""),      // K
      total:      Number(r[11]) || 0        // L
    });
  }
  return out;
}

function _apiReadKaryawan(ss) {
  var ws = ss.getSheetByName(SHEET.KARYAWAN);
  if (!ws) return [];
  var R    = ROWS.KARYAWAN;
  var data = ws.getRange("B" + R.start + ":L" + R.end).getValues();
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
  var R    = ROWS.ABSENSI;
  var data = ws.getRange("A" + R.start + ":N" + R.end).getValues(); // extended to N for lembur fields
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
      jamLembur:   Number(r[12]) || 0,  // M = jamLembur (v1.12)
      upahLembur:  Number(r[13]) || 0   // N = upahLembur (v1.12)
    });
  }
  return out;
}

function _apiReadLogKasbon(ss) {
  var ws = ss.getSheetByName(SHEET.KASBON);
  if (!ws) return [];
  var R    = ROWS.KASBON;
  var data = ws.getRange("A" + R.start + ":H" + R.end).getValues();
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
      ket:        String(r[7] || "")
    });
  }
  return out;
}

function _apiReadLogPembayaran(ss) {
  var ws = ss.getSheetByName(SHEET.PEMBAYARAN);
  if (!ws) return [];
  var R    = ROWS.PEMBAYARAN;
  var data = ws.getRange("A" + R.start + ":I" + R.end).getValues();
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
  var R    = ROWS.BARANG;
  // Range dari B (id) sampai G (hargaTerakhir)
  var data = ws.getRange("B" + R.start + ":G" + R.end).getValues();
  var out  = [];
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === "") continue; // C = nama (index 1 dari B)
    out.push({
      id:            String(data[i][0] || "BRG-" + (i + 1)),  // B
      nama:          String(data[i][1] || ""),                  // C
      kategori:      String(data[i][2] || ""),                  // D
      satuan:        String(data[i][3] || "pcs"),               // E
      hargaTerakhir: Number(data[i][5]) || 0                    // G (index 5 dari B)
    });
  }
  return out;
}

function _apiReadToko(ss) {
  var ws = ss.getSheetByName(SHEET.TOKO);
  if (!ws) return [];
  var R    = ROWS.TOKO;
  var data = ws.getRange("B" + R.start + ":B" + R.end).getValues();
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
// Range B4:L103 → index: 0=kodeProj 1=material 2=upah 3=subkon 4=overhead 5=total 6=tglUpdate
//                         7=labelMat 8=labelUpah 9=labelSubkon 10=labelOverhead
function _apiReadRAB(ss) {
  var ws = ss.getSheetByName(SHEET.RAB);
  if (!ws) return [];
  var R    = ROWS.RAB;
  var data = ws.getRange("B" + R.start + ":L" + R.end).getValues();
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
      total:         Number(r[5]) || 0,    // G = total
      tglUpdate:     _apiSerDate(r[6]),    // H = tglUpdate
      labelMat:      String(r[7]  || ""),  // I = labelMat
      labelUpah:     String(r[8]  || ""),  // J = labelUpah
      labelSubkon:   String(r[9]  || ""),  // K = labelSubkon
      labelOverhead: String(r[10] || "")   // L = labelOverhead
    });
  }
  return out;
}

// ── Subkontraktor ─────────────────────────────────────────────────────
// Sheet: A=No B=id C=nama D=spesialisasi E=noHP F=alamat
function _apiReadSubkon(ss) {
  var ws = ss.getSheetByName(SHEET.SUBKON);
  if (!ws) return [];
  var R    = ROWS.SUBKON;
  var data = ws.getRange("B" + R.start + ":F" + R.end).getValues();
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
  var R    = ROWS.LOG_SUBKON;
  var data = ws.getRange("A" + R.start + ":L" + R.end).getValues();
  var out  = [], cnt = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[2]).trim() === "") continue; // C = kodeProj
    cnt++;
    out.push({
      id:           String(r[0]).trim() || ("LSK-GS-" + cnt), // A = id dari kolom A
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
