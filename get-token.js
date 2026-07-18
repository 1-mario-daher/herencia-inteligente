/*
  Convierte el token corto (token.txt) en un TOKEN DE PÁGINA que NO expira,
  y lo guarda de vuelta en token.txt. Se corre una sola vez (o si algún día
  Mario cambia su contraseña de Facebook y hay que renovar).

  Requiere:
    token.txt      -> un token de usuario VÁLIDO (fresco del Explorer)
    appsecret.txt  -> la clave secreta de la app de Meta (Settings > Basic > Mostrar)

  Uso: node get-token.js
  Nunca imprime los tokens; solo confirma.
*/
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const APP_ID = '1046336254466591';
const PAGE_ID = '1155350744338836';
const GRAPH = 'https://graph.facebook.com/v21.0';

const tokenPath = path.join(DIR, 'token.txt');
const secretPath = path.join(DIR, 'appsecret.txt');
if (!fs.existsSync(tokenPath)) { console.error('Falta token.txt (pega un token fresco del Explorer).'); process.exit(1); }
if (!fs.existsSync(secretPath)) { console.error('Falta appsecret.txt (pega la clave secreta de la app).'); process.exit(1); }
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const secret = fs.readFileSync(secretPath, 'utf8').trim();
if (!/^EAA/.test(token)) { console.error('token.txt no trae un token válido (debe empezar con EAA).'); process.exit(1); }

(async () => {
  // 1) token corto -> token de usuario de larga duración (60 días)
  const u = new URL(GRAPH + '/oauth/access_token');
  u.searchParams.set('grant_type', 'fb_exchange_token');
  u.searchParams.set('client_id', APP_ID);
  u.searchParams.set('client_secret', secret);
  u.searchParams.set('fb_exchange_token', token);
  const r = await (await fetch(u)).json();
  if (r.error) { console.error('❌ Error al extender el token:', r.error.message, '\n(¿el token de token.txt ya expiró? saca uno fresco del Explorer y repega.)'); process.exit(1); }
  console.log('  ✓ token de usuario de larga duración obtenido');

  // 2) token de usuario largo -> token de PÁGINA (no expira)
  const pr = await (await fetch(GRAPH + '/me/accounts?fields=id,name,access_token&access_token=' + encodeURIComponent(r.access_token))).json();
  if (pr.error) { console.error('❌ Error consultando páginas:', pr.error.message); process.exit(1); }
  const page = (pr.data || []).find(p => p.id === PAGE_ID);
  if (!page || !page.access_token) { console.error('❌ No encontré el token de la página Herencia Inteligente.'); process.exit(1); }

  fs.writeFileSync(tokenPath, page.access_token);
  // borrar la clave secreta: ya no se necesita guardada
  try { fs.unlinkSync(secretPath); } catch (e) {}
  console.log('  ✓ token de PÁGINA (no expira) guardado en token.txt');
  console.log('  ✓ appsecret.txt borrado (ya no hace falta)');
  console.log('\n🎉 Listo. Token permanente. Ya nunca hay que repegarlo.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
