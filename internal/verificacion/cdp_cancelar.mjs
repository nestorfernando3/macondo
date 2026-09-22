// Cancelación del recorrido, movimiento manual, volver a la plaza, colisión de fachada,
// alternativa sin 3D y captura del puerto.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
s.permitir(/modo sin 3D solicitado/);
await s.entrar();

// 1. Detener el recorrido a mitad de camino.
await s.clic('#toggle-tour');
await s.esperar(`window.__macondo.tour.active`, { tope: 8000 });
await new Promise(r => setTimeout(r, 4000));
const parada = JSON.parse(await s.js(`(() => {
  const z = window.__macondo.player.position.z;
  document.querySelector('#tour-stop').click();
  return JSON.stringify({ z:+z.toFixed(1), activo: window.__macondo.tour.active,
    banner: !document.querySelector('#tour-banner').hidden });
})()`));
console.log('CANCELAR:', JSON.stringify(parada));
s.afirmar(!parada.activo, 'el recorrido no se detuvo');
s.afirmar(!parada.banner, 'el banner del recorrido siguió visible');

// 2. Tras cancelar, el vuelo manual responde.
const manual = JSON.parse(await s.js(`(async () => {
  const z0 = window.__macondo.player.position.z;
  dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
  await new Promise(r => setTimeout(r, 1500));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
  const z1 = window.__macondo.player.position.z;
  return JSON.stringify({ delta:+(z1-z0).toFixed(2) });
})()`));
console.log('MANUAL:', JSON.stringify(manual));
s.afirmar(Math.abs(manual.delta) > .5, `el vuelo manual no movió (delta ${manual.delta})`);

// 3. «Plaza» devuelve al pueblo desde el patio.
await s.js(`window.__macondo.player.place(0,-16,0)`);
await s.clic('#to-plaza');
const volvio = await s.esperar(`(() => { const p = window.__macondo.player.position;
  return !window.__macondo.tour.active && Math.hypot(p.x, p.z - 5.5) < 3; })()`, { tope: 60000 });
const plaza = JSON.parse(await s.js(`(() => { const p = window.__macondo.player.position;
  return JSON.stringify({ lugar: document.querySelector('#place-name').textContent,
    dist: +Math.hypot(p.x, p.z - 5.5).toFixed(1) }); })()`));
console.log('A_PLAZA:', JSON.stringify(plaza), `en ${(volvio / 1000).toFixed(1)}s`);
s.afirmar(volvio >= 0, `no volvió a la plaza (${plaza.dist} m, lugar ${plaza.lugar})`);

// 4. Colisión: en x=0 está el hueco de la puerta, así que atravesarla es correcto; el muro
//    de verdad lo prueba cdp_fisica con x=2,5. Aquí se comprueba que el vuelo no se cuela.
const colision = JSON.parse(await s.js(`(async () => {
  window.__macondo.player.place(0,-8,0);
  dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
  await new Promise(r => setTimeout(r, 2500));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
  const p = window.__macondo.player.position;
  return JSON.stringify({ x:+p.x.toFixed(2), z:+p.z.toFixed(2) });
})()`));
console.log('PUERTA:', JSON.stringify(colision));
s.afirmar(colision.z > -19.3, 'el vuelo atravesó la casa entera');

// 5. Alternativa sin 3D.
const no3d = JSON.parse(await s.js(`(() => {
  document.querySelector('#help-btn').click();
  document.querySelector('#no3d').click();
  const f = document.querySelector('#fallback');
  return JSON.stringify({ visible: !f.hidden, botones: f.querySelectorAll('button').length });
})()`));
console.log('NO3D:', JSON.stringify(no3d));
s.afirmar(no3d.visible && no3d.botones >= 10, `el modo sin 3D no ofrece todo (${no3d.botones} botones)`);

// 6. Captura del puerto.
await s.js(`document.querySelector('#fallback').hidden = true;
  window.__macondo.player.place(-30,8,Math.PI*1.02)`);
await s.esperar(`Math.abs(window.__macondo.player.position.x + 30) < .4`, { tope: 4000 });
await s.captura('puerto_final');
await s.cerrar();
