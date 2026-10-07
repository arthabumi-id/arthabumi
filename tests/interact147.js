// Uji v1.47: dropdown cari, reset filter, kosongkan isian, ketik tanggal custom.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi';
const hs = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const P = eval('(' + hs.slice(hs.indexOf('const P = ') + 10, hs.indexOf(';\nconst seed = ')) + ')');
const seed = eval(hs.slice(hs.indexOf('const P = '), hs.indexOf('const seed = ')) + '(' + hs.slice(hs.indexOf('const seed = ') + 13, hs.indexOf('};\n\nconst STATES') + 1) + ')');
// data lebih banyak (seperti data asli) supaya dropdown ≥ 7 pilihan
['Renovasi Baja - Pak Johan GV', 'Kanopi Rumah Bu Sinta', 'Waterproofing Ruko Kopo', 'Interior Kafe Senopati', 'Pagar Gudang Cikarang', 'Plafon Kantor Grogol'].forEach((n, i) => seed['ab3-p'].push(P('PRJ-03' + i, n, 'Renovasi', 'Berjalan', 50000000, 10)));
seed['ab3-toko'].push('Toko Baut - Sumber Sejahtera', 'Depo Bangunan Daan Mogot', 'Mitra10 Taman Palem', 'Toko Cat Warna Indah');
seed['ab3-beli'].push({ id: 'BLI-9', tgl: '2026-09-28', kodeProj: 'PRJ-030', namaBarang: 'Baut M12', kategori: 'Material', satuan: 'pcs', qty: 100, harga: 1500, diskon: 0, status: 'HABIS', toko: 'Toko Baut - Sumber Sejahtera', total: 150000, bayarToko: 'Lunas' });
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = q.url.split('?')[0] === '/' ? path.join(APP, 'index.html') : path.join(APP, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, locale: 'id-ID' });
  await ctx.addInitScript(seed => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in seed) localStorage.setItem(k, JSON.stringify(seed[k])); sessionStorage.setItem('seeded', '1'); } }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('native dialog'); d.dismiss(); });
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(500);
  await p.evaluate(() => setTab('beli', 'log')); await p.waitForTimeout(200);
  ok(await p.locator('#content .cbx').count() === 2, 'Log Pembelian: filter Proyek & Toko jadi kotak ketik');
  // ketik keyword proyek
  const proj = p.locator('#content .cbx').nth(0).locator('.cbx-in');
  await proj.click(); await proj.type('johan', { delay: 30 });
  const opts = await p.locator('#content .cbx').nth(0).locator('.cbx-opt').allInnerTexts();
  ok(opts.length === 1 && opts[0] === 'Renovasi Baja - Pak Johan GV', 'ketik "johan" → tersaring 1 proyek: ' + JSON.stringify(opts));
  await p.screenshot({ path: path.join(__dirname, 'out', 'v147-cari.png') });
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.beliFilter) === 'PRJ-030' && (await p.locator('#beli-items').innerText()).includes('Baut M12') && !(await p.locator('#beli-items').innerText()).includes('Semen'), 'Enter → filter proyek terpasang, daftar ikut tersaring');
  ok(await p.locator('#content .cbx').nth(0).locator('.cbx-in').inputValue() === 'Renovasi Baja - Pak Johan GV', 'kotak menampilkan proyek terpilih');
  // toko: ketik 2 kata, klik pilihan
  const toko = p.locator('#content .cbx').nth(1).locator('.cbx-in');
  await toko.click(); await toko.type('sumber baut', { delay: 20 }); await p.waitForTimeout(100);
  await p.locator('#content .cbx').nth(1).locator('.cbx-opt').first().click(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.beliTokoFilter) === 'Toko Baut - Sumber Sejahtera', 'ketik "sumber baut" (urutan kata bebas) → klik → filter toko terpasang');
  // tidak cocok
  await toko.click(); await toko.fill(''); await toko.type('zzz'); await p.waitForTimeout(80);
  ok((await p.locator('#content .cbx').nth(1).locator('.cbx-none').innerText()) === 'Tidak ada yang cocok', 'kata tidak cocok → "Tidak ada yang cocok"');
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  ok(await toko.inputValue() === 'Toko Baut - Sumber Sejahtera' && await p.evaluate(() => S.beliTokoFilter) === 'Toko Baut - Sumber Sejahtera', 'Esc → kembali ke pilihan semula');
  // tombol × hapus pilihan
  await p.locator('#content .cbx').nth(1).locator('.cbx-x').dispatchEvent('pointerdown'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.beliTokoFilter) === '', 'tombol × → kembali "Semua Toko"');
  // reset filter
  ok(await p.locator('.filter-reset button').isEnabled(), 'Reset filter aktif saat ada filter');
  await p.locator('.filter-reset button').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.beliFilter === '' && S.beliTokoFilter === '' && !S.beliLogQ && (S.tab.beliDateMode || 'all') === 'all'), 'Reset filter → semua filter kosong');
  ok(!(await p.locator('.filter-reset button').isEnabled()), 'Reset filter nonaktif saat tidak ada filter');
  // tanggal custom: ketik mulus
  await p.evaluate(() => setBeliDateFilter('custom')); await p.waitForTimeout(150);
  const d1 = p.locator('#content input[type=date]').nth(0);
  await d1.click({ position: { x: 20, y: 20 } }); await p.keyboard.type('01102026', { delay: 60 }); await p.waitForTimeout(150); console.log('  nilai kolom:', await d1.inputValue());
  const st = await p.evaluate(() => ({ v: S.tab.beliDateFrom, fokus: document.activeElement && document.activeElement.type === 'date' }));
  ok(st.v === '2026-10-01' && st.fokus, 'ketik tanggal Dari 01/10/2026 tanpa terputus (fokus tetap di kolom): ' + JSON.stringify(st));
  ok(!(await p.locator('#beli-items').innerText()).includes('Baut M12') && (await p.locator('#beli-items').innerText()).includes('Semen'), 'daftar langsung tersaring dari 1 Okt');
  // absensi log: tanggal + reset
  await p.evaluate(() => { setTab('absensi', 'log'); setAbsDateFilter('custom'); }); await p.waitForTimeout(150);
  const a1 = p.locator('#content input[type=date]').nth(0);
  await a1.click({ position: { x: 20, y: 20 } }); await p.keyboard.type('25092026', { delay: 60 }); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.tab.absDateFrom === '2026-09-25' && document.activeElement.type === 'date'), 'Log Absensi: ketik tanggal mulus');
  await p.locator('.filter-reset button').click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => (S.tab.absDateMode || 'all') === 'all' && !S.tab.absDateFrom && !S.absKarFilter), 'Log Absensi: Reset filter');
  // kosongkan isian
  await p.evaluate(() => { S.formItems = [{ namaBarang: 'Semen', kategori: 'Material', satuan: 'sak', qty: 3, harga: 60000, diskon: 0, status: 'HABIS', toko: 'X' }]; S.formBeliProj = 'PRJ-021'; setTab('beli', 'input'); }); await p.waitForTimeout(150);
  ok(await p.locator('#content .cbx').count() >= 1, 'form Pembelian: pilihan proyek bisa diketik');
  await p.locator('.form-top button').click(); await p.waitForTimeout(100);
  ok(await p.locator('.cfm-yes').innerText() === 'Kosongkan', 'Kosongkan isian minta konfirmasi');
  await p.locator('.cfm-yes').click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.formItems.length === 1 && S.formItems[0].namaBarang === '' && S.formBeliProj === ''), 'form Pembelian dikosongkan');
  const nb = await p.evaluate(() => S.pembelian.length);
  ok(nb === seed['ab3-beli'].length, 'data pembelian tersimpan tidak tersentuh');
  // form subkon: pilihan proyek via ketik → submit membaca nilai select asli
  await p.evaluate(() => setTab('subkon', 'input')); await p.waitForTimeout(150);
  const sp = p.locator('#content .cbx').first().locator('.cbx-in');
  await sp.click(); await sp.type('kafe'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => [...document.querySelectorAll('#content select')].some(s => s.value === 'PRJ-033')), 'form Subkon: pilihan lewat ketik tersimpan di dropdown asli (dibaca saat Simpan)');
  // nilai diubah lewat kode ikut tampil
  await p.evaluate(() => { const s = [...document.querySelectorAll('#content select')].find(s => s._cbx); s.value = 'PRJ-022'; });
  ok((await p.locator('#content .cbx').first().locator('.cbx-in').inputValue()).startsWith('Renovasi Interior Kantor'), 'nilai yang diubah lewat kode ikut tampil di kotak ketik');
  // dropdown pendek tetap biasa
  ok(await p.evaluate(() => { const s = [...document.querySelectorAll('select')].filter(s => s.options.length < 7); return s.length > 0 && s.every(x => !x._cbx); }), 'dropdown pendek (status, metode, dll.) tetap dropdown biasa');
  ok(errs.length === 0, 'tanpa error: ' + errs.join('; '));
  console.log(fail ? `${fail} GAGAL` : 'SEMUA LULUS'); await b.close(); srv.close();
})();
