// Bandingkan: ketik tanggal Custom di Log Pembelian — versi lama (HEAD) vs baru.
const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const path = require('path');
(async () => {
  for (const [n, f] of [['lama', process.argv[2]], ['baru', 'D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi/index.html']]) {
    const b = await chromium.launch(); const p = await (await b.newContext({ locale: 'id-ID' })).newPage();
    await p.goto('file:///' + path.resolve(f).split(path.sep).join('/')); await p.waitForTimeout(400);
    await p.evaluate(() => { S.pembelian = [{ id: 'B1', tgl: '2026-10-02', kodeProj: '', namaBarang: 'X', qty: 1, harga: 1, diskon: 0, status: 'HABIS', toko: '', bayarToko: 'Lunas' }]; setTab('beli', 'log'); setBeliDateFilter('custom'); });
    const d = p.locator('#content input[type=date]').nth(0); await d.click({ position: { x: 20, y: 20 } });
    await p.keyboard.type('01102026', { delay: 60 }); await p.waitForTimeout(150);
    console.log(n, JSON.stringify(await p.evaluate(() => ({ tersimpan: S.tab.beliDateFrom, fokus_di_tanggal: document.activeElement.type === 'date' }))));
    await b.close();
  }
})();
