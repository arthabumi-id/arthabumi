// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — helpers.gs  v1.8
// Fungsi-fungsi bantu: tanggal, pencarian baris, locale, validasi
// Diekstrak dari config.gs agar lebih mudah di-maintain
// ════════════════════════════════════════════════════════════════════════

// ── Date: Serialize (Date object → string YYYY-MM-DD) ─────────────────
// Dipakai di fungsi READ untuk kirim tanggal ke app
function _apiSerDate(v) {
  if (!v || v === "") return "";
  if (v instanceof Date) {
    if (v.getTime() < 86400000) return ""; // guard nilai aneh (< 1 Jan 1970)
    var sstz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(v, sstz, "yyyy-MM-dd");
  }
  return String(v);
}

// ── Date: Parse (string YYYY-MM-DD → Date object) ─────────────────────
// Dipakai di fungsi WRITE untuk konversi dari app ke GSheet
// ✅ Pakai timezone spreadsheet (WIB) bukan UTC — fix timezone bug
function _apiParseDate(s) {
  if (!s || s === "") return null;
  try {
    var str = String(s).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      var sstz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
      var d = Utilities.parseDate(str, sstz, "yyyy-MM-dd");
      return isNaN(d.getTime()) ? null : d;
    }
    // Fallback untuk format lain
    var d2 = new Date(s);
    return isNaN(d2.getTime()) ? null : d2;
  } catch (e) {
    return null;
  }
}

// ── Find: Baris kosong berikutnya di kolom tertentu ───────────────────
// Dipakai untuk INSERT — cari slot kosong pertama
// col = huruf kolom (misal "B"), s/e = range baris
function _apiFindNext(ws, col, s, e) {
  var vals = ws.getRange(col + s + ":" + col + e).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === "") return s + i;
  }
  return e + 1; // di luar range — idealnya log warning
}

// ── Find: Baris berdasarkan nilai kunci di kolom tertentu ─────────────
// Dipakai untuk UPDATE/DELETE — cari baris yang cocok
// Mengembalikan -1 kalau tidak ditemukan
function _apiFindRow(ws, col, s, e, key) {
  var vals = ws.getRange(col + s + ":" + col + e).getValues();
  var keyStr = String(key).trim();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === keyStr) return s + i;
  }
  return -1;
}

// ── Locale: Deteksi separator formula (Indonesia = titik-koma) ────────
// Indonesia (id_ID) pakai titik-koma (;), English pakai koma (,)
// Dipakai untuk deteksi locale — catatan: formula kini pakai setFormula() bukan setFormulaLocal()
function _getSep(ss) {
  var loc = (ss || SpreadsheetApp.getActiveSpreadsheet()).getSpreadsheetLocale() || "en_US";
  return loc.substring(0, 2) === "id" ? ";" : ",";
}

// ── Pad Number (angka → string dengan leading zeros) ─────────────────
// Contoh: _padNum(5, 3) → "005"
function _padNum(n, len) {
  return String(n).padStart(len, "0");
}

// ── Validasi: Cek string tidak kosong ─────────────────────────────────
// Lempar error kalau field wajib tidak ada
function _requireField(obj, field, label) {
  var val = obj && obj[field];
  if (!val || String(val).trim() === "") {
    throw new Error("Field wajib tidak ada: " + (label || field));
  }
  return String(val).trim();
}

// ── Sanitize: Hilangkan karakter berbahaya dari string input ──────────
// Mencegah formula injection di Google Sheets (awalan = + - @)
function _sanitizeStr(s) {
  if (!s) return "";
  var str = String(s).trim();
  // Cegah formula injection: string yang diawali =, +, -, @ bisa jadi formula
  if (str.length > 0 && "=+-@".indexOf(str[0]) >= 0) {
    return "'" + str; // prefix dengan apostrophe → perlakukan sebagai teks
  }
  return str;
}

// ── Sanitize: Pastikan nilai numerik valid ────────────────────────────
function _sanitizeNum(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}
