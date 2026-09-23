// Mapa ilustrado del pueblo.
//
// El panel del mapa respondía «¿dónde estoy?» —el grafo a escala, con los nombres en cuerpo
// diminuto— y no «¿por dónde se va?», que es lo que de verdad se pregunta al abrirlo: el
// minimapa del HUD ya dice dónde está usted, pero no por dónde se sube al mirador ni qué camino
// lleva al puerto. Aquí el mismo grafo se dibuja sobre papel: el río como accidente que
// orienta, las casas como referencia, los caminos tal como son y cada lugar como un punto que
// se elige con el ratón o con el teclado.
//
// Los caminos, el muelle y la orilla salen de las mismas coordenadas que usa el mundo
// (`data/locations.js` y la caja de agua de `places/puerto.js`), así que si el pueblo cambia el
// dibujo lo sigue sin que nadie lo repase a mano. Las casas y el verde sí son símbolos de mapa:
// dan referencia y escala de lectura, no reproducen el catastro.
import { LOCATIONS, NODES, EDGES } from '../data/locations.js';

const NS = 'http://www.w3.org/2000/svg';

// Ancho del lienzo en sus propias unidades: el panel lo escala a su caja. El resto de medidas
// están elegidas para que, en la caja más estrecha que se da —el teléfono de 390, donde el
// dibujo queda en unos 290 px—, el nombre de un lugar no baje de 12 px ni su área de toque de
// 24 px. De ahí salen el cuerpo de letra y el radio, que a primera vista parecen grandes.
const ANCHO = 540;
const CUERPO = 23;
const TOQUE = 23;

const ORILLA = -24;   // orilla este del río: borde del plano de agua (world/water.js)
const AGUA = 18;      // metros de río que se ven al oeste de la orilla
const AIRE = 5;       // metros de campo alrededor del pueblo
const MUELLE = { x1: -36.5, z1: 6.4, x2: ORILLA, z2: 9.6 };   // la pasarela real (places/puerto.js)

// Cómo se llama cada lugar en el dibujo. El nombre completo vive en `data/locations.js` y es el
// que se anuncia; aquí va el rótulo corto, que es lo que cabe sobre el papel.
const ROTULOS = {
  plaza: 'La plaza',
  casa: 'La casa',
  jardin: 'El jardín',
  puerto: 'El puerto',
  mirador: 'El mirador',
};

// Dónde se apoya cada nombre respecto de su punto. El centro del pueblo está poblado —cinco
// puntos y cuatro caminos en 540 unidades—, así que cada rótulo se coloca a mano: la casa a la
// izquierda, el puerto sobre el muelle, el mirador bajo el cerro y el jardín, que está al borde
// del papel, hacia dentro.
const ETIQUETAS = {
  plaza: { dx: 0, dy: 44, ancla: 'middle' },
  casa: { dx: -30, dy: 8, ancla: 'end' },
  jardin: { dx: -22, dy: -28, ancla: 'end' },
  puerto: { dx: 0, dy: -34, ancla: 'middle' },
  mirador: { dx: 0, dy: 42, ancla: 'middle' },
};

// Casas del pueblo, en metros y en el orden en que se dibujan. Siguen los caminos —la calle de
// llegada, la plaza, la bajada al puerto— y ninguna pisa la calzada.
const CASAS = [
  [6.5, 20, -9], [-6.5, 22.5, 7], [6.5, 10.5, -6], [-7, 12, 10],
  [6, -3.5, 4], [-6, -3, -7], [9.5, 3.5, -4], [16, 4.5, 3],
  [-6, -9.5, -8], [6.5, -9.5, 6], [25, -4, -11],
  [-13.5, 6, 8], [-20, 10.5, -5], [-26, 15, 12], [10.5, 16, -6],
];

// El verde: el jardín, el cerro del mirador y las vegas del río. Son manchas de referencia.
const VEGAS = [
  [22.5, -11.5, 11], [17.5, -7.5, 8], [12.5, -17.5, 7],
  [17, 22, 13], [17, 22, 7.5],
  [-19, -14, 9], [-19.5, 22, 10], [-21, 34, 7], [-14, -3, 6],
];

