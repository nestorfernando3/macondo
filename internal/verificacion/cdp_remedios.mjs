// Remedios, la bella: la cita del libro en el panel y la ascensión sobre el tendal.
//
// Es la única estación con transcripción literal de la novela, así que lo que se vigila aquí
// no es que el panel abra —eso ya lo hace `cdp_lectura`— sino que la cita viaje entera, con su
// atribución pegada y separada de la glosa, y que el enlace de fuente esté retirado: la fuente
// de una cita es el libro, no la página del Nobel que citan las demás estaciones.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true, url: 'http://127.0.0.1:5179/' });
await s.entrar();

// Bajo SwiftShader el renderizador se atraganta de vez en cuando y una evaluación suelta
// devuelve `undefined` sin que el producto tenga nada roto: con cuatro Chromes headless de
// corridas anteriores comiéndose la máquina, pasa. Se reintenta la lectura antes de darla por
// fallida, y el reintento se declara en la salida —una lectura que sólo sale al tercer intento
// es un dato, no una vergüenza—.
async function leer(expr, { intentos = 4, pausa = 350 } = {}) {
  for (let i = 1; i <= intentos; i++) {
    const v = await s.js(expr);
    if (v !== undefined && v !== null) {
      if (i > 1) console.log(`  (lectura al intento ${i})`);
      return v;
    }
    await new Promise(r => setTimeout(r, pausa));
  }
  s.afirmar(false, `la evaluación no devolvió nada en ${intentos} intentos: ${expr.slice(0, 60)}…`);
  return null;
}

// 1. Junto al tendal de bramante, E abre la lectura de Remedios.
// Si el paseo no arrancó, se sale por donde se entró: un `null` aquí reventaba con un TypeError
// y el guion moría sin decir qué pasó, dejando su Chrome vivo para estorbar al siguiente.
const ancla = JSON.parse(await leer(`JSON.stringify(window.__macondo.village.interactables
  .find(e => e.id === 'sabanas-bramante'))`) ?? 'null');
s.afirmar(!!ancla, 'el ancla sabanas-bramante no llegó a los interactuables');
if (!ancla) await s.cerrar();
await s.js(`window.__macondo.player.place(${ancla.x}, ${ancla.z}, 0)`);
await s.esperar(`window.__macondo.interactions.current?.id === 'sabanas-bramante'`, { tope: 6000 });
await s.tecla('KeyE');
await s.esperar(`document.querySelector('#reading').open`, { tope: 5000 });

const panel = JSON.parse(await leer(`JSON.stringify({
  abierta: document.querySelector('#reading').open,
  titulo: document.querySelector('#reading-title').textContent,
  citaVisible: !document.querySelector('#reading-cita').hidden,
  cita: document.querySelector('#reading-cita-texto').textContent,
  fuente: document.querySelector('#reading-cita-fuente').textContent,
  glosa: (document.querySelector('#reading-body').textContent || '').length,
  quiz: !document.querySelector('#reading-quiz').hidden,
  conversa: !document.querySelector('#reading-conversa').hidden,
  enlaceFuente: document.querySelector('#source').hidden,
  escuchar: document.querySelector('#reading-listen').hidden })`));
console.log('PANEL:', JSON.stringify({ ...panel, cita: panel.cita.slice(0, 48) + '…' }));

s.afirmar(panel.abierta, 'la lectura no abrió desde el tendal');
s.afirmar(panel.titulo === 'La ascensión de Remedios, la bella', `título inesperado: ${panel.titulo}`);
s.afirmar(panel.citaVisible, 'la cita del libro quedó oculta');
// 1545 caracteres es el pasaje del capítulo 12 de la edición del repo, medido aparte. Si alguien
// recorta o retoca la cita, esta cuenta lo delata.
s.afirmarIgual(panel.cita.length, 1545, 'la cita no trae el pasaje entero');
s.afirmar(panel.cita.startsWith('Remedios, la bella, se quedó vagando'), 'la cita no empieza donde debe');
s.afirmar(panel.cita.endsWith('ni los más altos pájaros de la memoria.'), 'la cita no termina donde debe');
s.afirmar(/Cien años de soledad, capítulo 12/.test(panel.fuente), `falta la atribución: ${panel.fuente}`);
s.afirmar(panel.glosa > 200, 'la glosa original quedó vacía o raquítica');
s.afirmar(!panel.quiz, 'este pasaje no debe traer quiz');
s.afirmar(panel.conversa, 'falta la línea «para conversar»');
s.afirmar(panel.enlaceFuente, 'el enlace de fuente debe retirarse: la fuente es el libro');
await s.captura('remedios_lectura');

