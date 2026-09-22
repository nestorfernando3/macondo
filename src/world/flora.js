// Vocabulario floral del pueblo: pétalos, corolas, matas con tallo, macizos y briznas.
//
// Antes una flor era un icosaedro de veinte caras con escala de 20 cm: de cerca se leía
// como una piedra de color, y los pétalos que caen del árbol del tiempo eran conos de seis
// caras. Aquí viven las geometrías de verdad —pétalo acucharado con garra, corola radial,
// domo del centro, brizna de hierba— y los constructores que las reparten.
//
// Presupuesto: todo entra por `lote()` (una llamada de dibujo por par geometría/material) y
// nada proyecta sombra. La corola de detalle cuesta 60 triángulos, la simple 40 y una mata
// con tallo y flor unos 80: el jardín entero cabe en unas pocas llamadas.
//
// Dos convenciones que hay que respetar al colocar una pieza:
//   · La corola vive centrada en el origen y abre hacia +y (una flor plana mira al cielo).
//   · El domo del centro comparte ese mismo sistema local, así que se coloca con el MISMO
//     `lote` y la misma escala: nunca se desalinea, ni siquiera con la flor inclinada.
import * as THREE from 'three';
import { secuencia } from './azar.js';

const TAU = Math.PI * 2;
const cache = new Map();

// ---------- Utilidades de geometría ----------