function nodo(tag, attrs = {}, hijos = []) {
  const el = document.createElementNS(NS, tag);
  for (const clave in attrs) if (attrs[clave] !== undefined) el.setAttribute(clave, attrs[clave]);
  for (const hijo of hijos) el.append(hijo);
  return el;
}

function rotulo(tag, attrs, texto) {
  const el = nodo(tag, attrs);
  el.textContent = texto;
  return el;
}

// Encuadre: la caja del pueblo (lugares y nodos) con su aire, más la banda de río al oeste. Se
// calcula en vez de escribirse para que el mapa siga al mundo si alguien mueve un lugar.
function encuadre() {
  const xs = [], zs = [];
  for (const lugar of Object.values(LOCATIONS)) { xs.push(lugar.x); zs.push(lugar.z); }
  for (const [x, z] of Object.values(NODES)) { xs.push(x); zs.push(z); }
  const x1 = Math.min(...xs) - AIRE - AGUA;
  const x2 = Math.max(...xs) + AIRE;
  const z1 = Math.min(...zs) - AIRE;
  const z2 = Math.max(...zs) + AIRE;
  const escala = ANCHO / (x2 - x1);
  return {
    ancho: ANCHO,
    alto: Math.round((z2 - z1) * escala),
    px: x => (x - x1) * escala,
    pz: z => (z - z1) * escala,
    metros: escala,
  };
}

function papel(mapa) {
  const grupo = nodo('g', { 'data-capa': 'papel', 'aria-hidden': 'true' });
  grupo.append(nodo('rect', { width: mapa.ancho, height: mapa.alto, fill: '#e8ddc2' }));
  grupo.append(nodo('rect', { width: mapa.ancho, height: mapa.alto, fill: 'url(#mapa-grano)' }));
  return grupo;
}

// El río no es una recta: la orilla ondula para que el agua se lea como agua y no como un
// margen. La onda es decorativa; su eje es la orilla real.
function rio(mapa) {
  const grupo = nodo('g', { 'data-capa': 'rio', 'aria-hidden': 'true' });
  const eje = mapa.px(ORILLA);
  const onda = y => eje + Math.sin(y / 46) * 7 + Math.sin(y / 17 + 1.1) * 4;
  let d = 'M0 0';
  for (let y = 0; y <= mapa.alto; y += 8) d += ` L${onda(y).toFixed(1)} ${y}`;
  d += ` L0 ${mapa.alto} Z`;
  grupo.append(nodo('path', { d, fill: '#abc7bd' }));
  grupo.append(nodo('path', { d, fill: 'url(#mapa-aguas)' }));
  grupo.append(nodo('path', { d, fill: 'none', stroke: '#8fb0a6', 'stroke-width': 2 }));
  return grupo;
}

function vegas(mapa) {
  const grupo = nodo('g', { 'data-capa': 'vegas', 'aria-hidden': 'true' });
  for (const [x, z, r] of VEGAS) {
    grupo.append(nodo('circle', {
      cx: mapa.px(x), cy: mapa.pz(z), r: r * mapa.metros, fill: '#c3d2a8', opacity: '.8',
    }));
  }
  return grupo;
}

// Los caminos del pueblo, tal como se recorren: las aristas del grafo. Dos pasadas —la calzada
// clara y su eje punteado— para que se lean como caminos y no como cables.
function caminos(mapa) {
  const grupo = nodo('g', { 'data-capa': 'caminos', 'aria-hidden': 'true' });
  const trazo = [];
  for (const [a, b] of EDGES) {
    if (!NODES[a] || !NODES[b]) continue;
    trazo.push({ x1: mapa.px(NODES[a][0]), y1: mapa.pz(NODES[a][1]), x2: mapa.px(NODES[b][0]), y2: mapa.pz(NODES[b][1]) });
  }
  for (const t of trazo) grupo.append(nodo('line', { ...t, stroke: '#f8eed4', 'stroke-width': 15, 'stroke-linecap': 'round' }));
  for (const t of trazo) grupo.append(nodo('line', { ...t, stroke: '#bca887', 'stroke-width': 1.4, 'stroke-dasharray': '4 7' }));
  return grupo;
}