// La cita se lee como cita: bloque propio, con papel y tipografía distintos a los de la glosa.
const estilos = JSON.parse(await leer(`(() => {
  const c = document.querySelector('#reading-cita'), b = document.querySelector('#reading-body');
  const a = getComputedStyle(c), d = getComputedStyle(b), p = getComputedStyle(c.querySelector('p'));
  return JSON.stringify({ fondo: a.backgroundColor, glosaFondo: d.backgroundColor,
    familiaCita: p.fontFamily.split(',')[0], familiaGlosa: d.fontFamily.split(',')[0],
    ancho: Math.round(c.getBoundingClientRect().width) }) })()`));
console.log('CITA:', JSON.stringify(estilos));
s.afirmar(estilos.fondo !== estilos.glosaFondo, 'la cita y la glosa comparten fondo: no se distinguen');
s.afirmar(estilos.familiaCita !== estilos.familiaGlosa, 'la cita y la glosa comparten tipografía');
s.afirmar(estilos.ancho > 100, `la cita no tiene caja (${estilos.ancho} px)`);
await s.js(`document.querySelector('#reading .close').click()`);

// 2. La ascensión: la figura existe, sube sola y se apaga por los dos extremos.
// La expresión devuelve un marcador en vez de lanzar: un `throw` aquí deja la lectura en
// `undefined` y confunde un cierre del renderizador con un fallo del producto.
const figura = `(() => {
  const ex = window.__macondo;
  if (!ex?.experience?.scene) return JSON.stringify({ error: 'sin escena' });
  let g = null;
  ex.experience.scene.traverse(o => {
    if (!g && o.name === 'remedios') g = o;
  });
  if (!g) return JSON.stringify({ error: 'sin figura' });
  return JSON.stringify({ visible: g.visible, y: +g.position.y.toFixed(2),
    x: +g.position.x.toFixed(2), z: +g.position.z.toFixed(2),
    opacidad: +g.children[0].material.opacity.toFixed(3), mallas: g.children.length,
    estatura: +(g.scale.x * 1.595).toFixed(2) });
})()`;
const a = JSON.parse(await leer(figura));
s.afirmar(!!a && !a.error, `no se encontró la figura de Remedios: ${JSON.stringify(a)}`);
s.afirmarIgual(a.mallas, 6, 'la figura cambió de número de mallas');
s.afirmar(a.estatura > 1.6 && a.estatura < 2.05, `estatura fuera de escala humana: ${a.estatura} m`);
console.log('FIGURA:', JSON.stringify(a));

// Se la sigue durante unos segundos: tiene que estar sobre el jardín y haberse movido.
const muestras = [];
for (let i = 0; i < 4; i++) {
  const crudo = await leer(figura, { intentos: 2 });
  if (!crudo) console.log(`  muestra ${i}: sin lectura (vivo=${await s.js('1+1')})`);
  else muestras.push(JSON.parse(crudo));
  await new Promise(r => setTimeout(r, 2500));
}
console.log('ASCENSIÓN:', muestras.map(m => `${m.visible ? 'y=' + m.y : 'oculta'}`).join(' → '));
const visibles = muestras.filter(m => m.visible);
s.afirmar(visibles.length >= 3, 'la figura pasa demasiado tiempo invisible');
if (visibles.length >= 2)
  s.afirmar(visibles.at(-1).y > visibles[0].y, 'la figura no sube');
// El tendal está en (25, −6): la ascensión arranca ahí y deriva con el viento, pero no puede
// irse del aire del jardín —si se va, deja de verse desde donde está la actividad—.
for (const m of visibles) {
  s.afirmar(m.opacidad > .5, `figura casi transparente estando visible (${m.opacidad})`);
  s.afirmar(m.x >= 24.5 && m.x <= 28, `la ascensión se salió del jardín en x: ${m.x}`);
  s.afirmar(m.z >= -6.2 && m.z <= 1.5, `la ascensión se salió del jardín en z: ${m.z}`);
}

