import { buildSecondPackage } from './places/secondPackage.js';
import * as THREE from 'three';
import { ENCOUNTERS } from '../data/encounters.js';
import { WalkableWorld } from '../navigation/WalkableWorld.js';
import { crearKit, secuencia } from './kit.js';
import { verificarPueblo } from './invariantes.js';
import { buildCalles } from './places/calles.js';
import { buildPlaza } from './places/plaza.js';
import { buildCasa } from './places/casa.js';
import { buildJardin } from './places/jardin.js';
import { buildPuerto } from './places/puerto.js';
import { buildMirador } from './places/mirador.js';
import { crearVida } from './ambient.js';

// Composición del pueblo a escala humana (metros). Paleta Caribe del spec: estuco
// marfil/coral, carpintería turquesa, tejas terracota, vegetación profunda, flores rosa y
// mariposas amarillas.
//
// Layout verificado: calle principal x=0 (spawn z=30 → plaza z=0 → casa z=-11),
// calle este hacia el jardín (portería oeste en z=-11), calle oeste al muelle,
// camino sur a la rampa del mirador (meseta centrada en (17,23)).
// El vocabulario de piezas vive en kit.js y cada lugar en places/<id>.js.

// Resolución del mapa de sombra según el ancho de la ventana. Sin `innerWidth` (Node,
// donde corren las pruebas) se usa el valor de escritorio: el pueblo se construye igual.
export function tamanoSombra() {
  return typeof innerWidth === 'undefined' || innerWidth >= 700 ? 2048 : 1024;
}

export function createVillage(experience) {
  const { scene } = experience;
  const world = new WalkableWorld();
  const interactables = ENCOUNTERS.map(item => ({ ...item }));
  const kit = crearKit(scene, world);
  const ctx = { scene, kit, world, camera: experience.camera, renderer: experience.renderer ?? null };

  // ---------- Luz de tarde ----------
  scene.add(new THREE.HemisphereLight(0xffe6c0, 0x51707a, .9));
  const sol = new THREE.DirectionalLight(0xffe0b0, 2.6);
  sol.position.set(-30, 42, 18);
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(tamanoSombra());
  Object.assign(sol.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 5, far: 120 });
  scene.add(sol);

  // ---------- Suelo ----------
  const tierra = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), kit.m('tierra'));
  tierra.rotation.x = -Math.PI / 2; tierra.receiveShadow = true; scene.add(tierra);

  // ---------- Los seis lugares ----------
  buildCalles(ctx);
  buildPlaza(ctx);
  buildCasa(ctx);
  buildJardin(ctx);
  buildPuerto(ctx);
  buildMirador(ctx);
  casas(ctx);
  vegetacion(ctx);

  buildSecondPackage(ctx);
  kit.hornear();
  const vida = crearVida(ctx);

  // El pueblo se revisa a sí mismo al construirse: la lista de problemas viaja en el
  // resultado (vacía = cumple lo prometido) y la cruzan la prueba de Node y los guiones CDP.
  const invariantes = verificarPueblo({ world, encuentros: interactables });

  return {
    world, interactables, invariantes, camera: experience.camera,
    update(t) { kit.actualizar(t); vida.update(t); },
  };
}

