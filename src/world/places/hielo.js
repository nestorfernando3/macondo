// La carpa del hielo (capítulo 1) como pieza ORIGINAL de la instalación, no como decorado
// de libro: una carpa de feria improvisada junto a la plaza, con un cofre de pirata abierto
// sobre un banquete y, dentro, un témpano que brilla; toldo de lona rayada, cajas de madera
// apiladas y amarradas, un cartel rotulado a mano con palabras nuestras y una vasija de agua
// que suda. Los detalles que la sostienen de cerca: el hielo con caras lechosas, el borde
// húmedo que gotea, la escarcha, el charco que crece muy despacio.
//
// Convenciones (copiadas de src/world/places/secondPackage.js, plaza.js, casa.js): el `ctx`
// trae `{ scene, kit, world, camera, renderer }`; de `kit` se reutilizan geometrías
// (`kit.geo.*`), materiales y paleta (`kit.m(nombre)`, `kit.PALETA`) y `secuencia`; lo que no
// existe en el catálogo se construye aquí (el témpano, las rayas del toldo, la rotulación).
//
// Interfaz congelada (internal/PLAN-RECURSOS-NOVELA.md §7):
//   crearHielo(ctx) → { grupo, colisiones, actualizar?(t) }
//   · `grupo` es un THREE.Group ya añadido a `ctx.scene` (por si el integrador lo referencia
//     o lo retira); conserva su propia transformada.
//   · `colisiones` es una lista de cajas listas para `kit.colisionCaja(...)`, con la MISMA
//     forma que usan las demás piezas: [x1, z1, x2, z2, alto] en coordenadas de MUNDO, con
//     `alto` —la Y absoluta del remate—. No se registran aquí: las cablea el integrador, que
//     es quien conoce el mundo. El cofre y el banquete se pasan por encima (remate ~1,4 m) y
//     nada cerca la plaza.
//   · `actualizar(t)` mueve el goteo, el brillo del hielo, el sudor de la vasija y el charco.
//     Con `prefers-reduced-motion` todo queda estático (se fija una sola pose).
//
// La carpa vive al lado de la plaza y FUERA de todo camino del grafo NODES/EDGES
// (src/data/locations.js): ni bloquea una ruta ni cerca el lugar.
//
// Presupuesto: pieza barata (< 3 000 triángulos), sin sombras propias caras —sólo la silueta
// proyecta— y con instancing en lo repetido (rayas, tablones, letras, gotas).

import * as THREE from 'three';
import { secuencia } from '../kit.js';

// Junto a la plaza, al sureste, con el frente mirando a la fuente. Lejos del eje z=0 de los
// caminos plaza→pEste→este y de cualquier nodo, así que no toca el grafo.
const X = 10.6, Z = -3.6, RY = -1.15;

const TAU = Math.PI * 2;

// ---------- Rotulación a mano ----------
// Cada letra es un juego de trazos [x1, y1, x2, y2] sobre una retícula unidad (y hacia
// arriba). Es el mismo vocabulario del cartel de la entrada (kit.js), ampliado con las letras
// que pide esta frase; una letra desconocida cae en el tarugo «·». Los trazos se pintan como
// láminas planas —una mano que rotula pinta, no esculpe— y entran por instancing.
const TRAZOS = {
  E: [[0, 1, 1, 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, .5, .62, .5]],
  L: [[0, 1, 0, 0], [0, 0, 1, 0]],
  I: [[.5, 1, .5, 0]],
  N: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 1, 1, 0]],
  V: [[0, 1, .5, 0], [.5, 0, 1, 1]],
  T: [[0, 1, 1, 1], [.5, 1, .5, 0]],
  O: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0]],
  D: [[0, 0, 0, 1], [0, 1, .72, 1], [.72, 1, .72, 0], [.72, 0, 0, 0]],
  R: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, .55], [1, .55, 0, .55], [0, .55, .86, 0]],
  M: [[0, 0, 0, 1], [0, 1, .5, .42], [.5, .42, 1, 1], [1, 1, 1, 0]],
  U: [[0, 1, 0, .18], [0, .18, .5, 0], [.5, 0, 1, .18], [1, .18, 1, 1]],
  '·': [[0, 0, 0, 1], [1, 0, 1, 1], [0, .5, 1, .5]],
};

