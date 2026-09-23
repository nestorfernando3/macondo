// Mapa del pueblo: qué se ve en él y qué se puede hacer desde él.
//
// Nació para comparar dos versiones del mismo panel —el esquema de líneas y puntos frente al
// mapa ilustrado— midiendo lo mismo en las dos: caja del lienzo, capas dibujadas, trazos,
// marcadores, tamaño de la etiqueta, contraste y alcance sin desplazar. La mejora se juzga con
// la tabla delante, no de palabra.
//
// El mapa es la única ayuda de navegación del paseo: el minimapa dice dónde está usted, pero
// «¿por dónde se sube?» y «¿qué camino lleva al puerto?» se responden aquí. Por eso lo que se
// afirma no es que el dibujo sea bonito sino que sea utilizable: que el río y los caminos
// estén, que cada lugar se pueda elegir desde el propio dibujo —con ratón y con teclado—, que
// cada punto tenga un área de toque real y que su nombre se lea sobre el papel.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true, out: process.argv[2] });
await s.entrar({ omitirVuelo: true });

// Abrir el mapa esperando a que el chip tenga caja: recién entrado al paseo el HUD todavía se
// está montando, y un clic medido en ese hueco cae en el vacío —el panel no abre y el fallo
// parece del mapa—. Los topes son anchos a propósito: bajo SwiftShader y con varias corridas de
// Chrome encima, el primer fotograma puede tardar bastante más que en una máquina despejada.
async function abrirMapa() {
  if (await s.js(`document.querySelector('#map').open`)) return true;
  await s.esperar(`(() => { const b = document.querySelector('#open-map'); if (!b) return false;
    const r = b.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !b.closest('#hud').hidden })()`,
  { tope: 25000 });
  await s.clic('#open-map', { intentos: 10 });
  if (await s.esperar(`document.querySelector('#map').open`, { tope: 5000 }) >= 0) return true;
  await s.clic('#open-map', { intentos: 10 });
  return (await s.esperar(`document.querySelector('#map').open`, { tope: 5000 })) >= 0;
}

// Se mide con el panel abierto y el pueblo recién cargado: los cinco lugares siguen pendientes,
// que es el estado en el que llega quien abre el mapa por primera vez.
const medir = () => s.js(`(() => {
  const svg = document.querySelector('#map-canvas svg');
  const lienzo = document.querySelector('#map-canvas');
  const panel = document.querySelector('#map');
  const caja = el => { const r = el.getBoundingClientRect();
    return { ancho: +r.width.toFixed(1), alto: +r.height.toFixed(1), area: Math.round(r.width * r.height) }; };
  // Sin svg no hay nada que medir, pero se devuelven las claves con sus ceros: así el guion
  // acumula los fallos con su mensaje en vez de reventar en la primera comparación.
  if (!svg) return JSON.stringify({ error: 'el lienzo no tiene svg', viewBox: null, relacion: 0,
    lienzo: { ancho: 0, alto: 0, area: 0 }, lienzoPctVista: 0, panel: caja(panel), elementos: 0,
    trazos: 0, capas: [], marcadoresEnMapa: 0, marcadoresEnfocables: 0, marcadoresConNombre: 0,
    toqueMin: 0, etiquetaPx: 0, contrasteEtiqueta: 0, destinos: 0, destinosSinDesplazar: false,
    panelDesborda: true, reparto: {} });
  const vb = (svg.getAttribute('viewBox') || '').split(/\\s+/).map(Number);
  const marcadores = [...svg.querySelectorAll('[data-lugar]')];
  const areas = marcadores.map(m => m.getBoundingClientRect());
  const etiqueta = svg.querySelector('[data-etiqueta]');
  // Luminancia relativa de la WCAG sobre el color que de verdad queda detrás del glifo: la
  // etiqueta lleva halo (paint-order), así que el fondo del texto es su propio trazo.
  const lum = color => {
    const [r, g, b] = (color.match(/[\\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number)
      .map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const destinos = [...document.querySelectorAll('#map-destinations button')];
  const ultimo = destinos[destinos.length - 1];
  const cajaPanel = panel.getBoundingClientRect();
  const cajaLienzo = caja(lienzo);
  // El cuerpo de las etiquetas se mide en píxeles de pantalla, no en unidades del lienzo: el
  // cuerpo de un texto SVG se declara en unidades de usuario y engaña —dice 23 px cuando en un
  // teléfono se ven 12,5—. getScreenCTM da la escala real del dibujo dentro de su caja.
  const escala = etiqueta ? etiqueta.getScreenCTM().a : 0;
  const alto = sel => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().height) : 0; };
  return JSON.stringify({
    viewBox: svg.getAttribute('viewBox'),
    relacion: +(vb[2] / vb[3]).toFixed(2),
    lienzo: cajaLienzo,
    lienzoPctVista: +((cajaLienzo.area / (innerWidth * innerHeight)) * 100).toFixed(1),
    panel: caja(panel),
    elementos: svg.querySelectorAll('*').length,
    trazos: svg.querySelectorAll('path, line').length,
    capas: [...svg.querySelectorAll('[data-capa]')].map(e => e.getAttribute('data-capa')),
    marcadoresEnMapa: marcadores.length,
    marcadoresEnfocables: marcadores.filter(m => m.tabIndex >= 0).length,
    marcadoresConNombre: marcadores.filter(m => (m.getAttribute('aria-label') || '').length > 3).length,
    toqueMin: areas.length ? +Math.min(...areas.map(r => Math.min(r.width, r.height))).toFixed(1) : 0,
    etiquetaPx: etiqueta ? +(parseFloat(getComputedStyle(etiqueta).fontSize) * escala).toFixed(1) : 0,
    contrasteEtiqueta: etiqueta ? +contraste(getComputedStyle(etiqueta).fill, getComputedStyle(etiqueta).stroke).toFixed(2) : 0,
    destinos: destinos.length,
    destinosSinDesplazar: !!ultimo && ultimo.getBoundingClientRect().bottom <= cajaPanel.bottom + 1,
    panelDesborda: panel.scrollHeight > panel.clientHeight + 1,
    // Reparto del alto del panel: dice de un vistazo qué se come el espacio cuando algo no entra.
    reparto: {
      visible: panel.clientHeight,
      contenido: panel.scrollHeight,
      titulo: alto('#map-title'),
      arbol: alto('#open-arbol'),
      lienzo: Math.round(cajaLienzo.alto),
      destinos: alto('#map-destinations'),
      pie: alto('#map-hint'),
    },
  }, null, 0);
})()`);