// ---------- Casas del pueblo (fachadas variadas, mismas plantas que antes) ----------
function casas(ctx) {
  const { kit } = ctx;
  // La casa oeste se corrió 1,1 m al sur-oeste: su esquina rozaba el camino pW→n1 (la
  // prueba «el pueblo sigue siendo transitable» lo vigila).
  const fichas = [
    [8, -9, 0, { ancho: 5, fondo: 4.2, muro: 'estuco', chimenea: true, semilla: 1 }],
    [14, -10, 0, { ancho: 4.6, fondo: 4.2, muro: 'coral', chimenea: true, semilla: 2 }],
    [-7.6, -4.8, .12, { ancho: 4.6, fondo: 4, muro: 'coral', chimenea: true, semilla: 3 }],
    [-7.5, 9.5, -.1, { ancho: 4.2, fondo: 3.8, muro: 'estuco', cubierta: 'hip', chimenea: true, semilla: 4 }],
    [8.5, 6.5, .08, { ancho: 4.4, fondo: 4, muro: 'coral', plantas: 2, portal: true, semilla: 5 }],
    [-4, 18.5, Math.PI, { ancho: 5, fondo: 4.2, muro: 'estuco', chimenea: true, semilla: 6 }],
    [4.5, 19.5, Math.PI + .1, { ancho: 4.4, fondo: 4, muro: 'coral', portal: true, semilla: 7 }],
    [30, 0, -.2, { ancho: 4.6, fondo: 4.2, muro: 'estuco', plantas: 2, portal: true, semilla: 8 }],
    [-15, 12, .15, { ancho: 4.4, fondo: 4, muro: 'coral', cubierta: 'hip', chimenea: true, semilla: 9 }],
  ];
  for (const [x, z, ry, spec] of fichas) kit.casa(x, z, ry, spec);
}

