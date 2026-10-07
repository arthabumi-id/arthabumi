// Uji app kontraktor dengan data contoh (localStorage, tanpa URL GSheet → tidak menyentuh data asli).
// node harness.js <label> [shots] [dark]  → teks tiap layar ke out/<label>.json, screenshot ke out/<label>/
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.env.APP || 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const label = process.argv[2] || 'run', SHOTS = process.argv.includes('shots'), DARK = process.argv.includes('dark');
const W = Number(process.env.W || 412), H = Number(process.env.H || 900);
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(path.join(OUT, label), { recursive: true });

const P = (kode, nama, jenis, status, nilaiKontrak, progress, variasi = [], catatan = '') => ({ kode, nama, jenis, status, nilaiKontrak, biayaMat: 0, biayaUpah: 0, totalBiaya: 0, laba: 0, margin: 0, tglMulai: '2026-08-01', pembayaran: 0, piutang: 0, catatan, progress, variasi });
const seed = {
  'ab3-p': [P('PRJ-021', 'Waterproofing Dak Rumah', 'Waterproofing', 'Berjalan', 145000000, 70, [{ jenis: 'tambah', nominal: 5000000, ket: 'Tambah talang', tgl: '2026-09-10' }], 'Cek ulang tes rendam'),
    P('PRJ-022', 'Renovasi Interior Kantor', 'Interior', 'Berjalan', 420000000, 55),
    P('PRJ-023', 'Pagar & Kanopi Besi', 'Besi', 'Berjalan', 88500000, 40),
    P('PRJ-010', 'Kamar Mandi Lt 2', 'Renovasi', 'Selesai', 60000000, 100),
    P('PRJ-011', 'Gudang Belakang', 'Renovasi', 'Hold', 75000000, 20)],
  'ab3-kr': [{ id: 'KRY-001', nama: 'Darto', jabatan: 'Tukang', upahHarian: 180000, noHP: '', catatan: '' }, { id: 'KRY-002', nama: 'Yanto', jabatan: 'Tukang', upahHarian: 170000, noHP: '', catatan: '' }, { id: 'KRY-003', nama: 'Asep', jabatan: 'Kenek', upahHarian: 130000, noHP: '', catatan: '' }],
  'ab3-beli': [
    { id: 'BLI-1', tgl: '2026-10-03', kodeProj: 'PRJ-021', namaBarang: 'Semen 50 kg', kategori: 'Material', satuan: 'sak', qty: 10, harga: 68000, diskon: 0, status: 'HABIS', toko: 'Sinar Jaya', total: 680000, bayarToko: 'Lunas' },
    { id: 'BLI-2', tgl: '2026-10-03', kodeProj: 'PRJ-021', namaBarang: 'Pasir pasang', kategori: 'Material', satuan: 'm3', qty: 1, harga: 350000, diskon: 0, status: 'HABIS', toko: 'Sinar Jaya', total: 350000, bayarToko: 'Hutang' },
    { id: 'BLI-3', tgl: '2026-10-02', kodeProj: 'PRJ-023', namaBarang: 'Besi beton 10 mm', kategori: 'Material', satuan: 'btg', qty: 20, harga: 92000, diskon: 40000, status: 'HABIS', toko: 'Besi Makmur', total: 1800000, bayarToko: 'Lunas' },
    { id: 'BLI-4', tgl: '2026-09-20', kodeProj: 'PRJ-022', namaBarang: 'Bor listrik', kategori: 'Tools', satuan: 'unit', qty: 1, harga: 850000, diskon: 0, status: 'ASET', toko: 'Teknik Jaya', total: 850000, bayarToko: 'Lunas' },
    { id: 'BLI-5', tgl: '2026-09-15', kodeProj: 'PRJ-022', namaBarang: 'Semen 50 kg', kategori: 'Material', satuan: 'sak', qty: 30, harga: 66000, diskon: 0, status: 'SISA', toko: 'Besi Makmur', total: 1980000, bayarToko: 'Lunas' }],
  'ab3-abs': [
    { id: 'ABS-1', tgl: '2026-10-02', idKaryawan: 'KRY-001', nama: 'Darto', status: 'Hadir', kodeProj: 'PRJ-021', namaProj: '', upahHariIni: 225000, statusBayar: 'Belum Dibayar', noClosing: '', tglBayar: '', ket: '', jamLembur: 2, upahLembur: 45000 },
    { id: 'ABS-2', tgl: '2026-10-02', idKaryawan: 'KRY-003', nama: 'Asep', status: 'Setengah Hari', kodeProj: 'PRJ-021', namaProj: '', upahHariIni: 65000, statusBayar: 'Belum Dibayar', noClosing: '', tglBayar: '', ket: '', jamLembur: 0, upahLembur: 0 },
    { id: 'ABS-3', tgl: '2026-09-25', idKaryawan: 'KRY-002', nama: 'Yanto', status: 'Hadir', kodeProj: 'PRJ-022', namaProj: '', upahHariIni: 170000, statusBayar: 'Sudah Dibayar', noClosing: 'CLS-20260926', tglBayar: '2026-09-26', ket: '', jamLembur: 0, upahLembur: 0 },
    { id: 'ABS-4', tgl: '2026-09-24', idKaryawan: 'KRY-001', nama: 'Darto', status: 'Hadir', kodeProj: 'PRJ-022', namaProj: '', upahHariIni: 180000, statusBayar: 'Sudah Dibayar', noClosing: 'CLS-20260926', tglBayar: '2026-09-26', ket: '', jamLembur: 0, upahLembur: 0 },
    { id: 'ABS-5', tgl: '2026-09-24', idKaryawan: 'KRY-003', nama: 'Asep', status: 'Tidak Hadir', kodeProj: 'PRJ-022', namaProj: '', upahHariIni: 0, statusBayar: 'Belum Dibayar', noClosing: '', tglBayar: '', ket: '', jamLembur: 0, upahLembur: 0 }],
  'ab3-ksb': [
    { id: 'KSB-1', tgl: '2026-09-20', idKaryawan: 'KRY-001', tipe: 'AMBIL', nominal: 500000, nama: 'Darto', noClosing: '', ket: 'pinjam', kodeProj: 'PRJ-022' },
    { id: 'KSB-2', tgl: '2026-09-26', idKaryawan: 'KRY-001', tipe: 'POTONG', nominal: 200000, nama: 'Darto', noClosing: 'CLS-20260926', ket: '', kodeProj: 'PRJ-022' },
    { id: 'KSB-3', tgl: '2026-09-26', idKaryawan: 'KRY-002', tipe: 'BONUS', nominal: 100000, nama: 'Yanto', noClosing: 'CLS-20260926', ket: '', kodeProj: 'PRJ-022' },
    { id: 'KSB-4', tgl: '2026-08-10', idKaryawan: 'KRY-003', tipe: 'AMBIL', nominal: 100000, nama: 'Asep', noClosing: '', ket: '', kodeProj: '' },
    { id: 'KSB-5', tgl: '2026-08-20', idKaryawan: 'KRY-003', tipe: 'POTONG', nominal: 100000, nama: 'Asep', noClosing: 'CLS-X', ket: '', kodeProj: 'PRJ-010' }],
  'ab3-bayar': [{ id: 'PAY-1', tgl: '2026-09-01', kodeProj: 'PRJ-021', namaProj: '', nominal: 87000000, metode: 'Transfer', bank: 'BCA', ket: 'DP', ref: '' },
    { id: 'PAY-2', tgl: '2026-09-05', kodeProj: 'PRJ-022', namaProj: '', nominal: 210000000, metode: 'Transfer', bank: 'BCA', ket: 'Termin 1', ref: '' },
    { id: 'PAY-3', tgl: '2026-06-05', kodeProj: 'PRJ-010', namaProj: '', nominal: 60000000, metode: 'Tunai', bank: '', ket: 'Lunas', ref: '' }],
  'ab3-brg': [{ id: 'BRG-1', nama: 'Semen 50 kg', kategori: 'Material', satuan: 'sak', hargaTerakhir: 68000 }, { id: 'BRG-2', nama: 'Besi beton 10 mm', kategori: 'Material', satuan: 'btg', hargaTerakhir: 92000 }],
  'ab3-toko': ['Sinar Jaya', 'Besi Makmur', 'Teknik Jaya'],
  'ab3-rab': [{ kodeProj: 'PRJ-021', material: 60000000, upah: 35000000, subkon: 10000000, overhead: 5000000, total: 110000000, tglUpdate: '2026-08-02', labelMat: '', labelUpah: '', labelSubkon: '', labelOverhead: '' },
    { kodeProj: 'PRJ-022', material: 150000000, upah: 120000000, subkon: 40000000, overhead: 10000000, total: 320000000, tglUpdate: '2026-08-02', labelMat: '', labelUpah: '', labelSubkon: '', labelOverhead: '' }],
  'ab3-sk': [{ id: 'SKN-001', nama: 'CV Kaca Prima', spesialisasi: 'Kaca', noHP: '', alamat: '' }],
  'ab3-lsk': [{ id: 'LSK-1', tgl: '2026-09-10', kodeProj: 'PRJ-022', namaProj: 'Renovasi Interior Kantor', idSubkon: 'SKN-001', namaSubkon: 'CV Kaca Prima', uraian: 'Partisi kaca', nilaiKontrak: 24000000, statusBayar: 'DP', nominalBayar: 12000000, tglBayar: '2026-09-12', ket: '', potongan: 0, idKaryawanPotong: '', ketPotongan: '', buktiUrls: '' }],
  'ab3-rbsk': { 'LSK-1': [{ tgl: '2026-09-12', nominal: 12000000 }] },
};

