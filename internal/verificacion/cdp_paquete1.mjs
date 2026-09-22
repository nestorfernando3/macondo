// Paquete 1 de historias: silla, carta y cuaderno; resolución, persistencia y huellas.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

// Abre el objeto que está en (x, z) con E y devuelve el título del panel de historia.
async function abrirCon(x, z) {
  await s.js(`window.__macondo.player.place(${x},${z},0);
    dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
    dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE',bubbles:true}))`);
  await s.esperar(`document.querySelector('#story').open`, { tope: 4000 });
  return s.js(`JSON.stringify({ abierto: document.querySelector('#story').open,
    titulo: document.querySelector('#story-title').textContent })`);
}

// 1. La silla de quien falta: resolver con la primera acción.
const silla = JSON.parse(await abrirCon(.7, -14.8));
console.log('SILLA:', JSON.stringify(silla));
s.afirmar(silla.abierto && /silla/i.test(silla.titulo), 'la historia de la silla no abrió');
await s.js(`document.querySelector('#story-actions button').click()`);
const resultado = JSON.parse(await s.js(`JSON.stringify({
  desenlace: document.querySelector('#story-outcome').textContent,
  guardado: JSON.parse(localStorage.getItem('macondo.historias.v1') || '{}').results || {} })`));
console.log('SILLA-RESULTADO:', JSON.stringify(resultado).slice(0, 200));
s.afirmar(!!resultado.desenlace, 'la silla no mostró desenlace');
s.afirmar(!!resultado.guardado['silla-quien-falta'], 'la silla no persistió');
await s.js(`document.querySelector('#story .close').click()`);

// 2. El correo de lo pendiente: escribir y resolver.
const carta = JSON.parse(await abrirCon(-32, 8));
console.log('CARTA:', JSON.stringify(carta));
s.afirmar(carta.abierto && /correo/i.test(carta.titulo), 'la historia de la carta no abrió');
await s.js(`document.querySelector('#story-text').value='Una línea pendiente.';
  document.querySelector('#story-actions button').click()`);
const persistido = JSON.parse(await s.js(`JSON.stringify(
  JSON.parse(localStorage.getItem('macondo.historias.v1') || '{}').results || {})`));
console.log('CARTA-RESULTADO:', Object.keys(persistido).join(', '));
s.afirmar(!!persistido['correo-pendiente'], 'la carta no persistió');
await s.js(`document.querySelector('#story .close').click()`);

// 3. El cuaderno del mirador: recoge las huellas de lo resuelto.
const cuaderno = JSON.parse(await abrirCon(17, 22));
console.log('CUADERNO:', JSON.stringify(cuaderno));
await s.esperar(`document.querySelector('#writing').open`, { tope: 4000 });
const huellas = await s.js(`document.querySelectorAll('#writing-trace-list li').length`);
s.afirmar(huellas >= 2, `el cuaderno muestra ${huellas} huellas y deberían ser 2`);
await s.js(`document.querySelector('#writing-field').value='Crónica propia.';
  document.querySelector('#writing-save').click()`);
const cierre = JSON.parse(await s.js(`JSON.stringify({
  estado: document.querySelector('#writing-status').textContent,
  huellas: document.querySelectorAll('#writing-trace-list li').length,
  guardado: Object.keys(JSON.parse(localStorage.getItem('macondo.historias.v1') || '{}').results || {}) })`));
console.log('CUADERNO-GUARDADO:', JSON.stringify(cierre));
s.afirmar(cierre.estado === 'Guardado.', 'el cuaderno no guardó');
s.afirmar(cierre.guardado.length === 3, `esperaba 3 historias resueltas, hay ${cierre.guardado.length}`);
await s.js(`document.querySelector('#writing .close').click()`);
await s.cerrar();
