const { chromium } = require('D:/Mirror/Claude Cowork/Analisis Arthabumi Fcc v.2/arthabumi-fcc/node_modules/playwright');
const fs = require('fs'), path = require('path');
const dir = process.argv[2], per = 12;
const url0 = f => 'file:///' + f.split(path.sep).join('/');
const url = f => 'file:///' + path.join(__dirname, 'out', dir, f).split(path.sep).join('/');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1120 } });
  const files = fs.readdirSync(path.join(__dirname, 'out', dir)).filter(f => f.endsWith('.png')).sort();
  for (let s = 0; s * per < files.length; s++) {
    const fsl = files.slice(s * per, s * per + per);
    const hp=path.join(__dirname,'out','_sheet.html');fs.writeFileSync(hp,'<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(6,247px);gap:3px;font:11px sans-serif">' +
      fsl.map(f => `<div><img src="${url(f)}" style="width:247px;display:block"><div style="background:#000;color:#fff">${f}</div></div>`).join('') + '</body>');await p.goto(url0(hp));
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, 'out', `sheet-${dir}-${s}.png`), fullPage: true });
  }
  await b.close();
})();
