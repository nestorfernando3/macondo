// Acercamiento a los modelos: a diferencia de cdp_metricas.mjs (que mide desde el encuadre
// real del paseo), este guion pega la cámara a un metro de cada pieza para poder mirarla.
//
// Nació al rehacer el vocabulario floral: el presupuesto de triángulos dice lo que cuesta
// una pieza, pero no dice si una flor parece una flor. Sirve para eso y sólo para eso.
// Uso: node internal/verificacion/cdp_modelos.mjs <carpeta_salida> [etiqueta]
import { abrir } from './arnes.mjs';

const etiqueta = process.argv[3] || 'modelos';
const s = await abrir({ autoplay: true, out: process.argv[2] });
s.permitir(/modo sin 3D solicitado/);
await s.entrar();

await s.js(`(() => { const m = window.__macondo;
  m.player.enabled = false;
  document.body.classList.add('exploring');
  for (const sel of ['#hud', '#caption', '#transition', '#vignette', 'header', 'main']) {
    const el = document.querySelector(sel); if (el) el.hidden = true;
  } })()`);

// [nombre, cámara x,y,z, punto mirado x,y,z]
const VISTAS = [
  ['maceta_plaza', 2.6, 1.05, -1.05, 2.6, .45, -2.6],
  ['maceta_casa', 1.05, .95, -9.35, 1.05, .45, -10.66],
  ['bancal_jardin', 23.4, 1.5, -12.4, 23.4, .35, -14.2],
  ['maceta_jardin', 21.4, 1.3, -12.3, 21.4, .5, -13.6],
  ['prado', 3, 1, 8, 6, .2, 13],
  ['prado_vuelo', 4.5, 2.35, 9, 7.5, .1, 14],   // como lo ve la mariposa al volar (2,1 m)
  ['prado_rasante', 5.5, .8, 11, 7, .25, 15],   // a ras: el prado de cerca
  ['arbol_tiempo', 21.5, 2.2, -8, 25, 3, -11],
  // El árbol entero: la pieza del jardín mide ocho metros y a un metro de distancia sólo se
  // ve el tronco, así que el juicio del modelo —tronco, horquilla, copa, contrafuertes— se
  // hace desde el aire, que es como lo mira la mariposa al volar.
  ['arbol_tiempo_entero', 20.6, 8.2, -3.4, 25, 4.6, -8.8],
  ['puesto_plaza', 8.2, 1.4, -2, 8.2, .8, -3.4],
  ['bote_puerto', -29, 1.2, 3.2, -31.5, .7, 3.2],
  ['orilla_puerto', -25, 1.6, 8, -23.6, .6, 12],
  ['palmera', 10.5, 3.5, 10.6, 10.5, 5.5, 8.6],
  ['palmera_entera', 10.5, 4.2, 18.5, 10.5, 3.6, 8.6],
  ['fuente', 2.6, 1.9, 2.6, 0, 1.7, 0],
  ['reloj', 4.48, 3.87, 7.29, 3.23, 3.62, 5.24],   // de frente a la esfera, a 2,4 m
  ['reloj_entero', 5.05, 2.6, 8.2, 3.23, 3.3, 5.24],   // la pieza completa, poste incluido
  ['juncos', -23.4, 1.4, 15, -23.6, .5, 18],
];

for (const [nombre, cx, cy, cz, tx, ty, tz] of VISTAS) {
  await s.js(`(() => { const m = window.__macondo;
    m.experience.camera.position.set(${cx}, ${cy}, ${cz});
    m.experience.camera.lookAt(${tx}, ${ty}, ${tz});
    m.experience.renderer.render(m.experience.scene, m.experience.camera);
    return true })()`);
  await new Promise(r => setTimeout(r, 200));
  await s.captura(`${etiqueta}_${nombre}`);
  console.log('capturado', nombre);
}
await s.cerrar();
