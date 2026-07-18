/*
  Motor de render diario — @herencia.inteligente
  Convierte un post de posts.json en imagenes 1080x1350 (4:5) listas para Instagram.

  Uso:
    node build_post.js            -> renderiza el post mas reciente
    node build_post.js 2026-06-28 -> renderiza el post de esa fecha

  Salida: posts/<fecha>-<slug>/slide-1.png ... slide-N.png + caption.txt
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR = __dirname;
const W = 1080, H = 1350;

// ---------- cargar post ----------
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'posts.json'), 'utf8'));
const posts = data.posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const wanted = process.argv[2];
const post = wanted ? posts.find(p => p.date === wanted) : posts[0];
if (!post) { console.error('No encontre el post', wanted || '(mas reciente)'); process.exit(1); }

const slug = post.kicker.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const outDir = path.join(DIR, 'posts', `${post.date}-${slug}`);
fs.mkdirSync(outDir, { recursive: true });

// ---------- plantilla de un slide ----------
// separa cada frase en su propio bloque, con aire entre ellas (mejor lectura)
function spaced(html) {
  const parts = html.split(/(?<=[.?!])\s+(?=[¿¡"'A-ZÁÉÍÓÚÑ0-9$])/);
  if (parts.length <= 1) return html;
  return parts.map(p => `<span class="sent">${p}</span>`).join('');
}

function slideHTML({ kick, page, total, big, sub, isLead, isCTA, ctaLine, ctaFoot }) {
  const bg = isCTA
    ? 'linear-gradient(158deg,#0f2b40,#0a1726)'
    : 'linear-gradient(158deg,#0e2336,#10283e 55%,#0a1726)';
  const bigSize = isLead ? 68 : 58;
  const pill = isCTA
    ? `<div class="cta-line">${ctaLine || 'Escríbeme.'}</div>`
    : '';
  const foot = isCTA
    ? `<div class="foot cta"><span class="lema">${ctaFoot || 'Yo no vendo. A mí me compran.'}</span></div>`
    : `<div class="foot"><span>@herencia.inteligente</span></div>`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;600&display=swap">
<style>
  :root{--cream:#f2ece1;--muted:#9fb3c4;--cyan:#3fc8e6;
    --serif:'Fraunces','Palatino Linotype',Palatino,Georgia,serif;
    --sans:'Inter','Segoe UI',Roboto,sans-serif;}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{background:${bg};color:var(--cream);font-family:var(--sans);position:relative;
    padding:150px 110px;display:flex;flex-direction:column;justify-content:center}
  .hair{position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.55}
  .top{position:absolute;top:96px;left:110px;right:110px;display:flex;justify-content:space-between;align-items:center}
  .kick{font-size:25px;letter-spacing:.24em;text-transform:uppercase;color:var(--cyan);font-weight:600}
  .pg{font-size:25px;color:var(--muted);letter-spacing:.1em}
  .big{font-family:var(--serif);font-weight:400;line-height:1.19;letter-spacing:-.01em;font-size:${bigSize}px}
  .big strong{color:var(--cyan);font-weight:500}
  .big .sent{display:block}
  .big .sent + .sent{margin-top:.55em}
  .sub{color:var(--muted);font-size:34px;margin-top:30px;line-height:1.5}
  .cta-line{margin-top:46px;font-family:var(--serif);font-style:italic;font-weight:400;
    font-size:44px;color:var(--cyan);letter-spacing:-.01em}
  .foot{position:absolute;bottom:96px;left:110px;right:110px;display:flex;justify-content:space-between;align-items:center;
    font-size:23px;letter-spacing:.16em;text-transform:uppercase;color:rgba(159,179,196,.62)}
  .foot .name{color:var(--cream);opacity:.8}
  .foot.cta{justify-content:center}
  .foot.cta .lema{color:var(--cyan);opacity:.85;letter-spacing:.2em}
</style></head><body>
  <div class="hair"></div>
  <div class="top"><span class="kick">${kick}</span><span class="pg">${page}/${total}</span></div>
  <div class="big">${spaced(big)}</div>
  ${sub ? `<div class="sub">${sub}</div>` : ''}
  ${pill}
  ${foot}
</body></html>`;
}

// ---------- armar lista de slides (valor + cierre) ----------
const total = post.slides.length + 1;
const slides = post.slides.map((s, i) => ({
  kick: post.kicker, page: i + 1, total, big: s.big, sub: s.sub, isLead: i === 0
}));
const cl = post.close || {};
slides.push({
  kick: cl.kicker || 'Cierre', page: total, total, isCTA: true,
  big: cl.big || 'No te quiero vender nada. Pero si algo de esto te movió, <strong>ya sabes a qué me dedico.</strong>',
  ctaLine: cl.line || 'Escríbeme.',
  ctaFoot: cl.foot || 'Yo no vendo. A mí me compran.'
});

// ---------- render con Chrome headless ----------
slides.forEach((s, i) => {
  const htmlPath = path.join(outDir, `slide-${i + 1}.html`);
  const pngPath = path.join(outDir, `slide-${i + 1}.png`);
  fs.writeFileSync(htmlPath, slideHTML(s));
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--force-device-scale-factor=1', `--window-size=${W},${H}`,
    '--virtual-time-budget=9000', `--screenshot=${pngPath}`,
    'file:///' + htmlPath.replace(/\\/g, '/')
  ], { stdio: 'ignore' });
  fs.unlinkSync(htmlPath);
  console.log('  ✓ slide-' + (i + 1) + '.png');
});

// ---------- caption para Instagram ----------
const caption = post.caption ||
`${post.slides[0].big.replace(/<[^>]+>/g, '')}

Desliza →

En México, heredar bien no es suerte: es diseño. Cada semana comparto cómo el patrimonio cruza a la siguiente generación sin romperse.

Si algo de esto te movió, escríbeme. Yo no vendo: a mí me compran.

—
#herencia #patrimonio #sucesion #planeacionpatrimonial #seguros #mexico #finanzas #legado`;
fs.writeFileSync(path.join(outDir, 'caption.txt'), caption, 'utf8');

console.log('\nListo:', outDir);
console.log('Slides:', total, '| Caption: caption.txt');
