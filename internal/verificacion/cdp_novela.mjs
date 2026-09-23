// Capa literaria: que la ficha «En la novela» aparezca en las lecturas nuevas, que el índice,
// el árbol de los Buendía y el cuaderno de palabras abran y se lean, que el pergamino recoja el
// paseo y que la lluvia del libro se encienda y se apague.
//
// Las dos estaciones nuevas (hielo y pescaditos) se prueban por el camino real: la mariposa se
// posa cerca del objeto, aparece «Explorar» y el clic abre su lectura. Así el guion cubre de una
// vez la pieza del mundo, su ancla y su texto.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar({ omitirVuelo: true });

const texto = async sel => await s.js(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
const cuantos = async sel => await s.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);

// ---------- 1. Las dos lecturas nuevas, por el camino real ----------
for (const [x, z, titulo, rotulo] of [
  [8.4, -3.4, 'El cofre que ardía', 'El cofre del hielo'],
  [-2.45, -15.5, 'Veinticinco pescaditos', 'La bandeja del platero'],
]) {
  await s.js(`window.__macondo.player.place(${x}, ${z}, 0)`);
  await s.esperar(`document.querySelector('#interact-tip')?.hidden === false`, { tope: 6000 });
  s.afirmar(await s.js(`document.querySelector('#interact-label').textContent === ${JSON.stringify(rotulo)}`),
    `no apareció «${rotulo}» al posarse en (${x}, ${z})`);
  await s.clic('#interact-btn');
  await s.esperar(`document.querySelector('#reading').open`, { tope: 4000 });
  s.afirmar(await s.js(`document.querySelector('#reading-title').textContent === ${JSON.stringify(titulo)}`),
    `la lectura de (${x}, ${z}) no abrió con el título esperado`);
  // La capa literaria: sello de origen y ficha con capítulo, texto y datos.
  s.afirmar(await s.js(`document.querySelector('#reading-novela').hidden === false`), `sin ficha en «${titulo}»`);
  s.afirmar(await s.js(`document.querySelectorAll('#reading-novela .sello-origen--instalacion').length === 1`),
    'falta el sello de esta instalación junto a la glosa');
  s.afirmar(await s.js(`document.querySelectorAll('#reading-novela .sello-origen--novela').length === 1`),
    'falta el sello de la novela en la ficha');
  s.afirmar(await s.js(`(document.querySelector('.ficha-novela-texto')?.textContent || '').length > 400`),
    `la ficha de «${titulo}» se quedó corta`);
  s.afirmar(await s.js(`document.querySelectorAll('.ficha-novela-dato').length >= 2`), 'la ficha no trae datos verificables');
  s.afirmar(await s.js(`!!document.querySelector('.ficha-novela-fuente cite')`), 'la ficha no cita su fuente');
  s.afirmar(await s.js(`/cap[íi]tulo/i.test(document.querySelector('.ficha-novela-capitulo')?.textContent || '')`),
    'la ficha no dice de qué capítulo habla');
  if (titulo === 'El cofre que ardía') await s.captura('novela_ficha');
  await s.js(`document.querySelector('#reading').close()`);
  await new Promise(r => setTimeout(r, 300));
}

// ---------- 2. El índice de los veinte capítulos ----------
await s.clic('#help-btn');
await s.esperar(`document.querySelector('#help').open`, { tope: 3000 });
await s.clic('#open-indice-ayuda');
await s.esperar(`document.querySelector('#indice').open`, { tope: 3000 });
s.afirmar(await cuantos('.indice-novela-entrada') === 20, 'el índice no tiene los veinte capítulos');
s.afirmar(await s.js(`!!document.querySelector('.indice-novela-nota')`), 'el índice no explica qué es de la novela');
await s.captura('novela_indice');
await s.js(`document.querySelector('#indice').close()`);
// La ayuda sigue debajo del índice: sin cerrarla, el mapa (y su botón del árbol) quedan
// detrás de un diálogo modal y ningún clic real los alcanza.
await s.js(`document.querySelector('#help').close()`);
await new Promise(r => setTimeout(r, 300));

// ---------- 3. El árbol de los Buendía, desde el mapa ----------
await s.clic('#open-map');
await s.esperar(`document.querySelector('#map').open`, { tope: 3000 });
await s.clic('#open-arbol');
await s.esperar(`document.querySelector('#arbol').open`, { tope: 3000 });
s.afirmar(await cuantos('.arbol-persona') >= 12, 'el árbol se quedó sin familia');
s.afirmar(await cuantos('.arbol-generacion') >= 5, 'faltan generaciones en el árbol');
s.afirmar(await s.js(`(document.querySelector('.arbol-cierre')?.textContent || '').length > 40`), 'falta el cierre del árbol');
s.afirmar(await cuantos('.arbol-nombre--resaltado') === 0, 'el árbol abre con tocayos resaltados');
await s.js(`document.querySelector('.arbol-nombre').focus()`);
await new Promise(r => setTimeout(r, 200));
s.afirmar(await cuantos('.arbol-nombre--resaltado') >= 1, 'enfocar un nombre repetido no resalta a sus tocayos');
await s.captura('novela_arbol');
await s.js(`document.querySelector('#arbol').close()`);
await s.js(`document.querySelector('#map').close()`);

