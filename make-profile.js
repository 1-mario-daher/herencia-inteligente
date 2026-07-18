/*
  Genera la foto de perfil de @herencia.inteligente (sello navy + cyan, 640x640).
  node make-profile.js  ->  profile/avatar.png
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR = __dirname;
const S = 640;
const outDir = path.join(DIR, 'profile');
fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${S}px;height:${S}px;overflow:hidden}
  body{background:radial-gradient(120% 120% at 50% 35%, #12324b 0%, #0e2336 45%, #0a1726 100%);
    display:flex;align-items:center;justify-content:center;
    font-family:'Fraunces','Palatino Linotype',Palatino,Georgia,serif;color:#f2ece1;position:relative}
  .ring{position:absolute;inset:56px;border:2px solid rgba(63,200,230,.45);border-radius:50%}
  .wrap{text-align:center;line-height:1}
  .top{font-size:26px;letter-spacing:.34em;color:#3fc8e6;font-weight:500;text-transform:uppercase;margin-bottom:26px;font-family:'Inter',sans-serif}
  .mono{font-size:150px;font-weight:400;letter-spacing:.02em;color:#f2ece1}
  .mono .dot{color:#3fc8e6}
  .bottom{font-size:22px;letter-spacing:.30em;color:rgba(242,236,225,.72);text-transform:uppercase;margin-top:30px;font-family:'Inter',sans-serif}
</style></head><body>
  <div class="ring"></div>
  <div class="wrap">
    <div class="top">Herencia</div>
    <div class="mono">hi<span class="dot">.</span></div>
    <div class="bottom">Inteligente</div>
  </div>
</body></html>`;

const htmlPath = path.join(outDir, 'avatar.html');
const pngPath = path.join(outDir, 'avatar.png');
fs.writeFileSync(htmlPath, html);
execFileSync(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-sandbox',
  '--force-device-scale-factor=1',`--window-size=${S},${S}`,'--virtual-time-budget=9000',
  `--screenshot=${pngPath}`,'file:///'+htmlPath.replace(/\\/g,'/')], {stdio:'ignore'});
fs.unlinkSync(htmlPath);
console.log('Listo:', pngPath);
