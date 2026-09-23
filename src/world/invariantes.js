// Invariantes del pueblo: lo que el paseo promete y ninguna pieza nueva puede romper.
//
// El conocimiento vivía repartido entre la prueba y el ojo de quien construía: al rehacer el
// puerto se perdieron dos rampas y tres cajas de agua y no lo notó nadie hasta correr un guion
// de navegador. Aquí está escrito una sola vez, con su interfaz pequeña —`verificarPueblo`
// devuelve la lista de problemas— para que la crucen la prueba de Node y el propio juego:
// `createVillage` guarda el resultado y el gancho de verificación lo expone.
//
// Cada problema lleva `check` (para filtrar) y `detalle` (para saber dónde).
import { NODES, EDGES, LOCATIONS, SPAWN } from '../data/locations.js';

export const RADIO_JUGADOR = .32;   // radio de la mariposa, con holgura
export const PASO_MUESTREO = .25;   // cada cuánto se muestrea una ruta
export const SALTO_MAXIMO = .6;     // escalón de suelo tolerable entre muestras

// Alturas que el paseo promete en sus puntos clave.
export const ALTURAS = [
  { nombre: 'calle principal', x: 0, z: 12, y: 0 },
  { nombre: 'patio de la casa', x: 0, z: -15.5, y: 0 },
  { nombre: 'tabla del muelle', x: -29.5, z: 8, y: .35 },
  { nombre: 'transición orilla-muelle', x: -23.4, z: 8, entre: [.1, .3] },
  { nombre: 'meseta del mirador', x: 17, z: 22, y: 3 },
];

// El agua no se cruza; el muelle y su transición sí se vuelan.
export const AGUA = [
  { nombre: 'río al norte del muelle', x: -30, z: 3, bloqueado: true },
  { nombre: 'río al sur del muelle', x: -30, z: 14, bloqueado: true },
  { nombre: 'pasado el muelle', x: -40, z: 8, bloqueado: true },
  { nombre: 'tabla del muelle', x: -30, z: 8, bloqueado: false },
  { nombre: 'transición a la orilla', x: -23, z: 8, bloqueado: false },
];

// Lo que la vista debe y no debe tapar. Los muros de las casas bloquean; los setos del
// jardín (1,1 m) no, porque la mariposa vuela a 2,1 m y los ve por encima.
export const VISTAS = [
  { nombre: 'la mesa del patio desde la calle, a través del muro', desde: [2, -8], hasta: [1.8, -16.2], visible: false },
  { nombre: 'la mesa del patio desde el propio patio', desde: [.6, -14.8], hasta: [1.8, -16.2], visible: true },
  { nombre: 'la mesa del patio desde el umbral de la puerta', desde: [0, -10.5], hasta: [1.8, -16.2], visible: true },
  { nombre: 'el árbol del tiempo desde la portería del jardín', desde: [20.5, -11], hasta: [25, -8.8], visible: true },
];

function recorridoTransitable(world) {
  const problemas = [];
  for (const [a, b] of EDGES) {
    const [ax, az] = NODES[a], [bx, bz] = NODES[b];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / PASO_MUESTREO));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (world.blocks(x, z, RADIO_JUGADOR))
        problemas.push({ check: 'ruta', detalle: `el camino ${a}→${b} está bloqueado en (${x.toFixed(2)}, ${z.toFixed(2)})` });
    }
  }
  return problemas;
}

function sueloContinuo(world) {
  const problemas = [];
  for (const [a, b] of EDGES) {
    const [ax, az] = NODES[a], [bx, bz] = NODES[b];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / PASO_MUESTREO));
    let anterior = world.groundAt(ax, az);
    for (let i = 1; i <= n; i++) {
      const t = i / n, y = world.groundAt(ax + (bx - ax) * t, az + (bz - az) * t);
      if (Math.abs(y - anterior) > SALTO_MAXIMO)
        problemas.push({ check: 'suelo', detalle: `escalón de ${(y - anterior).toFixed(2)} m en ${a}→${b}` });
      anterior = y;
    }
  }
  return problemas;
}

function alturasPrometidas(world) {
  const problemas = [];
  for (const a of ALTURAS) {
    const y = world.groundAt(a.x, a.z);
    const bien = a.entre ? (y > a.entre[0] && y < a.entre[1]) : Math.abs(y - a.y) < .01;
    if (!bien)
      problemas.push({ check: 'alturas', detalle: `${a.nombre}: el suelo está a ${y.toFixed(2)} m y debería estar ${a.entre ? `entre ${a.entre[0]} y ${a.entre[1]}` : `a ${a.y}`} m` });
  }
  return problemas;
}

