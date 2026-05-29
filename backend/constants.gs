// ════════════════════════════════════════════════════════════════════════
// ARTHABUMI — constants.gs  v1.8
// Konstanta terpusat: nama sheet, batas baris, config API
//
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

// ── Batas Baris per Sheet {start, end} ────────────────────────────────
// start = baris data pertama, end = baris data terakhir (inklusif)
var ROWS = {
  PROJECT:    { start: 4,  end: 53   },  // max 50 proyek
  PEMBELIAN:  { start: 4,  end: 303  },  // max 300 item
  KARYAWAN:   { start: 4,  end: 53   },  // max 50 karyawan
  ABSENSI:    { start: 4,  end: 1003 },  // max 1000 absensi
  KASBON:     { start: 4,  end: 1003 },  // max 1000 kasbon
  PEMBAYARAN: { start: 4,  end: 503  },  // max 500 pembayaran
  BARANG:     { start: 5,  end: 1004 },  // max 1000 barang (start=5, baris 4 = header tambahan)
  TOKO:       { start: 4,  end: 103  },  // max 100 toko
  RAB:        { start: 4,  end: 103  },  // max 100 entri RAB
  SUBKON:     { start: 4,  end: 103  },  // max 100 subkontraktor
  LOG_SUBKON: { start: 4,  end: 503  }   // max 500 log subkon
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
