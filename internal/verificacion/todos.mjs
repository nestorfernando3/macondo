// Corre toda la verificación de navegador y resume. Sale con 1 si algún guion falla.
//
// Uso: node internal/verificacion/todos.mjs [OUT]
//      node internal/verificacion/todos.mjs [OUT] --rapido   (sin el circuito completo)
//
// Cada guion abre su propio Chrome (puerto y perfil propios) y decide su código de salida
// a partir de sus afirmaciones: aquí sólo se recogen los veredictos.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || process.env.TMPDIR || '/tmp';
const rapido = process.argv.includes('--rapido');

const GUIONES = [
  'cdp_fisica',      // muro, agua, fallback sin 3D e invariantes del pueblo
  'cdp_cancelar',    // detener, vuelo manual, volver a la plaza, puerta
  'cdp_lectura',     // lectura, respuesta, escritura, móvil 390×844
  'cdp_paquete1',    // las tres historias y su persistencia
  'cdp_narracion',   // voz, gate de Continuar, postal, Escuchar
  'cdp_patio',       // vistas del patio
  'cdp_ambiente',    // lecho sonoro: gesto, río por distancia, atenuación
  'cdp_mariposa',    // avatar: mallas, triángulos y textura
  'cdp_metricas',    // coste de dibujo por lugar + capturas
  'cdp_modelos',     // acercamiento a un metro: la pieza, no el encuadre
  'cdp_paneles',     // los paneles abren y ningún control sale con el gris del navegador
  'cdp_rendimiento', // FPS del banco y presupuesto de llamadas
];
if (!rapido) GUIONES.push('cdp_circuito');   // el más lento (recorrido guiado completo)

const resultados = [];
for (const guion of GUIONES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(aqui, `${guion}.mjs`), out], { encoding: 'utf8' });
  const segundos = ((Date.now() - t0) / 1000).toFixed(1);
  const ok = r.status === 0;
  resultados.push({ guion, ok, segundos });
  console.log(`${ok ? '✓' : '✗'} ${guion.padEnd(16)} ${segundos.padStart(6)}s`);
  if (!ok) {
    const salida = (r.stdout || '') + (r.stderr || '');
    console.log(salida.split('\n').filter(l => l.trim()).slice(-8).map(l => `    ${l}`).join('\n'));
  }
}

const fallaron = resultados.filter(r => !r.ok);
console.log(`\n${resultados.length - fallaron.length}/${resultados.length} guiones en verde`);
if (fallaron.length) {
  console.log('Fallaron:', fallaron.map(r => r.guion).join(', '));
  process.exit(1);
}