function aguaYOrilla(world) {
  const problemas = [];
  for (const a of AGUA) {
    const bloquea = world.blocks(a.x, a.z, RADIO_JUGADOR);
    if (bloquea !== a.bloqueado)
      problemas.push({ check: 'agua', detalle: `${a.nombre} (${a.x}, ${a.z}): ${bloquea ? 'bloquea' : 'deja pasar'} y debería ${a.bloqueado ? 'bloquear' : 'dejar pasar'}` });
  }
  return problemas;
}

function encuentrosAlcanzables(world, encuentros) {
  const problemas = [];
  for (const e of encuentros) {
    const d = Math.min(1.5, e.radius - .4);
    let libres = 0;
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * 2 * i / 12;
      if (!world.blocks(e.x + Math.cos(a) * d, e.z + Math.sin(a) * d, .3)) libres++;
    }
    if (libres < 3)
      problemas.push({ check: 'encuentros', detalle: `${e.id}: sólo ${libres}/12 aproximaciones libres` });
  }
  return problemas;
}

// El vuelo es libre: ningún lugar puede quedar cercado por muros invisibles. Se vuela —sobre
// el papel— desde el arranque a la altura del techo de las casas y se comprueba que los seis
// lugares se alcanzan. Es la red que faltaba: la meseta del mirador estuvo cercada por dos
// anillos de colisión que bloqueaban a cualquier altura, y el único camino era la rampa.
export const ALTURA_VUELO_LIBRE = 7.5;   // sobre la cumbrera de las casas: el mando llega a 9
const CELDA = .75;

function vueloLibre(world) {
  const L = world.limit, n = Math.floor((2 * L) / CELDA) + 1;
  const idx = (i, j) => j * n + i;
  const libre = new Uint8Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const x = -L + i * CELDA, z = -L + j * CELDA;
      libre[idx(i, j)] = world.blocks(x, z, RADIO_JUGADOR, ALTURA_VUELO_LIBRE) ? 0 : 1;
    }
  const visto = new Uint8Array(n * n), cola = [];
  const casilla = (x, z) => [Math.round((x + L) / CELDA), Math.round((z + L) / CELDA)];
  const [i0, j0] = casilla(SPAWN.x, SPAWN.z);
  visto[idx(i0, j0)] = 1; cola.push([i0, j0]);
  while (cola.length) {
    const [i, j] = cola.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= n || b >= n) continue;
      const k = idx(a, b);
      if (visto[k] || !libre[k]) continue;
      visto[k] = 1; cola.push([a, b]);
    }
  }
  const problemas = [];
  for (const id in LOCATIONS) {
    const { x, z } = LOCATIONS[id];
    let alcanzables = 0;
    for (let dx = -1.5; dx <= 1.5; dx += CELDA)
      for (let dz = -1.5; dz <= 1.5; dz += CELDA) {
        const [i, j] = casilla(x + dx, z + dz);
        if (i >= 0 && j >= 0 && i < n && j < n && visto[idx(i, j)]) alcanzables++;
      }
    if (alcanzables < 3)
      problemas.push({ check: 'vuelo', detalle: `${id} (${x}, ${z}): sólo ${alcanzables} aproximaciones libres a ${ALTURA_VUELO_LIBRE} m` });
  }
  return problemas;
}

function vistaTapa(world) {
  const problemas = [];
  for (const v of VISTAS) {
    const ve = world.lineOfSight(v.desde[0], v.desde[1], v.hasta[0], v.hasta[1]);
    if (ve !== v.visible)
      problemas.push({ check: 'vista', detalle: `«${v.nombre}»: ${ve ? 'se ve' : 'no se ve'} y debería ${v.visible ? 'verse' : 'no verse'}` });
  }
  return problemas;
}

// Devuelve { problemas, revisados }. `problemas` vacío = el pueblo cumple lo prometido.
export function verificarPueblo({ world, encuentros = [] }) {
  const problemas = [
    ...recorridoTransitable(world),
    ...sueloContinuo(world),
    ...alturasPrometidas(world),
    ...aguaYOrilla(world),
    ...vistaTapa(world),
    ...encuentrosAlcanzables(world, encuentros),
    ...vueloLibre(world),
  ];
  return {
    problemas,
    revisados: {
      aristas: EDGES.length,
      alturas: ALTURAS.length,
      puntosDeAgua: AGUA.length,
      vistas: VISTAS.length,
      encuentros: encuentros.length,
      lugaresVolables: Object.keys(LOCATIONS).length,
    },
  };
}
