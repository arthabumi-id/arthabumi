// Uji setup.gs (U1, v1.45): jalankan setupAllSheets() dengan Google Sheet tiruan, laporkan argumen getRange yang salah.
const fs=require('fs'),vm=require('vm');
const bad=[];let calls=0,bgRows=0;
function mk(name,last){const h={get(t,p){
  if(p==='getLastRow')return()=>last;
  if(p==='getMaxRows')return()=>Math.max(last,1000);
  if(p==='getLastColumn'||p==='getMaxColumns')return()=>20;
  if(p==='getName')return()=>name;
  if(p==='getRange')return(...a)=>{calls++;if(a.length>1&&a.some(x=>typeof x!=='number'||!isFinite(x)||x<1))bad.push(name+' getRange('+a.join(',')+')');if(a.length===1&&/undefined|NaN|null/.test(String(a[0])))bad.push(name+' getRange("'+a[0]+'")');return P;};
  if(p==='setBackgrounds')return(v)=>{bgRows+=v.length;return P;};
  if(p===Symbol.toPrimitive)return()=>'mock';
  return (...a)=>{calls++;return P;};}};const P=new Proxy(function(){},h);return P;}
const sheets={};
const ss=new Proxy({},{get(t,p){if(p==='getSheetByName'||p==='insertSheet')return(n)=>sheets[n]=sheets[n]||mk(n,n==='LOG ABSENSI'?2400:80);return ()=>ss;}});
const SpreadsheetApp=new Proxy({},{get(t,p){if(p==='getActiveSpreadsheet')return()=>ss;if(p==='BorderStyle')return{SOLID:1,SOLID_MEDIUM:2};return()=>mk('builder',0);}});
const ctx={SpreadsheetApp,Logger:{log(){}},console,Utilities:{formatDate:()=>''}};vm.createContext(ctx);
for(const f of ['constants.gs','helpers.gs','setup.gs'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','backend',f),'utf8'),ctx,{filename:f});
vm.runInContext('setupAllSheets()',ctx);
console.log('panggilan',calls,'| baris warna (setBackgrounds)',bgRows,'| argumen salah:',bad.length?bad:'tidak ada');
