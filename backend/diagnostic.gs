// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — diagnostic.gs  v1.8
// Tool untuk cek kesehatan sistem — jalankan dari Apps Script Editor
//
// FIX vs versi sebelumnya:
//   ✅ Hilangkan eval() — ganti dengan cek typeof langsung (aman)
//   ✅ Gunakan konstanta SHEET.* dari constants.gs
// ════════════════════════════════════════════════════════════════════════

// Jalankan ini dari Apps Script Editor: Execution → diagnosticCheck
function diagnosticCheck() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var log = [];
  var ok  = 0;
  var err = 0;

  // ── 1. Cek semua sheet wajib ada ────────────────────────────────────
  log.push("─── SHEET CHECK ───────────────────────");
  var allSheets = [
    SHEET.PROJECT, SHEET.PEMBELIAN, SHEET.KARYAWAN,
    SHEET.ABSENSI, SHEET.KASBON,   SHEET.PEMBAYARAN,
    SHEET.BARANG,  SHEET.TOKO,     SHEET.RAB,
    SHEET.SUBKON,  SHEET.LOG_SUBKON
  ];
  allSheets.forEach(function (name) {
    var ws = ss.getSheetByName(name);
    if (ws) {
      log.push("✅ Sheet: " + name);
      ok++;
    } else {
      log.push("❌ Sheet: " + name + " — TIDAK ADA! Jalankan setupAllSheets()");
      err++;
    }
  });

  // ── 2. Cek fungsi READ tersedia (tanpa eval) ─────────────────────────
  log.push("─── FUNGSI READ ────────────────────────");
  var readFns = [
    { name: "_apiReadProjects",    fn: typeof _apiReadProjects    },
    { name: "_apiReadPembelian",   fn: typeof _apiReadPembelian   },
    { name: "_apiReadKaryawan",    fn: typeof _apiReadKaryawan    },
    { name: "_apiReadLogAbsensi",  fn: typeof _apiReadLogAbsensi  },
    { name: "_apiReadLogKasbon",   fn: typeof _apiReadLogKasbon   },
    { name: "_apiReadLogPembayaran", fn: typeof _apiReadLogPembayaran },
    { name: "_apiReadRAB",         fn: typeof _apiReadRAB         },
    { name: "_apiReadSubkon",      fn: typeof _apiReadSubkon      },
    { name: "_apiReadLogSubkon",   fn: typeof _apiReadLogSubkon   }
  ];
  readFns.forEach(function (f) {
    if (f.fn === "function") {
      log.push("✅ " + f.name);
      ok++;
    } else {
      log.push("❌ " + f.name + " — tidak ditemukan");
      err++;
    }
  });

  // ── 3. Cek fungsi WRITE tersedia (tanpa eval) ────────────────────────
  log.push("─── FUNGSI WRITE ───────────────────────");
  var writeFns = [
    { name: "_apiAddProject",       fn: typeof _apiAddProject      },
    { name: "_apiAddPembelian",     fn: typeof _apiAddPembelian    },
    { name: "_apiAddKaryawan",      fn: typeof _apiAddKaryawan     },
    { name: "_apiAddAbsensi",       fn: typeof _apiAddAbsensi      },
    { name: "_apiAddKasbon",        fn: typeof _apiAddKasbon       },
    { name: "_apiAddPembayaran",    fn: typeof _apiAddPembayaran   },
    { name: "_apiFinalizeClosing",  fn: typeof _apiFinalizeClosing },
    { name: "_apiSaveRAB",          fn: typeof _apiSaveRAB         },
    { name: "_apiAddLogSubkon",     fn: typeof _apiAddLogSubkon    }
  ];
  writeFns.forEach(function (f) {
    if (f.fn === "function") {
      log.push("✅ " + f.name);
      ok++;
    } else {
      log.push("❌ " + f.name + " — tidak ditemukan");
      err++;
    }
  });

  // ── 4. Cek fungsi HELPER tersedia ────────────────────────────────────
  log.push("─── FUNGSI HELPER ──────────────────────");
  var helperFns = [
    { name: "_apiSerDate",   fn: typeof _apiSerDate  },
    { name: "_apiParseDate", fn: typeof _apiParseDate },
    { name: "_apiFindNext",  fn: typeof _apiFindNext  },
    { name: "_apiFindRow",   fn: typeof _apiFindRow   },
    { name: "_getSep",       fn: typeof _getSep       },
    { name: "_sanitizeStr",  fn: typeof _sanitizeStr  },
    { name: "_sanitizeNum",  fn: typeof _sanitizeNum  }
  ];
  helperFns.forEach(function (f) {
    if (f.fn === "function") {
      log.push("✅ " + f.name);
      ok++;
    } else {
      log.push("❌ " + f.name + " — tidak ditemukan");
      err++;
    }
  });

  // ── 5. Cek konstanta SHEET dan ROWS ──────────────────────────────────
  log.push("─── KONSTANTA ──────────────────────────");
  if (typeof SHEET !== "undefined" && SHEET.PROJECT) {
    log.push("✅ SHEET constants OK");
    ok++;
  } else {
    log.push("❌ SHEET constants TIDAK ADA — cek constants.gs");
    err++;
  }
  if (typeof ROWS !== "undefined" && ROWS.PROJECT) {
    log.push("✅ ROWS constants OK");
    ok++;
  } else {
    log.push("❌ ROWS constants TIDAK ADA — cek constants.gs");
    err++;
  }

  // ── 6. Test doGet simulasi (read-only) ───────────────────────────────
  log.push("─── INTEGRATION TEST ───────────────────");
  try {
    var fakeE  = { parameter: { action: "getAllData" } };
    var result = doGet(fakeE);
    var json   = JSON.parse(result.getContent());
    if (json.ok) {
      log.push("✅ doGet getAllData OK — " +
        (json.data.projects  || []).length + " proyek, " +
        (json.data.karyawan  || []).length + " karyawan, " +
        (json.data.pembelian || []).length + " pembelian");
      ok++;
    } else {
      log.push("❌ doGet error: " + json.error);
      err++;
    }
  } catch (e) {
    log.push("❌ doGet crash: " + e.message);
    err++;
  }

  // ── 7. Test write kecil — addProject lalu deleteProject ──────────────
  try {
    var fakeAdd = { parameter: { action: "addProject", payload: JSON.stringify({
      kode: "DIAG-TEST-999", nama: "Diagnostic Test", jenis: "Lainnya",
      status: "Berjalan", nilaiKontrak: 0, tglMulai: ""
    })}};
    var addResult = doGet(fakeAdd);
    var addJson   = JSON.parse(addResult.getContent());
    if (addJson.ok) {
      var fakeDel = { parameter: { action: "deleteProject", payload: JSON.stringify({ kode: "DIAG-TEST-999" }) }};
      doGet(fakeDel);
      log.push("✅ Write test OK — addProject + deleteProject berhasil");
      ok++;
    } else {
      log.push("❌ Write test gagal: " + addJson.error);
      err++;
    }
  } catch (e) {
    log.push("❌ Write test crash: " + e.message);
    err++;
  }

  // ── 8. Cek timezone ──────────────────────────────────────────────────
  try {
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    if (tz === TZ || tz === "Asia/Jakarta") {
      log.push("✅ Timezone: " + tz + " (WIB — benar)");
      ok++;
    } else {
      log.push("⚠️  Timezone: " + tz + " — harusnya Asia/Jakarta, jalankan setIndonesiaLocale()");
    }
  } catch (e) {
    log.push("❌ Timezone check error: " + e.message);
  }

  // ── Tampilkan ringkasan ───────────────────────────────────────────────
  Logger.log("═══════════════════════════════════════════");
  Logger.log("  ARTHABUMI DIAGNOSTIC REPORT v1.8");
  Logger.log("═══════════════════════════════════════════");
  log.forEach(function (l) { Logger.log(l); });
  Logger.log("═══════════════════════════════════════════");
  Logger.log("  HASIL: " + ok + " OK | " + err + " ERROR");
  if (err === 0) {
    Logger.log("  ✅ SISTEM SEHAT — siap dipakai");
  } else {
    Logger.log("  ❌ ADA " + err + " MASALAH — periksa log di atas");
  }
  Logger.log("═══════════════════════════════════════════");
}
