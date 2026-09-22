// Genera los lechos de sonido ambiente del pueblo (río, viento y aves) sintetizados aquí
// mismo: son originales, no dependen de ninguna licencia de terceros y el resultado es
// determinista (semilla fija), así que el manifiesto por hash los salta si no cambiaron.
//
// Uso: node internal/scripts/generar_ambiente.mjs [--forzar] [--wav]
//   --forzar  regenera aunque el hash coincida
//   --wav     no llama a ffmpeg: deja WAV en public/audio/ambiente (más pesado, sin pérdida)
//
// Requiere ffmpeg para el MP3 (si no está, avisa y deja los WAV).
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dirAudio = join(raiz, 'public', 'audio', 'ambiente');
const dirInterno = join(raiz, 'internal', 'audio');
const archivoManifiesto = join(dirInterno, 'manifest-ambiente.json');

const SR = 24000;                      // mismo muestreo que la voz narrada
const VERSION = 1;                     // súbala si cambia la síntesis
const objetivos = {                    // RMS objetivo en dBFS y techo de pico
  rio: { dur: 24, rms: -21, pico: -3 },
  viento: { dur: 30, rms: -23, pico: -3 },
  aves: { dur: 36, rms: -26, pico: -4 },
};

const args = process.argv.slice(2);
const forzar = args.includes('--forzar');
const soloWav = args.includes('--wav');

// ---------- Herramientas ----------
function prng(semilla) {                // xorshift32: reproducible entre corridas
  let s = semilla >>> 0 || 2463534242;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// Biquad RBJ con estado: se recalcula por muestra cuando la frecuencia se modula.
function biquad(tipo, f0, Q, estado) {
  const w = 2 * Math.PI * f0 / SR, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (tipo === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (tipo === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  return {
    b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0,
    x1: estado.x1 || 0, x2: estado.x2 || 0, y1: estado.y1 || 0, y2: estado.y2 || 0,
  };
}
function filtrar(x, f) {
  const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
  f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
  return y;
}
function medir(buf) {
  let suma = 0, pico = 0;
  for (const v of buf) { suma += v * v; pico = Math.max(pico, Math.abs(v)); }
  return { rms: Math.sqrt(suma / buf.length), pico };
}
// Normaliza al RMS pedido sin pasarse del techo de pico.
function normalizar(buf, dBrms, dBpico) {
  const { rms, pico } = medir(buf);
  const objetivo = 10 ** (dBrms / 20), techo = 10 ** (dBpico / 20);
  let g = objetivo / (rms || 1);
  if (pico * g > techo) g = techo / pico;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}
// Cierra el bucle: se sintetiza de más y la cola se funde sobre la cabeza. Devuelve una
// vista de exactamente n muestras (una Float32Array no se puede truncar en el sitio).
function cerrarBucle(buf, n, x) {
  for (let i = 0; i < x; i++) {
    const t = i / x;
    buf[i] = buf[i] * t + buf[n + i] * (1 - t);
  }
  return buf.subarray(0, n);
}

// ---------- Río: agua corriendo sobre piedras ----------
function rio(semilla) {
  const { dur } = objetivos.rio, n = dur * SR;
  const rnd = prng(semilla);
  const buf = new Float32Array(n + SR);
  const estFlujo = {}, estGrava = {}, estBurbuja = {};
  let envBurbuja = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR, x = rnd() * 2 - 1;
    const respira = 1 + .3 * Math.sin(2 * Math.PI * t / 6) + .18 * Math.sin(2 * Math.PI * t / 2.4);
    const flujo = filtrar(x, biquad('bp', 820 * (1 + .35 * Math.sin(2 * Math.PI * t / 8.5)), .8, estFlujo)) * respira;
    const grava = filtrar(x, biquad('bp', 2600 + 400 * Math.sin(2 * Math.PI * t / 3.1), .6, estGrava));
    if (rnd() < .0016) envBurbuja = .5 + rnd() * .5;      // cada tanto, una burbuja
    envBurbuja *= .9982;
    const burbuja = filtrar(x, biquad('bp', 380 + 300 * Math.sin(t * 5.3), 6, estBurbuja)) * envBurbuja * 4;
    buf[i] = flujo * 2.4 + grava * .5 + burbuja;
  }
  return normalizar(cerrarBucle(buf, n, SR / 2), objetivos.rio.rms, objetivos.rio.pico);
}

// ---------- Viento: aire entre los árboles, con rachas ----------
function viento(semilla) {
  const { dur } = objetivos.viento, n = dur * SR;
  const rnd = prng(semilla);
  const buf = new Float32Array(n + SR);
  const estAire = {}, estSilbo = {};
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR, x = rnd() * 2 - 1;
    // Rachas: periodos que dividen la duración, para que el bucle cierre solo.
    const racha = .45 + .55 * Math.max(0, Math.sin(2 * Math.PI * t / dur * 4) * .6 + Math.sin(2 * Math.PI * t / dur * 3) * .5);
    const corte = 240 + 620 * racha + 90 * Math.sin(2 * Math.PI * t / 5.5);
    const aire = filtrar(x, biquad('lp', corte, 1.1, estAire)) * (1.4 + racha);
    const silbo = filtrar(x, biquad('bp', 1900, 3, estSilbo)) * Math.max(0, racha - .75) * .5;
    buf[i] = aire * 2.2 + silbo;
  }
  return normalizar(cerrarBucle(buf, n, SR / 2), objetivos.viento.rms, objetivos.viento.pico);
}

// ---------- Aves: fondo de monte y cantos dispersos ----------
function aves(semilla) {
  const { dur } = objetivos.aves, n = dur * SR;
  const rnd = prng(semilla);
  const buf = new Float32Array(n + SR);
  const estMonte = {}, estGrillo = {};
  // Cantos: nunca en los bordes, para que la costura del bucle quede callada.
  const cantos = [];
  for (let k = 0; k < 22; k++) {
    const ini = 1.2 + rnd() * (dur - 3.4);
    const notas = 1 + Math.floor(rnd() * 3);
    const alto = 2300 + rnd() * 1900;
    cantos.push({ ini, notas, alto, bend: 1 + (rnd() - .3) * .5, durNota: .07 + rnd() * .07, pausa: .06 + rnd() * .1 });
  }
  const muestras = new Float32Array(n + SR);
  for (const c of cantos) {
    let t = c.ini;
    for (let nota = 0; nota < c.notas; nota++) {
      const largo = c.durNota, desde = Math.round(t * SR), hasta = Math.round((t + largo) * SR);
      for (let i = desde; i < hasta && i < muestras.length; i++) {
        const u = (i - desde) / (hasta - desde);
        const env = Math.sin(Math.PI * u) ** 1.6;                   // ataque y caída suaves
        const f = c.alto * (1 + (c.bend - 1) * u) * (1 + .02 * Math.sin(u * 40));
        const fase = 2 * Math.PI * f * ((i - desde) / SR);
        muestras[i] += (Math.sin(fase) * .7 + Math.sin(fase * 2) * .22 + Math.sin(fase * 3) * .08) * env * .5;
      }
      t += largo + c.pausa;
    }
  }
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR, x = rnd() * 2 - 1;
    const monte = filtrar(x, biquad('bp', 700, .7, estMonte)) * (1 + .3 * Math.sin(2 * Math.PI * t / 9));
    const grillo = filtrar(x, biquad('bp', 4600, 8, estGrillo)) * (.35 + .35 * Math.sin(2 * Math.PI * t / 4.5));
    buf[i] = monte * .5 + grillo * .5 + muestras[i];
  }
  // El fondo del monte y los grillos son continuos: se cierran como los otros lechos.
  return normalizar(cerrarBucle(buf, n, SR / 2), objetivos.aves.rms, objetivos.aves.pico);
}

