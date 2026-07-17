/*
  Sube las imagenes de un post a un hosting publico (catbox.moe, anonimo) y
  devuelve las URLs publicas. La API de Instagram exige image_url accesible.
  Uso: node upload-images.js 2026-06-29
*/
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const date = process.argv[2];
if (!date) { console.error('Falta la fecha. Uso: node upload-images.js 2026-06-29'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(path.join(DIR, 'posts.json'), 'utf8'));
const post = data.posts.find(p => p.date === date);
if (!post) { console.error('No hay post con fecha', date); process.exit(1); }
const slug = post.kicker.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const folder = path.join(DIR, 'posts', `${date}-${slug}`);

async function uploadOne(file) {
  const buf = fs.readFileSync(path.join(folder, file));
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', new Blob([buf], { type: 'image/png' }), file);
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
  const url = (await res.text()).trim();
  if (!/^https?:\/\//.test(url)) throw new Error('Respuesta inesperada para ' + file + ': ' + url);
  return url;
}

(async () => {
  const files = fs.readdirSync(folder).filter(f => /^slide-\d+\.png$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
  const urls = [];
  for (const f of files) {
    const u = await uploadOne(f);
    urls.push(u);
    console.error('  ✓', f, '->', u);
  }
  // salida limpia (solo el JSON de URLs) en stdout para copiar
  console.log(JSON.stringify(urls));
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
