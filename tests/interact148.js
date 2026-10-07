// Uji v1.48 dengan Apps Script tiruan: hitung unduhan lengkap vs cek versi.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const hs = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const seed = eval(hs.slice(hs.indexOf('const P = '), hs.indexOf('const seed = ')) + '(' + hs.slice(hs.indexOf('const seed = ') + 13, hs.indexOf('};\n\nconst STATES') + 1) + ')');
const DATA = { projects: seed['ab3-p'], pembelian: seed['ab3-beli'], karyawan: seed['ab3-kr'], logAbsensi: seed['ab3-abs'], logKasbon: seed['ab3-ksb'], logPembayaran: seed['ab3-bayar'], barang: seed['ab3-brg'], toko: seed['ab3-toko'], rab: seed['ab3-rab'], subkon: seed['ab3-sk'], logSubkon: seed['ab3-lsk'], bayarSubkonFCC: [] };
let versi = '100', lama = false; const hit = { versi: 0, full: 0, tulis: 0, tulisRingan: 0 };
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/gas') {
    const a = u.searchParams.get('action') || 'getAllData'; let o;
    r.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    if (a === 'versi') { hit.versi++; o = lama ? { ok: false, error: 'Unknown action: versi (line 9)' } : { ok: true, versi, ms: 40 }; }
    else if (a === 'getAllData') { hit.full++; o = { ok: true, versi: lama ? undefined : versi, data: DATA, ms: lama ? undefined : 9100 }; }
    else { hit.tulis++; versi = String(+versi + 1); if (u.searchParams.get('ringan') && !lama) { hit.tulisRingan++; o = { ok: true, versi }; } else o = { ok: true, data: DATA }; }
    return r.end(JSON.stringify(o));
  }
  const f = u.pathname === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(u.pathname));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
const tunggu = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.addInitScript(({ seed, url }) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); localStorage.setItem('ab3-url', JSON.stringify(url)); localStorage.setItem('ab3-poll', JSON.stringify(0)); sessionStorage.setItem('seeded', '1'); } }, { seed, url: `http://localhost:${port}/gas` });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(800);
  ok(hit.full === 1 && hit.versi === 0, 'buka app pertama: 1x unduh lengkap ' + JSON.stringify(hit));
  ok(await p.evaluate(() => S.dataVersi) === '100', 'versi data tersimpan di perangkat');
  // sync otomatis tanpa perubahan
  for (let i = 0; i < 3; i++) { await p.evaluate(() => doFetch()); }
  ok(hit.full === 1 && hit.versi === 3, '3x sync tanpa perubahan: hanya cek versi, 0 unduh lengkap ' + JSON.stringify(hit));
  // perubahan dari FCC (versi naik di server)
  versi = '200'; DATA.projects = DATA.projects.map(x => x.kode === 'PRJ-021' ? { ...x, nama: 'Waterproofing (dari FCC)' } : x);
  await p.evaluate(() => doFetch()); await p.waitForTimeout(100);
  ok(hit.full === 2 && (await p.locator('#content').innerText()).includes('Waterproofing (dari FCC)'), 'data berubah (mis. kiriman FCC): cek versi → unduh lengkap → tampil');
  // simpan
  const h0 = { ...hit };
  await p.evaluate(() => { S.ksbF = { tgl: '2026-10-06', kr: 'KRY-001', tipe: 'AMBIL', nom: 50000, proj: '', ket: '' }; submitKasbon(); }); await p.waitForTimeout(100);
  await p.locator('.cfm-yes').click(); await p.waitForTimeout(600);
  ok(hit.tulisRingan === 1 && hit.full === h0.full + 1, 'Simpan: dijawab ringkas, lalu data terbaru diambil di belakang layar ' + JSON.stringify(hit));
  ok(await p.evaluate(() => S.dataVersi) === versi && !(await p.evaluate(() => document.body.classList.contains('is-busy'))), 'versi ikut terbaru, tombol tidak terkunci');
  // Sync manual selalu lengkap
  const f0 = hit.full; await p.evaluate(() => manualSync()); await p.waitForTimeout(300);
  ok(hit.full === f0 + 1, 'Sync manual: unduh lengkap');
  // 10 menit tanpa unduh lengkap → lengkap lagi (jaga perubahan langsung di Sheet)
  const f1 = hit.full; await p.evaluate(() => { S._lastFull = Date.now() - 11 * 60000; return doFetch(); });
  ok(hit.full === f1 + 1, '> 10 menit sejak unduh lengkap: unduh lengkap lagi');
  // pengukur
  await p.evaluate(() => openSettings()); await p.waitForTimeout(150);
  const spd = await p.locator('.spd-box').innerText();
  ok(/Cek perubahan: [\d,]+ dtk/.test(spd) && /Unduh data lengkap: [\d,]+ dtk · \d+ KB/.test(spd) && /kerja server 0,0 dtk/.test(spd) && /kerja server 9,1 dtk/.test(spd), 'Pengaturan menampilkan kecepatan sync + waktu kerja server (v1.51):\n' + spd);
  // [v1.51] sync otomatis yang timeout: tanpa toast merah; Sync manual yang timeout: tetap ada pesan
  await p.evaluate(() => { document.getElementById('toast').textContent = ''; const f = window.fetch; window.fetch = (u, o) => String(u).includes('/gas') ? Promise.reject(Object.assign(new Error('t'), { name: 'AbortError' })) : f(u, o); window._fetchAsli = f; });
  await p.evaluate(() => doFetch()); await p.waitForTimeout(100);
  ok(!(await p.locator('#toast').innerText()).includes('timeout') && await p.evaluate(() => !!S.syncError), 'sync otomatis timeout → tanpa toast merah (tanda di header saja)');
  await p.evaluate(() => manualSync()); await p.waitForTimeout(150);
  ok((await p.locator('#toast').innerText()).includes('timeout'), 'Sync manual timeout → pesan tetap muncul');
  await p.evaluate(() => { window.fetch = window._fetchAsli; });
  await p.screenshot({ path: path.join(__dirname, 'out', 'v148-settings.png') });
  await p.evaluate(() => closeModal());
  // backend lama (belum di-deploy): tetap jalan seperti dulu
  lama = true; const g0 = { ...hit };
  await p.evaluate(() => doFetch()); await p.evaluate(() => doFetch());
  ok(hit.full === g0.full + 2 && hit.versi === g0.versi + 1, 'backend lama: sekali dicoba "versi" ditolak → kembali unduh lengkap seperti dulu ' + JSON.stringify(hit));
  await p.evaluate(() => { S.ksbF = { tgl: '2026-10-06', kr: 'KRY-001', tipe: 'AMBIL', nom: 60000, proj: '', ket: '' }; submitKasbon(); }); await p.waitForTimeout(100);
  const g1 = hit.full; await p.locator('.cfm-yes').click(); await p.waitForTimeout(500);
  ok(hit.full === g1, 'backend lama: simpan dijawab data lengkap → tidak perlu unduh tambahan');
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? `${fail} GAGAL` : 'SEMUA LULUS'); await b.close(); srv.close();
})();