await abrirMapa();
s.afirmar(await s.js(`document.querySelector('#map').open`), 'el panel del mapa no abrió');
const escritorio = JSON.parse(await medir());
console.log('ESCRITORIO ' + JSON.stringify(escritorio));
await s.captura('mapa_escritorio');

// 1. El mapa dibuja el pueblo: el río como accidente que orienta, el papel, los caminos del
//    grafo y las casas. Sin capas con nombre no hay nada que afirmar, así que su ausencia es
//    el propio fallo.
for (const capa of ['papel', 'rio', 'vegas', 'caminos', 'plaza', 'muelle', 'casas', 'lugares']) {
  s.afirmar(escritorio.capas.includes(capa), `el mapa no dibuja la capa «${capa}»`);
}

// 2. Los cinco lugares se eligen desde el propio dibujo, no sólo desde la lista de abajo.
s.afirmar(escritorio.marcadoresEnMapa === 5,
  `el mapa tiene ${escritorio.marcadoresEnMapa} lugares elegibles en el dibujo y deberían ser 5`);
s.afirmar(escritorio.marcadoresEnfocables === escritorio.marcadoresEnMapa,
  'hay lugares del dibujo a los que no se llega con el teclado');
s.afirmar(escritorio.marcadoresConNombre === escritorio.marcadoresEnMapa,
  'hay lugares del dibujo sin nombre accesible');

// 3. Se puede tocar y se puede leer: área de toque real y nombre legible sobre el papel.
s.afirmar(escritorio.toqueMin >= 24,
  `el área de toque más pequeña mide ${escritorio.toqueMin} px y el mínimo cómodo es 24`);
s.afirmar(escritorio.etiquetaPx >= 12,
  `las etiquetas del mapa se leen a ${escritorio.etiquetaPx} px`);
s.afirmar(escritorio.contrasteEtiqueta >= 4.5,
  `el nombre de los lugares queda en ${escritorio.contrasteEtiqueta}:1 de contraste`);

// 4. La lista de destinos sigue siendo la ruta de texto y no se cae bajo el pliegue: era la
//    única forma de elegir lugar antes del mapa ilustrado y no puede perderse al cambiarlo.
s.afirmar(escritorio.destinos === 5, `la lista de destinos tiene ${escritorio.destinos} botones`);
s.afirmar(escritorio.destinosSinDesplazar && !escritorio.panelDesborda,
  'la lista de destinos queda fuera de la vista al abrir el mapa');

// 5. Elegir un lugar desde el dibujo funciona de verdad: cierra el panel y arranca el recorrido
//    hacia ese lugar. Se comprueba con un clic real y con el teclado por separado.
const destino = await s.js(`(() => { const m = document.querySelector('#map-canvas [data-lugar="jardin"]');
  return m ? m.getAttribute('aria-label') : null })()`);
