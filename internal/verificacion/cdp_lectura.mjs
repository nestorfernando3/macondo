// Lecturas (E), historia del patio, escritura persistida, vista móvil y capturas.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

// 1. Junto a la mesa del patio, E abre la historia; «Profundizar» lleva a la lectura.
await s.js(`window.__macondo.player.place(0.6,-14.8,2.6)`);
await s.js(`dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE',bubbles:true}))`);
await s.esperar(`document.querySelector('#story').open || document.querySelector('#reading').open`, { tope: 5000 });
const leyoHistoria = await s.js(`document.querySelector('#story').open`);
if (leyoHistoria) await s.js(`document.querySelector('#story-read').click()`);
await s.esperar(`document.querySelector('#reading').open`, { tope: 5000 });
const lectura = JSON.parse(await s.js(`JSON.stringify({
  abierta: document.querySelector('#reading').open,
  titulo: document.querySelector('#reading-title').textContent,
  quiz: !document.querySelector('#reading-quiz').hidden,
  cuerpo: (document.querySelector('#reading-body').textContent || '').length })`));
console.log('LECTURA:', JSON.stringify(lectura));
s.afirmar(lectura.abierta, 'la lectura no abrió desde la historia');
s.afirmar(lectura.quiz, 'la lectura crítica debe traer pregunta');
s.afirmar(lectura.cuerpo > 100, `la lectura trae poco texto (${lectura.cuerpo} caracteres)`);
await s.captura('lectura_escritorio');

// 2. Responder: hay retroalimentación.
const respuesta = await s.js(`(() => { document.querySelector('#answers button').click();
  return document.querySelector('#feedback').textContent; })()`);
console.log('RESPUESTA:', respuesta);
s.afirmar(/Así es|Vuelve a pensarlo/.test(respuesta || ''), 'la respuesta no dio retroalimentación');
const guardado = await s.js(`JSON.parse(localStorage.getItem('macondo.progreso.v1') || '{}').answers?.length || 0`);
s.afirmar(guardado >= 1, 'la respuesta no quedó registrada');
await s.js(`document.querySelector('#reading .close').click()`);

// 3. Escritura del cuaderno: se guarda y sobrevive.
await s.js(`(() => { document.querySelector('#open-cuaderno').click();
  document.querySelector('#writing-field').value = 'Frase uno.\\nFrase dos.\\nFrase tres.';
  document.querySelector('#writing-save').click(); })()`);
const escritura = JSON.parse(await s.js(`JSON.stringify({
  estado: document.querySelector('#writing-status').textContent,
  guardado: localStorage.getItem('macondo.escritura.v1') || '' })`));
console.log('ESCRITURA:', JSON.stringify(escritura));
s.afirmar(escritura.estado === 'Guardado.', `la escritura no se guardó: ${escritura.estado}`);
s.afirmar(escritura.guardado.includes('Frase uno'), 'la escritura no persistió');
await s.js(`document.querySelector('#writing .close').click()`);

// 4. Vista móvil 390×844: HUD visible y sin desborde horizontal.
await s.movil(390, 844);
await s.captura('movil_paseo');
const movil = JSON.parse(await s.js(`JSON.stringify({
  hud: !document.querySelector('#hud').hidden,
  overflowX: document.documentElement.scrollWidth > innerWidth })`));
console.log('MOVIL:', JSON.stringify(movil));
s.afirmar(movil.hud, 'el HUD no está visible en móvil');
s.afirmar(!movil.overflowX, 'la vista móvil desborda a lo ancho');

await s.clic('#open-map');
await s.esperar(`document.querySelector('#map').open`, { tope: 4000 });
await s.captura('movil_mapa');
const mapa = JSON.parse(await s.js(`JSON.stringify({ destinos: document.querySelectorAll('#map-destinations button').length,
  overflowX: document.documentElement.scrollWidth > innerWidth })`));
console.log('MAPA-MOVIL:', JSON.stringify(mapa));
s.afirmar(mapa.destinos >= 5, `el mapa sólo ofrece ${mapa.destinos} destinos`);
s.afirmar(!mapa.overflowX, 'el mapa desborda en móvil');
await s.js(`document.querySelector('#map').close()`);

// 5. Vuelta a la portada.
await s.escritorio();
await s.clic('#exit-walk');
await s.esperar(`document.body.classList.contains('exploring') === false`, { tope: 6000 });
await s.captura('portada');
s.afirmar(await s.js(`document.querySelector('#hud').hidden`), 'la portada dejó el HUD a la vista');
await s.cerrar();