// ---------- Salida ----------
function aWav(buf) {
  const datos = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    datos.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const cab = Buffer.alloc(44);
  cab.write('RIFF', 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write('WAVE', 8);
  cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(1, 22);
  cab.writeUInt32LE(SR, 24); cab.writeUInt32LE(SR * 2, 28); cab.writeUInt16LE(2, 32); cab.writeUInt16LE(16, 34);
  cab.write('data', 36); cab.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cab, datos]);
}

const sintesis = { rio, viento, aves };
mkdirSync(dirAudio, { recursive: true });
mkdirSync(dirInterno, { recursive: true });
const manifiesto = existsSync(archivoManifiesto) ? JSON.parse(readFileSync(archivoManifiesto, 'utf8')) : {};

let hechos = 0, saltados = 0;
for (const [id, fn] of Object.entries(sintesis)) {
  const hash = createHash('sha256').update(`v${VERSION}:${id}:${objetivos[id].dur}:${SR}`).digest('hex').slice(0, 16);
  const destino = join(dirAudio, `${id}.mp3`);
  if (!forzar && manifiesto[id]?.hash === hash && existsSync(destino)) { saltados++; continue; }

  const buf = fn(1234 + id.length * 977);
  const wav = aWav(buf);
  const wavRuta = join(dirAudio, `${id}.wav`);
  writeFileSync(wavRuta, wav);

  let bytes = wav.length;
  if (soloWav) {
    console.log(`~ ${id}: WAV sin comprimir (${(bytes / 1024).toFixed(0)} kB)`);
  } else {
    const mp3 = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavRuta, '-codec:a', 'libmp3lame',
      '-b:a', '64k', '-ac', '1', destino], { encoding: 'utf8' });
    if (mp3.error || mp3.status !== 0) {
      console.error(`✗ ${id}: ffmpeg no disponible (${mp3.error?.message || mp3.stderr}). Queda el WAV.`);
    } else {
      bytes = readFileSync(destino).length;
      rmSync(wavRuta, { force: true });
    }
  }
  const m = medir(buf);
  const costura = Math.abs(buf[buf.length - 1] - buf[0]);
  manifiesto[id] = {
    hash, bytes, duracion: objetivos[id].dur,
    rms_dBFS: +(20 * Math.log10(m.rms)).toFixed(1),
    pico_dBFS: +(20 * Math.log10(m.pico)).toFixed(1),
    salto_de_bucle: +costura.toFixed(5),
  };
  hechos++;
  console.log(`✓ ${id}: ${(bytes / 1024).toFixed(0)} kB · ${objetivos[id].dur} s · `
    + `RMS ${manifiesto[id].rms_dBFS} dBFS · pico ${manifiesto[id].pico_dBFS} dBFS · `
    + `salto de bucle ${manifiesto[id].salto_de_bucle}`);
}
writeFileSync(archivoManifiesto, JSON.stringify(manifiesto, null, 2));
console.log(`Listo: ${hechos} generados, ${saltados} sin cambios. Síntesis original (sin terceros).`);
