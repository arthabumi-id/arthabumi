// Uji v1.50: Salin pengaturan di alamat lama → Tempel di alamat baru (dua origin = dua localStorage, seperti github.io → pages.dev).
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = path.join(__dirname, '..');
const hs = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const seed = eval(hs.slice(hs.indexOf('const P = '), hs.indexOf('const seed = ')) + '(' + hs.slice(hs.indexOf('const seed = ') + 13, hs.indexOf('};\n\nconst STATES') + 1) + ')');
const DATA = { projects: seed['ab3-p'], pembelian: seed['ab3-beli'], karyawan: seed['ab3-kr'], logAbsensi: seed['ab3-abs'], logKasbon: seed['ab3-ksb'], logPembayaran: seed['ab3-bayar'], barang: seed['ab3-brg'], toko: seed['ab3-toko'], rab: seed['ab3-rab'], subkon: seed['ab3-sk'], logSubkon: seed['ab3-lsk'], bayarSubkonFCC: [] };
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript' };
const mk = () => http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/gas') { r.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); return r.end(JSON.stringify(u.searchParams.get('action') === 'versi' ? { ok: true, versi: '1' } : { ok: true, versi: '1', data: DATA })); }
  const f = u.pathname === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(u.pathname));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  const sA = mk(), sB = mk(); await new Promise(r => sA.listen(0, r)); await new Promise(r => sB.listen(0, r));
  const A = `http://127.0.0.1:${sA.address().port}`, B = `http://localhost:${sB.address().port}`;   // beda origin
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const errs = [];
  // alamat lama: lengkap dengan pengaturan & riwayat cicilan subkon (hanya di HP)
  const pa = await ctx.newPage(); pa.on('pageerror', e => errs.push(e.message));
  await pa.goto(A + '/'); await pa.evaluate(({ seed, gas }) => { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); localStorage.setItem('ab3-url', JSON.stringify(gas)); localStorage.setItem('ab3-tok', JSON.stringify('TOKEN-RAHASIA-123')); localStorage.setItem('ab3-poll', '0'); localStorage.setItem('ab3-nav', JSON.stringify(['dashboard', 'absensi', 'closing', 'beli', 'kasbon'])); localStorage.setItem('ab3-theme', 'dark'); }, { seed, gas: A + '/gas' });
  await pa.reload(); await pa.waitForTimeout(700);
  const lama = await pa.evaluate(k => Object.fromEntries(k.map(x => [x, localStorage.getItem(x)])), ['ab3-url', 'ab3-tok', 'ab3-poll', 'ab3-nav', 'ab3-co', 'ab3-theme', 'ab3-rbsk']);
  // banner hanya di alamat lama
  ok(!(await pa.locator('.pindah-banner').count()), 'bukan github.io → banner pindah tidak tampil');
  await pa.evaluate(() => { window._diAlamatLama = () => true; go('dashboard'); }); await pa.waitForTimeout(100);
  ok(await pa.locator('.pindah-banner').count() === 1 && (await pa.locator('.pindah-banner').innerText()).includes('arthabumi-kontraktor.pages.dev'), 'di alamat lama → banner pindah tampil dengan alamat baru');
  await pa.screenshot({ path: path.join(__dirname, 'out', 'v150-banner.png') });
  // masih ada isian belum terkirim → ditolak
  await pa.evaluate(() => { navigator.clipboard.writeText('kosong'); S.retryQ = [{ action: 'x', payload: {}, retries: 0 }]; return salinPengaturan(false); }); await pa.waitForTimeout(150);
  ok((await pa.evaluate(() => navigator.clipboard.readText())) === 'kosong' && (await pa.locator('#toast').innerText()).includes('belum terkirim'), 'ada antrean kirim → Salin ditolak, minta Sync dulu');
  await pa.evaluate(() => { S.retryQ = []; S.logKasbon.push({ id: 'KSB-P', tgl: '2026-10-07', idKaryawan: 'KRY-001', tipe: 'AMBIL', nominal: 1, nama: 'Darto', pending: true }); return salinPengaturan(false); }); await pa.waitForTimeout(150);
  ok((await pa.evaluate(() => navigator.clipboard.readText())) === 'kosong', 'ada data belum dikonfirmasi Sheet → Salin ditolak');
  await pa.evaluate(() => { S.logKasbon = S.logKasbon.filter(x => !x.pending); openSettings(); }); await pa.waitForTimeout(150);
  await pa.locator('#overlay button[onclick="salinPengaturan(false)"]').click(); await pa.waitForTimeout(200);
  const teks = await pa.evaluate(() => navigator.clipboard.readText());
  ok(/^ARTHABUMI-PENGATURAN:1:[A-Za-z0-9+/=]+$/.test(teks) && !teks.includes('TOKEN-RAHASIA'), 'Salin pengaturan → teks paket (token tidak terbaca polos)');
  // alamat baru: kosong
  const pb = await ctx.newPage(); pb.on('pageerror', e => errs.push(e.message));
  await pb.goto(B + '/'); await pb.waitForTimeout(500);
  ok(await pb.evaluate(() => !S.webAppUrl && !localStorage.getItem('ab3-tok')), 'alamat baru mulai kosong (penyimpanan beda alamat)');
  await pb.evaluate(() => openSettings()); await pb.waitForTimeout(150);
  await pb.locator('button', { hasText: 'Tempel pengaturan' }).click(); await pb.waitForTimeout(1500);
  const baru = await pb.evaluate(k => Object.fromEntries(k.map(x => [x, localStorage.getItem(x)])), Object.keys(lama));
  ok(JSON.stringify(baru) === JSON.stringify(lama), 'Tempel → URL, token, interval, menu, tema & riwayat cicilan subkon sama persis');
  ok(await pb.evaluate(() => S.webAppUrl.endsWith('/gas') && S.projects.length === 5 && document.documentElement.classList.contains('dark') && S.logAbsensi.length > 0), 'setelah muat ulang: data diunduh dari Sheet, tema ikut');
  ok(await pb.evaluate(() => Object.keys(S.riwayatBayarSubkon || {}).includes('LSK-1')), 'riwayat cicilan subkon ikut pindah');
  // tempel manual (clipboard tidak bisa dibaca) & teks salah
  const pc = await (await b.newContext({ viewport: { width: 412, height: 900 } })).newPage(); pc.on('pageerror', e => errs.push(e.message));
  await pc.goto(B + '/'); await pc.waitForTimeout(400);
  await pc.evaluate(() => tempelPengaturan()); await pc.waitForTimeout(150);
  ok(await pc.locator('#tp-teks').count() === 1, 'clipboard tidak bisa dibaca → kotak tempel manual');
  await pc.fill('#tp-teks', 'teks asal'); await pc.locator('button', { hasText: 'Pasang' }).click(); await pc.waitForTimeout(150);
  ok((await pc.locator('#toast').innerText()).includes('tidak dikenali') && !(await pc.evaluate(() => localStorage.getItem('ab3-tok'))), 'teks salah → ditolak, tidak ada yang berubah');
  await pc.fill('#tp-teks', teks); await pc.locator('button', { hasText: 'Pasang' }).click(); await pc.waitForTimeout(1500);
  ok(await pc.evaluate(() => JSON.parse(localStorage.getItem('ab3-tok')) === 'TOKEN-RAHASIA-123'), 'tempel manual → pengaturan terpasang');
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? fail + ' GAGAL' : 'SEMUA LULUS'); await b.close(); sA.close(); sB.close();
})();
