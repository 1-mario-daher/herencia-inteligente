/*
  Sube la carpeta deploy_diagnostico/ (index.html + guardar.php) a tu cPanel por FTP.
  Nunca imprime credenciales.

  Requiere ftp.json (gitignored) con:
    { "host":"ftp.life-experts.consulting", "user":"...", "password":"...",
      "remoteDir":"/public_html/diagnostico_herencia", "secure": false }

  Uso: node deploy.js
*/
const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');

const DIR = __dirname;
const cfgPath = path.join(DIR, 'ftp.json');
if (!fs.existsSync(cfgPath)) { console.error('Falta ftp.json (pega ahí los datos del FTP).'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const localDir = path.join(DIR, 'deploy_diagnostico');

(async () => {
  const client = new ftp.Client(15000);
  try {
    await client.access({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      secure: cfg.secure || false,
      secureOptions: { rejectUnauthorized: false }
    });
    console.log('  ✓ conectado a', cfg.host);
    const remote = cfg.remoteDir || '/public_html/diagnostico_herencia';
    await client.ensureDir(remote);
    console.log('  ✓ carpeta remota:', remote);
    await client.uploadFromDir(localDir, remote);
    console.log('  ✓ archivos subidos (index.html + guardar.php)');
    console.log('\n🎉 En línea: https://www.life-experts.consulting/diagnostico_herencia');
  } catch (e) {
    console.error('❌ Error de FTP:', e.message);
    if (/certificate|secure|TLS|ECONN/i.test(e.message)) console.error('   (prueba cambiar "secure" en ftp.json: true ↔ false)');
    process.exit(1);
  } finally {
    client.close();
  }
})();
