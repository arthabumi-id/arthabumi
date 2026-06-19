// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — constants.gs  v2.0
// Konstanta terpusat: nama sheet, batas baris, config API
//
// ✅ v2.0 UNLIMITED: .end dihapus dari ROWS — read/write pakai getLastRow() dinamis
//                   Sheet bisa tumbuh tanpa batas (Google Sheets max ~10 juta sel)
// ✅ CARA PAKAI: Gunakan SHEET.PROJECT bukan "MASTER PROJECT"
//               Gunakan ROWS.PROJECT.start bukan angka 4
// ════════════════════════════════════════════════════════════════════════

// ── Nama Sheet (gunakan ini, JANGAN hardcode string) ───────────────────
var SHEET = {
  PROJECT:    "MASTER PROJECT",
  PEMBELIAN:  "PEMBELIAN",
  KARYAWAN:   "MASTER KARYAWAN",
  ABSENSI:    "LOG ABSENSI",
  KASBON:     "LOG KASBON",
  PEMBAYARAN: "LOG PEMBAYARAN",
  BARANG:     "MASTER BARANG",
  TOKO:       "MASTER TOKO",
  RAB:        "RAB",
  SUBKON:     "MASTER SUBKON",
  LOG_SUBKON: "LOG SUBKON",
  REKAP:      "REKAP"           // Sheet rekap ringkasan semua proyek (v1.13)
};

// ── Batas Baris per Sheet — hanya .start (baris data pertama) ─────────
// .end DIHAPUS — semua read/write kini pakai ws.getLastRow() secara dinamis
// Sheet tumbuh otomatis, tidak ada batas maksimum
var ROWS = {
  PROJECT:    { start: 4 },  // unlimited
  PEMBELIAN:  { start: 4 },  // unlimited
  KARYAWAN:   { start: 4 },  // unlimited
  ABSENSI:    { start: 4 },  // unlimited
  KASBON:     { start: 4 },  // unlimited
  PEMBAYARAN: { start: 4 },  // unlimited
  BARANG:     { start: 5 },  // unlimited (start=5, baris 4 = header tambahan)
  TOKO:       { start: 4 },  // unlimited
  RAB:        { start: 4 },  // unlimited
  SUBKON:     { start: 4 },  // unlimited
  LOG_SUBKON: { start: 4 }   // unlimited
};

// ── Timezone ──────────────────────────────────────────────────────────
var TZ = "Asia/Jakarta";

// ── Security Token (Opsional tapi DISARANKAN) ─────────────────────────
// Ubah ke string rahasia yang hanya kamu tahu.
// Contoh: "arthabumi-eddysantoso-2026"
// Cara pakai di URL app: tambahkan &token=VALUE saat fetch
// Kosongkan "" untuk disable (tidak aman untuk production)
var API_TOKEN = "";  // TODO: isi sebelum deploy ke production

// ── Actions yang boleh via GET (read-only semantics) ──────────────────
// Write actions tetap diterima via GET untuk kompatibilitas CORS,
// tapi idealnya dipindah ke POST di masa depan.
var SAFE_ACTIONS = ["getAllData"];  // hanya ini yang benar-benar read-only
