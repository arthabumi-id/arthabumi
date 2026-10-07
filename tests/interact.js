// Uji interaksi v1.41: dialog konfirmasi, penahan sync, tema.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const seedSrc = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const seed = eval(seedSrc.slice(seedSrc.indexOf('const P = '), seedSrc.indexOf('const seed = ')) + '(' + seedSrc.slice(seedSrc.indexOf('const seed = ') + 13, seedSrc.indexOf('};\n\nconst STATES') + 1) + ')');
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = q.url === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.addInitScript(seed => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); sessionStorage.setItem('seeded', '1'); } }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('native dialog'); d.dismiss(); });
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(500);
  await p.evaluate(() => setTab('beli', 'log')); await p.waitForTimeout(200);
  const n0 = await p.evaluate(() => S.pembelian.length);
  // Batal
  await p.locator('button[onclick^="delPembelian("]').first().click(); await p.waitForTimeout(150);
  ok(await p.locator('#cfm.show').isVisible(), 'dialog muncul (bukan confirm browser)');
  ok((await p.locator('.cfm-t').innerText()).startsWith('Hapus "'), 'judul dialog berisi nama barang');
  ok(await p.locator('.cfm-yes').innerText() === 'Hapus', 'tombol Hapus');
  await p.screenshot({ path: path.join(__dirname, 'out', 'dlg-hapus.png') });
  await p.locator('.cfm-no').click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.pembelian.length) === n0, 'Batal → tidak terhapus');
  // Esc
  await p.locator('button[onclick^="delPembelian("]').first().click(); await p.waitForTimeout(100);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok(!(await p.locator('#cfm.show').count()) && await p.evaluate(() => S.pembelian.length) === n0, 'Esc → tertutup, tidak terhapus');
  // sync datang saat dialog terbuka → ditahan; Batal → diterapkan
  await p.locator('button[onclick^="delPembelian("]').first().click(); await p.waitForTimeout(100);
  await p.evaluate(() => applyGS({ toko: ['A', 'B', 'C', 'D'] }));
  ok(await p.evaluate(() => S.masterToko.length) === 3, 'sync ditahan selama dialog terbuka');
  await p.locator('.cfm-no').click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.masterToko.length) === 4, 'Batal → sync yang ditahan diterapkan');
  // Ya → terhapus barang yang benar
  const target = await p.evaluate(() => { const ri = Number(document.querySelector('button[onclick^="delPembelian("]').getAttribute('onclick').match(/\d+/)[0]); return S.pembelian[ri].id; });
  await p.locator('button[onclick^="delPembelian("]').first().click(); await p.waitForTimeout(100);
  await p.evaluate(() => applyGS({ toko: ['X'] }));
  await p.locator('.cfm-yes').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.pembelian.length) === n0 - 1 && await p.evaluate(t => !S.pembelian.some(x => x.id === t), target), 'Ya → barang yang dipilih terhapus');
  ok(await p.evaluate(() => S.masterToko.length) === 4, 'Ya → sync yang ditahan dibuang (aksi berikutnya ambil data baru)');
  // closing (dua baris + tombol khusus)
  await p.evaluate(() => { go('closing'); }); await p.waitForTimeout(150);
  await p.evaluate(() => { confirmDeleteClosing('CLS-20260926'); }); await p.waitForTimeout(150);
  ok(await p.locator('.cfm-yes').innerText() === 'Batalkan closing' && (await p.locator('.cfm-b').innerText()).includes('Reset'), 'dialog batalkan closing: judul + rincian');
  await p.screenshot({ path: path.join(__dirname, 'out', 'dlg-closing.png') });
  await p.locator('.cfm-no').click();
  // tema
  ok(await p.evaluate(() => !document.documentElement.classList.contains('dark')), 'bawaan terang');
  await p.locator('#btn-theme').click(); await p.waitForTimeout(100);
  ok(await p.evaluate(() => document.documentElement.classList.contains('dark') && localStorage.getItem('ab3-theme') === 'dark'), 'tombol tema → gelap & diingat');
  await p.reload(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.documentElement.classList.contains('dark')), 'gelap tetap setelah reload');
  ok(await p.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Plus Jakarta')) && await p.evaluate(() => document.fonts.check('700 16px Fraunces')), 'huruf termuat');
  const m = await p.evaluate(() => document.querySelector('link[rel=manifest]') && fetch(document.querySelector('link[rel=manifest]').href).then(r => r.json()));
  ok(m && m.icons[0].src.endsWith('/icons/icon-192.png'), 'manifest ikon baru');
  ok((await p.evaluate(() => fetch('icons/icon-512.png').then(r => r.status))) === 200, 'file ikon tersedia');
  await p.evaluate(() => showToast('✅ Tersimpan <b>x</b>'));const tt = await p.evaluate(() => ({ t: document.getElementById('toast').textContent, svg: !!document.querySelector('#toast svg') }));ok(tt.t === 'Tersimpan <b>x</b>' && tt.svg, 'toast: emoji dibuang, ikon muncul, isi tetap teks biasa');
  ok(await p.evaluate(() => document.querySelectorAll('#nav .nav-btn svg.ic').length) === 6, 'menu bawah 6 ikon');
  ok(await p.evaluate(() => document.querySelectorAll('#nav .side-btn').length === 11 && getComputedStyle(document.querySelector('.nav-side')).display === 'none'), 'menu samping 11 item, tersembunyi di HP');
  await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(100);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.nav-side')).display === 'flex' && getComputedStyle(document.querySelector('.nav-btn')).display === 'none'), 'PC: menu samping tampil, menu bawah sembunyi');
  await p.locator('.side-btn', { hasText: 'Closing' }).click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.page === 'closing' && document.querySelector('.side-btn.on').innerText.trim() === 'Closing'), 'PC: klik menu samping pindah halaman');
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? `${fail} GAGAL` : 'SEMUA LULUS');
  await b.close(); srv.close();
})();
