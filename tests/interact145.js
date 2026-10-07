// Uji v1.45: kunci data FCC, pengingat kasbon/bayar, absensi cepat, render ulang saat sync.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const hs = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const seed = eval(hs.slice(hs.indexOf('const P = '), hs.indexOf('const seed = ')) + '(' + hs.slice(hs.indexOf('const seed = ') + 13, hs.indexOf('};\n\nconst STATES') + 1) + ')');
seed['ab3-beli'].push({ id: 'BLI-FCC-TXN9-1-1', tgl: '2026-10-01', kodeProj: 'PRJ-022', namaBarang: 'Cat tembok', kategori: 'Material', satuan: 'pail', qty: 2, harga: 400000, diskon: 0, status: 'HABIS', toko: 'Sinar Jaya', total: 800000, bayarToko: 'Lunas' });
seed['ab3-ksb'].push({ id: 'KSB-FCC-KB1-1', tgl: '2026-10-01', idKaryawan: 'KRY-002', tipe: 'AMBIL', nominal: 300000, nama: 'Yanto', noClosing: '', ket: '', kodeProj: '' });
seed['ab3-bayar'].push({ id: 'PAY-FCC-TX7-1', tgl: '2026-10-01', kodeProj: 'PRJ-023', namaProj: '', nominal: 20000000, metode: 'Transfer', bank: 'BCA', ket: 'DP', ref: '' });
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = q.url === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.addInitScript(seed => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); sessionStorage.setItem('seeded', '1'); } }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('native dialog'); d.dismiss(); });
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(500);
  // B1 kunci FCC
  await p.evaluate(() => setTab('beli', 'log')); await p.waitForTimeout(150);
  ok(await p.locator('.fcc-tag').count() === 1 && await p.evaluate(() => { const c = [...document.querySelectorAll('.card')].find(c => c.innerText.includes('Cat tembok')); return !!c && !c.querySelector('button[onclick^="delPembelian"]'); }), 'pembelian dari FCC bertanda, tanpa tombol ubah/hapus');
  await p.screenshot({ path: path.join(__dirname, 'out', 'v145-fcc-beli.png') });
  const n0 = await p.evaluate(() => S.pembelian.length);
  await p.evaluate(() => delPembelian(S.pembelian.findIndex(x => x.id.startsWith('BLI-FCC-')))); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.pembelian.length) === n0 && !(await p.locator('#cfm.show').count()) && (await p.locator('#toast').innerText()).includes('lewat FCC'), 'hapus pembelian FCC ditolak (dipanggil langsung)');
  await p.evaluate(() => openEditBeli(S.pembelian.findIndex(x => x.id.startsWith('BLI-FCC-')))); await p.waitForTimeout(100);
  ok(!(await p.evaluate(() => document.getElementById('overlay').classList.contains('show'))), 'ubah pembelian FCC ditolak');
  await p.evaluate(() => setTab('kasbon', 'log')); await p.waitForTimeout(150);
  ok(await p.locator('.fcc-tag').count() === 1, 'kasbon dari FCC bertanda');
  await p.evaluate(() => delKasbon(S.logKasbon.findIndex(x => x.id.startsWith('KSB-FCC-')))); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.logKasbon.some(x => x.id.startsWith('KSB-FCC-'))), 'hapus kasbon FCC ditolak');
  await p.evaluate(() => setTab('bayar', 'log')); await p.waitForTimeout(150);
  ok(await p.locator('.fcc-tag').count() === 1, 'pembayaran dari FCC bertanda');
  await p.evaluate(() => delPembayaran(S.logPembayaran.findIndex(x => x.id.startsWith('PAY-FCC-')))); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.logPembayaran.some(x => x.id.startsWith('PAY-FCC-'))), 'hapus pembayaran FCC ditolak');
  const nb = await p.evaluate(() => S.logPembayaran.length);
  await p.locator('button[onclick^="delPembayaran("]').first().click(); await p.waitForTimeout(100); await p.locator('.cfm-yes').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.logPembayaran.length) === nb - 1, 'pembayaran biasa tetap bisa dihapus');
  // B2 pengingat + konfirmasi
  await p.evaluate(() => setTab('kasbon', 'input')); await p.waitForTimeout(150);
  ok(await p.locator('.fcc-note').count() === 1, 'Input Kasbon: pengingat FCC tampil');
  const k0 = await p.evaluate(() => S.logKasbon.length);
  await p.evaluate(() => { S.ksbF = { tgl: '2026-10-03', kr: 'KRY-001', tipe: 'AMBIL', nom: 100000, proj: '', ket: '' }; submitKasbon(); }); await p.waitForTimeout(150);
  ok(await p.locator('#cfm.show').count() === 1 && await p.locator('.cfm-yes').innerText() === 'Tetap simpan', 'simpan kasbon minta konfirmasi');
  await p.locator('.cfm-no').click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.logKasbon.length) === k0, 'Batal → kasbon tidak tersimpan');
  await p.evaluate(() => { S.ksbF = { tgl: '2026-10-03', kr: 'KRY-001', tipe: 'AMBIL', nom: 100000, proj: '', ket: '' }; submitKasbon(); }); await p.waitForTimeout(150);
  await p.locator('.cfm-yes').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.logKasbon.length) === k0 + 1, 'Tetap simpan → kasbon tersimpan');
  await p.evaluate(() => setTab('bayar', 'input')); await p.waitForTimeout(150);
  ok(await p.locator('.fcc-note').count() === 1, 'Input Bayar: pengingat FCC tampil');
  // B3 absensi cepat
  await p.evaluate(() => { S.absTgl = '2026-10-03'; setTab('absensi', 'input'); }); await p.waitForTimeout(150);
  await p.locator('button', { hasText: 'Salin hari kerja terakhir' }).click(); await p.waitForTimeout(150);
  const rows = await p.evaluate(() => S.absRows.map(r => r.status + '|' + r.kodeProj + '|' + r.jamLembur));
  ok(JSON.stringify(rows) === JSON.stringify(['Hadir|PRJ-021|0', '||0', 'Setengah Hari|PRJ-021|0']), 'salin dari 02 Okt (lembur tidak ikut): ' + JSON.stringify(rows));
  await p.screenshot({ path: path.join(__dirname, 'out', 'v145-absensi.png') });
  await p.locator('button', { hasText: 'Semua hadir' }).click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.absRows.every(r => r.status === 'Hadir') && S.absRows[0].kodeProj === 'PRJ-021'), 'Semua hadir: status Hadir, proyek tetap');
  // U2 render ulang
  await p.evaluate(() => go('dashboard')); await p.waitForTimeout(100);
  await p.evaluate(() => { S.webAppUrl = 'x'; window.gsFetch = async () => ({ projects: S.projects.map(x => x.kode === 'PRJ-021' ? { ...x, nama: 'Waterproofing BARU' } : x) }); return doFetch('x'); }); await p.waitForTimeout(200);
  ok((await p.locator('#content').innerText()).includes('Waterproofing BARU'), 'sync: Dashboard langsung ikut berubah');
  await p.evaluate(() => setTab('absensi', 'input')); await p.waitForTimeout(100);
  await p.evaluate(() => { window.gsFetch = async () => ({ projects: S.projects.map(x => x.kode === 'PRJ-021' ? { ...x, nama: 'Nama Lagi' } : x) }); return doFetch('x'); }); await p.waitForTimeout(200);
  ok(!(await p.locator('#content').innerText()).includes('Nama Lagi'), 'sync: form absensi TIDAK digambar ulang');
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? `${fail} GAGAL` : 'SEMUA LULUS'); await b.close(); srv.close();
})();