// ---------- 4. El cuaderno: pergamino y palabras del pueblo ----------
await s.js(`window.__macondo.director.open('cuaderno-mirador')`);
await s.esperar(`document.querySelector('#writing').open`, { tope: 3000 });
s.afirmar(await s.js(`!!document.querySelector('#writing-pergamino .pergamino-texto')`), 'el cuaderno no trae pergamino');
s.afirmar(await s.js(`/pergamino/i.test(document.querySelector('#writing-pergamino .pergamino-titulo')?.textContent || '')`),
  'el pergamino no se titula');
await s.clic('#open-palabras');
await s.esperar(`document.querySelector('#palabras').open`, { tope: 3000 });
s.afirmar(await cuantos('.palabra') >= 20, 'el cuaderno de palabras se quedó corto');
s.afirmar(await s.js(`document.querySelectorAll('.cuaderno-palabras-categoria').length >= 4`), 'las palabras no están agrupadas');
// El buscador filtra: una palabra concreta deja una sola visible.
await s.js(`(() => { const c = document.querySelector('.cuaderno-palabras-campo');
  c.value = 'totuma'; c.dispatchEvent(new Event('input', { bubbles: true })); })()`);
s.afirmar(await s.js(`[...document.querySelectorAll('.palabra')].filter(p => !p.hidden).length === 1`),
  'el buscador del cuaderno no filtra');
s.afirmar(await s.js(`/totuma/i.test(document.querySelector('.cuaderno-palabras-estado')?.textContent || '')`),
  'el buscador no avisa de lo que encontró');
await s.captura('novela_palabras');
await s.js(`document.querySelector('#palabras').close()`);
await s.js(`document.querySelector('#writing').close()`);
await new Promise(r => setTimeout(r, 400));

// ---------- 5. La lluvia del libro (desde la Ayuda: es un estado del pueblo, no un adorno) ----------
s.afirmar(await s.js(`window.__macondo.lluvia.visible === false`), 'el aguacero debería nacer apagado');
await s.clic('#help-btn');
await s.esperar(`document.querySelector('#help').open`, { tope: 3000 });
await s.clic('#toggle-lluvia');
s.afirmar(await s.js(`window.__macondo.lluvia.visible === true`), 'el aguacero no se encendió');
s.afirmar(await s.js(`document.querySelector('#toggle-lluvia').getAttribute('aria-pressed') === 'true'`),
  'el chip de lluvia no anuncia su estado');
s.afirmar(await s.js(`typeof window.__macondo.lluvia.update === 'function'`), 'la lluvia no expone update');
await s.js(`document.querySelector('#help').close()`);
// Se deja lloviendo con la mariposa volando: el pueblo no se rompe ni pierde el rumbo.
await s.js(`window.__macondo.player.place(0, 12, 0)`);
await new Promise(r => setTimeout(r, 1200));
s.afirmar(await s.js(`window.__macondo.lluvia.visible === true`), 'el aguacero se apagó solo al volar');
await s.captura('novela_lluvia');
// Con el aguacero encendido el banco va a media máquina (SwiftShader): se le da aire antes de
// volver a pedir un clic real, que si no se pierde entre fotogramas y parece un fallo del chip.
await new Promise(r => setTimeout(r, 800));
await s.clic('#help-btn', { intentos: 8 });
await s.esperar(`document.querySelector('#help').open`, { tope: 3000 });
await s.clic('#toggle-lluvia', { intentos: 8 });
s.afirmar(await s.js(`window.__macondo.lluvia.visible === false`), 'el aguacero no se apagó');
s.afirmar(await s.js(`document.querySelector('#toggle-lluvia').textContent === 'Lluvia del libro'`), 'el chip cambió de nombre');
await s.js(`document.querySelector('#help').close()`);

// ---------- 6. Móvil: la ficha y el árbol caben ----------
await s.movil();
await s.js(`window.__macondo.player.place(8.4, -3.4, 0)`);
await s.esperar(`document.querySelector('#interact-tip')?.hidden === false`, { tope: 6000 });
await s.clic('#interact-btn');
await s.esperar(`document.querySelector('#reading').open`, { tope: 4000 });
s.afirmar(await s.js(`(() => { const f = document.querySelector('.ficha-novela').getBoundingClientRect();
  return f.height > 0 && f.left >= -1 && f.right <= innerWidth + 1 })()`), 'la ficha se sale de la pantalla en móvil');
await s.captura('novela_movil');
await s.js(`document.querySelector('#reading').close()`);
await s.escritorio();

await s.cerrar();
