/*
  Transcribe un audio (ogg/opus de WhatsApp, u otro) a texto en español.
  Decodifica con ffmpeg y transcribe con Whisper (transformers.js, sin Python).
  Uso: node transcribe.js "ruta/al/audio.ogg"
*/
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function findFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch (e) {}
  const base = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
  let found = null;
  (function walk(d, depth) {
    if (found || depth > 5) return;
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isFile() && e.name.toLowerCase() === 'ffmpeg.exe') { found = p; return; }
      if (e.isDirectory()) walk(p, depth + 1);
    }
  })(base, 0);
  return found;
}

(async () => {
  const OGG = process.argv[2];
  if (!OGG || !fs.existsSync(OGG)) { console.error('No existe el archivo:', OGG); process.exit(1); }
  const FF = findFfmpeg();
  if (!FF) { console.error('No encontré ffmpeg.'); process.exit(1); }

  // decodificar a PCM 16kHz mono float32
  const raw = execFileSync(FF, ['-i', OGG, '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length);
  const audio = new Float32Array(ab);
  console.error('audio:', (audio.length / 16000).toFixed(1) + 's');

  const { pipeline } = await import('@huggingface/transformers');
  console.error('cargando modelo whisper (la 1a vez descarga ~480MB)...');
  const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
  const out = await asr(audio, { language: 'spanish', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });

  console.log('\n===TRANSCRIPCION===');
  console.log((out.text || '').trim());
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
