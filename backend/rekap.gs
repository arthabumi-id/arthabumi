// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — rekap.gs  v1.14 (kasbon model v2)
// Membuat / memperbarui sheet REKAP di GSheet
//
// Dipanggil via: action=updateRekap (dari config.gs)
// Atau manual: jalankan _apiUpdateRekap() langsung dari Apps Script editor
//
// Sheet REKAP berisi:
//   - KPI summary (total kontrak, biaya, laba, bayar) di atas
//   - Tabel per-proyek dengan breakdown biaya lengkap
//   - Kalkulasi sama persis dengan logic app (calcKasbonForProj)
// ════════════════════════════════════════════════════════════════════════

function _apiUpdateRekap(ss) {
  var REKAP_SHEET = "REKAP";

  // ── 1. Baca semua data mentah ─────────────────────────────────────────
  var projects    = _apiReadProjects(ss);
  var pembelian   = _apiReadPembelian(ss);
  var logAbsensi  = _apiReadLogAbsensi(ss);
  var logKasbon   = _apiReadLogKasbon(ss);
  var logPembayaran = _apiReadLogPembayaran(ss);
  var logSubkon   = _apiReadLogSubkon(ss);

  // ── 2. Hitung per-proyek (sama persis dengan frontend) ───────────────
  var rows = projects.map(function(p) {
    var kode = p.kode;

    // Material (qty × harga − diskon), exclude ASET
    var mat = pembelian
      .filter(function(b){ return b.kodeProj === kode && b.status !== "ASET"; })
      .reduce(function(s, b){ return s + (Number(b.qty)||0) * (Number(b.harga)||0) - (Number(b.diskon)||0); }, 0);

    // Upah gross dari absensi
    var upahGross = logAbsensi
      .filter(function(a){ return a.kodeProj === kode; })
      .reduce(function(s, a){ return s + (Number(a.upahHariIni)||0); }, 0);

    // Subkon
    var subkon = logSubkon
      .filter(function(ls){ return ls.kodeProj === kode; })
      .reduce(function(s, ls){ return s + (Number(ls.nilaiKontrak)||0); }, 0);

    // Kasbon POTONG dibebankan ke proyek ini (v2 — kodeProj langsung, tidak via noClosing)
    var potong = logKasbon
      .filter(function(k){ return k.kodeProj === kode && k.tipe === "POTONG"; })
      .reduce(function(s, k){ return s + (Number(k.nominal)||0); }, 0);

    // Kasbon BONUS
    var bonus = logKasbon
      .filter(function(k){ return k.kodeProj === kode && k.tipe === "BONUS"; })
      .reduce(function(s, k){ return s + (Number(k.nominal)||0); }, 0);

    // Bayar dari klien
    var bayar = logPembayaran
      .filter(function(x){ return x.kodeProj === kode; })
      .reduce(function(s, x){ return s + (Number(x.nominal)||0); }, 0);

    // Turunan — v2: biaya = material + upah gross + subkon + potong + bonus
    var totalBiaya = mat + upahGross + subkon + potong + bonus;
    var laba       = (Number(p.nilaiKontrak)||0) - totalBiaya;
    var margin     = p.nilaiKontrak > 0 ? laba / p.nilaiKontrak : 0;
    var piutang    = (Number(p.nilaiKontrak)||0) - bayar;

    return {
      kode: kode, nama: p.nama, jenis: p.jenis, status: p.status,
      nilaiKontrak: Number(p.nilaiKontrak)||0,
      mat: mat, upahGross: upahGross, subkon: subkon,
      potong: potong, bonus: bonus,
      totalBiaya: totalBiaya, laba: laba, margin: margin,
      bayar: bayar, piutang: piutang,
      progress: Number(p.progress)||0,
      tglMulai: p.tglMulai || ""
    };
  });

  // ── 3. Hitung KPI total ───────────────────────────────────────────────
  function sumF(arr, f){ return arr.reduce(function(s,r){ return s+(Number(r[f])||0); }, 0); }
  var tKontrak   = sumF(rows, "nilaiKontrak");
  var tMat       = sumF(rows, "mat");
  var tUpahGross = sumF(rows, "upahGross");
  var tSubkon    = sumF(rows, "subkon");
  var tPotong    = sumF(rows, "potong");
  var tBonus     = sumF(rows, "bonus");
  var tBiaya     = sumF(rows, "totalBiaya");
  var tLaba      = sumF(rows, "laba");
  var tBayar     = sumF(rows, "bayar");
  var tPiutang   = sumF(rows, "piutang");

  // ── 4. Get / Create sheet REKAP ───────────────────────────────────────
  var wsRekap = ss.getSheetByName(REKAP_SHEET);
  if (!wsRekap) {
    wsRekap = ss.insertSheet(REKAP_SHEET, 0); // posisi pertama
  }
  wsRekap.clearContents();
  wsRekap.clearFormats();

  var now = Utilities.formatDate(new Date(), TZ, "dd/MM/yyyy HH:mm");

  // ── 5. Row 1-2: Judul ──────────────────────────────────────────────────
  wsRekap.getRange("A1:R1").merge()
    .setValue("📊  REKAP ARTHABUMI — Semua Proyek")
    .setFontWeight("bold").setFontSize(14).setFontColor("#1e293b")
    .setBackground("#f8fafc").setVerticalAlignment("middle");
  wsRekap.setRowHeight(1, 36);

  wsRekap.getRange("A2:R2").merge()
    .setValue("Terakhir diperbarui: " + now + "   |   Total " + rows.length + " proyek")
    .setFontSize(9).setFontColor("#94a3b8").setBackground("#f8fafc");

  // ── 6. Row 3: Spacer ──────────────────────────────────────────────────
  wsRekap.getRange("A3:R3").merge().setBackground("#f8fafc");

  // ── 7. Row 4-6: KPI Summary (5 kotak) ─────────────────────────────────
  var kpis = [
    { lbl:"TOTAL KONTRAK",   val:tKontrak, bg:"#dbeafe", clr:"#1d4ed8", col:1, span:3 },
    { lbl:"TOTAL BIAYA",     val:tBiaya,   bg:"#ffedd5", clr:"#c2410c", col:4, span:3 },
    { lbl:"EST. LABA",       val:tLaba,    bg:tLaba>=0?"#dcfce7":"#fee2e2", clr:tLaba>=0?"#15803d":"#dc2626", col:7, span:3 },
    { lbl:"SUDAH DITERIMA",  val:tBayar,   bg:"#f3e8ff", clr:"#6d28d9", col:10, span:3 },
    { lbl:"SISA TAGIH",      val:tPiutang, bg:tPiutang>0?"#fff7ed":"#f0fdf4", clr:tPiutang>0?"#dc2626":"#16a34a", col:13, span:3 }
  ];
  kpis.forEach(function(k) {
    var r1 = wsRekap.getRange(4, k.col, 1, k.span).merge()
      .setValue(k.lbl).setFontSize(8).setFontWeight("bold").setFontColor("#475569")
      .setBackground(k.bg).setHorizontalAlignment("center").setVerticalAlignment("middle");
    var r2 = wsRekap.getRange(5, k.col, 2, k.span).merge()
      .setValue(k.val).setNumberFormat("#,##0").setFontSize(12).setFontWeight("bold")
      .setFontColor(k.clr).setBackground(k.bg).setHorizontalAlignment("center").setVerticalAlignment("middle");
    wsRekap.getRange(4, k.col, 3, k.span)
      .setBorder(true,true,true,true,false,false,"#e2e8f0",SpreadsheetApp.BorderStyle.SOLID);
  });
  wsRekap.setRowHeight(4, 22);
  wsRekap.setRowHeight(5, 28);
  wsRekap.setRowHeight(6, 28);
  wsRekap.getRange("A7:R7").merge().setBackground("#f8fafc"); // spacer

  // ── 8. Row 8: Header Tabel ────────────────────────────────────────────
  var HDR = [
    "No","Kode","Nama Proyek","Jenis","Status",
    "Nilai Kontrak","Material","Upah Gross","Subkon",
    "Kasbon Potong","Kasbon Bonus","Total Biaya",
    "Est. Laba","Margin%","Sudah Bayar","Piutang","Progress%","Tgl Mulai"
  ];
  // Kolom: 1=No 2=Kode 3=Nama 4=Jenis 5=Status
  //        6=Kontrak 7=Mat 8=UpahGross 9=Subkon
  //        10=KasbonPotong 11=KasbonBonus 12=TotalBiaya
  //        13=Laba 14=Margin% 15=Bayar 16=Piutang 17=Progress% 18=TglMulai
  var HDR_ROW = 8;
  wsRekap.getRange(HDR_ROW, 1, 1, HDR.length)
    .setValues([HDR])
    .setFontWeight("bold").setFontSize(9).setFontColor("#ffffff")
    .setBackground("#334155").setHorizontalAlignment("center").setVerticalAlignment("middle");
  wsRekap.setRowHeight(HDR_ROW, 28);
  wsRekap.setFrozenRows(HDR_ROW);

  // ── 9. Data rows (row 9+) ─────────────────────────────────────────────
  var STATUS_BG = { "Berjalan":"#dcfce7","Selesai":"#dbeafe","Hold":"#fef9c3","Batal":"#fee2e2" };

  var dataArr = rows.map(function(r, i) {
    return [
      i+1,
      r.kode,
      r.nama,
      r.jenis,
      r.status,
      r.nilaiKontrak,
      r.mat,
      r.upahGross,
      r.subkon,
      r.potong,
      r.bonus,
      r.totalBiaya,
      r.laba,
      r.margin,
      r.bayar,
      r.piutang,
      r.progress / 100,
      r.tglMulai
    ];
  });

  if (dataArr.length > 0) {
    var startRow = HDR_ROW + 1;
    wsRekap.getRange(startRow, 1, dataArr.length, HDR.length).setValues(dataArr);

    // Format angka (kolom sesuai HDR 18-kolom v2)
    var fRp = "#,##0";
    wsRekap.getRange(startRow, 6,  dataArr.length, 1).setNumberFormat(fRp);  // Kontrak
    wsRekap.getRange(startRow, 7,  dataArr.length, 1).setNumberFormat(fRp);  // Material
    wsRekap.getRange(startRow, 8,  dataArr.length, 1).setNumberFormat(fRp);  // Upah Gross
    wsRekap.getRange(startRow, 9,  dataArr.length, 1).setNumberFormat(fRp);  // Subkon
    wsRekap.getRange(startRow, 10, dataArr.length, 1).setNumberFormat(fRp);  // Kasbon Potong
    wsRekap.getRange(startRow, 11, dataArr.length, 1).setNumberFormat(fRp);  // Kasbon Bonus
    wsRekap.getRange(startRow, 12, dataArr.length, 1).setNumberFormat(fRp);  // Total Biaya
    wsRekap.getRange(startRow, 13, dataArr.length, 1).setNumberFormat(fRp);  // Laba
    wsRekap.getRange(startRow, 14, dataArr.length, 1).setNumberFormat("0.0%"); // Margin
    wsRekap.getRange(startRow, 15, dataArr.length, 1).setNumberFormat(fRp);  // Bayar
    wsRekap.getRange(startRow, 16, dataArr.length, 1).setNumberFormat(fRp);  // Piutang
    wsRekap.getRange(startRow, 17, dataArr.length, 1).setNumberFormat("0%"); // Progress

    // Warna per baris
    for (var i = 0; i < dataArr.length; i++) {
      var rn  = startRow + i;
      var bg  = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      wsRekap.getRange(rn, 1, 1, HDR.length).setBackground(bg).setFontSize(9).setVerticalAlignment("middle");
      wsRekap.setRowHeight(rn, 22);

      // Status chip warna
      var sBg = STATUS_BG[dataArr[i][4]] || "#f1f5f9";
      wsRekap.getRange(rn, 5).setBackground(sBg).setFontWeight("bold").setHorizontalAlignment("center");

      // Laba warna (col 13, index 12)
      wsRekap.getRange(rn, 13).setFontColor(dataArr[i][12] >= 0 ? "#15803d" : "#dc2626").setFontWeight("bold");

      // Piutang warna (col 16, index 15)
      if (dataArr[i][15] > 0) {
        wsRekap.getRange(rn, 16).setFontColor("#dc2626").setFontWeight("bold");
      } else {
        wsRekap.getRange(rn, 16).setFontColor("#16a34a");
      }
    }

    // Border tabel
    wsRekap.getRange(HDR_ROW, 1, dataArr.length+1, HDR.length)
      .setBorder(true,true,true,true,true,true,"#e2e8f0",SpreadsheetApp.BorderStyle.SOLID);
  }

  // ── 10. Total row ─────────────────────────────────────────────────────
  // HDR columns v2: 1=No 2=Kode 3=Nama 4=Jenis 5=Status
  //   6=Kontrak 7=Mat 8=UpahGross 9=Subkon
  //   10=KasbonPotong 11=KasbonBonus 12=TotalBiaya
  //   13=Laba 14=Margin% 15=Bayar 16=Piutang 17=Progress% 18=TglMulai
  if (dataArr.length > 0) {
    var totRow = HDR_ROW + dataArr.length + 1;
    wsRekap.getRange(totRow, 1, 1, 5)
      .merge().setValue("TOTAL").setFontWeight("bold").setFontSize(10)
      .setBackground("#334155").setFontColor("#ffffff").setHorizontalAlignment("center");
    // 11 nilai: col 6 → 16 (span=11); skip Margin% (col 14) → isi ""
    var totVals = [tKontrak, tMat, tUpahGross, tSubkon,
                   tPotong, tBonus, tBiaya, tLaba,
                   "", tBayar, tPiutang];
    wsRekap.getRange(totRow, 6, 1, 11)
      .setValues([totVals])
      .setFontWeight("bold").setBackground("#f1f5f9").setFontSize(9);
    // Format angka (skip col 14 = Margin% yang diisi "")
    var totNumCols = [6,7,8,9,10,11,12,13,15,16];
    totNumCols.forEach(function(c){ wsRekap.getRange(totRow, c).setNumberFormat("#,##0"); });
    wsRekap.getRange(totRow, 13).setFontColor(tLaba>=0?"#15803d":"#dc2626");
    wsRekap.getRange(totRow, 16).setFontColor(tPiutang>0?"#dc2626":"#16a34a");
  }

  // ── 11. Lebar kolom ───────────────────────────────────────────────────
  var colW = [35,65,190,100,75,115,105,105,90,105,90,115,110,60,110,100,60,90]; // 18 kolom v2
  for (var c = 0; c < colW.length; c++) {
    wsRekap.setColumnWidth(c+1, colW[c]);
  }
}
