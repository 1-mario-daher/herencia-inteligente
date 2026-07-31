/*
  Genera la imagen para el Status de WhatsApp (1080x1920, vertical).
  node make-status.js  ->  profile/status-nuevo-proyecto.png
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR = __dirname;
const W = 1080, H = 1920;
const outDir = path.join(DIR, 'profile');
fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;600&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{background:radial-gradient(130% 100% at 50% 0%, #12324b 0%, #0e2336 45%, #0a1726 100%);
    color:#f2ece1;font-family:'Inter',sans-serif;position:relative;
    display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px}
  .hair{position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent,#3fc8e6,transparent);opacity:.6}
  .kick{font-size:30px;letter-spacing:.34em;text-transform:uppercase;color:#3fc8e6;font-weight:600;margin-bottom:60px}
  h1{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:110px;line-height:1.05;letter-spacing:-.01em;margin-bottom:56px}
  .sub{color:#9fb3c4;font-size:38px;line-height:1.5;max-width:760px;margin-bottom:110px}
  .cta{font-size:30px;letter-spacing:.2em;text-transform:uppercase;color:rgba(242,236,225,.75);margin-bottom:30px}
  .pill{display:inline-block;background:#3fc8e6;color:#04222b;font-weight:600;font-size:42px;
    padding:28px 60px;border-radius:999px;letter-spacing:.01em}
  .ring{position:absolute;bottom:-340px;left:50%;transform:translateX(-50%);width:900px;height:900px;
    border:2px solid rgba(63,200,230,.18);border-radius:50%}
</style></head><body>
  <div class="hair"></div>
  <div class="kick">Nuevo proyecto</div>
  <h1>Herencia<br>Inteligente</h1>
  <div class="sub">Cómo tu patrimonio cruza a la siguiente generación — intacto, líquido y sin pleitos.</div>
  <div class="cta">Sígueme en Instagram</div>
  <div class="pill">@herencia.inteligente</div>
  <div class="ring"></div>
</body></html>`;

const htmlPath = path.join(outDir, 'status.html');
const pngPath = path.join(outDir, 'status-nuevo-proyecto.png');
fs.writeFileSync(htmlPath, html);
execFileSync(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-sandbox',
  '--force-device-scale-factor=1',`--window-size=${W},${H}`,'--virtual-time-budget=9000',
  `--screenshot=${pngPath}`,'file:///'+htmlPath.replace(/\\/g,'/')], {stdio:'ignore'});
fs.unlinkSync(htmlPath);
console.log('Listo:', pngPath);
