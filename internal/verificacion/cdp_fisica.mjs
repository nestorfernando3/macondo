// Muro que bloquea, agua que no se cruza, alternativa sin 3D y captura del puerto.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
s.permitir(/modo sin 3D solicitado/);   // el fallback sin 3D registra su propio error a propósito
await s.entrar();

// 1. Muro: frente a la fachada este de la casa (el hueco de la puerta es x ± 0,8).
const muro = JSON.parse(await s.js(`(async () => {
  window.__macondo.player.place(2.5,-8,0);
  dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
  await new Promise(r => setTimeout(r, 2600));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
  const p = window.__macondo.player.position;
  return JSON.stringify({ x:+p.x.toFixed(2), z:+p.z.toFixed(2) });
})()`));
console.log('MURO:', JSON.stringify(muro));
s.afirmar(muro.z >= -10.7, `el muro no bloqueó: z=${muro.z}`);

// 2. Agua: volar hacia el río desde la orilla (yaw π/2 = mirando al oeste).
const agua = JSON.parse(await s.js(`(async () => {
  window.__macondo.player.place(-22,3,Math.PI/2);
  const x0 = window.__macondo.player.position.x;
  dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
  await new Promise(r => setTimeout(r, 3000));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
  const x1 = window.__macondo.player.position.x;
  return JSON.stringify({ x0:+x0.toFixed(1), x1:+x1.toFixed(1) });
})()`));
console.log('AGUA:', JSON.stringify(agua));
s.afirmar(agua.x1 > -24.8, `cruzó el agua: x=${agua.x1}`);
s.afirmar(agua.x1 < agua.x0, 'no se movió hacia el río');

// 3. Alternativa sin 3D: lista completa y una lectura que abre.
const no3d = JSON.parse(await s.js(`(() => {
  document.querySelector('#help-btn').click();
  document.querySelector('#no3d').click();
  const f = document.querySelector('#fallback');
  return JSON.stringify({ visible: !f.hidden, botones: f.querySelectorAll('button').length });
})()`));
console.log('NO3D:', JSON.stringify(no3d));
s.afirmar(no3d.visible, 'el fallback sin 3D no se mostró');
s.afirmar(no3d.botones >= 10, `el fallback ofrece ${no3d.botones} botones`);
await s.js(`document.querySelector('#fallback-places button').click()`);
await s.esperar(`document.querySelector('#reading').open`, { tope: 4000 });
const titulo = await s.js(`document.querySelector('#reading-title').textContent`);
console.log('FALLBACK-LECTURA:', titulo);
s.afirmar(!!titulo, 'la lectura del fallback no abrió');
await s.js(`document.querySelector('#reading .close').click()`);

// 4. Captura del puerto con el agua ya ajustada.
await s.js(`document.querySelector('#fallback').hidden = true;
  window.__macondo.player.place(-30,8,Math.PI*1.02)`);
await s.esperar(`Math.abs(window.__macondo.player.position.x + 30) < .4`, { tope: 4000 });
await s.captura('puerto_final');

// 5. Los invariantes del pueblo, tal como los revisa la prueba de Node: el mismo module,
//    el mismo veredicto, pero dentro del navegador y con el pueblo ya construido.
const invariantes = JSON.parse(await s.js(`JSON.stringify(window.__macondo.village.invariantes)`));
console.log('INVARIANTES:', JSON.stringify(invariantes.revisados));
s.afirmar(invariantes.problemas.length === 0, `el pueblo no cumple sus invariantes: ${JSON.stringify(invariantes.problemas)}`);
s.afirmar(invariantes.revisados.aristas >= 18, 'el registro de invariantes no recorrió el grafo');
await s.cerrar();
