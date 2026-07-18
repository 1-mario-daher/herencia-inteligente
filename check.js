/*
  Verifica que el token de token.txt sirva y muestre la cuenta de Instagram.
  Uso: node check.js
*/
const fs = require('fs');
const path = require('path');
const IG = '17841447038623900';
const GRAPH = 'https://graph.facebook.com/v21.0';
const token = fs.readFileSync(path.join(__dirname, 'token.txt'), 'utf8').trim();

(async () => {
  const url = `${GRAPH}/${IG}?fields=username,name,followers_count,media_count&access_token=${encodeURIComponent(token)}`;
  const j = await (await fetch(url)).json();
  if (j.error) { console.error('❌ Token NO sirve:', j.error.message); process.exit(1); }
  console.log('✅ Token OK');
  console.log('   Cuenta:', '@' + j.username);
  console.log('   Seguidores:', j.followers_count);
  console.log('   Publicaciones:', j.media_count);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