const STATES = [];
const pages = ['dashboard', 'project', 'beli', 'karyawan', 'absensi', 'kasbon', 'closing', 'bayar', 'rab', 'subkon', 'catatan'];
for (const p of pages) STATES.push({ n: p, js: `go('${p}')` });
STATES.push({ n: 'dash-semua', js: "setDashFilter('Semua')" });
STATES.push({ n: 'dash-alert', js: "S.logAbsensi.push({id:'ABS-X',tgl:'2026-10-01',idKaryawan:'KRY-002',nama:'Yanto',status:'Hadir',kodeProj:'PRJ-022',upahHariIni:46500000,statusBayar:'Belum Dibayar',jamLembur:0,upahLembur:0});S.rab.push({kodeProj:'PRJ-023',material:2000000,upah:0,subkon:0,overhead:0});go('dashboard')" });
for (const v of ['piutang', 'hutang']) STATES.push({ n: 'dash-' + v, js: `go('dashboard');setDashView('${v}')` });
for (const t of "absensi:log bayar:log beli:harga beli:hutang beli:log closing:log kasbon:hutang kasbon:log kasbon:rekap rab:perband subkon:log subkon:master subkon:rekap".split(' ')) { const [p, tb] = t.split(':'); STATES.push({ n: p + '-' + tb, js: `setTab('${p}','${tb}')` }); }
for (const [n, js] of [['m-settings', 'openSettings()'], ['m-lainnya', 'openLainnya()'], ['m-aturmenu', 'openAturMenu()'], ['m-addproj', 'openAddProject()'], ['m-editproj', 'go("project");openEditProject(0)'], ['m-rekap', "openRekapProyek('PRJ-022')"], ['m-rekap21', "openRekapProyek('PRJ-021')"], ['m-addkar', 'openAddKaryawan()'], ['m-editkar', 'openEditKaryawan(0)'], ['m-variasi', "openVariasiForm('PRJ-021')"], ['m-paste', 'openPasteBeli()'], ['m-editbeli', 'openEditBeli(0)'], ['m-editabs', 'openEditAbsensi(0)'], ['m-closing', "openClosingDetail('CLS-20260926')"], ['m-addsk', 'openAddSubkon()'], ['m-editsk', 'openEditSubkon(0)'], ['m-bayarsk', 'openBayarSubkon(0)'], ['m-editlsk', 'openEditLogSubkon(0)']])
  STATES.push({ n, js });

