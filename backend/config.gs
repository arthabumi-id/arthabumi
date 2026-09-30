// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — config.gs  v1.11 (v1.38: token · v1.39: jalur ringan utk FCC · v1.40: closing & bayar subkon FCC)
// Isi: Entry Points (doGet/doPost) + Router ONLY
//
// Helper date/find functions → helpers.gs
// Sheet setup & format       → setup.gs
// Sheet name constants       → constants.gs
// ════════════════════════════════════════════════════════════════════════

// ── Token keamanan (v1.38) ─────────────────────────────────────────────
// Token disimpan di Project Settings → Script Properties → API_TOKEN (BUKAN di file,
// karena repo GitHub publik). Kosong = backend terbuka seperti dulu.
function _apiToken() {
  var t = "";
  try { t = PropertiesService.getScriptProperties().getProperty("API_TOKEN") || ""; } catch (e) {}
  return String(t || API_TOKEN || "").trim();
}
function _apiTokenSalah(given) {
  var tok = _apiToken();
  return !!tok && String(given || "") !== tok;
}
var _ERR_TOKEN = "Token salah / belum diisi — cek Pengaturan → Token Keamanan";

// Jalankan SEKALI dari editor (Run) untuk membuat token acak → lihat Execution log, salin.
// Fungsi ini TIDAK memasang token; pasang sendiri di Script Properties setelah semua HP diisi.
function buatToken() {
  var t = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "").slice(0, 8);
  Logger.log("Token baru (salin): " + t);
  return t;
}

// ── Entry Point GET ────────────────────────────────────────────────────
// Digunakan untuk READ dan WRITE (karena limitasi CORS Google Apps Script)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var p  = e && e.parameter ? e.parameter : {};

    // ── Token check (v1.38: Script Properties API_TOKEN) ──
    if (_apiTokenSalah(p.token)) {
      return _apiError(new Error(_ERR_TOKEN));
    }

    var action = p.action || "getAllData";
    // v1.39: baca ringan untuk FCC (Tes sambungan, daftar barang) — tanpa log pembelian/absensi/kasbon
    if (action === "ringkas") return _apiRingkas(ss);
    // v1.40: closing gaji untuk antrean FCC (tanggal bayar >= sejak)
    if (action === "closing") return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ts: new Date().getTime(), data: { closing: _apiClosingFCC(ss, p.sejak || "") } }))
      .setMimeType(ContentService.MimeType.JSON);
    if (action !== "getAllData") {
      var payload = {};
      try { payload = JSON.parse(p.payload || "{}"); } catch (pe) {
        return _apiError(new Error("Payload JSON tidak valid: " + pe.message));
      }
      _apiHandleAction(ss, action, payload);
    }
    return _apiResponse(ss);
  } catch (err) {
    return _apiError(err);
  }
}

// ── Entry Point POST ───────────────────────────────────────────────────
// Saat ini tidak dipakai (CORS issue), tapi dipertahankan untuk masa depan
function doPost(e) {
  try {
    var ss     = SpreadsheetApp.getActiveSpreadsheet();
    var body   = e.postData && e.postData.contents ? e.postData.contents : "{}";
    var parsed = JSON.parse(body);

    if (_apiTokenSalah(parsed.token)) {
      return _apiError(new Error(_ERR_TOKEN));
    }

    _apiHandleAction(ss, parsed.action || "", parsed.data || {});
    // v1.39: kiriman dari FCC (server ke server) cukup dijawab ok — tidak perlu membaca seluruh sheet
    if (parsed.ringan) return _apiOk();
    return _apiResponse(ss);
  } catch (err) {
    return _apiError(err);
  }
}

