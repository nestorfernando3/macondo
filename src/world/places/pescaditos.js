// =============================================================================
// El taller de los pescaditos de oro · pieza original de la instalación.
//
// El coronel hace veinticinco pescaditos de oro, los cuenta en una bandeja y los funde
// para volver a empezar: hacer para deshacer, el tiempo que da vueltas sobre sí mismo
// (capítulos 6, 9 y 13 de la novela). Aquí no se cuenta nada —ni un rótulo, ni una
// interacción—: se deja el oficio a la vista para que el integrador le cuelgue la
// estación. Lo que tiene que leerse de cerca son las herramientas de verdad, a la
// escala del juego (la mariposa mide 0,22 m de radio y mira desde 2–3 m): una mesa de
// tablones, el banco del platero, un fuelle con su fragua, el crisol, el tanque de
// templar, la lupa, las tenazas, el martillo, la lámpara de aceite y las virutas.
//
// Contrato (congelado en internal/PLAN-RECURSOS-NOVELA.md §7):
//   crearTallerPescaditos(ctx) → { grupo, colisiones, actualizar?(t) }
//   · ctx es el mismo de las demás piezas de places/*: { scene, kit, world, camera }.
//   · `grupo` ya viene colocado en el mundo (ver TALLER_PESCADITOS): el integrador hace
//     scene.add(r.grupo) y nada más para verlo.
//   · `colisiones` son DATOS en coordenadas de mundo, listos para el mundo caminable:
//       { caja:[x1,z1,x2,z2], alto }   → world.addBox(...)
//       { circulo:[x,z,r], alto }      → world.addCircle(...)
//     `alto` es una Y ABSOLUTA (el remate de la pieza, no una altura sobre el suelo):
//     la mesa y el banco se pasan por encima; el tanque y el fuelle son muros
//     (alto = Infinity), como pide la pieza.
//   · `actualizar(t)` SÓLO existe si no hay prefers-reduced-motion: mueve la llama de la
//     lámpara y el brillo del metal. En reducido se devuelve en pose fija.
//
// Presupuesto medido: 1 827 triángulos; los veinticinco pescaditos van instanciados con
// una sola geometría (un único InstancedMesh de un solo pescadito). No se modifica kit.js:
// se reutilizan sus geometrías (caja, cil, cono, mota, tiesto y circulo) y sus materiales
// de paleta (madera, maderaClara, hierro, piedra, piedraHonda, tierraHonda, coral y agua);
// sólo se crean tres cosas que el kit no tiene: el pescadito, el aro fino de la lupa y los
// materiales de metal, vidrio y luz (oro, latón, oro fundido, vidrio, brasa y llama).
//
// El taller vive en el rincón oeste del patio de la casa, contra el muro y lejos del
// paso puerta→patio del grafo (el nodo «patio» está en (0, −15,5); el taller ocupa
// x ≤ −1,9): el paso queda libre para el recorrido guiado.
// =============================================================================
import * as THREE from 'three';
import { secuencia } from '../kit.js';

// Sitio del taller en el mundo. Fuente única de las coordenadas: el integrador apunta
// aquí el ancla del encuentro `pescaditos` (src/data/encounters.js) en vez de repetirlas.
// `y` es la rasante del patio (las losas de la casa suben ~9 cm sobre el suelo del pueblo).
export const TALLER_PESCADITOS = { x: -2.45, y: .09, z: -15.5, ry: 0 };

const PECES = 25;                    // los veinticinco del ciclo
const TAU = Math.PI * 2;
const RADIO_TANQUE = .24;            // el remate de la tina de templar

// ---------- Geometrías locales (sólo las que el kit no tiene) ----------
const cacheGeo = new Map();