const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let f = path.join(APP, decodeURIComponent(q.url.split('?')[0])); if (q.url === '/' ) f = path.join(APP, 'index.html'); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });

(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: DARK ? 'dark' : 'light' });
  await ctx.addInitScript(({ seed, dark }) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); if (dark) localStorage.setItem('ab3-theme', 'dark'); sessionStorage.setItem('seeded', '1'); }
    const RD = Date, FIX = new RD('2026-10-03T10:00:00+07:00').getTime();
    class D extends RD { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return FIX; } }
    window.Date = D;
  }, { seed, dark: DARK });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('dialog', d => { errs.push('NATIVE DIALOG: ' + d.message().slice(0, 60)); d.dismiss(); });
  const res = {};
  for (const s of STATES) {
    await page.goto(`http://localhost:${port}/`); await page.waitForTimeout(450);
    try { await page.evaluate(s.js); } catch (e) { errs.push(s.n + ': ' + e.message); }
    await page.waitForTimeout(350);
    res[s.n] = await page.evaluate(() => {
      const t = id => { const e = document.getElementById(id); return e ? e.innerText : ''; };
      const ov = document.getElementById('overlay');
      return { content: t('content'), nav: t('nav'), sheet: document.getElementById('nav-sheet')?.classList.contains('show') ? t('nav-sheet') : '', modal: ov && ov.classList.contains('show') ? t('modal-body') : '' };
    });
    if (SHOTS) await page.screenshot({ path: path.join(OUT, label, s.n + '.png'), fullPage: false });
  }
  fs.writeFileSync(path.join(OUT, label + '.json'), JSON.stringify(res, null, 1));
  console.log(label, 'states', STATES.length, 'errors', errs.length); errs.slice(0, 30).forEach(e => console.log('  ', e));
  await b.close(); srv.close();
})();