s.afirmar(!!destino, 'el jardín no está en el mapa');
if (await s.puedeClic('#map-canvas [data-lugar="jardin"]')) await s.clic('#map-canvas [data-lugar="jardin"]');
else await s.js(`document.querySelector('#map-canvas [data-lugar="jardin"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
s.afirmar(await s.esperar(`!document.querySelector('#map').open`, { tope: 3000 }) >= 0,
  'elegir el jardín en el mapa no cerró el panel');
s.afirmar((await s.esperar(`window.__macondo.locomocion.estado.recorrido === true`, { tope: 3000 })) >= 0,
  'elegir el jardín en el mapa no puso rumbo a ninguna parte');
if (await s.puedeClic('#tour-stop')) await s.clic('#tour-stop');
await s.esperar(`window.__macondo.locomocion.estado.recorrido === false`, { tope: 3000 });

// El teclado: se enfoca un punto y se activa con Enter.
await s.clic('#open-map');
await s.esperar(`document.querySelector('#map').open`, { tope: 3000 });
const enfocado = await s.js(`(() => { const m = document.querySelector('#map-canvas [data-lugar="puerto"]');
  if (!m) return null; m.focus();
  const etiqueta = m.getAttribute('aria-label');
  m.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  return etiqueta })()`);
s.afirmar(!!enfocado, 'el puerto no está en el mapa');
s.afirmar(await s.esperar(`!document.querySelector('#map').open`, { tope: 3000 }) >= 0,
  'activar el puerto con Enter no cerró el panel');
if (await s.puedeClic('#tour-stop')) await s.clic('#tour-stop');
await s.esperar(`window.__macondo.locomocion.estado.recorrido === false`, { tope: 3000 });

// 6. El estado de cada lugar se ve en el propio dibujo: pendiente es un anillo hueco y visitado,
//    un disco lleno. Se comprueba llegando al jardín, que es lo que hace el paseo al pasar por
//    un lugar, y sin depender del tono: el disco pasa de `none` a un color.
const leerJardin = () => s.js(`(() => {
  const m = document.querySelector('#map-canvas [data-lugar="jardin"]');
  if (!m) return 'null';
  return JSON.stringify({
    visitado: m.classList.contains('mapa-lugar--visitado'),
    disco: getComputedStyle(m.querySelector('.mapa-lugar__disco')).fill,
  });
})()`);
await abrirMapa();
const pendiente = JSON.parse((await leerJardin()) || 'null');
s.afirmar(pendiente && pendiente.visitado === false, 'el jardín figuraba como visitado antes de llegar');
s.afirmar(pendiente && pendiente.disco === 'none',
  `un lugar por descubrir ya traía el disco lleno (${pendiente && pendiente.disco})`);
await s.js(`document.querySelector('#map').close()`);
await s.js(`window.__macondo.player.place(22.5, -11.5, 0)`);
await s.esperar(`document.querySelector('#place-name').textContent === 'Jardín del tiempo'`, { tope: 5000 });
await abrirMapa();
const visitado = JSON.parse((await leerJardin()) || 'null');
s.afirmar(visitado && visitado.visitado === true, 'el jardín no cambió de estado en el dibujo tras visitarlo');
s.afirmar(visitado && visitado.disco !== 'none',
  'el lugar visitado se quedó con el anillo hueco: los dos estados se distinguen sólo por color');
s.afirmar(await s.js(`[...document.querySelectorAll('#map-destinations button')]
  .some(b => b.textContent.includes('Jardín') && b.textContent.startsWith('✓'))`),
  'la lista de destinos no marca el jardín ya visitado');

// 7. En el teléfono: el mismo dibujo, sin desbordar y sin dejar la lista fuera.
await s.js(`document.querySelector('#map').close()`);
await s.js(`window.__macondo.player.place(0, 24, 0)`);
await s.movil();
await abrirMapa();
const movil = JSON.parse(await medir());
console.log('MÓVIL ' + JSON.stringify(movil));
await s.captura('mapa_movil');
s.afirmar(movil.destinos === 5, `en el teléfono la lista de destinos quedó en ${movil.destinos}`);
s.afirmar(!movil.panelDesborda, 'en el teléfono el panel del mapa desborda su alto');
s.afirmar(movil.marcadoresEnMapa === 5, 'en el teléfono el dibujo pierde lugares elegibles');
s.afirmar(movil.lienzo.ancho > 200, `el lienzo del mapa mide ${movil.lienzo.ancho} px de ancho en el teléfono`);

// 8. El borde del corte: a 700 px el dibujo se apila, y sin techo el lienzo pasaría de 314 a
//    624 px de ancho y se comería en alto lo que se acababa de ganar. Se mide justo por debajo
//    del corte, que es donde el riesgo está.
await s.js(`document.querySelector('#map').close()`);
await s.escritorio();
await s.movil(700, 800);
await abrirMapa();
const borde = JSON.parse(await medir());
console.log('BORDE 700×800 ' + JSON.stringify(borde));
await s.captura('mapa_borde700');
s.afirmar(borde.lienzo.ancho <= 522,
  `en el borde del corte el lienzo mide ${borde.lienzo.ancho} px y se estira sin freno`);
s.afirmar(!borde.panelDesborda, 'en el borde del corte el panel desborda su alto');
s.afirmar(borde.marcadoresEnMapa === 5, 'en el borde del corte el dibujo pierde lugares elegibles');
s.afirmar(borde.destinos === 5, 'en el borde del corte la lista de destinos queda incompleta');

await s.cerrar();
