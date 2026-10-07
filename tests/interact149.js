// Uji v1.49: tombol kembali ke atas.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const path = require('path');
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h, nama] of [[412, 900, 'HP'], [1280, 800, 'PC']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi/index.html'); await p.waitForTimeout(400);
    await p.evaluate(() => { S.pembelian = Array.from({ length: 60 }, (_, i) => ({ id: 'B' + i, tgl: '2026-10-0' + (1 + i % 5), kodeProj: '', namaBarang: 'Barang ' + i, kategori: 'Material', satuan: 'pcs', qty: 1, harga: 1000, diskon: 0, status: 'HABIS', toko: 'Toko ' + (i % 4), bayarToko: 'Lunas' })); setTab('beli', 'log'); });
    await p.waitForTimeout(200);
    const vis = () => p.evaluate(() => getComputedStyle(document.getElementById('toTop')).opacity === '1');
    ok(!(await vis()), nama + ': di atas → tombol tersembunyi');
    await p.evaluate(() => document.getElementById('content').scrollTop = 1500); await p.waitForTimeout(350);
    ok(await vis(), nama + ': digulir ke bawah → tombol muncul');
    if (nama === 'HP') await p.screenshot({ path: path.join(__dirname, 'out', 'v149-totop.png') });
    await p.locator('#toTop').click(); await p.waitForTimeout(900);
    ok(await p.evaluate(() => document.getElementById('content').scrollTop) === 0 && !(await vis()), nama + ': ketuk → kembali ke paling atas, tombol hilang lagi');
    await p.evaluate(() => document.getElementById('content').scrollTop = 1500); await p.waitForTimeout(300);
    await p.evaluate(() => go('dashboard')); await p.waitForTimeout(350);
    ok(await p.evaluate(() => document.getElementById('content').scrollTop < 400) ? !(await vis()) : true, nama + ': pindah halaman pendek → tombol menyesuaikan');
    ok(errs.length === 0, nama + ': tanpa error ' + errs.join('; '));
  }
  console.log(fail ? fail + ' GAGAL' : 'SEMUA LULUS'); await b.close();
})();