// 3. Vista del tendal desde la portería del jardín, para revisar el encuadre a ojo. El rumbo se
// calcula, no se adivina: la cámara mira hacia (−sin yaw, −cos yaw), así que apuntar a (dx, dz)
// pide yaw = atan2(−dx, −dz). Con el signo invertido el guion fotografía el lado contrario del
// pueblo y parece que la figura no está.
const rumboA = (px, pz, dx, dz) => Math.atan2(-(dx - px), -(dz - pz));
const [vx, vz] = [21, -10.5], [tx, tz] = [25, -6];
await s.js(`window.__macondo.player.place(${vx}, ${vz}, ${rumboA(vx, vz, tx, tz)})`);
await new Promise(r => setTimeout(r, 1200));
await s.captura('remedios_jardin');

// La cita ocupa casi todo el panel: el diálogo tiene que poder recorrerse hasta la glosa y la
// línea «para conversar», o la mitad de la actividad queda fuera de alcance.
await s.js(`window.__macondo.player.place(${ancla.x}, ${ancla.z}, 0)`);
await s.esperar(`window.__macondo.interactions.current?.id === 'sabanas-bramante'`, { tope: 6000 });
await s.tecla('KeyE');
await s.esperar(`document.querySelector('#reading').open`, { tope: 5000 });
const desliza = JSON.parse(await leer(`(() => {
  const d = document.querySelector('#reading');
  const antes = d.scrollTop; d.scrollTop = d.scrollHeight;
  const alcanza = document.querySelector('#reading-conversa').getBoundingClientRect().bottom
    <= d.getBoundingClientRect().bottom + 2;
  const r = { recorrible: d.scrollHeight > d.clientHeight + 4, movio: d.scrollTop > antes, alcanza };
  d.scrollTop = antes;
  // Y con el panel arriba del todo la glosa NO puede estar todavía a la vista: si lo está, es
  // que la cita se comió el alto y el bloque de diálogo quedó inservible.
  r.glosaVisibleSinBajar = document.querySelector('#reading-conversa').getBoundingClientRect().top
    < d.getBoundingClientRect().bottom;
  return JSON.stringify(r) })()`));
console.log('DESLIZA:', JSON.stringify(desliza));
s.afirmar(desliza.recorrible, 'el panel no se puede recorrer con la cita puesta');
s.afirmar(desliza.movio, 'el panel no bajó al llevarlo al final');
s.afirmar(desliza.alcanza, 'la línea «para conversar» no queda al alcance');
await s.js(`document.querySelector('#reading .close').click()`);

// 4. Móvil: la cita larga tiene que caber sin desbordar el panel. La lectura se reabre con su
// misma condición de antes —esperar al encuentro acercándose—, porque un `KeyE` a destiempo no
// abre nada y entonces las medidas salen 0 × 0 y las afirmaciones pasan por vacuidad.
await s.movil();
await s.js(`window.__macondo.player.place(${ancla.x}, ${ancla.z}, 0)`);
await s.esperar(`window.__macondo.interactions.current?.id === 'sabanas-bramante'`, { tope: 6000 });
await s.tecla('KeyE');
const abrioMovil = (await s.esperar(`document.querySelector('#reading').open`, { tope: 5000 })) >= 0;
s.afirmar(abrioMovil, 'la lectura no reabrió en móvil');
const movil = JSON.parse(await leer(`(() => {
  const c = document.querySelector('#reading-cita'), d = document.querySelector('#reading');
  return JSON.stringify({ abierta: d.open, caja: Math.round(c.getBoundingClientRect().width),
    panel: Math.round(d.getBoundingClientRect().width),
    desborda: c.scrollWidth > c.clientWidth + 1 }) })()`));
console.log('MÓVIL:', JSON.stringify(movil));
s.afirmar(movil.abierta, 'el panel no estaba abierto al medir en móvil');
s.afirmar(movil.panel > 200 && movil.panel <= 390, `el panel mide ${movil.panel} px en móvil`);
s.afirmar(movil.caja > 100 && movil.caja <= movil.panel, `la cita mide ${movil.caja} px de ${movil.panel}`);
s.afirmar(!movil.desborda, 'la cita desborda a lo ancho en móvil');
await s.captura('remedios_movil');
await s.escritorio();

await s.cerrar();