// ---------- Vegetación ----------
function vegetacion(ctx) {
  const { kit, scene } = ctx;
  const rnd = secuencia(7);

  // Palmeras: la silueta que dice Caribe. Van lejos de toda ruta (prueba de transitabilidad).
  const palmeras = [
    [10.5, 8.6, 7.4, .05], [-11.5, 10.8, 6.2, .1], [19.5, 5.5, 5.6, .12], [27.5, -2.5, 7.8, .06],
    [32, 6, 6.4, .14], [-18.5, 2.5, 5.8, .09], [-2.5, -21.5, 7, .07], [-13, -19, 6.6, .12],
    [24, -19, 5.4, .1], [6, 13.5, 5.2, .16], [-9.5, -8.5, 6.8, .08], [16, -20, 5.6, .11],
    [3.6, 20.5, 5.4, .13], [-3.6, 15.5, 6.6, .1],
  ];
  palmeras.forEach(([x, z, alto, curvo], i) => kit.palmera(x, z, { alto, curvo, semilla: 11 + i }));

  // Bananos y arbustos: manchas de verde junto a las fachadas y los bordes.
  for (const [x, z, s] of [[4.5, -14, 21], [-4.2, -8.5, 22], [12.5, -13.5, 23], [18.5, -1, 24],
    [-19, 9, 25], [34, -6, 26], [22, -21, 27], [-6, 22, 28]]) {
    kit.banano(x, z, { alto: 2.2 + (s % 3) * .3, semilla: s });
  }
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 13 + rnd() * 21;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (x < -20 && z > -14 && z < 30) continue;                 // no sobre el río
    if (Math.abs(x) < 8 && z > -13 && z < 20) continue;          // ni en medio de la calle
    if (x > 7 && x < 27 && z > 12 && z < 34) continue;           // ni en la meseta del mirador
    kit.arbusto(x, z, { r: .6 + rnd() * .5, alto: .8 + rnd() * .5, semilla: 40 + i, mate: i % 4 ? 'hoja' : 'hojaSeca' });
  }

  // Árboles interiores con colisión (los mismos de antes: el circuito ya los esquiva).
  // Antes eran un poste recto con tres esferas encima, y a la altura de vuelo de la
  // mariposa el tronco parecía flotar. La copa de cinco lóbulos en dos verdes, las raíces
  // al pie y el tronco en dos tramos desfasados dan silueta de árbol de verdad sin mover
  // un milímetro el `colisionCirculo` pactado.
  for (const [tx, tz] of [[12, 5], [22, 4], [-14, 14], [-16, -6], [31, 8], [-22, 18], [9, 27], [-9, -9], [31, -18], [-13, -14], [6.5, -14]]) {
    const vuelco = (rnd() - .5) * .09;               // el tronco no sale perfecto a plomo
    kit.lote('cil6', 'tronco', tx, 1.25, tz, { rz: vuelco, esc: [.48, 2.5, .48] });
    kit.lote('cil6', 'tronco', tx + vuelco * 2.5, 2.85, tz, { rz: vuelco * 2, esc: [.34, 1.5, .34] });
    // Raíces: bultos de tronco medio hundidos en el suelo, repartidos al azar. Son lo que
    // ata el árbol al piso cuando la mariposa lo bordea.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + rnd() * .8;
      kit.lote('bruto', 'tronco', tx + Math.cos(a) * .36, .09, tz + Math.sin(a) * .36,
        { ry: -a, esc: [.92, .44, .52] });
    }
    // Copa: cinco lóbulos a distintas alturas, corrimientos y tamaños; los altos, más claros.
    const lobulos = [[0, 4.2, 0, 3.3], [-.85, 3.7, .5, 2.5], [.8, 3.8, -.55, 2.4], [.25, 4.9, .35, 2.2], [-.35, 3.4, -.8, 1.9]];
    for (let i = 0; i < lobulos.length; i++) {
      const [dx, dy, dz, d] = lobulos[i];
      kit.lote('esfera', i === 1 || i === 3 ? 'hojaClara' : 'hoja',
        tx + dx + (rnd() - .5) * .35, dy + (rnd() - .5) * .3, tz + dz + (rnd() - .5) * .35,
        { ry: rnd() * 6.28, esc: [d, d * .82, d] });
    }
    kit.colisionCirculo(tx, tz, .5);
  }

  // ---------- Vegetación perimetral (límite del mundo) ----------
  // Copas de veinte caras: están en la bruma, a 40 m del paseo, y así el bosque entero
  // cuesta una fracción de lo que costaban las esferas de ochenta.
  const troncoGeo = new THREE.CylinderGeometry(.16, .26, 2.6, 6);
  const copaGeo = new THREE.IcosahedronGeometry(1.3, 0);
  const N = 90;
  const troncos = new THREE.InstancedMesh(troncoGeo, kit.m('tronco'), N);
  const copas = new THREE.InstancedMesh(copaGeo, kit.m('hoja'), N);
  const copasAltas = new THREE.InstancedMesh(copaGeo, kit.m('hojaClara'), N);
  const dummy = new THREE.Object3D();
  let puestas = 0, semilla = 7;
  const r = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  while (puestas < N) {
    const a = r() * Math.PI * 2, radio = 41 + r() * 12;
    const x = Math.cos(a) * radio, z = Math.sin(a) * radio;
    if (x < -20 && z > -14 && z < 30) continue;                 // no sobre el río
    const s = .8 + r() * .8;
    const esbelta = .78 + r() * .55;               // los hay altos y estrechos, y anchos y bajos
    // Tronco ni a plomo ni mirando todos al mismo norte: dos grados de libertad que rompen
    // la cuadrícula sin costar un solo triángulo (el presupuesto del bosque no se toca).
    dummy.position.set(x, 1.3 * s, z);
    dummy.rotation.set((r() - .5) * .16, r() * 6.28, (r() - .5) * .16);
    dummy.scale.set(s, s * esbelta, s);
    dummy.updateMatrix(); troncos.setMatrixAt(puestas, dummy.matrix);
    // La copa se abre hacia un lado distinto en cada árbol. Antes las noventa colgaban del
    // mismo eje con la misma proporción: a 40 m se leían como el mismo sello repetido.
    const abre = r() * 6.28, desvio = s * (.4 + r() * .8);
    dummy.position.set(x + Math.cos(abre) * desvio, 3 * s * esbelta, z + Math.sin(abre) * desvio);
    dummy.rotation.set((r() - .5) * .5, r() * 6.28, (r() - .5) * .5);
    dummy.scale.set(s * (.85 + r() * .55), s * (.7 + r() * .5), s * (.85 + r() * .55));
    dummy.updateMatrix(); copas.setMatrixAt(puestas, dummy.matrix);
    // Remate claro: la punta, más pequeña y también desviada del eje del tronco.
    dummy.position.set(x + Math.cos(abre) * desvio * 1.5, 3.9 * s * esbelta, z + Math.sin(abre) * desvio * 1.5);
    dummy.rotation.set((r() - .5) * .5, r() * 6.28, (r() - .5) * .5);
    dummy.scale.setScalar(s * (.42 + r() * .3));
    dummy.updateMatrix(); copasAltas.setMatrixAt(puestas, dummy.matrix);
    puestas++;
  }
  troncos.castShadow = copas.castShadow = copasAltas.castShadow = true;
  scene.add(troncos, copas, copasAltas);

  // ---------- Prado de flores silvestres ----------
  // Antes eran 150 icosaedros rosas idénticos clavados a y=.18: sin tallo, sin hoja y de un
  // solo color, a un metro de la cámara se leían como piedras. Ahora cada mata lleva vara
  // curva, hoja y corola —la simple, que hay muchas— y el prado se reparte entre tres
  // colores. Entran por `mataFlor`, así que van a los mismos acumuladores instanciados y
  // salen del horno en una llamada de dibujo por par (geometría, material).
  // Las exclusiones son las de siempre: nunca al oeste del río, nunca sobre la meseta.
  const COLORES_PRADO = ['flor', 'florRoja', 'amarillo'];
  let n = 0, mancha = 0;
  while (n < 320) {
    // En manchas, no una a una: 150 matas repartidas sobre 68 × 68 m dan una flor cada 32 m²
    // y desde el aire el prado se veía vacío —las piedras rosas de antes se veían más porque
    // eran grandes y de alto contraste—. Agrupadas de 3 a 5 y de un solo color por mancha, el
    // mismo presupuesto rinde mucho más.
    const cx = (r() - .5) * 68, cz = (r() - .5) * 68;
    const radio = .45 + r() * .5;
    // Mismo destierro que antes, con el radio de la mancha como margen: ni una mata al oeste
    // del río ni sobre la meseta del mirador.
    if (cx - radio < -22) continue;
    if (cx > 6 && cx < 28 && cz > 11 && cz < 35) continue;
    const color = COLORES_PRADO[mancha++ % COLORES_PRADO.length];
    const cuantas = Math.min(3 + Math.round(r() * 2), 320 - n);
    for (let k = 0; k < cuantas; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radio;
      // La silvestre es la corola barata —cuatro pétalos, 32 triángulos— y va sin hoja: es
      // lo que permite pasar de 150 matas a 320 sin salirse del presupuesto del prado. El
      // ojo amarillo sí se queda: es lo que hace que la flor se lea como flor desde el aire.
      kit.mataFlor(kit, cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d, {
        alto: .16 + r() * .18,                   // mata rastrera de prado, no planta de maceta
        flores: 1,
        color,
        centro: 'amarillo',
        tamano: .12 + r() * .09,
        semilla: 300 + n * 13,
        hojas: 0,
        geometria: 'corolaSilvestre',
        cabeceo: .16 + r() * .22,                // la flor silvestre cabecea con el viento
      });
      n++;
    }
  }

  // Hierba: penachos bajos que entran por `briznas`/`mecer`, no por `lote`, para que el
  // viento del pueblo los meca junto a las palmeras y los bananos. Unas pocas docenas —el
  // prado es ancho y el detalle menudo no se cuenta—, con las mismas exclusiones.
  let h = 0;
  while (h < 36) {
    const gx = (r() - .5) * 68, gz = (r() - .5) * 68;
    if (gx < -22) continue;
    if (gx > 7 && gx < 27 && gz > 12 && gz < 34) continue;
    kit.briznas(kit, gx, gz, {
      n: 4 + Math.round(r() * 3), alto: .2 + r() * .2, radio: .16 + r() * .18,
      semilla: 500 + h * 5, mate: 'hojaClara', mateSeco: 'hojaSeca',
    });
    h++;
  }
}
