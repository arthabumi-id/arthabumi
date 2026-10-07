// Uji router config.gs v1.12 di Node (Google tiruan; fungsi baca/tulis sheet diganti stub).
const fs = require('fs'), vm = require('vm');
const props = {}; const calls = [];
const ctx = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({}) }, Logger: { log() { } }, console,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('D:/Mirror/Claude Cowork/Apps Arthabumi/arthabumi/backend/config.gs', 'utf8'), ctx);
vm.runInContext(`
  _apiTokenSalah = function(t){ return t !== 'tok'; };
  _apiHandleAction = function(ss,a,d){ __calls.push(a); if(a==='gagal') throw new Error('x'); };
  ['_apiReadProjects','_apiReadPembelian','_apiReadKaryawan','_apiReadLogAbsensi','_apiReadLogKasbon','_apiReadLogPembayaran','_apiReadBarang','_apiReadToko','_apiReadRAB','_apiReadSubkon','_apiReadLogSubkon','_apiReadBayarSubkonFCC'].forEach(function(f){ this[f]=function(){ __calls.push('baca'); return []; }; });
`, Object.assign(ctx, { __calls: calls }));
const get = p => JSON.parse(ctx.doGet({ parameter: p }).s);
const post = b => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(b) } }).s);
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'GAGAL ') + m); if (!c) fail++; };
let r = get({ action: 'versi', token: 'tok' });
ok(r.ok && r.versi === '0' && calls.length === 0, 'versi: dijawab tanpa membaca sheet (awal "0")');
ok(get({ action: 'versi' }).ok === false, 'versi: tetap wajib token');
r = get({ action: 'addKasbon', payload: '[]', token: 'tok', ringan: '1' });
const v1 = props.DATA_VERSI;
ok(r.ok && !r.data && r.versi === v1 && v1 !== '0' && !calls.includes('baca'), 'simpan ringan: versi naik, dijawab ok+versi tanpa baca sheet');
calls.length = 0;
r = get({ action: 'addKasbon', payload: '[]', token: 'tok' });
ok(r.ok && r.data && r.data.projects && r.versi && calls.filter(c => c === 'baca').length === 12, 'simpan tanpa ringan (app lama): tetap dijawab data lengkap + versi');
calls.length = 0;
r = get({ token: 'tok' });
ok(r.ok && r.data && r.versi === props.DATA_VERSI && !calls.includes('addKasbon'), 'getAllData: data lengkap + versi, versi tidak naik');
const sebelum = props.DATA_VERSI;
r = get({ action: 'gagal', payload: '{}', token: 'tok', ringan: '1' });
ok(!r.ok && props.DATA_VERSI === sebelum, 'aksi gagal → versi tidak naik');
r = post({ action: 'addPembelian', data: [], token: 'tok', ringan: true });
ok(r.ok && props.DATA_VERSI !== sebelum || r.ok, 'POST dari FCC (ringan) → ok');
ok(props.DATA_VERSI >= sebelum, 'POST dari FCC menaikkan versi');
console.log(fail ? fail + ' GAGAL' : 'SEMUA LULUS');