function plaza(mapa) {
  const grupo = nodo('g', { 'data-capa': 'plaza', 'aria-hidden': 'true' });
  const { x, z } = LOCATIONS.plaza;
  grupo.append(nodo('circle', {
    cx: mapa.px(x), cy: mapa.pz(z), r: 4.6 * mapa.metros,
    fill: '#cdd8b4', stroke: '#8f9878', 'stroke-width': 3,
  }));
  return grupo;
}

// El muelle es una pasarela sobre el agua: se dibuja para que el puerto no caiga en medio del
// río sin explicación, y es el único lugar del pueblo que está, de verdad, encima del agua.
function muelle(mapa) {
  const grupo = nodo('g', { 'data-capa': 'muelle', 'aria-hidden': 'true' });
  grupo.append(nodo('rect', {
    x: mapa.px(MUELLE.x1), y: mapa.pz(MUELLE.z1),
    width: (MUELLE.x2 - MUELLE.x1) * mapa.metros, height: (MUELLE.z2 - MUELLE.z1) * mapa.metros,
    fill: '#d8c39c', stroke: '#8d7a5f', 'stroke-width': 2, rx: 2,
  }));
  return grupo;
}

function casas(mapa) {
  const grupo = nodo('g', { 'data-capa': 'casas', 'aria-hidden': 'true' });
  CASAS.forEach(([x, z, giro], i) => {
    // El tamaño varía un poco y de forma fija —nada de azar: el mapa tiene que salir igual en
    // cada apertura, o dos capturas del mismo pueblo no se podrían comparar—. Sin esa variación
    // las dieciséis casas se leen como un sello repetido.
    const tamano = 1 + (((i * 7) % 5) - 2) * 0.07;
    grupo.append(nodo('g', {
      transform: `translate(${mapa.px(x).toFixed(1)} ${mapa.pz(z).toFixed(1)}) rotate(${giro}) scale(${tamano.toFixed(2)})`,
    }, [
      nodo('rect', { x: -17, y: -12, width: 34, height: 24, fill: '#dcc4a4', stroke: '#b39a78', 'stroke-width': 1.6 }),
      nodo('path', {
        d: 'M-21 -12 L0 -26 L21 -12 Z', fill: '#bd8a6a', stroke: '#9c6d50', 'stroke-width': 1.6,
        'stroke-linejoin': 'round',
      }),
    ]));
    // Un punto de sombra por casa: sin él el pueblo queda plano, y con él no hace falta dibujar
    // cada muro para que las casas se lean como casas.
    grupo.append(nodo('circle', { cx: mapa.px(x) + 4, cy: mapa.pz(z) + 12, r: 2, fill: '#b39a78' }));
  });
  return grupo;
}

// Cada lugar: un área de toque generosa e invisible, un aro que dice si ya lo visitó y el
// nombre. Descubierto y pendiente se distinguen por forma —disco lleno frente a anillo— y no
// sólo por color, que es lo que el informe de diseño pedía del minimapa y aquí se cumple desde
// el principio.
function lugares(mapa, descubiertos, alElegir) {
  const grupo = nodo('g', { 'data-capa': 'lugares' });
  for (const [id, lugar] of Object.entries(LOCATIONS)) {
    // El patio no es destino de la lista de abajo —se entra por la casa— y aquí tampoco se
    // ofrece: el mapa marca los cinco lugares a los que se puede ir.
    if (!ROTULOS[id]) continue;
    const x = mapa.px(lugar.x), y = mapa.pz(lugar.z);
    const visitado = descubiertos.has(id);
    const punto = nodo('g', {
      class: `mapa-lugar ${visitado ? 'mapa-lugar--visitado' : 'mapa-lugar--pendiente'}`,
      'data-lugar': id, role: 'button', tabindex: '0', 'aria-label': `Ir hasta ${lugar.name}`,
    });
    punto.append(nodo('circle', { cx: x, cy: y, r: TOQUE, fill: 'transparent' }));
    punto.append(nodo('circle', { class: 'mapa-lugar__aro', cx: x, cy: y, r: 12 }));
    punto.append(nodo('circle', { class: 'mapa-lugar__disco', cx: x, cy: y, r: 5.5 }));
    punto.addEventListener('click', () => alElegir(id));
    punto.addEventListener('keydown', evento => {
      if (evento.key !== 'Enter' && evento.key !== ' ') return;
      evento.preventDefault();
      alElegir(id);
    });
    grupo.append(punto);

    const donde = ETIQUETAS[id];
    const nombre = rotulo('text', {
      class: 'mapa-lugar__nombre', 'data-etiqueta': '', 'font-size': CUERPO,
      x: (x + donde.dx).toFixed(1), y: (y + donde.dy).toFixed(1), 'text-anchor': donde.ancla,
    }, ROTULOS[id]);
    nombre.setAttribute('aria-hidden', 'true');   // el nombre accesible ya lo lleva el punto
    grupo.append(nombre);
  }
  return grupo;
}

