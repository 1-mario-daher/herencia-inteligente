/*
  Realinea las fechas de posts.json a la realidad y renombra las carpetas de posts/ para que coincidan.
  Uso: node reorder-dates.js
*/
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const MAP = {
  'El encuadre': '2026-07-17',
  'Más rico de lo que crees': '2026-07-18',
  'Liquidez': '2026-07-21',
  'La gran mentira': '2026-07-22',
  'El costo de no planear': '2026-07-23',
  'Lo que el SAT no te dijo': '2026-07-24',
  'Tu número': '2026-07-25',
  'El error de los iguales': '2026-07-26',
  'Privacidad y certeza': '2026-07-27',
  'La trampa del tiempo': '2026-07-28'
};

const slugify = k => k.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const data = JSON.parse(fs.readFileSync(path.join(DIR, 'posts.json'), 'utf8'));
const postsDir = path.join(DIR, 'posts');

for (const post of data.posts) {
  const newDate = MAP[post.kicker];
  if (!newDate) { console.log('  ⚠ sin mapeo:', post.kicker); continue; }
  const slug = slugify(post.kicker);
  const oldFolder = `${post.date}-${slug}`;
  const newFolder = `${newDate}-${slug}`;
  // renombrar carpeta si existe y cambia
  if (oldFolder !== newFolder) {
    const oldPath = path.join(postsDir, oldFolder);
    const newPath = path.join(postsDir, newFolder);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`  ✓ ${oldFolder}  →  ${newFolder}`);
    } else {
      console.log(`  · carpeta no existe (${oldFolder}), solo actualizo fecha`);
    }
  }
  post.date = newDate;
}

// ordenar por fecha ascendente para que el archivo quede legible
data.posts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
fs.writeFileSync(path.join(DIR, 'posts.json'), JSON.stringify(data, null, 2));
console.log('\nposts.json actualizado y reordenado por fecha.');
