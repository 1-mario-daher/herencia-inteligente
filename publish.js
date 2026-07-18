/*
  Publicador a Instagram — @herencia.inteligente
  Publica un carrusel (las imagenes de posts/<fecha>-<slug>/) via la API oficial de Meta.
  Mario NO toca Instagram. Se corre tras su "queda" en el chat.

  Requisitos (se llenan una sola vez tras autorizar):
    .secret.json  ->  { "ig_user_id": "...", "token": "...", "image_base_url": "https://..." }
      - ig_user_id: ID de la cuenta profesional de IG (lo saco al conectar)
      - token: token de larga duracion (60 dias, se refresca solo con refresh-token.js)
      - image_base_url: base publica donde viven las imagenes (GitHub Pages / hosting)

  Uso:
    node publish.js 2026-06-29        -> publica el carrusel de esa fecha
    node publish.js                   -> publica el mas reciente que NO este marcado como publicado

  La API exige que las imagenes esten en URLs publicas (image_url). Por eso primero
  se suben al hosting (ver deploy-images.js) y aqui solo se referencian.
*/
const fs = require('fs');
const path = require('path');

const GRAPH = 'https://graph.facebook.com/v21.0';
const DIR = __dirname;
const STAMP = Date.now(); // anti-cache para las URLs de imagen

// ---------- config ----------
const ig_user_id = '17841447038623900';                                                 // herencia.inteligente
const image_base_url = 'https://raw.githubusercontent.com/1-mario-daher/herencia-inteligente/main';
const tokenPath = path.join(DIR, 'token.txt');
if (!fs.existsSync(tokenPath)) {
  console.error('Falta el archivo token.txt (pega ahi el token de Instagram). Aun no puedo publicar.');
  process.exit(1);
}
const token = fs.readFileSync(tokenPath, 'utf8').trim();
if (!token || !/^EAA/.test(token)) { console.error('El .token no tiene un token valido (debe empezar con EAA).'); process.exit(1); }

// ---------- elegir post ----------
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'posts.json'), 'utf8'));
const posts = data.posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const wanted = process.argv[2];
const post = wanted ? posts.find(p => p.date === wanted) : posts.find(p => !p.published);
if (!post) { console.error('No hay post para publicar.'); process.exit(1); }

const slug = post.kicker.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const folder = `${post.date}-${slug}`;
const postDir = path.join(DIR, 'posts', folder);
if (!fs.existsSync(postDir)) { console.error('No existe la carpeta', folder, '- corre build_post.js primero.'); process.exit(1); }

const slides = fs.readdirSync(postDir).filter(f => /^slide-\d+\.png$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
const caption = fs.existsSync(path.join(postDir, 'caption.txt'))
  ? fs.readFileSync(path.join(postDir, 'caption.txt'), 'utf8') : '';

// ---------- helpers ----------
async function g(endpoint, params) {
  const url = new URL(GRAPH + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message + ' (' + JSON.stringify(json.error) + ')');
  return json;
}

async function waitReady(containerId) {
  for (let i = 0; i < 30; i++) {
    const url = new URL(`${GRAPH}/${containerId}`);
    url.searchParams.set('fields', 'status_code');
    url.searchParams.set('access_token', token);
    const j = await (await fetch(url)).json();
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR') throw new Error('Container ERROR: ' + containerId);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Timeout esperando el container ' + containerId);
}

// ---------- publicar ----------
(async () => {
  console.log(`Publicando "${post.kicker}" (${post.date}) — ${slides.length} slides`);

  // 1) container por cada imagen
  const children = [];
  for (const file of slides) {
    // ?v= rompe el cache de Meta: si un intento falla, cachea el fallo para esa URL exacta
    const image_url = `${image_base_url.replace(/\/$/, '')}/posts/${folder}/${file}?v=${STAMP}`;
    const r = await g(`/${ig_user_id}/media`, {
      image_url, is_carousel_item: 'true', access_token: token
    });
    children.push(r.id);
    console.log('  ✓ container', file, '->', r.id);
    await new Promise(res => setTimeout(res, 2000)); // pausa: IG se atraganta si le pegamos muy seguido
  }

  // 2) container del carrusel
  const carousel = await g(`/${ig_user_id}/media`, {
    media_type: 'CAROUSEL', children: children.join(','), caption, access_token: token
  });
  await waitReady(carousel.id);

  // 3) publicar
  const pub = await g(`/${ig_user_id}/media_publish`, {
    creation_id: carousel.id, access_token: token
  });
  console.log('\n🎉 PUBLICADO en Instagram. media id:', pub.id);

  // 4) marcar como publicado en posts.json
  post.published = new Date().toISOString();
  post.ig_media_id = pub.id;
  fs.writeFileSync(path.join(DIR, 'posts.json'), JSON.stringify(data, null, 2));
})().catch(e => { console.error('\n❌ Error al publicar:', e.message); process.exit(1); });
