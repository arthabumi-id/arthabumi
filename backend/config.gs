// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — config.gs  v1.8
// Isi: Entry Points (doGet/doPost) + Router ONLY
//
// Helper date/find functions → helpers.gs
// Sheet setup & format       → setup.gs
// Sheet name constants       → constants.gs
// ════════════════════════════════════════════════════════════════════════

// ── Entry Point GET ────────────────────────────────────────────────────
// Digunakan untuk READ dan WRITE (karena limitasi CORS Google Apps Script)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var p  = e && e.parameter ? e.parameter : {};

    // ── Token check (aktifkan dengan isi API_TOKEN di constants.gs) ──
    if (API_TOKEN && p.token !== API_TOKEN) {
      return _apiError(new Error("Unauthorized: token tidak valid"));
    }

    var action = p.action || "getAllData";
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

    if (API_TOKEN && parsed.token !== API_TOKEN) {
      return _apiError(new Error("Unauthorized: token tidak valid"));
    }

    _apiHandleAction(ss, parsed.action || "", parsed.data || {});
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
      logSubkon:     _apiReadLogSubkon(ss)
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
    case "deletePembelian":   _apiDeletePembelian(ss, data);   break;
    // Karyawan
    case "addKaryawan":       _apiAddKaryawan(ss, data);       break;
    case "updateKaryawan":    _apiUpdateKaryawan(ss, data);    break;
    case "deleteKaryawan":    _apiDeleteKaryawan(ss, data);    break;
    // Absensi
    case "addAbsensi":        _apiAddAbsensi(ss, data);        break;
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
    case "deleteLogSubkon":   _apiDeleteLogSubkon(ss, data);   break;

    // Rekap GSheet
    case "updateRekap":      _apiUpdateRekap(ss);            break;

    default:
      throw new Error("Unknown action: " + action);
  }
}