// Nuestras palabras para el cartel: nada de citas (regla de la casa), pero con el asombro del
// capítulo detrás. Dice lo que es: un invento de otro mundo.
const LETRERO = 'EL INVENTO DE OTRO MUNDO';

export function crearHielo(ctx) {
  const { kit, scene } = ctx;
  const { geo } = kit;

  // Con movimiento reducido, todo lo que late o gotea queda en una pose fija.
  const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = secuencia(101);

  // ---------- Grupo y materiales ----------
  const grupo = new THREE.Group();
  grupo.position.set(X, 0, Z);
  grupo.rotation.y = RY;

  // Materiales propios (además de la paleta del kit). La lona va a dos caras porque la
  // mariposa vuelve a mirar el toldo desde abajo y una lámina de una sola cara desaparece.
  const mats = {
    lonaClaro: new THREE.MeshStandardMaterial({ color: kit.PALETA.lona, roughness: .95, side: THREE.DoubleSide }),
    lonaRayada: new THREE.MeshStandardMaterial({ color: kit.PALETA.coral, roughness: .95, side: THREE.DoubleSide }),
    // Hielo lechoso: pálido, poco especular y con una emisión suave que lo hace brillar.
    hielo: new THREE.MeshStandardMaterial({
      color: 0xdceff4, emissive: 0x86cbdd, emissiveIntensity: .5, roughness: .3,
      metalness: .04, transparent: true, opacity: .93,
    }),
    escarcha: new THREE.MeshStandardMaterial({ color: 0xf3fbff, roughness: .95, transparent: true, opacity: .75 }),
    gota: new THREE.MeshStandardMaterial({ color: 0xd4f0f6, roughness: .12, metalness: .08, transparent: true, opacity: .85 }),
    letras: new THREE.MeshStandardMaterial({ color: 0x33261a, roughness: .85, side: THREE.DoubleSide }),
  };
  const mat = nombre => mats[nombre] ?? kit.m(nombre);

  // ---------- Utilidades locales ----------
  const dummy = new THREE.Object3D();
  function caja(m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, { sombra = true } = {}) {
    const mesh = new THREE.Mesh(geo.caja, mat(m));
    mesh.scale.set(w, h, d); mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = sombra; mesh.receiveShadow = true;
    grupo.add(mesh); return mesh;
  }
  function cil(m, r, h, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(opts.geo ?? geo.cil, mat(m));
    mesh.scale.set(r * 2, h, r * 2); mesh.position.set(x, y, z);
    mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
    mesh.castShadow = opts.sombra ?? true; mesh.receiveShadow = true;
    grupo.add(mesh); return mesh;
  }
  // Detalle repetido: se acumula en un InstancedMesh (una llamada de dibujo por familia).
  function instanciar(geometria, material, items, { sombra = false } = {}) {
    const mesh = new THREE.InstancedMesh(geometria, material, items.length);
    items.forEach((it, i) => {
      dummy.position.set(it.x ?? 0, it.y ?? 0, it.z ?? 0);
      dummy.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
      const e = it.esc ?? 1;
      if (typeof e === 'number') dummy.scale.setScalar(e); else dummy.scale.set(e[0], e[1], e[2]);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = sombra; mesh.receiveShadow = false;
    mesh.frustumCulled = false;          // instancias repartidas: la caja envolvente no sirve
    grupo.add(mesh); return mesh;
  }

  // Rotula un texto en un plano vertical que mira a +z local; devuelve los trazos para
  // `instanciar`. El paso se reparte para que el texto entre en la tabla, y cada letra lleva
  // un temblor menudo —de ahí lo «a mano»—.
  function rotular(texto, { x, y, z, anchoMax, pasoMax = .17, alto = .15, grueso = .026 }) {
    const letras = [...String(texto || '')].filter(ch => ch !== ' ');
    const n = Math.max(1, letras.length);
    const paso = Math.min(anchoMax / n, pasoMax), ancho = paso * .66;
    const items = [];
    letras.forEach((ch, i) => {
      const trazos = TRAZOS[ch.toUpperCase()] || TRAZOS['·'];
      const cx0 = x + (i - (n - 1) / 2) * paso + (rnd() - .5) * .012;
      const dy0 = (rnd() - .5) * .012, tilt = (rnd() - .5) * .05;
      for (const [ax, ay, bx, by] of trazos) {
        const mx = cx0 + (ax - .5) * ancho, my = y + dy0 + (ay - .5) * alto;
        const nx = cx0 + (bx - .5) * ancho, ny = y + dy0 + (by - .5) * alto;
        const dx = nx - mx, dy = ny - my;
        items.push({
          x: (mx + nx) / 2, y: (my + ny) / 2, z,
          rz: Math.atan2(dy, dx) + tilt,
          esc: [Math.hypot(dx, dy) + grueso, grueso, 1],
        });
      }
    });
    return items;
  }

  // ============================================================
  // 1. La carpa: postes, varas y toldo de lona rayada
  // ============================================================
  const ANCHO = 3.0, MEDIO = ANCHO / 2, EAVE = 1.15, EAVE_Y = 2.02, RIDGE_Y = 2.5;

  // Cuatro postes esquineros y las varas (cumbrera y dos aleros).
  instanciar(geo.caja, mat('madera'), [
    { x: -1.45, y: EAVE_Y / 2, z: EAVE, esc: [.09, EAVE_Y, .09] },
    { x: 1.45, y: EAVE_Y / 2, z: EAVE, esc: [.09, EAVE_Y, .09] },
    { x: -1.45, y: EAVE_Y / 2, z: -EAVE, esc: [.09, EAVE_Y, .09] },
    { x: 1.45, y: EAVE_Y / 2, z: -EAVE, esc: [.09, EAVE_Y, .09] },
  ], { sombra: true });
  instanciar(geo.caja, mat('maderaClara'), [
    { x: 0, y: RIDGE_Y, z: 0, esc: [ANCHO + .12, .07, .07] },
    { x: 0, y: EAVE_Y, z: EAVE, esc: [ANCHO + .12, .06, .06] },
    { x: 0, y: EAVE_Y, z: -EAVE, esc: [ANCHO + .12, .06, .06] },
  ], { sombra: true });

  // Toldo a dos aguas: dos faldones de rayas que caen del caballete a los aleros. Cada raya
  // es una lámina (2 triángulos) y se reparte entre los dos materiales alternos.
  const dySlope = EAVE_Y - RIDGE_Y, dzSlope = EAVE;
  const largoFaldon = Math.hypot(dySlope, dzSlope);
  const angFaldon = Math.atan2(dzSlope, -(dySlope));      // giro en x para acostar la lámina
  const rayasClaro = [], rayasOscuras = [];
  const N_RAYAS = 8, anchoRaya = ANCHO / N_RAYAS;
  for (const [dirZ, signo] of [[EAVE, 1], [-EAVE, -1]]) {
    for (let i = 0; i < N_RAYAS; i++) {
      const xc = -MEDIO + (i + .5) * anchoRaya;
      const raya = { x: xc, y: (RIDGE_Y + EAVE_Y) / 2, z: dirZ / 2, rx: signo * angFaldon, esc: [anchoRaya, largoFaldon, 1] };
      (i % 2 ? rayasOscuras : rayasClaro).push(raya);
    }
  }
  instanciar(geo.plancha, mats.lonaClaro, rayasClaro, { sombra: true });
  instanciar(geo.plancha, mats.lonaRayada, rayasOscuras, { sombra: true });

  // Banderines: la guirnalda de feria colgada del alero delantero.
  cil('tierraHonda', .008, ANCHO, 0, EAVE_Y - .06, EAVE + .02, { rz: Math.PI / 2, sombra: false });
  const banderines = [];
  for (let i = 0; i < 7; i++) {
    const x = -1.05 + i * .35;
    banderines.push({ x, y: EAVE_Y - .19, z: EAVE + .02, rz: (i % 2 ? 1 : -1) * .12, esc: [.11, .18, 1] });
  }
  instanciar(geo.plancha, mats.lonaRayada, banderines);

  // Vientos: dos cabos del poste delantero a una estaca en el suelo.
  instanciar(geo.caja, mat('tierraHonda'), [
    { x: -1.85, y: EAVE_Y / 2 + .15, z: EAVE + .3, rz: .5, esc: [.02, EAVE_Y + .5, .02] },
    { x: 1.85, y: EAVE_Y / 2 + .15, z: EAVE + .3, rz: -.5, esc: [.02, EAVE_Y + .5, .02] },
  ]);

  // ============================================================
  // 2. El banquete: la mesa debajo del toldo
  // ============================================================
  const TABLERO = .81;
  // Patas y tablero. La mesa larga corre a lo ancho de la carpa.
  caja('madera', 2.2, .06, .85, 0, TABLERO, 0);
  instanciar(geo.caja, mat('madera'), [
    { x: -1.0, y: TABLERO / 2, z: -.34, esc: [.08, TABLERO, .08] },
    { x: 1.0, y: TABLERO / 2, z: -.34, esc: [.08, TABLERO, .08] },
    { x: -1.0, y: TABLERO / 2, z: .34, esc: [.08, TABLERO, .08] },
    { x: 1.0, y: TABLERO / 2, z: .34, esc: [.08, TABLERO, .08] },
    // Travesaños bajos entre las patas.
    { x: 0, y: .22, z: -.34, esc: [2.0, .05, .05] },
    { x: 0, y: .22, z: .34, esc: [2.0, .05, .05] },
  ], { sombra: true });
  // Mantel de lona: tabla cubierta y dos paños que caen por el frente y el fondo.
  caja('lonaClaro', 2.26, .03, .9, 0, TABLERO + .045, 0, 0, 0, 0, { sombra: false });
  instanciar(geo.plancha, mats.lonaClaro, [
    { x: 0, y: TABLERO - .22, z: .46, esc: [2.18, .46, 1] },
    { x: 0, y: TABLERO - .22, z: -.46, esc: [2.18, .46, 1] },
  ]);
  // Un par de platos y fruta: el banquete se lee a un metro.
  instanciar(geo.cil6, mat('blanco'), [
    { x: -.65, y: TABLERO + .07, z: .18, esc: [.3, .04, .3] },
    { x: .5, y: TABLERO + .07, z: -.16, esc: [.26, .04, .26] },
    { x: -.75, y: TABLERO + .07, z: -.22, esc: [.22, .04, .22] },
  ]);
  instanciar(geo.mota, mat('florRoja'), [
    { x: -.65, y: TABLERO + .12, z: .18, esc: .09 },
    { x: -.6, y: TABLERO + .12, z: .26, esc: .08 },
    { x: .5, y: TABLERO + .12, z: -.16, esc: .1 },
  ]);
  instanciar(geo.mota, mat('amarillo'), [
    { x: .52, y: TABLERO + .12, z: -.09, esc: .08 },
    { x: -.78, y: TABLERO + .12, z: -.22, esc: .08 },
  ]);

  // ============================================================
  // 3. El cofre de pirata abierto, con el témpano dentro
  // ============================================================
  const CF = .28;                       // centro del cofre en el tablero
  // Casco hueco: fondo y cuatro paredes, para poder ver el hielo de dentro.
  caja('madera', .72, .04, .5, 0, TABLERO + .04, CF);
  caja('madera', .72, .34, .05, 0, TABLERO + .21, CF + .225);
  caja('madera', .72, .34, .05, 0, TABLERO + .21, CF - .225);
  caja('madera', .05, .34, .5, .335, TABLERO + .21, CF);
  caja('madera', .05, .34, .5, -.335, TABLERO + .21, CF);
  // Flejes de hierro, cerradura y bisagras.
  caja('hierro', .75, .05, .53, 0, TABLERO + .1, CF, 0, 0, 0, { sombra: false });
  caja('hierro', .75, .05, .53, 0, TABLERO + .32, CF, 0, 0, 0, { sombra: false });
  caja('hierro', .1, .13, .03, 0, TABLERO + .24, CF + .25, 0, 0, 0, { sombra: false });
  instanciar(geo.caja, mat('hierro'), [
    { x: -.3, y: TABLERO + .37, z: CF - .22, esc: [.07, .06, .06] },
    { x: .3, y: TABLERO + .37, z: CF - .22, esc: [.07, .06, .06] },
  ]);
  // Tapa abierta, inclinada hacia atrás sobre las bisagras.
  caja('madera', .74, .5, .08, 0, TABLERO + .5, CF - .3, -.34);
  caja('hierro', .74, .05, .1, 0, TABLERO + .72, CF - .36, -.34, 0, 0, { sombra: false });

  // ---------- El témpano ----------
  // Bloque de caras lechosas con la superficie picada: una caja segmentada con los vértices
  // de arriba revueltos lee como hielo partido y no como un ladrillo.
  const geoHielo = new THREE.BoxGeometry(.5, .4, .34, 2, 2, 2);
  const hp = geoHielo.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    if (hp.getY(i) > .08) {
      hp.setY(i, hp.getY(i) + (rnd() - .5) * .07);
      hp.setX(i, hp.getX(i) + (rnd() - .5) * .06);
      hp.setZ(i, hp.getZ(i) + (rnd() - .5) * .06);
    }
  }
  hp.needsUpdate = true; geoHielo.computeVertexNormals();
  const hielo = new THREE.Mesh(geoHielo, mats.hielo);
  hielo.position.set(0, TABLERO + .24, CF);
  hielo.castShadow = true; hielo.receiveShadow = true;
  grupo.add(hielo);
  // Esquirlas apoyadas en la punta y un par de témpanos menores al pie.
  instanciar(geo.bruto, mats.hielo, [
    { x: .14, y: TABLERO + .44, z: CF + .06, esc: [.16, .14, .14], rx: .3, ry: .7 },
    { x: -.13, y: TABLERO + .43, z: CF - .05, esc: [.13, .16, .12], ry: 1.4 },
    { x: .02, y: TABLERO + .45, z: CF - .1, esc: [.11, .1, .12], rx: .6 },
  ]);
  // Borde húmedo: el deshielo se asienta en un aro de agua en el filo del cofre.
  const geoAro = new THREE.RingGeometry(.29, .34, 14).rotateX(-Math.PI / 2);
  const aroHumedo = new THREE.Mesh(geoAro, mat('agua'));
  aroHumedo.position.set(0, TABLERO + .4, CF); aroHumedo.receiveShadow = true;
  grupo.add(aroHumedo);
  // Escarcha: motas de hielo prendidas a las caras y derramadas por la tabla.
  const escarcha = [];
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, r = .1 + rnd() * .28;
    escarcha.push({
      x: Math.cos(a) * r, y: TABLERO + .12 + rnd() * .34, z: CF + Math.sin(a) * r * .7,
      esc: .02 + rnd() * .03,
    });
  }
  instanciar(geo.mota, mats.escarcha, escarcha);

  // ============================================================
  // 4. Las cajas de madera apiladas y amarradas
  // ============================================================
  const CAJA_X = -1.95, C = .55, media = C / 2;
  const cajas = [
    { x: CAJA_X, y: media, z: -.1 },
    { x: CAJA_X, y: media, z: .62 },
    { x: CAJA_X + .04, y: media + C, z: .24 },      // la tercera, encima de las dos
  ];
  instanciar(geo.caja, mat('madera'), cajas.map(c => ({ x: c.x, y: c.y, z: c.z, esc: [C, C, C] })), { sombra: true });
  // Tablones de refuerzo: dos listones por cara visible y los cantos de las aristas.
  const tablones = [];
  for (const c of cajas) {
    for (const dz of [-media + .08, media - .08]) {
      tablones.push({ x: c.x, y: c.y, z: c.z + dz, esc: [C + .02, C - .06, .04] });
      tablones.push({ x: c.x + dz, y: c.y, z: c.z, esc: [.04, C - .06, C + .02] });
    }
  }
  instanciar(geo.caja, mat('maderaClara'), tablones);
  // La cuerda que amarra la pila: dos cinchos y un nudo.
  instanciar(geo.caja, mat('tierraHonda'), [
    { x: CAJA_X, y: media + .18, z: .26, ry: .05, esc: [C + .14, .04, C + .8] },
    { x: CAJA_X, y: media * .5, z: .26, ry: .05, esc: [C + .14, .04, C + .8] },
    { x: CAJA_X + .28, y: media + .05, z: .52, esc: [.09, .09, .09] },
    { x: CAJA_X + .28, y: media - .05, z: .52, rz: .8, esc: [.02, .22, .02] },
  ]);

  // ============================================================
  // 5. La vasija con agua que suda
  // ============================================================
  const VAS_X = 1.95, VAS_Z = .35;
  cil('coral', .22, .5, VAS_X, .25, VAS_Z, { geo: geo.tiesto });
  cil('coralHondo', .2, .06, VAS_X, .52, VAS_Z);
  cil('agua', .18, .04, VAS_X, .5, VAS_Z, { sombra: false });
  // El sudor: gotas que resbalan por la panza de la vasija (estáticas con movimiento reducido).
  const sudor = [];
  for (let i = 0; i < 8; i++) {
    const a = rnd() * TAU;
    sudor.push({ a, r: .175, y0: .46, y1: .12, fase: rnd(), esc: .022 + rnd() * .012 });
  }
  const mallaSudor = instanciar(geo.mota, mats.gota, sudor.map(g => ({
    x: VAS_X + Math.cos(g.a) * g.r, y: g.y0, z: VAS_Z + Math.sin(g.a) * g.r, esc: g.esc,
  })));

  // ============================================================
  // 6. El goteo y el charco
  // ============================================================
  // Gotas que caen del filo del cofre al tablero y del tablero al suelo.
  const gotas = [
    { x: -.08, z: CF + .24, y0: TABLERO + .38, y1: TABLERO + .06, fase: 0, rate: .35, r: .026 },
    { x: .1, z: CF + .24, y0: TABLERO + .38, y1: TABLERO + .06, fase: .5, rate: .3, r: .022 },
    { x: .0, z: CF + .26, y0: TABLERO + .2, y1: TABLERO + .04, fase: .8, rate: .42, r: .026 },
    { x: .25, z: .5, y0: TABLERO - .02, y1: .05, fase: .2, rate: .26, r: .028 },
    { x: .1, z: .52, y0: TABLERO - .06, y1: .05, fase: .65, rate: .22, r: .024 },
    { x: .35, z: .48, y0: TABLERO - .04, y1: .05, fase: .9, rate: .3, r: .022 },
  ];
  const mallaGotas = instanciar(geo.mota, mats.gota, gotas.map(g => ({ x: g.x, y: g.y0, z: g.z, esc: g.r })));

  // Charco que crece muy despacio bajo el frente de la mesa.
  const geoCharco = new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2);
  const charco = new THREE.Mesh(geoCharco, mat('agua'));
  charco.position.set(CAJA_X + .1, .015, VAS_Z - .1);
  charco.receiveShadow = true;
  grupo.add(charco);
  const CHARCO_MIN = .12, CHARCO_MAX = .56, CHARCO_VEL = .008;

  // ============================================================
  // 7. El cartel rotulado a mano
  // ============================================================
  const CART_X = .4, CART_Z = 1.75;
  instanciar(geo.caja, mat('madera'), [
    { x: CART_X - .85, y: .8, z: CART_Z, esc: [.07, 1.6, .07] },
    { x: CART_X + .85, y: .8, z: CART_Z, esc: [.07, 1.6, .07] },
  ], { sombra: true });
  caja('maderaClara', 2.0, .5, .05, CART_X, 1.5, CART_Z, 0, 0, 0, { sombra: true });
  caja('madera', 2.08, .56, .03, CART_X, 1.5, CART_Z - .01, 0, 0, 0, { sombra: false });   // bastidor
  instanciar(geo.plancha, mats.letras,
    rotular(LETRERO, { x: CART_X, y: 1.5, z: CART_Z + .035, anchoMax: 1.8 }));

  // ============================================================
  // 8. Luz del hielo, goteo y pose (actualizar)
  // ============================================================
  // Una luz puntual sin sombra devuelve el brillo frío que la tarde caribeña no da.
  const luzHielo = new THREE.PointLight(0xbfe7f2, 1.3, 5.5, 2);
  luzHielo.position.set(0, TABLERO + .5, CF);
  grupo.add(luzHielo);

  function posarGotas(t) {
    gotas.forEach((g, i) => {
      const c = ((t * g.rate + g.fase) % 1 + 1) % 1;
      dummy.position.set(g.x + Math.sin(c * TAU) * .012, g.y0 + (g.y1 - g.y0) * c, g.z);
      dummy.rotation.set(0, c * TAU, 0);
      dummy.scale.setScalar(g.r);
      dummy.updateMatrix(); mallaGotas.setMatrixAt(i, dummy.matrix);
    });
    mallaGotas.instanceMatrix.needsUpdate = true;
  }
  function posarSudor(t) {
    sudor.forEach((g, i) => {
      const c = ((t * .12 + g.fase) % 1 + 1) % 1;
      const y = g.y0 + (g.y1 - g.y0) * c;
      dummy.position.set(VAS_X + Math.cos(g.a) * g.r, y, VAS_Z + Math.sin(g.a) * g.r);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(g.esc * (1 - c * .35));
      dummy.updateMatrix(); mallaSudor.setMatrixAt(i, dummy.matrix);
    });
    mallaSudor.instanceMatrix.needsUpdate = true;
  }

  function pose(t) {
    // El hielo respira: la emisión y la luz laten juntas.
    const latido = Math.sin(t * .9);
    mats.hielo.emissiveIntensity = .5 + .16 * latido;
    luzHielo.intensity = 1.3 + .3 * latido;
    posarGotas(t);
    posarSudor(t);
    const s = Math.min(CHARCO_MAX, CHARCO_MIN + t * CHARCO_VEL);
    charco.scale.set(s, 1, s * .8);
  }
  pose(0);                                  // pose inicial, por si nadie llama a `actualizar`

  let posado = false;
  function actualizar(t) {
    if (quieto) {                           // movimiento reducido: una sola pose, y quieto
      if (!posado) { pose(0); posado = true; }
      return;
    }
    pose(t);
  }

  // ---------- Colisiones (cajas de mundo, con remate) ----------
  // La misma forma que usan las demás piezas: [x1, z1, x2, z2, alto]. Se pasan al integrador;
  // aquí no se registran. Ninguna cerca la plaza ni pisa una ruta del grafo.
  const c = Math.cos(RY), s = Math.sin(RY);
  function cajaMundo(lx0, lz0, lx1, lz1, alto) {
    const esq = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]]
      .map(([lx, lz]) => [X + lx * c + lz * s, Z - lx * s + lz * c]);
    const xs = esq.map(p => p[0]), zs = esq.map(p => p[1]);
    return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), alto];
  }
  const colisiones = [
    // El banquete y el cofre: se pasa volando por encima (remate a la altura del hielo).
    cajaMundo(-1.15, -.5, 1.15, .55, TABLERO + .6),
    // La pila de cajas, la vasija y el cartel.
    cajaMundo(CAJA_X - media, -.4, CAJA_X + media, .9, media * 2 + C + .05),
    cajaMundo(VAS_X - .26, VAS_Z - .26, VAS_X + .26, VAS_Z + .26, .58),
    cajaMundo(CART_X - 1.0, CART_Z - .12, CART_X + 1.0, CART_Z + .12, 1.78),
    // Los cuatro postes del toldo (finos; a 2,1 m la mariposa pasa por encima).
    cajaMundo(-1.5, EAVE - .06, -1.4, EAVE + .06, EAVE_Y),
    cajaMundo(1.4, EAVE - .06, 1.5, EAVE + .06, EAVE_Y),
    cajaMundo(-1.5, -EAVE - .06, -1.4, -EAVE + .06, EAVE_Y),
    cajaMundo(1.4, -EAVE - .06, 1.5, -EAVE + .06, EAVE_Y),
  ];

  scene.add(grupo);

  return { grupo, colisiones, actualizar };
}