// Pescadito de oro, acostado en el origen y con la nariz hacia +x: cuerpo de bipirámide
// sobre un rombo y cola de aleta. Once triángulos. Es la ÚNICA geometría de los
// veinticinco; por eso el material va a dos caras (la cola, plana, se mira desde arriba).
function geoPescadito() {
  if (cacheGeo.has('pez')) return cacheGeo.get('pez');
  const L = .046, W = .012, T = .0075;           // largo, media anchura, media altura
  const nariz = [L * .5, 0, 0];
  const costadoA = [0, 0, W];
  const base = [-L * .2, 0, 0];
  const costadoB = [0, 0, -W];
  const lomo = [-L * .06, T, 0];
  const quilla = [-L * .06, -T, 0];
  const aletaA = [-L * .52, 0, W * 1.5];
  const aletaB = [-L * .52, 0, -W * 1.5];
  const caras = [
    [nariz, costadoA, lomo], [costadoA, base, lomo], [base, costadoB, lomo], [costadoB, nariz, lomo],
    [nariz, costadoB, quilla], [costadoB, base, quilla], [base, costadoA, quilla], [costadoA, nariz, quilla],
    [costadoA, aletaA, base], [base, aletaB, costadoB], [base, aletaA, aletaB],   // cola abierta
  ];
  const posiciones = [];
  for (const [a, b, c] of caras) posiciones.push(...a, ...b, ...c);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geo.computeVertexNormals();
  cacheGeo.set('pez', geo);
  return geo;
}

// Aro fino de pocos lados para la lupa y los cinchos del tanque: el toro del kit mide
// 336 triángulos (seis caras por el tubo y veintiocho por la vuelta) y por una lente de
// tres centímetros no se paga. Cuatro caras por el tubo bastan a la escala del juego.
function geoAro(segs = 10, lados = 4) {
  const clave = `aro|${segs}|${lados}`;
  if (!cacheGeo.has(clave)) cacheGeo.set(clave, new THREE.TorusGeometry(.5, .055, lados, segs));
  return cacheGeo.get(clave);
}

// Materiales con carácter propio (el resto sale de la paleta del kit vía kit.m).
function materialesPropios() {
  return {
    // El oro de los pescaditos y de las limaduras: metal, con una brasa tenue de emisión
    // propia que es lo que hace de «brillo del metal» en la animación. A dos caras.
    oro: new THREE.MeshStandardMaterial({
      color: 0xf1c04a, metalness: .95, roughness: .28,
      emissive: 0x6a4a11, emissiveIntensity: .22, side: THREE.DoubleSide,
    }),
    // Latón de la bandeja: menos fino que el oro, más mate.
    laton: new THREE.MeshStandardMaterial({
      color: 0xc7a24e, metalness: .8, roughness: .42,
      emissive: 0x4a3610, emissiveIntensity: .16, side: THREE.DoubleSide,
    }),
    // Oro fundido en el crisol: emisión alta, porque está a punto de volver a empezar.
    oroFundido: new THREE.MeshStandardMaterial({
      color: 0xffce5c, metalness: .6, roughness: .22,
      emissive: 0xffa41f, emissiveIntensity: 1.15, side: THREE.DoubleSide,
    }),
    // Vidrio de la lupa: casi transparente y a dos caras, para verlo desde donde se mire.
    vidrioLupa: new THREE.MeshStandardMaterial({
      color: 0xbcd6d8, metalness: .1, roughness: .08,
      transparent: true, opacity: .38, depthWrite: false, side: THREE.DoubleSide,
    }),
    // Brasas de la fragua.
    brasa: new THREE.MeshStandardMaterial({ color: 0xd85a2a, roughness: .95, emissive: 0xff6a22, emissiveIntensity: 1 }),
    // Llama de la lámpara de aceite y su núcleo.
    llama: new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: .4, emissive: 0xffb347, emissiveIntensity: 1.35, side: THREE.DoubleSide }),
    nucleo: new THREE.MeshStandardMaterial({ color: 0xfff3d0, roughness: .3, emissive: 0xfff0c0, emissiveIntensity: 1.7 }),
  };
}

