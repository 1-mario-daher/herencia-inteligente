/*
  Diagnóstico: intenta crear UN solo container con la imagen que se pasa por argumento.
  Uso: node test-one.js https://.../slide-6.png
*/
const fs = require('fs');
const path = require('path');
const IG = '17841447038623900';
const GRAPH = 'https://graph.facebook.com/v21.0';
const token = fs.readFileSync(path.join(__dirname, 'token.txt'), 'utf8').trim();
const url = process.argv[2];
if (!url) { console.error('Falta la URL'); process.exit(1); }

(async () => {
  const r = await (await fetch(`${GRAPH}/${IG}/media?is_carousel_item=true&image_url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(token)}`, { method: 'POST' })).json();
  if (r.error) { console.log('❌ FALLA:', r.error.message); process.exit(1); }
  console.log('✅ OK, container:', r.id);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
