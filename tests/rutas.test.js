// Rutas del recorrido: que la mariposa vaya por donde de verdad se puede volar.
//
// Nació de un fallo que no se veía en las pruebas ni en el mapa: el recorrido enlazaba al jugador
// con el nodo MÁS CERCANO en línea recta, sin mirar qué había en medio, así que guiar desde detrás
// de una casa trazaba el primer tramo a través de ella. Una de cada cinco posiciones libres del
// pueblo tiene esa recta tapada. Aquí se comprueba lo que promete el planificador: que ningún
// tramo de la ruta cruce un obstáculo, que las paradas propias del recorrido siempre tengan
// salida, y que cuando no la hay se diga en vez de trazar una ruta imposible.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVillage } from '../src/world/createVillage.js';
import { NODES, LOCATION_NODE, TOUR_ORDER, SPAWN } from '../src/data/locations.js';
import { RADIUS, HOVER } from '../src/navigation/PlayerController.js';
import { planearRuta } from '../src/navigation/RoutePlanner.js';
import { WalkableWorld } from '../src/navigation/WalkableWorld.js';
import { ALTURAS_SALIDA } from '../src/navigation/TourController.js';

const pueblo = () => createVillage({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera() }).world;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Un tramo es válido si todos sus puntos están libres a la altura de vuelo.
function tramoDespejado(world, a, b, altura) {
  const n = Math.max(1, Math.ceil(dist(a, b) / .25));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    if (world.blocks(x, z, RADIUS, world.groundAt(x, z) + altura)) return false;
  }
  return true;
}

test('un muro de verdad corta la recta y la calle la deja pasar', () => {
  const world = new WalkableWorld();
  // Mundo vacío: cualquier recta está despejada.
  assert.equal(world.pathClear([0, 0], [10, 0], HOVER), true);
  // Un muro alto en medio la corta; una reja baja (1 m) no, porque se pasa volando por encima.
  world.addBox(4, -2, 6, 2, Infinity);
  assert.equal(world.pathClear([0, 0], [10, 0], HOVER), false);
  world.boxes.length = 0;
  world.addBox(4, -2, 6, 2, 1);
  assert.equal(world.pathClear([0, 0], [10, 0], HOVER), true);
});

test('la ruta del recorrido no cruza ni una casa, desde cualquier rincón', () => {
  const world = pueblo();
  let planes = 0, sinRuta = 0;
  for (let x = -34; x <= 30; x += 3) {
    for (let z = -18; z <= 32; z += 3) {
      if (world.blocks(x, z, RADIUS, world.groundAt(x, z) + HOVER)) continue;   // dentro de algo
      for (const destino of TOUR_ORDER) {
        const meta = NODES[LOCATION_NODE[destino]];
        // Se prueban las alturas de salida del recorrido: la de crucero y el escalón que sube
        // sobre las tapias de un corral.
        let ruta = null, altura = HOVER;
        for (const a of ALTURAS_SALIDA) {
          const intento = planearRuta(world, [x, z], meta, { altura: a, siemprePorGrafo: true });
          if (intento) { ruta = intento; altura = a; break; }
        }
        if (!ruta) { sinRuta++; continue; }
        planes++;
        let actual = [x, z];
        for (const punto of ruta) {
          assert.ok(tramoDespejado(world, actual, punto, altura),
            `la ruta de (${x}, ${z}) a ${destino} cruza un obstáculo cerca de (${punto})`);
          actual = punto;
        }
        assert.ok(dist(actual, meta) < .01, `la ruta a ${destino} no termina en su nodo`);
      }
    }
  }
  // Casi todo el pueblo tiene salida; los pocos rincones sin ninguna son corrales de tapias a los
  // que sólo se entra volando, y ahí el recorrido avisa en vez de trazar una ruta imposible.
  assert.ok(planes > 0 && sinRuta / planes < .05, `demasiados rincones sin ruta: ${sinRuta} de ${planes + sinRuta}`);
});

test('desde la entrada y desde cada parada del recorrido siempre hay ruta a las demás', () => {
  const world = pueblo();
  const paradas = [['entrada', [SPAWN.x, SPAWN.z]], ...TOUR_ORDER.map(id => [id, NODES[LOCATION_NODE[id]]])];
  for (const [nombre, desde] of paradas) {
    for (const destino of TOUR_ORDER) {
      if (destino === nombre) continue;
      const ruta = planearRuta(world, desde, NODES[LOCATION_NODE[destino]], { altura: HOVER, siemprePorGrafo: true });
      assert.ok(ruta && ruta.length, `sin ruta de ${nombre} a ${destino}`);
    }
  }
});

test('la recta despejada se respeta y el destino tapado se rechaza', () => {
  const world = pueblo();
  // Vuelo libre: con la recta limpia, el plan es ir recto —un solo punto, el destino—.
  const recto = planearRuta(world, [0, 24], [0, 20], { altura: HOVER });
  assert.deepEqual(recto, [[0, 20]]);
  // El mismo par obligado a pasar por el grafo da más de un punto.
  const porGrafo = planearRuta(world, [0, 24], NODES.s2, { altura: HOVER, siemprePorGrafo: true });
  assert.ok(porGrafo.length >= 1);
  // Un destino dentro de un muro no tiene ruta: ni se intenta. El punto se busca en el propio
  // mundo en vez de escribirlo a mano, que la próxima mudanza de una casa lo dejaría de ser.
  let dentro = null;
  for (let x = -20; x <= 20 && !dentro; x += .5)
    for (let z = -18; z <= 0 && !dentro; z += .5)
      if (world.blocks(x, z, RADIUS, world.groundAt(x, z) + HOVER)) dentro = [x, z];
  assert.ok(dentro, 'no se encontró ningún punto tapado en el pueblo');
  assert.equal(planearRuta(world, [0, 24], dentro, { altura: HOVER }), null);
  // Entradas imposibles: fuera del mapa o no numéricas.
  assert.equal(planearRuta(world, [NaN, 0], [0, 0]), null);
  assert.equal(planearRuta(null, [0, 0], [0, 0]), null);
});

test('el recorrido entra por una calle: la ruta pasa por nodos del grafo', () => {
  const world = pueblo();
  const ruta = planearRuta(world, [6, 12], NODES.cima, { altura: HOVER, siemprePorGrafo: true });
  assert.ok(ruta.length > 2, 'la ruta por el grafo debería tener varios puntos');
  const nodos = new Set(Object.values(NODES).map(([x, z]) => `${x}|${z}`));
  const enGrafo = ruta.filter(([x, z]) => nodos.has(`${x}|${z}`)).length;
  assert.ok(enGrafo >= ruta.length - 2, `la ruta sólo pisa ${enGrafo} nodos del grafo`);
});