// ── Response Builder ───────────────────────────────────────────────────
function _apiResponse(ss) {
  var result = {
    ok: true,
    ts: new Date().getTime(), // timestamp untuk debug sync
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
      logSubkon:     _apiReadLogSubkon(ss),
      bayarSubkonFCC: _apiReadBayarSubkonFCC(ss)   // v1.40: riwayat bayar subkon dari FCC
    }
  };
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// v1.39: jawaban ringan untuk FCC
function _apiOk() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ts: new Date().getTime() }))
    .setMimeType(ContentService.MimeType.JSON);
}
function _apiRingkas(ss) {
  var result = {
    ok: true,
    ts: new Date().getTime(),
    data: {
      projects: _apiReadProjects(ss),
      karyawan: _apiReadKaryawan(ss),
      barang:   _apiReadBarang(ss),
      toko:     _apiReadToko(ss),
      subkon:   _apiSubkonFCC(ss)          // v1.40: pekerjaan subkon untuk form bayar di FCC
    }
  };
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function _apiError(err) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok:    false,
      error: err.message + " (line " + (err.lineNumber || "?") + ")"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Router ─────────────────────────────────────────────────────────────
function _apiHandleAction(ss, action, data) {
  switch (action) {
    // Project
    case "addProject":        _apiAddProject(ss, data);        break;
    case "updateProject":     _apiUpdateProject(ss, data);     break;
    case "deleteProject":     _apiDeleteProject(ss, data);     break;
    // Pembelian
    case "addPembelian":      _apiAddPembelian(ss, data);      break;
    case "updatePembelian":   _apiUpdatePembelian(ss, data);   break;
    case "deletePembelian":   _apiDeletePembelian(ss, data);   break;
    // Karyawan
    case "addKaryawan":       _apiAddKaryawan(ss, data);       break;
    case "updateKaryawan":    _apiUpdateKaryawan(ss, data);    break;
    case "deleteKaryawan":    _apiDeleteKaryawan(ss, data);    break;
    // Absensi
    case "addAbsensi":        _apiAddAbsensi(ss, data);        break;
    case "updateAbsensi":     _apiUpdateAbsensi(ss, data);     break;
    case "deleteAbsensi":     _apiDeleteAbsensi(ss, data);     break;
    // Kasbon
    case "addKasbon":         _apiAddKasbon(ss, data);         break;
    case "deleteKasbon":      _apiDeleteKasbon(ss, data);      break;
    // Pembayaran
    case "addPembayaran":     _apiAddPembayaran(ss, data);     break;
    case "deletePembayaran":  _apiDeletePembayaran(ss, data);  break;
    // Closing
    case "finalizeClosing":   _apiFinalizeClosing(ss, data);   break;
    case "deleteClosing":     _apiDeleteClosing(ss, data);     break;
    // RAB
    case "saveRAB":           _apiSaveRAB(ss, data);           break;
    case "deleteRAB":         _apiDeleteRAB(ss, data);         break;
    // Subkon
    case "addSubkon":         _apiAddSubkon(ss, data);         break;
    case "updateSubkon":      _apiUpdateSubkon(ss, data);      break;
    case "deleteSubkon":      _apiDeleteSubkon(ss, data);      break;
    case "addLogSubkon":      _apiAddLogSubkon(ss, data);      break;
    case "updateLogSubkon":   _apiUpdateLogSubkon(ss, data);   break;
    case "editLogSubkon":     _apiEditLogSubkon(ss, data);     break;
    case "uploadBuktiSubkon": _apiUploadBuktiSubkon(ss, data); break;
    case "markBayarToko":    _apiMarkBayarToko(ss, data);    break;
    case "bayarSubkonFCC":      _apiBayarSubkonFCC(ss, data);      break;   // v1.40 (dari FCC)
    case "hapusBayarSubkonFCC": _apiHapusBayarSubkonFCC(ss, data); break;   // v1.40 (dari FCC)
    case "deleteLogSubkon":   _apiDeleteLogSubkon(ss, data);   break;

    // Rekap GSheet
    case "updateRekap":      _apiUpdateRekap(ss);            break;

    default:
      throw new Error("Unknown action: " + action);
  }
}