export function crearTallerPescaditos(ctx) {
  const kit = ctx.kit;
  // La preferencia se lee al construir (no al importar) para que las pruebas que simulan
  // matchMedia antes de construir la vean, igual que hacen los invariantes del pueblo.
  const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const propios = materialesPropios();
  const matDe = (nombre) => propios[nombre] ?? kit.m(nombre);

  const grupo = new THREE.Group();
  grupo.name = 'taller-pescaditos';
  grupo.position.set(TALLER_PESCADITOS.x, TALLER_PESCADITOS.y, TALLER_PESCADITOS.z);
  grupo.rotation.y = TALLER_PESCADITOS.ry;

  // ---------- Utilidades de colocación ----------
  // Mismo orden de Euler que kit.lote (rx, ry, rz con el default 'XYZ'), pero escribiendo
  // en el grupo de la pieza en vez de en la escena: la pieza es dueña de su grupo.
  const poner = (geo, nombre, x, y, z, o = {}) => {
    const malla = new THREE.Mesh(typeof geo === 'string' ? kit.geo[geo] : geo, matDe(nombre));
    const e = typeof o.esc === 'number' ? [o.esc, o.esc, o.esc] : (o.esc ?? [1, 1, 1]);
    malla.scale.set(e[0], e[1], e[2]);
    malla.position.set(x, y, z);
    malla.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    malla.castShadow = !!o.sombra;
    malla.receiveShadow = !!o.recibe;
    grupo.add(malla);
    return malla;
  };
  const caja = (nombre, w, h, d, x, y, z, o = {}) =>
    poner('caja', nombre, x, y, z, { ...o, esc: [w, h, d] });
  const cil = (nombre, r, h, x, y, z, o = {}) =>
    poner('cil', nombre, x, y, z, { ...o, esc: [r * 2, h, r * 2] });
  // Aro fino tumbado (el agujero mira al cielo): la vuelta del toro va en y.
  const aro = (nombre, r, x, y, z, o = {}) =>
    poner(geoAro(o.segs ?? 10, o.lados ?? 4), nombre, x, y, z, { ...o, rx: Math.PI / 2, esc: r * 2 });

  // =========================================================================
  // LA MESA DE TABLONES — el tablero donde se arma cada pescadito.
  // Cinco tablones sobre dos pares de patas y su travesaño: de cerca se cuentan uno a uno.
  // =========================================================================
  const MESA = { x: -.30, z: .15, alto: .86 };           // centro en planta y rasante del tablero
  for (let i = 0; i < 5; i++) {                          // tablones, con junta a la vista
    const px = MESA.x + (i - 2) * .112;
    caja('madera', .106, .055, 1.55, px, MESA.alto, MESA.z, { sombra: true });
  }
  for (const lx of [-.22, .22]) {                        // patas, en las cuatro esquinas
    for (const lz of [-.73, .73]) {
      caja('madera', .08, .83, .08, MESA.x + lx, .415, MESA.z + lz, { sombra: true });
    }
  }
  for (const lz of [-.73, .73])                          // travesaños cortos
    caja('maderaClara', .5, .05, .05, MESA.x, .2, MESA.z + lz, { rx: .02, sombra: false });
  caja('maderaClara', .05, .05, 1.5, MESA.x, .2, MESA.z, { sombra: false });   // largo

  // =========================================================================
  // EL BANCO DEL PLATERO — donde se sienta el que hace los pescaditos.
  // Bajo, para pasar por encima: el asiento a 0,49 m.
  // =========================================================================
  const BANCO = { x: .36, z: .15, asiento: .49 };
  caja('maderaClara', .28, .06, .44, BANCO.x, BANCO.asiento - .03, BANCO.z, { sombra: true });
  for (const lx of [-.08, .08]) {
    for (const lz of [-.17, .17]) {
      caja('madera', .06, .43, .06, BANCO.x + lx, .215, BANCO.z + lz, { sombra: true });
    }
  }
  for (const lz of [-.17, .17])                          // travesaños
    caja('maderaClara', .2, .04, .05, BANCO.x, .15, BANCO.z + lz, { sombra: false });

  // =========================================================================
  // LA BANDEJA DE LATÓN Y LOS VEINTICINCO PESCADITOS DE ORO.
  // Llegan al veinticinco, se cuentan y se funden para volver a empezar. Van alineados
  // en cinco filas de cinco: es la cifra exacta de la novela puesta en el tablero.
  // =========================================================================
  const BANDEJA = { x: MESA.x, z: -.23, y: MESA.alto + .034 };   // fondo de la bandeja
  caja('laton', .26, .012, .17, BANDEJA.x, BANDEJA.y, BANDEJA.z, { sombra: false });
  for (const [dx, dz, w, d] of [[0, -.085, .26, .012], [0, .085, .26, .012], [-.13, 0, .012, .17], [.13, 0, .012, .17]])
    caja('laton', w, .03, d, BANDEJA.x + dx, BANDEJA.y + .015, BANDEJA.z + dz, { sombra: false });

  const peces = new THREE.InstancedMesh(geoPescadito(), matDe('oro'), PECES);
  peces.castShadow = false;
  peces.frustumCulled = false;
  const tmpPez = new THREE.Object3D();
  let nPez = 0;
  const yPez = BANDEJA.y + .006 + .0075;                 // el pez acostado sobre el fondo
  for (let fila = 0; fila < 5; fila++) {
    for (let col = 0; col < 5; col++) {
      tmpPez.position.set(BANDEJA.x + (col - 2) * .046, yPez, BANDEJA.z + (fila - 2) * .03);
      tmpPez.rotation.set(0, 0, 0);                      // alineados: el ciclo no se descuadra
      tmpPez.scale.set(1, 1, 1);
      tmpPez.updateMatrix();
      peces.setMatrixAt(nPez++, tmpPez.matrix);
    }
  }
  peces.instanceMatrix.needsUpdate = true;
  grupo.add(peces);

  // =========================================================================
  // LA FRAGUA Y EL FUELLE — el calor del oficio.
  // El fuelle es muro (no se pasa por encima); la fragua es un yunque bajo y se vuela.
  // =========================================================================
  const FRAGUA = { x: -.31, z: 1.35 };
  caja('piedraHonda', .5, .55, .42, FRAGUA.x, .275, FRAGUA.z, { sombra: true, recibe: true });
  caja('piedra', .54, .06, .46, FRAGUA.x, .58, FRAGUA.z, { sombra: true, recibe: true });
  caja('tierraHonda', .12, .18, .24, FRAGUA.x + .20, .4, FRAGUA.z, { sombra: false });   // boca del hogar
  const rnd = secuencia(20260923);
  for (let i = 0; i < 6; i++) {                          // brasas
    const a = rnd() * TAU, d = rnd() * .14;
    poner('mota', 'brasa', FRAGUA.x + Math.cos(a) * d, .585, FRAGUA.z + Math.sin(a) * d,
      { esc: .05 + rnd() * .03, ry: rnd() * TAU, sombra: false });
  }

  // El crisol, encima del hogar: un tiesto de barro con el oro fundido asomando.
  cil('hierro', .062, .11, FRAGUA.x, .64, FRAGUA.z, { sombra: false });
  cil('oroFundido', .052, .022, FRAGUA.x, .7, FRAGUA.z, { sombra: false });

  // El fuelle: dos tablas con el cuero plegado en medio, su manija y el caño que sopla
  // al hogar. Va junto a la fragua, hacia el muro.
  const FUELLE = { x: -.30, z: 1.72 };
  caja('madera', .26, .03, .5, FUELLE.x, .06, FUELLE.z, { sombra: true });
  caja('madera', .26, .03, .5, FUELLE.x, .2, FUELLE.z, { rx: .06, sombra: true });
  caja('tierraHonda', .22, .16, .44, FUELLE.x, .125, FUELLE.z, { sombra: false });   // cuero
  cil('maderaClara', .015, .2, FUELLE.x, .3, FUELLE.z, { sombra: false });           // manija
  cil('hierro', .02, .16, FUELLE.x, .1, FUELLE.z - .34, { rx: Math.PI / 2, sombra: false });  // caño

  // =========================================================================
  // EL TANQUE DE TEMPLAR — donde el oro caliente se enfría de golpe.
  // Muro: no se pasa por encima (alto = Infinity en las colisiones). Cinchos de hierro.
  // =========================================================================
  const TANQUE = { x: -.34, z: -1.05 };
  poner('tiesto', 'madera', TANQUE.x, .24, TANQUE.z, { esc: [.44, .48, .44], sombra: true, recibe: true });
  aro('hierro', .225, TANQUE.x, .36, TANQUE.z, { segs: 12 });
  aro('hierro', .225, TANQUE.x, .12, TANQUE.z, { segs: 12 });
  cil('agua', .185, .03, TANQUE.x, .44, TANQUE.z, { sombra: false });                // la superficie

  // =========================================================================
  // LAS HERRAMIENTAS DE MANO — lupa, tenazas y martillo, sobre el tablero.
  // Son las que dicen «platería» a un metro: hay que poder contarlas.
  // =========================================================================
  // Lupa acostada: lente de vidrio con su aro de hierro y el mango de madera.
  const LUPA = { x: -.13, z: .30 };
  poner('circulo', 'vidrioLupa', LUPA.x, MESA.alto + .033, LUPA.z, { rx: -Math.PI / 2, esc: .072, sombra: false });
  poner(geoAro(16, 5), 'hierro', LUPA.x, MESA.alto + .034, LUPA.z, { rx: -Math.PI / 2, esc: .078, sombra: false });
  cil('maderaClara', .011, .1, LUPA.x, MESA.alto + .033, LUPA.z + .09, { rx: Math.PI / 2, sombra: false });

  // Tenazas: dos brazos que se abren en la punta y se cruzan en el pasador.
  const TNZ = { x: -.05, z: -.55 };
  for (const lado of [-1, 1]) {
    caja('hierro', .012, .016, .22, TNZ.x + lado * .014, MESA.alto + .037, TNZ.z, { rz: lado * .05, sombra: false });
    caja('hierro', .01, .014, .05, TNZ.x + lado * .026, MESA.alto + .037, TNZ.z - .12, { rz: lado * .18, sombra: false });
  }
  cil('hierro', .014, .028, TNZ.x, MESA.alto + .037, TNZ.z + .11, { rz: Math.PI / 2, sombra: false });

  // Martillo: mango de madera y cabeza de hierro con su boca y su peña.
  const MRT = { x: -.5, z: -.15 };
  cil('maderaClara', .011, .22, MRT.x, MESA.alto + .036, MRT.z, { rx: Math.PI / 2, sombra: false });
  caja('hierro', .05, .03, .03, MRT.x, MESA.alto + .036, MRT.z + .12, { sombra: false });
  caja('hierro', .02, .022, .022, MRT.x, MESA.alto + .036, MRT.z + .15, { sombra: false });   // peña

  // =========================================================================
  // LA LÁMPARA DE ACEITE — la luz con que se trabaja de noche.
  // Su llama y el brillo del metal son lo único que se mueve (y no, con movimiento reducido).
  // =========================================================================
  const LAMP = { x: -.44, z: .78 };
  const base = MESA.alto + .028;                         // el pie se posa en el tablero
  cil('coral', .045, .02, LAMP.x, base, LAMP.z, { sombra: false });
  poner('tiesto', 'coral', LAMP.x, base + .04, LAMP.z, { esc: [.1, .08, .1], sombra: false });   // aceitera
  poner('cono', 'coral', LAMP.x + .06, base + .04, LAMP.z, { rz: -Math.PI / 2, esc: [.03, .06, .03], sombra: false });  // pico
  cil('tierraHonda', .006, .02, LAMP.x + .058, base + .048, LAMP.z, { rz: -Math.PI / 2, sombra: false });  // mechero
  const llama = poner('cono', 'llama', LAMP.x + .058, base + .085, LAMP.z, { esc: [.024, .05, .024], sombra: false });
  const nucleo = poner('mota', 'nucleo', LAMP.x + .058, base + .072, LAMP.z, { esc: .014, sombra: false });

  // =========================================================================
  // VIRUTAS Y LIMADURAS — la prueba del oficio: lo que sobra del trabajo de cada día.
  // Limaduras de oro sobre el tablero y el piso, y hebillas de la madera y el latón.
  // =========================================================================
  for (let i = 0; i < 12; i++) {
    const enMesa = i < 8;
    const x = MESA.x + (rnd() - .5) * (enMesa ? .5 : .7);
    const z = MESA.z + (rnd() - .5) * (enMesa ? 1.0 : 1.4);
    poner('mota', 'oro', x, enMesa ? MESA.alto + .033 : .012, z,
      { esc: .011 + rnd() * .008, ry: rnd() * TAU, sombra: false });
  }
  for (let i = 0; i < 7; i++) {
    const x = MESA.x + (rnd() - .5) * .9;
    const z = MESA.z + (rnd() - .5) * 1.7;
    caja(i % 3 ? 'maderaClara' : 'laton', .03 + rnd() * .03, .006, .008, x, .008, z,
      { ry: rnd() * TAU, rz: (rnd() - .5) * .6, sombra: false });
  }

  // =========================================================================
  // COLISIONES — datos de mundo. El remate (`alto`) es una Y absoluta.
  // Mesa y banco se pasan por encima; el tanque y el fuelle son muros; la fragua es
  // un yunque bajo y también se vuela.
  // =========================================================================
  const Y = TALLER_PESCADITOS.y;
  const colisiones = [
    { caja: [-3.05, -16.15, -2.45, -14.55], alto: MESA.alto + .055 + Y },   // la mesa
    { caja: [-2.23, -15.56, -1.95, -15.14], alto: BANCO.asiento + .03 + Y }, // el banco del platero
    { caja: [-3.04, -14.40, -2.48, -13.90], alto: .72 + Y },                 // la fragua (se vuela)
    { circulo: [TALLER_PESCADITOS.x + TANQUE.x, TALLER_PESCADITOS.z + TANQUE.z, RADIO_TANQUE], alto: Infinity },
    { caja: [-2.92, -14.08, -2.58, -13.52], alto: Infinity },                // el fuelle: muro
  ];

  const resultado = { grupo, colisiones };
  // Con movimiento reducido no se devuelve `actualizar`: la lámpara y el metal quedan
  // en su pose fija (llama plantada, emisión de reposo).
  if (!quieto) {
    resultado.actualizar = (t) => {
      // La llama respira y tiembla: la escala sube y baja en dos tiempos que no casan.
      const soplo = 1 + Math.sin(t * 8.5) * .12 + Math.sin(t * 19.3) * .05;
      llama.scale.set(.024 * soplo, .05 * (1 + Math.sin(t * 12.1) * .16), .024 * soplo);
      llama.material.emissiveIntensity = 1.15 + Math.sin(t * 9.7) * .35;
      nucleo.material.emissiveIntensity = 1.5 + Math.sin(t * 13.3) * .4;
      // El brillo del metal: una emisión lenta sobre el oro de los peces y el latón.
      propios.oro.emissiveIntensity = .18 + .14 * (.5 + .5 * Math.sin(t * 1.6));
      propios.laton.emissiveIntensity = .13 + .1 * (.5 + .5 * Math.sin(t * 1.6 + 1.1));
    };
    resultado.actualizar(0);
  }
  return resultado;
}
