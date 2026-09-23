#!/usr/bin/env node
// Publica dist/ en here.now (hosting estático para agentes): https://here.now/docs
//
// Uso:  npm run build  y luego  node internal/scripts/publicar_herenow.mjs
//
// Flujo según la documentación oficial (sin cuenta): POST /api/v1/publish con el
// manifiesto de archivos → PUT de cada archivo a su URL firmada → POST al finalizeUrl.
// El sitio anónimo expira en 24 horas; la respuesta trae un `claimUrl` que el dueño
// abre una vez para quedarse el sitio de forma permanente. El enlace y el token de
// reclamo quedan en .herenow/estado.json (carpeta gitignored: nunca se publica).
//
// Con $HERENOW_API_KEY (o ~/.herenow/credentials) el sitio se publica bajo esa cuenta
// y no expira; en ese caso la API no devuelve claimUrl.
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const RAIZ = new URL('../..', import.meta.url).pathname;   // raíz del repo
const DIST = join(RAIZ, 'dist');
const ESTADO = join(RAIZ, '.herenow', 'estado.json');
const CLIENTE = { 'X-HereNow-Client': 'arena/macondo' };   // quién publica (docs §Authentication)

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
const tipoDe = ruta => TIPOS[extname(ruta).toLowerCase()] ?? 'application/octet-stream';

function listar(dir, acc = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) listar(ruta, acc);
    else acc.push({ path: relative(DIST, ruta).replaceAll('\\', '/'), ruta, size: statSync(ruta).size, contentType: tipoDe(ruta) });
  }
  return acc;
}

async function respuesta(res, contexto) {
  const texto = await res.text();
  if (!res.ok) throw new Error(`${contexto}: HTTP ${res.status} — ${texto.slice(0, 400)}`);
  return JSON.parse(texto);
}

const clave = process.env.HERENOW_API_KEY;
const archivos = listar(DIST);
console.log(`Publicando ${archivos.length} archivos (${(archivos.reduce((a, f) => a + f.size, 0) / 1048576).toFixed(1)} MB) desde dist/…`);

// 1 · Crear el sitio y recibir las URLs de subida.
const crear = await fetch('https://here.now/api/v1/publish', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...CLIENTE, ...(clave ? { authorization: `Bearer ${clave}` } : {}) },
  body: JSON.stringify({ files: archivos.map(({ path, size, contentType }) => ({ path, size, contentType })) }),
}).then(r => respuesta(r, 'crear sitio'));

const subidas = new Map((crear.uploads ?? []).map(u => [u.path ?? u.file ?? u.name, u.url]));
console.log(`Sitio asignado: ${crear.siteUrl ?? crear.primaryUrl}`);

// 2 · Subir cada archivo a su URL firmada (sin la cabecera de cliente: va directo al almacenamiento).
for (let i = 0; i < archivos.length; i += 6) {
  const lote = archivos.slice(i, i + 6);
  await Promise.all(lote.map(async f => {
    const url = subidas.get(f.path);
    if (!url) throw new Error(`sin URL de subida para ${f.path}`);
    const res = await fetch(url, { method: 'PUT', headers: { 'content-type': f.contentType }, body: readFileSync(f.ruta) });
    if (!res.ok) throw new Error(`subida de ${f.path}: HTTP ${res.status}`);
  }));
}
console.log('Archivos subidos.');

// 3 · Finalizar la versión.
const fin = await fetch(crear.finalizeUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...CLIENTE, ...(clave ? { authorization: `Bearer ${clave}` } : {}) },
  body: JSON.stringify({ versionId: crear.versionId }),
}).then(r => respuesta(r, 'finalizar'));
void fin;

// 4 · Recordar el enlace (y el token de reclamo si el sitio es anónimo).
mkdirSync(join(RAIZ, '.herenow'), { recursive: true });
writeFileSync(ESTADO, JSON.stringify({
  siteUrl: crear.siteUrl ?? crear.primaryUrl,
  claimUrl: crear.claimUrl ?? null,
  versionId: crear.versionId,
  publicado: new Date().toISOString(),
}, null, 2));

console.log(`\n✅ En vivo: ${crear.siteUrl ?? crear.primaryUrl}`);
if (crear.claimUrl) {
  console.log(`⏳ Sitio anónimo: expira en 24 h. Para conservarlo, abra este enlace (byte a byte):`);
  console.log(`   ${crear.claimUrl}`);
} else {
  console.log('Sitio publicado bajo la cuenta de la llave: no expira.');
}
