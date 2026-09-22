// Genera los MP3 de la narración con Deepgram Aura 2 (español colombiano).
// Uso: node internal/scripts/generar_audio.mjs [--voz gloria|celeste] [--forzar]
// La llave se lee de $DEEPGRAM_KEY o de internal/audio/deepgram.key (nunca se publica).
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NARRACION, VOZ_ESCO } from '../../src/data/narracion.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dirAudio = join(raiz, 'public', 'audio');
const dirInterno = join(raiz, 'internal', 'audio');
const archivoManifiesto = join(dirInterno, 'manifest.json');

const args = process.argv.slice(2);
const flagVoz = args.includes('--voz') ? args[args.indexOf('--voz') + 1] : VOZ_ESCO;
const forzar = args.includes('--forzar');
const voces = { gloria: 'aura-2-gloria-es', celeste: 'aura-2-celeste-es' };
const modelo = voces[flagVoz];
if (!modelo) { console.error(`Voz desconocida: ${flagVoz}. Use: ${Object.keys(voces).join(', ')}`); process.exit(1); }

const clave = process.env.DEEPGRAM_KEY
  || (existsSync(join(dirInterno, 'deepgram.key')) ? readFileSync(join(dirInterno, 'deepgram.key'), 'utf8').trim() : '');
if (!clave) { console.error('Falta la llave: export DEEPGRAM_KEY=… o internal/audio/deepgram.key'); process.exit(1); }

mkdirSync(dirAudio, { recursive: true });
mkdirSync(dirInterno, { recursive: true });
const manifiesto = existsSync(archivoManifiesto) ? JSON.parse(readFileSync(archivoManifiesto, 'utf8')) : {};

let hechos = 0, saltados = 0;
for (const [id, texto] of Object.entries(NARRACION)) {
  const hash = createHash('sha256').update(`${modelo}\n${texto}`).digest('hex').slice(0, 16);
  const archivo = join(dirAudio, `${id}.mp3`);
  if (!forzar && manifiesto[id]?.hash === hash && existsSync(archivo)) { saltados++; continue; }
  // Sin parámetro de formato, la API devuelve MP3 24 kHz / 48 kbps mono (máximo admitido para mp3).
  const url = `https://api.deepgram.com/v1/speak?model=${modelo}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto }),
  });
  if (!res.ok) {
    console.error(`✗ ${id}: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  writeFileSync(archivo, bytes);
  manifiesto[id] = { hash, voz: flagVoz, bytes: bytes.length };
  hechos++;
  console.log(`✓ ${id} (${(bytes.length / 1024).toFixed(0)} kB)`);
  await new Promise(r => setTimeout(r, 250)); // respiro entre llamadas
}
writeFileSync(archivoManifiesto, JSON.stringify(manifiesto, null, 2));
console.log(`Listo: ${hechos} generados, ${saltados} sin cambios (voz: ${flagVoz}, modelo: ${modelo}).`);