// Une geometrías en una sola malla, sin depender de three/examples: lo que se repite en el
// pueblo tiene que viajar en una sola llamada de dibujo. Es público porque los efectos de
// historia y la capa de vida componen sus propias siluetas y necesitan exactamente esto.
export function fusionarGeometrias(geometrias) {
  const partes = geometrias.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of partes) total += g.attributes.position.count;
  const posicion = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let p3 = 0, p2 = 0;
  for (const g of partes) {
    posicion.set(g.attributes.position.array, p3);
    normal.set(g.attributes.normal.array, p3);
    uv.set(g.attributes.uv.array, p2);
    p3 += g.attributes.position.count * 3;
    p2 += g.attributes.position.count * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posicion, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

// Copia con las caras al revés (mismos vértices, normales opuestas). Es lo que hace que un
// pétalo se vea por las dos caras sin pagar un material `DoubleSide` por color: la mariposa
// vuela por encima, pero también de lado, y una flor de una sola cara desaparece.
function carasAlReves(geo) {
  const copia = geo.clone();
  for (const nombre of ['position', 'normal', 'uv']) {
    const at = copia.attributes[nombre];
    if (!at) continue;
    for (let i = 0; i < at.count; i += 3) {
      for (let k = 0; k < at.itemSize; k++) {
        const a = (i + 1) * at.itemSize + k, b = (i + 2) * at.itemSize + k;
        const guardado = at.array[a];
        at.array[a] = at.array[b];
        at.array[b] = guardado;
      }
    }
    at.needsUpdate = true;
  }
  copia.computeVertexNormals();
  return copia;
}

function deDosCaras(geo) { return fusionarGeometrias([geo, carasAlReves(geo)]); }

// ---------- Geometrías ----------

// Pétalo unidad: la raíz en el origen, crece hacia +z, el ancho en x, la cara hacia ±y.
// `garra` cierra la base (los pétalos se juntan en el centro sin dejar hueco), `copa`
// levanta los bordes y `curva` dobla la punta: sin esas dos, de cerca el pétalo es un
// polígono plano y la flor vuelve a leerse como una mancha de color.
export function geoPetalo({
  largo = 1, ancho = .54, garra = .2, copa = .34, curva = .3, giro = .16,
  segAncho = 1, segLargo = 3, doble = true, centrado = false,
} = {}) {
  const clave = `petalo|${largo}|${ancho}|${garra}|${copa}|${curva}|${giro}|${segAncho}|${segLargo}|${doble}|${centrado}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;

  const geo = new THREE.PlaneGeometry(ancho, largo, segAncho, segLargo);
  geo.rotateX(-Math.PI / 2);                 // al piso: el ancho en x, el largo en z
  geo.rotateY(Math.PI);                      // el largo pasa a +z
  geo.translate(0, 0, largo / 2);            // la raíz en el origen
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (ancho / 2);     // -1 … 1 a lo ancho
    const t = pos.getZ(i) / largo;           // 0 en la raíz, 1 en la punta
    const perfil = Math.max(garra, Math.sqrt(Math.sin(Math.PI * Math.pow(t, .78))));
    pos.setX(i, (u * perfil + giro * u * t) * (ancho / 2));
    pos.setY(i, curva * t * t + copa * u * u * (.3 + .7 * t));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  if (centrado) geo.translate(0, 0, -largo / 2);
  // `doble` decide si la cara de abajo existe. Un pétalo suelto la necesita (cae girando y
  // se mira desde cualquier lado); dentro de una corola NO, porque `geoCorola` voltea el
  // conjunto una sola vez al final. Ignorar la bandera aquí costaba el doble: la corola
  // salía de 120 triángulos creyendo que medía 60, y el prado entero pagaba 150 veces.
  const bruto = fusionarGeometrias([geo]);
  const final = doble ? deDosCaras(bruto) : bruto;
  cache.set(clave, final);
  return final;
}

// Corola: `petalos` pétalos en rueda alrededor del origen. `inclina` los levanta en cuenco
// (0 = flor plana, 1,2 = campana) y el pétalo impar se desfasa para romper la simetría de
// reloj. El centro geométrico queda en el origen: ahí se posa el domo.
//
// El primer intento salió cerrado —inclina .46 más la copa del propio pétalo— y de lejos se
// leía como un capullo. La flor abierta pide lo contrario: pétalos anchos, casi acostados y
// traslapados (el ancho pasa de lo que mide el arco que les toca), que es lo que hace la
// plumeria caribeña.
export function geoCorola({
  petalos = 5, largo = .5, ancho = .46, inclina = .32, copa = .2, curva = .16, giro = .2,
  desfase = 0, segAncho = 1, segLargo = 3, doble = true,
} = {}) {
  const clave = `corola|${petalos}|${largo}|${ancho}|${inclina}|${copa}|${curva}|${giro}|${desfase}|${segAncho}|${segLargo}|${doble}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;

  const partes = [];
  for (let i = 0; i < petalos; i++) {
    const p = geoPetalo({ largo, ancho, copa, curva, giro, segAncho, segLargo, doble: false })
      .clone().rotateX(-inclina).rotateY(desfase + (i / petalos) * TAU + (i % 2 ? .14 : -.14));
    partes.push(p);
  }
  const final = deDosCaras(fusionarGeometrias(partes));
  cache.set(clave, final);
  return final;
}

// Domo del centro de la flor: un casquete bajo, del tamaño de la corola con la que se
// combina (radio .17 sobre pétalos de .5: el centro amarillo de una plumeria es un tercio
// del ancho de la flor). Se hunde un poco en el centro para que no flote.
export function geoDomoFlor({ radio = .17, alto = .13, lados = 6 } = {}) {
  const clave = `domo|${radio}|${alto}|${lados}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;
  const geo = new THREE.ConeGeometry(radio, alto, lados, 1, true);
  geo.translate(0, alto * .3, 0);
  geo.computeVertexNormals();
  const final = deDosCaras(fusionarGeometrias([geo]));
  cache.set(clave, final);
  return final;
}

// Cuánto se dobla la brizna unidad hacia +z en la punta. `mataFlor` lo necesita para posar
// la cabeza justo donde termina la vara, así que el número vive aquí una sola vez.
export const CURVA_BRIZNA = .22;

// Brizna: hoja de hierba estrecha que crece hacia +y desde la raíz, se afila y se dobla.
// Sirve de tallo (una vara curva lee mejor que un cilindro recto), de hoja y de cañaveral.
export function geoBrizna({ alto = 1, ancho = .085, curva = CURVA_BRIZNA, segLargo = 3, doble = true } = {}) {
  const clave = `brizna|${alto}|${ancho}|${curva}|${segLargo}|${doble}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;
  const geo = new THREE.PlaneGeometry(ancho, alto, 1, segLargo);
  geo.translate(0, alto / 2, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / alto;                       // 0 base … 1 punta
    pos.setX(i, pos.getX(i) * (1 - .82 * t));           // se afila hacia la punta
    pos.setZ(i, curva * t * t * alto);                  // y se dobla
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const final = doble ? deDosCaras(fusionarGeometrias([geo])) : fusionarGeometrias([geo]);
  cache.set(clave, final);
  return final;
}

// Las siete geometrías que el kit reparte por el pueblo. Dos corolas para el mismo dibujo y
// dos presupuestos distintos: la del prado se ve a diez metros y de a cientos, así que lleva
// cuatro pétalos y 32 triángulos; la de maceta y bancal se mira a un metro y lleva 60.
export function crearGeometriasFlor() {
  return {
    petalo: geoPetalo({ largo: 1, ancho: .5, segLargo: 3, centrado: false }),
    corola: geoCorola({ petalos: 5, largo: .5, ancho: .48, inclina: .3, segLargo: 3 }),
    corolaSimple: geoCorola({ petalos: 5, largo: .5, ancho: .5, inclina: .32, segLargo: 2 }),
    corolaPlena: geoCorola({ petalos: 8, largo: .44, ancho: .34, inclina: .34, desfase: .2, segLargo: 2 }),
    corolaSilvestre: geoCorola({ petalos: 4, largo: .5, ancho: .56, inclina: .26, desfase: .4, segLargo: 2 }),
    domoFlor: geoDomoFlor(),
    brizna: geoBrizna(),
  };
}

// ---------- Constructores ----------
// Todos emiten por `lote()` y no proyectan sombra: la sombra es de la silueta, no del detalle.

// Una flor suelta, ya orientada: `tamano` es el diámetro en metros.
export function flor(kit, x, y, z, {
  color = 'flor', centro = 'amarillo', tamano = .2, ry = 0, rx = 0, rz = 0,
  geometria = 'corola',
} = {}) {
  const opciones = { rx, ry, rz, esc: tamano, sombra: false };
  kit.lote(geometria, color, x, y, z, opciones);
  if (centro) kit.lote('domoFlor', centro, x, y, z, opciones);
}

// Mata con tallo: la planta entera. Cada flor nace de su propia vara —doblada por el viento,
// con la cabeza posada exactamente donde termina la vara— y debajo lleva una hoja. Es la
// unidad que repiten macetas, jardineras, bancales y el prado.
//
// Proporción: la vara es delgada (3 cm de ancho) y la hoja pequeña, porque la primera
// versión salió con hojas de 20 cm que se comían las flores. La flor manda.
const euler = new THREE.Euler(), punta = new THREE.Vector3();
export function mataFlor(kit, x, y, z, {
  alto = .5, flores = 2, color = 'flor', centro = 'amarillo', tamano = .2,
  semilla = 1, tallo = 'hojaClara', hojas = 1, geometria = 'corola', cabeceo = 0,
} = {}) {
  const rnd = secuencia(semilla);
  for (let i = 0; i < Math.max(1, flores); i++) {
    const a = rnd() * TAU, d = rnd() * .13;
    const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    const altoVara = alto * (.6 + rnd() * .4);
    const giro = a + (rnd() - .5) * .7;
    const vuelco = (rnd() - .5) * .5;                    // la vara no sale perfecta
    euler.set(0, giro, vuelco);                          // mismo orden de Euler que `lote`
    // La punta real de la vara: altoVara arriba y lo que la brizna se dobla, ya girado.
    punta.set(0, altoVara, CURVA_BRIZNA * altoVara).applyEuler(euler);
    kit.lote('brizna', tallo, px, y, pz, { ry: giro, rz: vuelco, esc: [.36, altoVara, altoVara], sombra: false });
    flor(kit, px + punta.x, y + punta.y, pz + punta.z, {
      color, centro, tamano: tamano * (.85 + rnd() * .3),
      ry: giro + i * 1.1, rx: -cabeceo * (.5 + rnd() * .5), geometria,
    });
    for (let h = 0; h < hojas; h++) {                    // hoja al pie, abierta hacia fuera
      // Ojo con la escala: `esc` multiplica la geometría unidad, que mide 1 m de largo, así
      // que la hoja se pide en metros (13-18 cm), no en centímetros. Pedirla en centímetros
      // puso hojas de doce metros sobre el pueblo.
      const hoja = (.13 + rnd() * .05) * (tamano / .2);
      kit.lote('petalo', tallo, px, y + altoVara * .16, pz, {
        ry: rnd() * TAU, rx: -(.15 + rnd() * .35), esc: [hoja, 1, hoja], sombra: false,
      });
    }
  }
}

// Macizo floral: un arriate o una jardinera llena de matas, dos colores alternados y las
// flores a alturas distintas. Las coordenadas se reparten en el sistema local del macizo.
export function macizoFloral(kit, x, z, {
  ancho = 2, fondo = 1, ry = 0, n = 8, alto = .42, semilla = 1, y = 0,
  colores = ['flor', 'florRoja'], centro = 'amarillo', tamano = .19, geometria = 'corolaSimple',
} = {}) {
  const rnd = secuencia(semilla);
  const L = kit.local(x, z, ry);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? .5 : i / (n - 1);
    const [px, pz] = L((t - .5) * ancho, (rnd() - .5) * fondo);
    mataFlor(kit, px, y, pz, {
      alto: alto * (.78 + rnd() * .5),
      flores: 1 + Math.round(rnd()),
      color: colores[i % colores.length],
      centro, tamano: tamano * (.85 + rnd() * .3), geometria,
      semilla: semilla * 31 + i * 7,
    });
  }
}

// Penacho de hierba: briznas que se mecen. Entra por `mecer` —no por `lote`— para que el
// viento del pueblo lo mueva junto con las palmeras y los bananos.
export function briznas(kit, x, z, {
  n = 7, alto = .42, radio = .3, semilla = 1, mate = 'hojaClara', y = 0, mateSeco = null,
} = {}) {
  const rnd = secuencia(semilla);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * .5, d = rnd() * radio;
    const escala = alto * (.6 + rnd() * .7);
    kit.mecer('brizna', i % 3 === 2 && mateSeco ? mateSeco : mate, {
      x: x + Math.cos(a) * d, y, z: z + Math.sin(a) * d,
      ry: a + (rnd() - .5) * .9, rz: -(.1 + rnd() * .55), rx: (rnd() - .5) * .2,
      esc: [.8 + rnd() * .5, escala, escala],
      fase: rnd() * TAU, amp: .07 + rnd() * .09,
    });
  }
}
