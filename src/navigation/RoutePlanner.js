// Rutas seguras sobre el grafo de caminos.
//
// El recorrido guiado enlazaba al jugador con el grafo por el nodo MÁS CERCANO en línea recta,
// sin mirar qué había en medio: guiar desde detrás de una casa trazaba el primer tramo a través
// de ella, y allí el vuelo se cancelaba —el muro mandaba— o el detector de atasco saltaba el
// punto de giro y la mariposa cortaba la esquina. Aquí el tramo libre sólo se acepta si de verdad
// está despejado a la altura de vuelo, y el resto se resuelve por las aristas del grafo (que sí
// son calles) con Dijkstra, comprobando cada arista una sola vez.
//
// Sigue siendo un planificador de calles, no de geometría: no inventa atajos fuera del grafo.
// Es lo que el pueblo promete —«usa el mapa para los trayectos entre lugares»— y por eso el
// recorrido guiado entra siempre por una calle.
import { NODES, vecinos } from '../data/locations.js';
import { HOVER } from './PlayerController.js';

// Metros: radio en el que se busca un nodo del grafo al que llegar en línea recta.
const RADIO_ENLACE = 8;
// Metros: dos puntos más cerca que esto son el mismo punto en la ruta.
const JUNTOS = 0.15;
// Metros: lo que hay que alejarse del origen para que el primer punto aporte algo.
const PEGADO_AL_ORIGEN = 0.45;

const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Nodos del grafo a los que se puede llegar en línea recta desde `punto`. Los de dentro del
// radio, ordenados por cercanía; si ninguno vale, se prueba el despejado más próximo aunque
// quede lejos —mejor un rodeo por una calle que un tramo recto contra una casa—.
function enlaces(world, punto, altura) {
  const orden = Object.entries(NODES)
    .map(([id, p]) => ({ id, d: distancia(punto, p) }))
    .sort((a, b) => a.d - b.d);
  if (!orden.length) return [];
  const limite = Math.max(RADIO_ENLACE, orden[0].d + 3);
  const cerca = orden.filter(c => c.d <= limite && world.pathClear(punto, NODES[c.id], altura));
  if (cerca.length) return cerca;
  const lejos = orden.find(c => c.d > limite && world.pathClear(punto, NODES[c.id], altura));
  return lejos ? [lejos] : [];
}

// Ruta desde `desde` hasta `hasta`, como lista de puntos [x,z] por los que volar en orden.
// Devuelve null cuando no hay ninguna ruta segura: quien llame decide qué decirle al jugador.
//
//   - `altura` es la altura sobre el suelo a la que se va a volar (por omisión, la de crucero).
//   - `siemprePorGrafo` obliga a entrar y salir por el grafo aunque la recta esté despejada; es
//     lo que quiere el recorrido guiado, que debe verse pasar por las calles del pueblo.
export function planearRuta(world, desde, hasta, { altura = HOVER, siemprePorGrafo = false } = {}) {
  if (!world || ![desde[0], desde[1], hasta[0], hasta[1]].every(Number.isFinite)) return null;
  // El destino no puede estar dentro de un muro: ni se intenta.
  if (world.blocks(hasta[0], hasta[1], world.radio, world.groundAt(hasta[0], hasta[1]) + altura)) return null;

  // Vuelo libre con la recta despejada: se va recto, que es lo que pidió el jugador.
  if (!siemprePorGrafo && world.pathClear(desde, hasta, altura)) return [[hasta[0], hasta[1]]];

  const nodoFinal = Object.keys(NODES).find(id => distancia(NODES[id], hasta) < 1e-6);
  const origenes = enlaces(world, desde, altura);
  const finales = siemprePorGrafo && nodoFinal ? [{ id: nodoFinal, d: 0 }] : enlaces(world, hasta, altura);
  if (!origenes.length || !finales.length) return null;
  const costeSalida = new Map(finales.map(f => [f.id, f.d]));

  // Dijkstra. El coste de una arista es su largo en metros, así que la ruta prefiere el camino
  // más corto de verdad y no el que menos saltos da.
  const dist = new Map(origenes.map(o => [o.id, o.d]));
  const previo = new Map(origenes.map(o => [o.id, null]));
  const cerrados = new Set();
  const aristas = new Map();
  const aristaLibre = (a, b) => {
    const clave = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!aristas.has(clave)) aristas.set(clave, world.pathClear(NODES[a], NODES[b], altura));
    return aristas.get(clave);
  };

  let mejor = null;
  let mejorCoste = Infinity;
  for (;;) {
    let actual = null;
    let d = Infinity;
    for (const [id, v] of dist) if (!cerrados.has(id) && v < d) { actual = id; d = v; }
    if (actual === null || d >= mejorCoste) break;
    cerrados.add(actual);
    if (costeSalida.has(actual) && d + costeSalida.get(actual) < mejorCoste) {
      mejorCoste = d + costeSalida.get(actual);
      mejor = actual;
    }
    for (const vecino of vecinos(actual)) {
      if (cerrados.has(vecino)) continue;
      const nd = d + distancia(NODES[actual], NODES[vecino]);
      if (nd < (dist.has(vecino) ? dist.get(vecino) : Infinity) && aristaLibre(actual, vecino)) {
        dist.set(vecino, nd);
        previo.set(vecino, actual);
      }
    }
  }
  if (!mejor) return null;

  const puntos = [];
  for (let id = mejor; id; id = previo.get(id)) puntos.unshift([NODES[id][0], NODES[id][1]]);
  if (distancia(puntos[puntos.length - 1], hasta) > 1e-6) puntos.push([hasta[0], hasta[1]]);
  while (puntos.length && distancia(desde, puntos[0]) < PEGADO_AL_ORIGEN) puntos.shift();
  return puntos.filter((p, i) => i === 0 || distancia(p, puntos[i - 1]) > JUNTOS);
}