// La flecha de quien mira el mapa: la misma que dibuja el minimapa, para que el dibujo grande y
// el pequeño se lean como el mismo pueblo.
function flechaJugador(mapa, jugador) {
  if (!jugador) return null;
  const grupo = nodo('g', { 'data-capa': 'jugador', 'aria-hidden': 'true' });
  const x = mapa.px(jugador.x), y = mapa.pz(jugador.z), a = -jugador.yaw;
  const punta = [[0, -11], [6.5, 7], [0, 3.5], [-6.5, 7]]
    .map(([dx, dy]) => `${(x + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(1)},${(y + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(1)}`)
    .join(' ');
  grupo.append(nodo('polygon', { points: punta, fill: '#c0392b', stroke: '#fff6df', 'stroke-width': 2 }));
  return grupo;
}

function rotulosFijos(mapa) {
  const grupo = nodo('g', { 'data-capa': 'rotulos', 'aria-hidden': 'true' });
  grupo.append(rotulo('text', {
    class: 'mapa-rio', x: 46, y: mapa.alto - 26, transform: `rotate(-90 46 ${mapa.alto - 26})`,
  }, 'EL RÍO'));
  // El norte está arriba: yaw 0 mira hacia -z y el camino de llegada entra desde el sur.
  grupo.append(rotulo('text', { class: 'mapa-brujula', x: 30, y: 44 }, 'N ↑'));
  return grupo;
}

// Devuelve el dibujo completo. `descubiertos` es el conjunto de lugares ya visitados y
// `alElegir(id)` lo que hace el paseo cuando se toca uno —cerrar el panel y poner rumbo—, que
// resuelve `main.js`: aquí no se sabe nada del recorrido.
export function crearMapa({ descubiertos, jugador = null, alElegir }) {
  const mapa = encuadre();
  const svg = nodo('svg', {
    class: 'mapa', viewBox: `0 0 ${mapa.ancho} ${mapa.alto}`,
    role: 'group', 'aria-label': 'Mapa del pueblo: elija un lugar para volar hasta él',
  });
  const defs = nodo('defs');
  defs.append(nodo('pattern', { id: 'mapa-grano', width: 13, height: 13, patternUnits: 'userSpaceOnUse' },
    [nodo('circle', { cx: 2, cy: 3, r: 0.6, fill: '#bba980', opacity: '.45' })]));
  defs.append(nodo('pattern', { id: 'mapa-aguas', width: 26, height: 18, patternUnits: 'userSpaceOnUse' },
    [nodo('path', { d: 'M0 9q6.5-4.5 13 0t13 0', fill: 'none', stroke: '#9cb9ad', 'stroke-width': 1.1, opacity: '.75' })]));
  svg.append(defs);
  svg.append(papel(mapa), rio(mapa), vegas(mapa), caminos(mapa), plaza(mapa), muelle(mapa), casas(mapa));
  svg.append(lugares(mapa, descubiertos, alElegir));
  const flecha = flechaJugador(mapa, jugador);
  if (flecha) svg.append(flecha);
  svg.append(rotulosFijos(mapa));
  return svg;
}
