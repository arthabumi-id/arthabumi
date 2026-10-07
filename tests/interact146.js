// Uji v1.46: slip closing, pengingat Dashboard, bisa dibuka tanpa sinyal.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const hs = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const seed = eval(hs.slice(hs.indexOf('const P = '), hs.indexOf('const seed = ')) + '(' + hs.slice(hs.indexOf('const seed = ') + 13, hs.indexOf('};\n\nconst STATES') + 1) + ')');
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = q.url.split('?')[0] === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(seed => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); sessionStorage.setItem('seeded', '1'); }
    const RD = Date, FIX = new RD('2026-10-03T10:00:00+07:00').getTime();
    class D extends RD { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return FIX; } } window.Date = D;
  }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('native dialog'); d.dismiss(); });
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(500);
  // slip
  const slip = await p.evaluate(() => slipText('CLS-20260926', 'KRY-001'));
  const exp = ['*Slip Gaji — Arthabumi*', 'No. closing: CLS-20260926 · dibayar 26 Sep 2026', 'Nama: Darto', '', 'Rincian:', '• Renovasi Interior Kantor: 1 hari — Rp 180.000', '', 'Total upah: Rp 180.000', 'Potong kasbon: - Rp 200.000', '*Net dibayar: Rp -20.000*'].join('\n');
  ok(slip === exp, 'slip Darto = angka Detail Closing (upah 180.000, potong 200.000, net -20.000)\n' + slip);
  const slipY = await p.evaluate(() => slipText('CLS-20260926', 'KRY-002'));
  ok(slipY.includes('Bonus: + Rp 100.000') && slipY.includes('*Net dibayar: Rp 270.000*'), 'slip Yanto: bonus 100.000, net 270.000');
  await p.evaluate(() => { delete navigator.share; openClosingDetail('CLS-20260926'); }); await p.waitForTimeout(150);
  await p.locator('button', { hasText: 'Bagikan slip Darto' }).click(); await p.waitForTimeout(200);
  const dbg = await p.evaluate(async () => ({ share: 'share' in navigator, toast: document.getElementById('toast').innerText, modal: document.getElementById('overlay').classList.contains('show') && document.querySelector('#modal-body textarea') ? 'textarea' : '-', clip: await navigator.clipboard.readText().catch(e => 'ERR ' + e.message) })); console.log(JSON.stringify(dbg).slice(0, 300));
  ok(dbg.clip.split('\r\n').join('\n') === exp && dbg.toast.includes('Slip disalin'), 'tanpa menu bagikan → slip disalin ke clipboard (Windows mengubah baris jadi \\r\\n)');
  await p.evaluate(() => { window._shared = null; navigator.share = async d => { window._shared = d; }; });
  await p.locator('button', { hasText: 'Bagikan slip Yanto' }).click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => window._shared && window._shared.text.includes('Nama: Yanto')), 'dengan menu bagikan HP → navigator.share dipanggil');
  await p.screenshot({ path: path.join(__dirname, 'out', 'v146-closing.png') });
  await p.evaluate(() => closeModal());
  // pengingat
  await p.evaluate(() => go('dashboard')); await p.waitForTimeout(100);
  ok(await p.locator('.remind').count() === 1 && (await p.locator('.remind').innerText()).includes('Absensi hari ini belum diisi'), 'pengingat absensi muncul (terakhir 02 Okt, hari ini kosong)');
  await p.evaluate(() => { S.logAbsensi.push({ id: 'ABS-OLD', tgl: '2026-09-20', idKaryawan: 'KRY-002', nama: 'Yanto', status: 'Hadir', kodeProj: 'PRJ-022', upahHariIni: 170000, statusBayar: 'Belum Dibayar', jamLembur: 0, upahLembur: 0 }); go('dashboard'); }); await p.waitForTimeout(100);
  const rem = await p.locator('.remind-list').innerText();
  ok(rem.includes('Upah belum di-closing 13 hari') && rem.includes('total Rp 460.000'), 'pengingat upah >7 hari: 13 hari, total = hutang upah (290.000 + 170.000)');
  await p.screenshot({ path: path.join(__dirname, 'out', 'v146-dashboard.png') });
  await p.locator('.remind button', { hasText: 'Buat closing' }).click(); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.page === 'closing' && S.tab.closing === 'baru'), 'tombol Buat closing → Closing baru');
  await p.evaluate(() => go('dashboard')); await p.waitForTimeout(100);
  await p.locator('.remind button', { hasText: 'Isi absensi' }).click(); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.page === 'absensi' && S.absTgl === '2026-10-03'), 'tombol Isi absensi → Input Absensi tanggal hari ini');
  await p.evaluate(() => { S.logAbsensi.push({ id: 'ABS-T', tgl: '2026-10-03', idKaryawan: 'KRY-001', nama: 'Darto', status: 'Hadir', kodeProj: 'PRJ-021', upahHariIni: 180000, statusBayar: 'Belum Dibayar', jamLembur: 0, upahLembur: 0 }); go('dashboard'); }); await p.waitForTimeout(100);
  ok(!(await p.locator('.remind-list').innerText()).includes('Absensi hari ini'), 'sudah ada absensi hari ini → pengingat absensi hilang');
  // tanpa sinyal
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(600);
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'service worker aktif');
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(800);
  ok((await p.locator('#content').innerText()).includes('Waterproofing Dak Rumah') && await p.evaluate(() => document.fonts.check('700 16px Fraunces')), 'tanpa sinyal: app tetap terbuka dengan data & huruf');
  await ctx.setOffline(false);
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? `${fail} GAGAL` : 'SEMUA LULUS'); await b.close(); srv.close();
})();
