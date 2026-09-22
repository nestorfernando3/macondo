// Vocabulario de piezas del pueblo: materiales, geometrías compartidas, acumulador de
// instancias y constructores con nombre (casa, palmera, farol…). Los lugares de
// places/*.js solo describen QUÉ va dónde; aquí vive CÓMO se construye.
//
// Regla de oro del presupuesto: el detalle repetido entra por `lote()` y sale horneado en
// un InstancedMesh por par (geometría, material); lo que no se repite se suelta suelto.
// La silueta proyecta sombra; el detalle no.
import * as THREE from 'three';
import { secuencia } from './azar.js';
import { crearGeometriasFlor, flor, mataFlor, macizoFloral, briznas, CURVA_BRIZNA } from './flora.js';

const TAU = Math.PI * 2;

// `secuencia` se reexporta: media docena de módulos la piden a kit.js y su sitio natural es
// azar.js (flora.js también la usa y así no hay ciclo entre los dos vocabularios).
export { secuencia };

// Paleta Caribe del spec: estuco marfil/coral, carpintería turquesa, tejas terracota,
// vegetación profunda, flores rosa y mariposas amarillas.
export const PALETA = {
  estuco: 0xf3e7cd, estucoClaro: 0xfaf2df, coral: 0xe8a087, coralHondo: 0xcf7c5f,
  turquesa: 0x1d6a6a, turquesaClaro: 0x2f8f8b, madera: 0x8a5a3b, maderaClara: 0xb08356,
  teja: 0xc4643f, tejaHonda: 0xa04a2b, tierra: 0xb99a6d, tierraHonda: 0x9a7b50,
  piedra: 0xcfc3ab, piedraHonda: 0xaea289, hoja: 0x2e6b3f, hojaClara: 0x4d8b57,
  hojaSeca: 0x83914a, palma: 0x3d7a44, tronco: 0x8f7a5e, agua: 0x3f9fa8,
  flor: 0xe88fb4, florRoja: 0xd4574a, amarillo: 0xf5c542, blanco: 0xfbf6ea,
  banco: 0x6e8f7c, hierro: 0x3d4a49, vidrio: 0x33545c, lona: 0xf0e3c8, arena: 0xd9c49a,
};

// Sombra sólo para la silueta. El detalle repetido (marcos, tablones, postes, rejas) no
// proyecta: cada lote instanciado se dibujaría entero otra vez en el mapa de sombras y no
// se nota en pantalla. El spec lo pide así: «evitar sombras en cada objeto».
const CON_SOMBRA = new Set(['estuco', 'estucoClaro', 'coral', 'teja', 'tejaHonda', 'hoja', 'hojaClara', 'tronco', 'palma']);

// ---------- Geometrías de perfil propio (se cachean por medidas) ----------
const cacheGeo = new Map();

// Teja acanalada: losa con la cara superior en dientes de sierra. Las canales corren por
// la pendiente (eje z) y se reparten a lo ancho (eje x): desde arriba el techo se lee
// tejido y desde abajo el borde queda limpio.
export function geoTeja(largo, grosor, ancho, amp = .05) {
  const clave = `teja|${largo}|${grosor}|${ancho}|${amp}`;
  if (cacheGeo.has(clave)) return cacheGeo.get(clave);
  const dientes = Math.max(3, Math.round(largo / .42));
  const geo = new THREE.BoxGeometry(largo, grosor, ancho, dientes, 1, 1);
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    if (nor.getY(i) < .5) continue;                       // solo la cara de arriba
    const x = pos.getX(i), u = (x / largo + .5) * dientes;
    pos.setY(i, pos.getY(i) + amp * Math.abs(2 * (u - Math.floor(u)) - 1));
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  cacheGeo.set(clave, geo);
  return geo;
}

// Frontón triangular de un techo a dos aguas (prisma de 5 caras, sin ExtrudeGeometry).
export function geoTriangulo(base, alto, grosor) {
  const clave = `tri|${base}|${alto}|${grosor}`;
  if (cacheGeo.has(clave)) return cacheGeo.get(clave);
  const b = base / 2, h = grosor / 2;
  const v = [[-b, 0, h], [b, 0, h], [0, alto, h], [-b, 0, -h], [b, 0, -h], [0, alto, -h]];
  const caras = [[0, 1, 2], [5, 4, 3], [0, 4, 1], [0, 3, 4], [1, 4, 5], [1, 5, 2], [2, 5, 3], [2, 3, 0]];
  const posiciones = [], normales = [];
  const a = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
  for (const [i, j, k] of caras) {
    a.copy(pb.fromArray(v[j])).sub(pa.fromArray(v[i]));
    c.copy(pc.fromArray(v[k])).sub(pa);
    n.crossVectors(a, c).normalize().toArray();
    for (const idx of [i, j, k]) { posiciones.push(...v[idx]); normales.push(...n); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));
  cacheGeo.set(clave, geo);
  return geo;
}

// Hoja de palmera (o de banano): lámina alargada que cae hacia la punta y se dobla en V
// sobre la nervadura — sin el pliegue, la hoja se ve de canto y la corona desaparece.
// Nace mirando a +x, mide 1 m y se escala por instancia.
export function geoHoja(caida = .34, pliegue = .07) {
  const clave = `hoja|${caida}|${pliegue}`;
  if (cacheGeo.has(clave)) return cacheGeo.get(clave);
  const geo = new THREE.PlaneGeometry(1, .26, 6, 2);
  geo.rotateX(-Math.PI / 2);                    // al piso: largo en x, ancho en z
  geo.translate(.5, 0, 0);                      // la raíz en el origen
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, -caida * x * x + pliegue * (Math.abs(z) / .13) * (1 - .5 * x));
    pos.setZ(i, z * (1 - .45 * x));             // se afila hacia la punta
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  cacheGeo.set(clave, geo);
  return geo;
}

// Fronda de palmera: raquis arqueado con pares de folíolos a los lados, en lugar de la lámina
// entera de `geoHoja`. La diferencia no es de detalle sino de lectura. Una lámina de 26 cm de
// ancho sobre 2,4 m de largo —lo que había— se ve de canto desde media docena de ángulos, y
// desde abajo la cara de arriba mira al cielo: la corona se leía como un alambre. Una fronda
// pinnada tiene silueta desde donde se mire y, a contraluz, recorta el borde dentado que dice
// «palmera» a cincuenta metros.
//
// Nace en el origen mirando a +x y mide 1 m: se escala por instancia. Sobre el raquis —una
// cinta en tienda de campaña, porque el de una palmera va acanalado— se insertan los folíolos
// como agujas: base estrecha, punta afilada y un hueco entre uno y el siguiente. Ese hueco es
// lo que deja pasar la luz y separa un plumero de una hoja de plátano: con los folíolos
// pegados —la primera versión de esta pieza— la fronda se leía como una lámina maciza con el
// borde rizado.
export function geoHojaPalma({
  largo = 1, foliolo = .3, caida = .26, pares = 15, t0 = .1, avance = .5, holgura = .3,
} = {}) {
  const clave = `fronda|${largo}|${foliolo}|${caida}|${pares}|${t0}|${avance}|${holgura}`;
  if (cacheGeo.has(clave)) return cacheGeo.get(clave);

  // El raquis: nace a plomo y cae cada vez más hacia la punta.
  const raquis = (t, z = 0) => new THREE.Vector3(largo * t, -caida * largo * t * t, z);
  const enRaquis = t => t0 + (1 - t0) * t / pares;            // t del raquis para el folíolo t
  // Perfil del folíolo a lo largo del raquis: corto al pie, el más largo al primer tercio y
  // nulo en la punta — así la fronda acaba en punta y no en cepillo.
  const perfil = t => Math.pow(Math.sin(Math.PI * (.13 + .87 * t)), .7);
  // Salida del folíolo: al lado, adelantado, levantado en V al pie y caído hacia la punta.
  const salida = (t, lado) => {
    const l = foliolo * perfil(t);
    return new THREE.Vector3(l * avance, l * (.55 - t), l * lado);
  };

  const posiciones = [];
  const tri = (a, b, c) => posiciones.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  const cinta = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };

  // El raquis va de punta a punta en tienda de campaña: sostiene los folíolos, se lee de canto y
  // tapa la inserción por donde no llega ninguno. Cuatro tramos bastan —la curva de un metro de
  // raquis se aparta dos centímetros de la cuerda— y son ocho triángulos menos por fronda.
  const w = .026;
  for (let i = 0; i < 4; i++) {
    const a = raquis(i / 4), b = raquis((i + 1) / 4);
    const al = a.clone().setZ(-w).setY(a.y + w), bl = b.clone().setZ(-w).setY(b.y + w);
    const ar = a.clone().setZ(w).setY(a.y + w), br = b.clone().setZ(w).setY(b.y + w);
    cinta(a, b, bl, al);
    cinta(a, ar, br, b);
  }

  // Folíolos: dos agujas por inserción, una a cada lado. La base no toma todo el hueco entre
  // inserción e inserción —de ahí `holgura`—, y la punta se afila en un solo vértice.
  for (const lado of [-1, 1]) {
    for (let i = 0; i < pares; i++) {
      const t = (i + .5) / pares, tm = t0 + (1 - t0) * t;
      const a = raquis(enRaquis(i)), b = raquis(enRaquis(i + 1));
      const base = a.clone().lerp(b, holgura), fin = b.clone().lerp(a, holgura);
      tri(base, fin, a.clone().lerp(b, .5).add(salida(tm, lado)));
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geo.computeVertexNormals();
  cacheGeo.set(clave, geo);
  return geo;
}

export function geometriaCache() { return cacheGeo; }

// ---------- Kit ----------
export function crearKit(scene, world) {
  const mat = {};
  const geo = {
    caja: new THREE.BoxGeometry(1, 1, 1),
    cil: new THREE.CylinderGeometry(.5, .5, 1, 10),
    cil6: new THREE.CylinderGeometry(.5, .5, 1, 6),
    // Tronco de palmera: tubo abierto de ocho caras, ahusado (la boca de arriba es más ancha que
    // la de abajo) y sin las tapas que van dentro del tramo siguiente —costaban la mitad de la
    // pieza y los tramos finos del tronco anillado se pagan con ese ahorro—. El ahusado y un
    // tramo de vuelta (`rx: π`) por medio son el zigzag del tronco de cocotero: cada junta casa
    // radio con radio, así que la silueta es una sola línea continua que se estrecha y se ensancha
    // en vez de la escalera de tubos apilados.
    tronco8: new THREE.CylinderGeometry(.52, .48, 1, 8, 1, true),
    cono: new THREE.ConeGeometry(.5, 1, 6),
    esfera: new THREE.SphereGeometry(.5, 8, 6),
    // Baratas para el detalle menudo: humo y polvo no necesitan 80 caras.
    mata: new THREE.SphereGeometry(.5, 6, 4),
    bruto: new THREE.IcosahedronGeometry(.5, 0),
    humo: new THREE.SphereGeometry(.5, 6, 4),
    mota: new THREE.OctahedronGeometry(.5, 0),
    plancha: new THREE.PlaneGeometry(1, 1),
    // Carátula del reloj: el círculo y su aro ya viven en el plano x-y y el círculo mira a +z,
    // así que se piden con sólo `ry`. Tumbar un cilindro con `rx` no sirve aquí: el orden de
    // Euler del kit aplica la x al final y la pieza acabaría mirando al norte del mundo.
    circulo: new THREE.CircleGeometry(.5, 28),
    aro: new THREE.TorusGeometry(.5, .045, 6, 28),
    hojaPalma: geoHojaPalma(),
    hojaBanano: geoHoja(.2),
    tiesto: new THREE.CylinderGeometry(.5, .34, 1, 10),
    // El vocabulario floral (pétalo, corolas, domo del centro y brizna) vive en flora.js.
    ...crearGeometriasFlor(),
  };
  // Materiales con carácter propio (no salen de la paleta plana).
  mat.farolLuz = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffc46b, emissiveIntensity: 1, roughness: .35 });
  mat.linterna = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd272, emissiveIntensity: 1.2, roughness: .3 });
  // Carátula del reloj: el marfil de la paleta levantado con un punto de emisión propia. La
  // esfera mira al sureste —perpendicular a la luz de la tarde—, así que con el marfil liso
  // quedaba en gris propio y los numerales se perdían a diez metros. No es un material
  // encendido como el del farol: es el marfil al que se le devuelve lo que la luz no le da.
  mat.caratula = new THREE.MeshStandardMaterial({
    color: PALETA.blanco, roughness: .8, emissive: 0xb0a692, emissiveIntensity: .5,
  });
  // Vidrio de las luminarias de calle: traslúcido y emisivo, deja ver la luz de dentro y a un
  // metro convierte la caja amarilla en un farol.
  mat.vidrioFarol = new THREE.MeshStandardMaterial({
    color: 0xfff2c8, roughness: .2, metalness: .1,
    transparent: true, opacity: .45, emissive: 0xffc46b, emissiveIntensity: .35, depthWrite: false,
  });
  mat.ventanaLuz = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  // Frondas de palmera: las dos caras por material, no volteando la malla. En `flora.js` se
  // voltea la malla porque allí cada color es un pétalo que el prado repite cientos de veces y
  // el material es compartido; aquí las frondas son las únicas dueñas de su material, así que
  // `DoubleSide` cuesta cero triángulos donde duplicar la malla costaría el doble. Y hacen
  // falta: la mariposa vuela a dos metros y mira la corona desde abajo, que es justo la cara
  // que no existía — desde el suelo la copa se veía hueca, con el cielo por dentro.
  mat.palma = new THREE.MeshStandardMaterial({ color: PALETA.palma, roughness: .88, side: THREE.DoubleSide });
  mat.palmaSeca = new THREE.MeshStandardMaterial({ color: PALETA.hojaSeca, roughness: .9, side: THREE.DoubleSide });
  mat.agua = new THREE.MeshStandardMaterial({ color: 0x4fb6c6, roughness: .16, metalness: .15 });
  // Materiales de la capa de vida: humo, polvo a contraluz, espuma y aves lejanas.
  mat.humo = new THREE.MeshStandardMaterial({ color: 0xe9e5dd, roughness: 1, transparent: true, opacity: .26, depthWrite: false });
  mat.polvo = new THREE.MeshBasicMaterial({ color: 0xffe6ac, transparent: true, opacity: .5, depthWrite: false });
  mat.espuma = new THREE.MeshBasicMaterial({ color: 0xdff3f2, transparent: true, opacity: .3, depthWrite: false });
  mat.brillo = new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: .4, depthWrite: false });
  mat.ave = new THREE.MeshBasicMaterial({ color: 0x35413f });

  const lotes = new Map();       // geometría → Map(material → { matrices, sombra })
  const moviles = [];            // instancias que se recolocan cada frame
  const animados = [];           // callbacks t → nada
  const chimeneas = [];          // bocas de humo del pueblo
  const tmp = new THREE.Object3D();
  const cuaternion = new THREE.Quaternion(), euler = new THREE.Euler();
  // Punta real de una brizna/tallo (alto + lo que la vara se dobla), para posar la espiga
  // del junco justo donde termina la hoja (misma cuenta que hace `mataFlor` en flora.js).
  const puntaVara = new THREE.Vector3();

  function materialDe(nombre) {
    if (nombre?.isMaterial) return nombre;
    if (mat[nombre]) return mat[nombre];
    return mat[nombre] = new THREE.MeshStandardMaterial({ color: PALETA[nombre] ?? 0xff00ff, roughness: .88 });
  }

  function abrirLote(nombreGeo, nombreMat, sombra) {
    const geometria = geo[nombreGeo] ?? nombreGeo;
    if (!lotes.has(geometria)) lotes.set(geometria, new Map());
    const porMaterial = lotes.get(geometria);
    if (!porMaterial.has(nombreMat)) porMaterial.set(nombreMat, { mat: materialDe(nombreMat), matrices: [], sombra });
    return porMaterial.get(nombreMat);
  }

  // Pieza suelta: pocas, con silueta propia o material único.
  function suelta(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh; }
  function caja(m, w, h, d, x, y, z, ry = 0, opciones = {}) {
    const mesh = new THREE.Mesh(geo.caja, materialDe(m));
    mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
    mesh.rotation.set(opciones.rx ?? 0, ry, opciones.rz ?? 0);
    mesh.castShadow = mesh.receiveShadow = opciones.sombra !== false;
    scene.add(mesh); return mesh;
  }
  function cil(m, r, h, x, y, z, opciones = {}) {
    const mesh = new THREE.Mesh(geo.cil, materialDe(m));
    mesh.scale.set(r * 2, h, r * 2); mesh.position.set(x, y, z);
    mesh.rotation.set(opciones.rx ?? 0, opciones.ry ?? 0, opciones.rz ?? 0);
    mesh.castShadow = mesh.receiveShadow = opciones.sombra !== false;
    scene.add(mesh); return mesh;
  }
  function plano(m, w, h, x, y, z, opciones = {}) {
    const mesh = new THREE.Mesh(geo.plancha, materialDe(m));
    mesh.scale.set(w, h, 1); mesh.position.set(x, y, z);
    mesh.rotation.set(opciones.rx ?? 0, opciones.ry ?? 0, opciones.rz ?? 0);
    mesh.castShadow = false; mesh.receiveShadow = opciones.sombra !== false;
    scene.add(mesh); return mesh;
  }

  // Detalle repetido: se acumula y sale horneado. `esc` admite número o [x,y,z];
  // `q` (cuaternión) sustituye a rx/ry/rz cuando hace falta componer giro y pendiente.
  function lote(nombreGeo, nombreMat, x, y, z, opciones = {}) {
    const { rx = 0, ry = 0, rz = 0, esc = 1, sombra, q } = opciones;
    const e = typeof esc === 'number' ? [esc, esc, esc] : esc;
    tmp.position.set(x, y, z);
    if (q) tmp.quaternion.fromArray(q);
    else { euler.set(rx, ry, rz); tmp.quaternion.setFromEuler(euler); }
    tmp.scale.set(e[0], e[1], e[2]);
    tmp.updateMatrix();
    const b = abrirLote(nombreGeo, nombreMat, sombra ?? CON_SOMBRA.has(nombreMat));
    b.matrices.push(tmp.matrix.clone());
    return b.matrices.length - 1;
  }

  // `tmp` es uno solo para todo el kit, así que antes de cada `porItem` se deja en cero: una
  // familia que no escriba las tres rotaciones —o que escriba `undefined`— envenenaba el
  // objeto compartido y arrastraba a las demás. Pasó de verdad: las hojas del banano dejaron
  // el `tmp` en NaN y las gotas de la fuente, que sólo escriben posición y escala, salieron
  // del pueblo sin que las pruebas dijeran nada (una matriz NaN no dibuja, pero no falla).
  function colocar(porItem, i, t) {
    tmp.position.set(0, 0, 0); tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1);
    porItem(tmp, i, t);
    tmp.updateMatrix();
  }

  // Instancias que se recolocan cada frame (mariposas, humo, polvo, frondas, oleaje).
  // `porItem(o, i, t)` recibe un Object3D reutilizable y escribe posición/rotación/escala.
  function movil(nombreGeo, nombreMat, n, porItem, opciones = {}) {
    const mesh = new THREE.InstancedMesh(geo[nombreGeo] ?? nombreGeo, materialDe(nombreMat), n);
    mesh.castShadow = !!opciones.sombra;
    mesh.frustumCulled = false;                  // sus instancias se mueven por todo el pueblo
    scene.add(mesh);
    for (let i = 0; i < n; i++) { colocar(porItem, i, 0); mesh.setMatrixAt(i, tmp.matrix); }
    mesh.instanceMatrix.needsUpdate = true;
    moviles.push({ mesh, porItem, n });
    return mesh;
  }

  function hornear() {
    for (const [geometria, porMaterial] of lotes)
      for (const b of porMaterial.values()) {
        const mesh = new THREE.InstancedMesh(geometria, b.mat, b.matrices.length);
        b.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.castShadow = mesh.receiveShadow = b.sombra;
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
      }
    lotes.clear();
  }

  function actualizar(t) {
    for (const { mesh, porItem, n } of moviles) {
      for (let i = 0; i < n; i++) { colocar(porItem, i, t); mesh.setMatrixAt(i, tmp.matrix); }
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const fn of animados) fn(t);
  }

  function animar(fn) { animados.push(fn); }

  // Coordenadas locales de una pieza: (dx, dz) alrededor de (x, z) girados por ry.
  function local(x, z, ry) {
    const c = Math.cos(ry), s = Math.sin(ry);
    return (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  }

  // Vegetación que se mece: se registra aquí durante la construcción del lugar y más tarde
  // `crearViento` la convierte en un único InstancedMesh por material, recolocado por frame.
  const viento = [];
  function mecer(nombreGeo, nombreMat, item) { viento.push({ nombreGeo, nombreMat, ...item }); }
  function crearViento(porItem) {
    const grupos = new Map();
    for (const item of viento) {
      const k = `${item.nombreGeo}|${item.nombreMat}`;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(item);
    }
    for (const items of grupos.values()) {
      const { nombreGeo, nombreMat } = items[0];
      movil(nombreGeo, nombreMat, items.length, (o, i, t) => porItem(o, items[i], t));
    }
    viento.length = 0;
  }

  const kit = {
    scene, world, mat, geo, PALETA, m: materialDe, chimeneas,
    suelta, caja, cil, plano, lote, movil, hornear, actualizar, local, animar, mecer, crearViento,
    // Vocabulario floral (flora.js): una flor, una mata con tallo, un macizo y un penacho
    // de briznas que se mece. Todo entra por lote()/mecer() y no proyecta sombra.
    flor, mataFlor, macizoFloral, briznas,
    colisionCaja: (x1, z1, x2, z2) => world.addBox(x1, z1, x2, z2),
    colisionCirculo: (x, z, r) => world.addCircle(x, z, r),
  };

  // ---------- Piezas ----------
  // Todas se colocan por su base (y = suelo) y su centro en (x, z), como en el pueblo.

  // Ventana con marco, vidrio, alféizar, contraventanas y luz cálida opcional.
  // Mira hacia +z local (el frente de la casa es -z: se pasa ry + π).
  function ventana(x, y, z, ry, { ancho = .9, alto = 1.1, contraventanas = true, luz = false } = {}) {
    const m = .07, L = local(x, z, ry);
    for (const [dx, dy, w, h] of [
      [0, alto / 2, ancho + m * 2, m], [0, -alto / 2, ancho + m * 2, m],
      [-ancho / 2 - m / 2, 0, m, alto + m * 2], [ancho / 2 + m / 2, 0, m, alto + m * 2],
    ]) {
      const [px, pz] = L(dx, .05);
      lote('caja', 'turquesa', px, y + dy, pz, { ry, esc: [w, h, .09] });
    }
    const [vx, vz] = L(0, .04);
    lote('caja', 'vidrio', vx, y, vz, { ry, esc: [ancho, alto, .03], sombra: false });
    if (luz) lote('caja', 'ventanaLuz', vx, y, vz + 0, { ry, esc: [ancho * .72, alto * .78, .04], sombra: false });
    const [sx, sz] = L(0, .12);
    lote('caja', 'piedra', sx, y - alto / 2 - .12, sz, { ry, esc: [ancho + .34, .09, .3] });
    const [ajx, ajz] = L(-ancho / 2 + .05, 0);
    lote('caja', 'turquesaClaro', ajx, y - alto / 2 - .12, ajz, { ry, esc: [.12, .06, .3], sombra: false });
    if (contraventanas) {
      for (const lado of [-1, 1]) {
        const [px, pz] = L(lado * ancho * .74, .12);
        lote('caja', 'turquesa', px, y, pz, { ry: ry + lado * .62, esc: [ancho * .58, alto * .94, .06] });
        lote('caja', 'turquesaClaro', px, y + alto * .16, pz, { ry: ry + lado * .62, esc: [ancho * .48, .05, .02], sombra: false });
      }
    }
  }

  // Puerta de dos hojas abiertas hacia adentro, con dintel, jambas y escalón.
  function puerta(x, y, z, ry, { ancho = 1.5, alto = 2.3, abierta = 1.15, hoja = 'turquesa' } = {}) {
    const L = local(x, z, ry), hojaAncho = ancho * .5 - .04;
    const [dx0, dz0] = L(0, 0);
    lote('caja', 'madera', dx0, y + alto + .14, dz0, { ry, esc: [ancho + .42, .26, .34] });
    const [ex0, ez0] = L(0, .16);
    lote('caja', 'piedra', ex0, y + .045, ez0, { ry, esc: [ancho + .5, .1, .95] });
    for (const lado of [-1, 1]) {
      const [jx, jz] = L(lado * (ancho / 2 + .1), 0);
      lote('caja', 'estucoClaro', jx, y + alto / 2, jz, { ry, esc: [.22, alto, .42] });
      // La hoja gira sobre su bisagra: el centro se corre media hoja en la dirección abierta.
      const hx = lado * (ancho / 2 - .04), dir = -lado * Math.cos(abierta), prof = -Math.sin(abierta);
      const [cx, cz] = L(hx + dir * hojaAncho / 2, .08 + prof * hojaAncho / 2);
      const giro = ry + (lado < 0 ? abierta : Math.PI - abierta);
      lote('caja', hoja, cx, y + (alto - .12) / 2 + .06, cz, { ry: giro, esc: [hojaAncho, alto - .12, .07] });
      const [mx, mz] = L(hx + dir * hojaAncho * .5, .14 + prof * hojaAncho * .5);
      lote('caja', 'maderaClara', mx, y + (alto - .12) * .42, mz, { ry: giro, esc: [hojaAncho * .7, alto * .34, .03], sombra: false });
    }
  }

  // Techo a dos aguas: dos faldones acanalados, caballete, frontones y colas de viga.
  function techo(x, y, z, ry, { ancho, fondo, alto = 1.5, voladizo = .45, muro = 'estuco' } = {}) {
    const L = ancho + voladizo * 2, vuelo = fondo / 2 + voladizo;
    const pendiente = Math.atan2(alto, vuelo), largoPendiente = Math.hypot(alto, vuelo);
    for (const lado of [-1, 1]) {
      const [cx, cz] = local(x, z, ry)(0, lado * vuelo / 2);
      const mesh = new THREE.Mesh(geoTeja(L, .17, largoPendiente), materialDe('teja'));
      mesh.position.set(cx, y + alto / 2, cz);
      mesh.rotation.y = ry;
      mesh.rotateX(lado * pendiente);              // +z baja: el faldón del lado +1 cae hacia +z
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
    }
    lote('caja', 'tejaHonda', x, y + alto + .06, z, { ry, esc: [L, .16, .3] });
    for (const lado of [-1, 1]) {
      const [gx, gz] = local(x, z, ry)(lado * (ancho / 2 - .1), 0);
      lote(geoTriangulo(fondo, alto, .3), muro, gx, y, gz, { ry: ry + Math.PI / 2 });
    }
    for (let i = -2; i <= 2; i++) {               // colas de viga bajo el alero
      for (const lado of [-1, 1]) {
        const [bx, bz] = local(x, z, ry)(i * (ancho / 5), lado * (fondo / 2 + voladizo * .55));
        lote('caja', 'madera', bx, y - .11, bz, { ry, esc: [.09, .13, voladizo] });
      }
    }
  }

  // Techo a cuatro aguas para las casas de esquina: pirámide y alero corrido.
  function techoHip(x, y, z, ry, { ancho, fondo, alto = 1.5, voladizo = .45 } = {}) {
    const mesh = new THREE.Mesh(geo.cono, materialDe('teja'));
    mesh.scale.set((ancho + voladizo * 2) * 1.42, alto, (fondo + voladizo * 2) * 1.42);
    mesh.position.set(x, y + alto / 2, z);
    mesh.rotation.y = ry + Math.PI / 4;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    for (let i = -2; i <= 2; i++)
      for (const [dx, dz] of [[i * (ancho / 5), -(fondo / 2 + voladizo * .55)], [i * (ancho / 5), fondo / 2 + voladizo * .55]]) {
        const [bx, bz] = local(x, z, ry)(dx, dz);
        lote('caja', 'madera', bx, y - .11, bz, { ry, esc: [.09, .13, voladizo] });
      }
  }

  // Chimenea de fogón: caño, corona y repisa. `x, z` en el faldón del techo. Anota su boca
  // en `chimeneas` para que la capa de vida sepa de dónde sale el humo.
  function chimenea(x, y, z, { alto = 1.3, cuerpo = 'coral' } = {}) {
    lote('caja', cuerpo, x, y + alto / 2, z, { esc: [.54, alto, .54] });
    lote('caja', 'tejaHonda', x, y + alto + .09, z, { esc: [.82, .18, .82] });
    lote('caja', 'piedra', x, y + alto * .42, z + .34, { esc: [.62, .1, .24] });
    chimeneas.push({ x, y: y + alto + .2, z });
  }

  // Casa de una o dos plantas: zócalo, cuerpo, alero, techo, vanos, portal y chimenea.
  function casa(x, z, ry, spec = {}) {
    const {
      ancho = 5, fondo = 4.2, muro = 'estuco', plantas = 1, alto = 3, techoAlto = 1.5,
      cubierta = 'aguas', portal = false, chimenea: conChimenea = false,
      contraventanas = true, ventanasFrente = 2, semilla = 1,
    } = spec;
    const rnd = secuencia(semilla * 13 + x * 3 + z);
    const L = local(x, z, ry);
    const cuerpoAlto = plantas === 2 ? alto + 2.5 : alto;
    const aleroY = .34 + cuerpoAlto;

    lote('caja', 'coralHondo', x, .17, z, { ry, esc: [ancho + .18, .34, fondo + .18] });
    lote('caja', muro, x, .34 + cuerpoAlto / 2, z, { ry, esc: [ancho, cuerpoAlto, fondo] });
    if (plantas === 2) {
      const [bx, bz] = L(0, -(fondo / 2 + .55));
      lote('caja', 'piedra', bx, .34 + alto + .07, bz, { ry, esc: [ancho * .92, .14, 1.1] });
      for (const y2 of [.34 + alto + .5, .34 + alto + 1.05]) {
        const [rx2, rz2] = L(0, -(fondo / 2 + 1.06));
        lote('caja', 'turquesa', rx2, y2, rz2, { ry, esc: [ancho * .92, .07, .07] });
      }
      for (let i = -3; i <= 3; i++) {
        const [px, pz] = L(i * (ancho * .92 / 6.5), -(fondo / 2 + 1.06));
        lote('caja', 'turquesa', px, .34 + alto + .78, pz, { ry, esc: [.06, 1.56, .06] });
      }
      for (const [dx, dz] of [[-ancho * .46, -(fondo / 2 + 1.06)], [ancho * .46, -(fondo / 2 + 1.06)]]) {
        const [px, pz] = L(dx, dz);
        lote('caja', 'turquesa', px, .34 + alto + .78, pz, { ry, esc: [.07, 1.6, .07] });
      }
    }
    const voladizo = .45;
    if (cubierta === 'hip') techoHip(x, aleroY, z, ry, { ancho, fondo, alto: techoAlto, voladizo });
    else techo(x, aleroY, z, ry, { ancho, fondo, alto: techoAlto, voladizo, muro });

    const zFrente = -(fondo / 2) - .02;
    for (const lado of [-1, 1]) {
      const [px, pz] = L(lado * (ancho / 2 + .24), 0);
      lote('caja', 'tejaHonda', px, aleroY - .5, pz, { ry, esc: [.11, 2.4, .11] });   // bajante
    }
    const [qx, qz] = L(0, zFrente);
    puerta(qx, .34, qz, ry, { ancho: 1.5, alto: 2.3, abierta: .95 + rnd() * .3 });
    const reparto = ventanasFrente === 2 ? [-1, 1] : [0];
    for (const lado of reparto) {
      const [vx, vz] = L(lado * ancho * .3, zFrente - .02);
      ventana(vx, .34 + 1.6, vz, ry + Math.PI, { ancho: .95, alto: 1.15, contraventanas, luz: rnd() > .45 });
    }
    for (const lado of [-1, 1]) {
      const [vx, vz] = L(lado * (ancho / 2 + .02), fondo * .08);
      ventana(vx, .34 + 1.6, vz, ry + lado * Math.PI / 2, { ancho: .8, alto: 1, contraventanas, luz: rnd() > .6 });
    }
    if (portal) {
      const dzPortal = zFrente - 1.15;
      for (let i = -2; i <= 2; i++) {
        const [px, pz] = L(i * (ancho / 4.6), dzPortal);
        lote('cil', 'madera', px, .34 + 1.2, pz, { esc: [.17, 2.4, .17] });
        lote('caja', 'piedra', px, .5, pz, { esc: [.34, .32, .34] });
      }
      const [tx, tz] = L(0, dzPortal);
      lote('caja', 'madera', tx, .34 + 2.44, tz, { ry, esc: [ancho + .3, .16, .32] });
      const [sx, sz] = L(0, dzPortal - .2);
      lote('caja', 'piedra', sx, .44, sz, { ry, esc: [ancho * .9, .2, 1.7] });
      for (let i = -2; i <= 2; i++) {
        const [px, pz] = L(i * (ancho / 4.6), dzPortal - 1.0);
        lote('caja', 'turquesa', px, .34 + 1.0, pz, { esc: [.06, .76, .06] });
      }
      const [rx2, rz2] = L(0, dzPortal - 1.0);
      lote('caja', 'turquesa', rx2, .34 + 1.38, rz2, { ry, esc: [ancho * .98, .07, .07] });
      const [hx, hz] = L(0, dzPortal - .25);
      const aleroPortal = new THREE.Mesh(geoTeja(ancho + .5, .15, 3.3), materialDe('teja'));
      aleroPortal.position.set(hx, .34 + 2.66, hz);
      aleroPortal.rotation.y = ry; aleroPortal.rotateX(-.18);
      aleroPortal.castShadow = aleroPortal.receiveShadow = true;
      scene.add(aleroPortal);
      lote('caja', 'madera', hx, .34 + 2.72, hz, { ry, esc: [.14, .12, ancho + .4] });
    }
    if (conChimenea) {
      const [hx, hz] = L(ancho * .28, fondo * .16);
      chimenea(hx, aleroY + techoAlto * .66, hz, { alto: 1.15 + rnd() * .3 });
    }
    // Colisión: misma caja envolvente que la versión anterior del pueblo. El cuerpo de la
    // casa también tapa la vista: desde la calle no se explora lo que hay detrás del muro.
    const hw = ancho / 2, hd = fondo / 2;
    const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([px, pz]) => L(px, pz));
    const caja = [
      Math.min(...pts.map(p => p[0])) - .05, Math.min(...pts.map(p => p[1])) - .05,
      Math.max(...pts.map(p => p[0])) + .05, Math.max(...pts.map(p => p[1])) + .05,
    ];
    world.addBox(...caja);
    world.addSight(...caja);
  }

  // Palmera: tronco en zigzag que se curva sobre una base floreada, cogollo con base fibrosa y
  // racimo de cocos, corona de frondas pinnadas en dos anillos —cogollos y maduras— que se mecen,
  // y frondas secas colgando pegadas al tronco.
  function palmera(x, z, { alto = 6, curvo = .09, ry = 0, hojas = 8, semilla = 1 } = {}) {
    const rnd = secuencia(semilla);
    // Tramos de 30 cm, no de 70: el zigzag del tronco es del tamaño del tramo, y a 70 cm cada
    // muesca medía lo que media el palmo del tronco —se leía como tubos apilados—. El tubo
    // abierto ('tronco8') paga los tramos finos.
    const tramos = Math.max(8, Math.round(alto / .3));
    let px = 0, pz = 0;
    const curvoZ = (rnd() - .5) * .5;   // cuánto se va la palmera de lado, una vez para todo el tronco
    for (let i = 0; i < tramos; i++) {
      const h = alto / tramos, t = (i + .5) / tramos;
      px = curvo * alto * t * t;
      // La curva es del TRONCO, no de cada tramo: antes `pz` llevaba ruido por tramo y las
      // secciones se desalineaban entre sí —la palmera parecía un tótem de tuberías—.
      pz = curvo * alto * t * t * curvoZ;
      // Zigzag: el tronco adelgaza de forma continua y cada tramo se ahusa un 4 % —uno hacia
      // arriba y el siguiente hacia abajo, con `rx: π`—, así que las juntas casan radio con radio
      // y la silueta no tiene un solo escalón. El escalón alterno es lo que se lee como bambú
      // (30 % en la primera versión; un ±2,5 % simétrico en la segunda dejaba un serrucho).
      const radio = .22 - .06 * t;
      lote('tronco8', 'tronco', x + px, h * (i + .5), z + pz,
        { rx: i % 2 ? Math.PI : 0, esc: [radio * 2, h * 1.01, radio * 2] });
    }
    const cx = x + px, cz = z + pz;

    // Base floreada: la palmera se abre al pie con las raíces a la vista. Sin ella el tronco
    // entra en la tierra como un poste clavado, y es la mitad que pasa junto a la mariposa.
    lote('tiesto', 'tronco', x, .17, z, { rx: Math.PI, esc: [.62, .36, .62] });

    // Cogollo: un tapón del color del tronco que cierra el tubo abierto y, sobre él, un aro verde
    // donde arraigan las frondas. Antes iban un cilindro más ancho y una esfera encima, del color
    // del tronco: de cerca se leía un sombrero de copa —dos cuerpos con el canto a la vista donde
    // la palmera tiene uno— y, verde y ancho, un embudo. El tronco sube hasta la corona y el
    // capitel es apenas una banda.
    lote('tiesto', 'tronco', cx, alto + .04, cz, { rx: Math.PI, esc: [.34, .34, .34] });
    lote('tiesto', 'hojaClara', cx, alto + .07, cz, { rx: Math.PI, esc: [.37, .15, .37] });

    // Corona en dos anillos y a varias alturas. Con uno solo —el de antes— la copa quedaba rala
    // y plana: nueve frondas separadas, el cielo por dentro y, de lejos, un parasol. Los cogollos
    // suben del centro casi a plomo y apenas asoman sobre las maduras; las maduras salen
    // escalonadas en altura y cada una cae a su aire, que es lo que le da volumen a la silueta.
    const yCopa = alto + .24;
    const cogollos = Math.max(3, Math.round(hojas * .5));
    for (let i = 0; i < cogollos; i++) {
      const a = (i / cogollos) * TAU + ry + .5 + rnd() * .3;
      const largo = 1.25 + rnd() * .5;
      mecer('hojaPalma', 'palma', {
        x: cx, y: yCopa - .18, z: cz, ry: a, rz: .6 + rnd() * .5, rx: (rnd() - .5) * .3,
        esc: [largo, largo, largo], fase: rnd() * 6.28, amp: .06 + rnd() * .05,
      });
    }
    for (let i = 0; i < hojas; i++) {
      const a = (i / hojas) * TAU + ry + rnd() * .9;   // el reparto no es de rueda dentada
      const caida = .1 + rnd() * .62;              // la que abre en arco y la que cuelga
      const largo = 2.15 + rnd() * 1.05;
      mecer('hojaPalma', 'palma', {
        x: cx, y: yCopa + .18 - caida * .38, z: cz, ry: a, rz: -caida, rx: (rnd() - .5) * .3,
        esc: [largo, largo, largo], fase: rnd() * 6.28, amp: .09 + rnd() * .07,
      });
    }

    // Base fibrosa: los flecos de la vaina que envuelve el cogollo, colgando contra el tronco.
    // Es el detalle que a un metro separa una palmera de un poste; de lejos, en cambio, no debe
    // competir con la corona: antes medían medio metro y salían en horizontal, y a contraluz el
    // cogollo se leía como un cepillo claro.
    const fibras = 5 + Math.round(rnd());
    for (let i = 0; i < fibras; i++) {
      const a = (i / fibras) * TAU + ry + rnd() * .6, largo = .24 + rnd() * .18;
      lote('brizna', 'tronco', cx + Math.cos(a) * .17, alto - .1, cz + Math.sin(a) * .17,
        { ry: a, rz: -(.95 + rnd() * .5), esc: [.16, largo, largo], sombra: false });
    }

    // Cocos: el racimo cuelga justo bajo la corona. Alternan el color del tronco con la
    // madera clara para que de cerca se cuenten uno a uno.
    const cocos = 4 + Math.round(rnd() * 2);
    for (let i = 0; i < cocos; i++) {
      const a = (i / cocos) * TAU + ry + rnd() * .7, d = .17 + rnd() * .1;
      lote('mota', i % 2 ? 'maderaClara' : 'tronco',
        cx + Math.cos(a) * d, alto - .1 - rnd() * .2, cz + Math.sin(a) * d,
        { esc: [.22, .25, .22], sombra: false });
    }

    // Frondas secas: las hojas viejas se doblan y caen pegadas al tronco, muy por debajo de
    // la horizontal (rz cercano a −1,2). Sin ellas la palmera parece recién fabricada.
    const secas = 3 + Math.round(rnd());
    for (let i = 0; i < secas; i++) {
      const largo = 1.5 + rnd() * .6;
      lote('hojaPalma', 'palmaSeca', cx, alto - .2, cz,
        { ry: rnd() * TAU + ry, rz: -(1.0 + rnd() * .45), rx: (rnd() - .5) * .4,
          esc: [largo, largo, largo], sombra: false });
    }
    world.addCircle(x, z, .45);
    return { x: cx, z: cz, y: alto };
  }

  // Banano: mata de hojas anchas con la nervadura a la vista, racimo colgando del seudotallo
  // y la bellota de la flor en la punta.
  function banano(x, z, { alto = 2.4, ry = 0, semilla = 2 } = {}) {
    const rnd = secuencia(semilla);
    lote('cil', 'hojaClara', x, alto * .45, z, { esc: [.24, alto * .9, .24] });
    const yHoja = alto * .82;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + ry;
      const vuelco = -(.2 + rnd() * .5), pliegue = .7 + rnd() * .6;
      const fase = rnd() * 6.28, amp = .07 + rnd() * .06;
      mecer('hojaBanano', 'hojaClara', {
        x, y: yHoja, z, rx: 0, ry: a, rz: vuelco, esc: [1.4, pliegue, .9], fase, amp,
      });
      // Nervadura: la MISMA hoja encogida a lo ancho y en verde oscuro, con idéntica raíz,
      // giro y vaivén. Colgada de `mecer` viaja pegada a la lámina —una varilla suelta por
      // `lote` se despegaría con el viento— y a un metro se lee la vena central.
      mecer('hojaBanano', 'hoja', {
        x, y: yHoja + .015, z, rx: 0, ry: a, rz: vuelco + .04, esc: [1.34, pliegue, .1], fase, amp: amp * .7,
      });
    }
    // Racimo: cuatro bananos colgando del vástago y, debajo, la bellota morada de la flor.
    const yRacimo = alto * .9;
    lote('cil6', 'hojaClara', x, yRacimo - .16, z, { esc: [.1, .34, .1], sombra: false });
    for (let i = 0; i < 4; i++) {
      const a = ry + (i - 1.5) * .55, d = .1 + rnd() * .06;
      lote('cil6', 'amarillo', x + Math.cos(a) * d, yRacimo - .34 - rnd() * .05, z + Math.sin(a) * d,
        { ry: a, rz: (rnd() - .5) * .3, esc: [.09, .28 + rnd() * .08, .09], sombra: false });
    }
    lote('cono', 'florRoja', x, yRacimo - .58, z, { rz: Math.PI + (rnd() - .5) * .3, esc: [.12, .24, .12], sombra: false });
    world.addCircle(x, z, .6);
  }

  // Arbusto: cinco lóbulos de esfera con materiales mezclados, manojos de hojas que sobresalen
  // y —en una de cada tres matas— un racimo de bayas. `y` lo sube a la meseta. Sin colisión.
  //
  // Sigue siendo una esfera completa, y por la misma razón de siempre: una mata queda a un
  // metro de la cámara en la plaza y el jardín, y ahí un icosaedro de veinte caras se lee como
  // un cristal verde. Pero la esfera grande (8×6, 80 caras) por cinco lóbulos costaría 160
  // triángulos más POR MATA —unos cinco mil seiscientos en todo el pueblo, la tanda entera—,
  // así que los lóbulos van en la esfera de detalle (6×4, 36 caras): sigue siendo redonda y
  // los lóbulos se solapan, de modo que la faceta no se ve. La lectura de cerca la devuelven
  // los manojos de hojas y las bayas, que son láminas y bolitas casi gratis.
  function arbusto(x, z, { r = .7, alto = 1.1, mate = 'hoja', semilla = 3, y = 0 } = {}) {
    const rnd = secuencia(semilla);
    const capa = [mate, 'hojaClara', mate, 'hojaSeca', mate];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + rnd() * 1.1, d = rnd() * r * .62;
      lote('mata', capa[i], x + Math.cos(a) * d, y + alto * (.48 + rnd() * .34), z + Math.sin(a) * d,
        { esc: [r * (1 + rnd() * .4), alto * (.85 + rnd() * .5), r * (1 + rnd() * .4)] });
    }
    // Manojos: hojas sueltas que asoman por entre los lóbulos. Ese es el detalle de a un metro.
    const manojos = 3 + Math.round(rnd());
    for (let i = 0; i < manojos; i++) {
      const a = rnd() * TAU;
      lote('petalo', i % 2 ? 'hojaClara' : mate,
        x + Math.cos(a) * r * .78, y + alto * (.35 + rnd() * .5), z + Math.sin(a) * r * .78,
        { ry: Math.PI / 2 - a, rx: -.2 - rnd() * .4, esc: [r * .5, .8, r * .75], sombra: false });
    }
    // Bayas: sólo en algunas matas, un puñado pequeño colgando del borde.
    if (rnd() > .66) {
      const a = rnd() * TAU;
      for (let i = 0; i < 3; i++) {
        const b = a + i * 2.1;
        lote('mata', 'florRoja', x + Math.cos(b) * r * .55, y + alto * (.72 + rnd() * .3), z + Math.sin(b) * r * .55,
          { esc: [.09, .09, .09], sombra: false });
      }
    }
  }

  // Maceta de barro con flores de verdad: tiesto troncocónico, tierra a la vista y las matas
  // con tallo, hoja y corola. Antes eran cuatro icosaedros de 20 cm clavados sobre el borde
  // del tiesto: de cerca —y la mariposa mira las macetas desde arriba— se leían como piedras.
  function maceta(x, z, { r = .3, semilla = 4, y = 0, flores = 3 } = {}) {
    const rnd = secuencia(semilla);
    const alto = r * 1.5;
    lote('tiesto', 'coral', x, y + alto / 2, z, { esc: [r * 2, alto, r * 2] });
    lote('cil', 'coralHondo', x, y + alto * .95, z, { esc: [r * 2.18, alto * .16, r * 2.18] });
    lote('cil', 'tierraHonda', x, y + alto * .98, z, { esc: [r * 1.78, alto * .12, r * 1.78], sombra: false });
    const n = flores + Math.round(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * .8, d = rnd() * r * .45;
      mataFlor(kit, x + Math.cos(a) * d, y + alto * .95, z + Math.sin(a) * d, {
        alto: r * (1.1 + rnd() * .8), flores: 1,
        color: i % 3 === 2 ? 'amarillo' : (i % 2 ? 'florRoja' : 'flor'),
        tamano: r * (.62 + rnd() * .22), semilla: semilla * 17 + i,
      });
    }
  }

  // Farol de calle: poste, brazo con riostra, luminaria cálida que respira y su vidrio. A un
  // metro la caja de hierro deja de ser un bloque amarillo y se lee un farol.
  function farol(x, z, { alto = 3.4, ry = 0 } = {}) {
    lote('cil', 'hierro', x, alto / 2, z, { esc: [.16, alto, .16] });
    lote('cil', 'hierro', x, .12, z, { esc: [.44, .24, .44] });
    const L = local(x, z, ry);
    const [ax, az] = L(.45, 0);
    lote('caja', 'hierro', ax, alto - .06, az, { ry, esc: [.9, .09, .09] });
    const [rx2, rz2] = L(.4, 0);
    lote('caja', 'hierro', rx2, alto - .36, rz2, { ry, rz: .7, esc: [.44, .05, .05], sombra: false });
    const [lx, lz] = L(.82, 0);
    lote('caja', 'hierro', lx, alto - .52, lz, { ry, esc: [.34, .07, .34] });
    lote('caja', 'vidrioFarol', lx, alto - .3, lz, { ry, esc: [.33, .4, .33], sombra: false });
    lote('caja', 'farolLuz', lx, alto - .3, lz, { ry, esc: [.24, .3, .24], sombra: false });
    lote('caja', 'hierro', lx, alto - .09, lz, { ry, esc: [.36, .07, .36] });
    world.addCircle(x, z, .3);
  }

  // Reloj de la llegada: basamento de piedra, poste de madera con capitel, caja de carpintería
  // turquesa con alféizar y cornisa, carátula redonda con aro, numerales romanos en los cuartos,
  // barras radiales en las horas restantes y las agujas girando de verdad: la minutera da la
  // vuelta en `vuelta` segundos y la horaria va doce veces más despacio. Es el reloj del
  // paisaje —el chip «Pausar movimiento» lo congela con todo lo demás— y la pieza que lee el
  // encuentro «El reloj de la llegada».
  //
  // Lo pagado aquí, que sólo se ve a un metro:
  // - La carátula era un cuadrado marfil con doce barras pardas verticales: manchas sueltas, no
  //   una esfera. Ahora es un círculo con aro de hierro y las barras son RADIALES —cada una
  //   apunta al centro—, con los cuartos rotulados en romano por el mismo vocabulario de trazos
  //   del cartel de la entrada.
  // - Las dos agujas nacían a las doce, una encima de la otra, y se leían como una sola mancha
  //   cruzándose. La horaria nace a `hora` (cuatro en punto), la minutera en las doce, y son
  //   distintas de largo y de grosor, con cola pasando el eje.
  // - El poste subía a 3,2 m con la caja empezando en 2,9: el tronco atravesaba la carátula por
  //   delante y tapaba el seis. Ahora muere bajo el alféizar.
  function reloj(x, z, ry, { hora = 4, vuelta = 30 } = {}) {
    const Y = 3.62;                       // centro de la carátula
    const L = local(x, z, ry);

    // Basamento, poste y capitel.
    lote('cil', 'piedra', x, .06, z, { esc: [.88, .12, .88] });      // escalón
    cil('piedraHonda', .36, .3, x, .23, z);
    lote('cil', 'piedra', x, .42, z, { esc: [.46, .09, .46] });      // collarín del pie
    cil('madera', .11, 2.5, x, 1.66, z);
    lote('cil', 'maderaClara', x, 2.8, z, { esc: [.32, .14, .32] });

    // Caja: cuerpo, alféizar y cornisa.
    caja('turquesa', 1.4, 1.4, .28, x, Y, z, ry);
    lote('caja', 'turquesa', x, 2.9, z, { ry, esc: [1.5, .1, .34] });
    lote('caja', 'turquesa', x, 4.38, z, { ry, esc: [1.62, .13, .44] });

    // Carátula: círculo marfil, aro de hierro y las doce horas.
    const [dx0, dz0] = L(0, .145);
    lote('circulo', 'caratula', dx0, Y, dz0, { ry, esc: [1.08, 1.08, 1] });
    const [ax0, az0] = L(0, .16);
    lote('aro', 'hierro', ax0, Y, az0, { ry, esc: [1.08, 1.08, 1] });
    const CUARTOS = [['XII', 0], ['III', Math.PI / 2], ['VI', Math.PI], ['IX', 3 * Math.PI / 2]];
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      if (i % 3) {                       // horas: barra radial; el +y local sale del centro al borde
        const [mx, mz] = L(Math.sin(a) * .42, .165);
        lote('caja', 'hierro', mx, Y + Math.cos(a) * .42, mz, { ry, rz: -a, esc: [.045, .13, .03] });
        continue;
      }
      const [texto, ang] = CUARTOS[i / 3];
      rotular(texto, {
        L, z: .165, ry, x: Math.sin(ang) * .35, y: Y + Math.cos(ang) * .35,
        anchoMax: .21, pasoMax: .055, alto: .17, grueso: .022, color: 'hierro',
      });
    }

    // Agujas: la minutera larga y fina, la horaria corta y gruesa, y el cubo que tapa el eje.
    // Van sueltas —y no por `lote`— porque giran cada fotograma: una instancia horneada se
    // queda congelada.
    const [hx, hz] = L(0, .2);
    const geoMinutera = new THREE.BoxGeometry(.042, .57, .028); geoMinutera.translate(0, .195, 0);
    const geoHoraria = new THREE.BoxGeometry(.055, .4, .028); geoHoraria.translate(0, .12, 0);
    const minutera = new THREE.Mesh(geoMinutera, materialDe('hierro'));
    const horaria = new THREE.Mesh(geoHoraria, materialDe('hierro'));
    for (const aguja of [minutera, horaria]) {
      aguja.position.set(hx, Y, hz);
      aguja.rotation.y = ry;
      scene.add(aguja);
    }
    const [ux, uz] = L(0, .225);
    lote('esfera', 'hierro', ux, Y, uz, { esc: [.16, .16, .095] });   // el cubo del eje
    const agujas = t => {
      minutera.rotation.z = -TAU * t / vuelta;
      horaria.rotation.z = -TAU * (hora / 12 + t / (vuelta * 12));
    };
    agujas(0);            // la pose se fija al construir: en reposo el reloj marca 4:00
    animar(agujas);

    // Tejadillo: alero, pirámide a cuatro aguas y pomo. La pirámide se ensancha a 2,08 para que
    // su base hexagonal toque el borde del alero; con 1,6 quedaba metida como sobre una bandeja.
    caja('teja', 1.8, .13, .96, x, 4.5, z, ry);
    const piramide = new THREE.Mesh(geo.cono, materialDe('teja'));
    piramide.scale.set(2.08, .5, .96);
    piramide.position.set(x, 4.81, z);
    piramide.rotation.y = ry;
    piramide.castShadow = piramide.receiveShadow = true;
    scene.add(piramide);
    lote('cil', 'tejaHonda', x, 5.08, z, { esc: [.1, .16, .1] });
    lote('esfera', 'tejaHonda', x, 5.22, z, { esc: [.26, .28, .26] });
    world.addCircle(x, z, .45);
  }

  // Banca de listones con brazos de hierro. Los listones llevan su veta y el brazo tiene algo
  // de curva: son los detalles que se ven cuando la mariposa pasa a un metro.
  function banca(x, z, ry = 0, { largo = 1.9 } = {}) {
    const L = local(x, z, ry);
    for (const lado of [-1, 1]) {
      const [px, pz] = L(lado * largo * .38, 0);
      lote('caja', 'hierro', px, .24, pz, { ry, esc: [.1, .48, .52] });
    }
    for (const lado of [-1, 1]) {
      const [bx, bz] = L(lado * largo * .38, .2);
      lote('caja', 'hierro', bx, .66, bz, { ry, esc: [.08, .6, .08] });
      // Brazo: un tramo inclinado en la punta del respaldo, no un poste recto.
      const [ax, az] = L(lado * largo * .45, .04);
      lote('caja', 'hierro', ax, .8, az, { ry, rz: lado * .5, esc: [.07, .32, .07], sombra: false });
    }
    for (let i = 0; i < 3; i++) {
      const [px, pz] = L(0, (i - 1) * .18);
      lote('caja', 'maderaClara', px, .5, pz, { ry, esc: [largo, .07, .15] });
      // Veta: una ranura oscura a lo largo de cada listón del asiento.
      lote('caja', 'madera', px, .537, pz, { ry, esc: [largo * .94, .01, .012], sombra: false });
    }
    for (let i = 0; i < 2; i++) {
      const [px, pz] = L(0, .18 + i * .03);
      lote('caja', 'maderaClara', px, .72 + i * .2, pz, { ry, rx: -.18, esc: [largo, .16, .07] });
    }
    world.addCircle(x, z, .85);
  }

  // Pozo de piedra: brocal de mampostería irregular, tejadillo sobre el torno y cubo colgando
  // de la cuerda. Las hiladas llevan piedras de anchos y giros distintos para que de cerca se
  // lean sentadas una a una y no un tambor perfecto.
  function pozo(x, z, { r = .8 } = {}) {
    const rnd = secuencia(Math.round((x + z) * 7) + 3);
    for (let fila = 0; fila < 3; fila++) {
      const y = .12 + fila * .19, n = 7 + fila;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + fila * .5;
        const ancho = (TAU * r) / n * (.8 + rnd() * .45);
        lote('caja', fila % 2 ? 'piedraHonda' : 'piedra', x + Math.cos(a) * r, y, z + Math.sin(a) * r,
          { ry: -a + (rnd() - .5) * .22, esc: [ancho, .2, .26 + rnd() * .07] });
      }
    }
    lote('caja', 'piedraHonda', x, .04, z, { esc: [r * 1.75, .08, r * 1.75] });
    lote('cil', 'tierraHonda', x, .1, z, { esc: [r * 1.3, .06, r * 1.3], sombra: false });
    for (const lado of [-1, 1]) lote('caja', 'madera', x + lado * r * .85, 1.25, z, { esc: [.13, 1.3, .13] });
    lote('cil', 'madera', x, 1.45, z, { rz: Math.PI / 2, esc: [.16, r * 1.9, .16] });
    lote('cil6', 'hierro', x + r * .7, 1.45, z, { rz: Math.PI / 2, esc: [.26, .06, .26] });
    // Tejadillo a dos aguas: dos faldones de teja que cabalgan sobre el torno.
    for (const lado of [-1, 1])
      lote('caja', 'teja', x, 1.98, z + lado * r * .44, { rx: lado * .55, esc: [r * 2.2, .09, r * 1.05] });
    lote('caja', 'tejaHonda', x, 2.4, z, { esc: [r * 2.28, .12, .22] });
    for (const lado of [-1, 1]) lote('caja', 'madera', x + lado * r * .85, 1.72, z, { esc: [.12, .3, .12] });
    // Cuerda con el cubo a medio izar.
    lote('caja', 'tierraHonda', x, 1.02, z, { esc: [.03, .82, .03], sombra: false });
    lote('cil', 'maderaClara', x, .66, z, { esc: [.46, .42, .46] });
    lote('cil6', 'hierro', x, .88, z, { esc: [.5, .05, .5] });
    world.addCircle(x, z, r + .4);
  }

  // Carreta de bueyes varada: dos ruedas de seis rayos con llanta de hierro sobre el mismo
  // eje, yugo al frente para uncir los bueyes y el cajón cargado de sacos.
  function carreta(x, z, ry = 0) {
    const L = local(x, z, ry);
    const c = Math.cos(ry), s = Math.sin(ry);
    lote('caja', 'madera', x, .62, z, { ry, esc: [2.1, .16, 1.1] });
    lote('caja', 'maderaClara', x, .96, z, { ry, esc: [1.9, .52, .98] });
    // Las dos ruedas van al mismo eje (a los costados), como en un carro de bueyes de verdad;
    // el disco cae en el plano x-y del carro y los radios se reparten en él.
    for (const lado of [-1, 1]) {
      const [wx, wz] = L(0, lado * .72);
      const R = .72, y0 = .74;
      for (let i = 0; i < 12; i++) {                       // llanta de hierro por dovelas
        const a = (i / 12) * TAU, ox = Math.cos(a), oy = Math.sin(a);
        lote('caja', 'hierro', wx + ox * c * R * .8, y0 + oy * R * .8, wz - ox * s * R * .8,
          { ry, rz: a + Math.PI / 2, esc: [R * .45, .07, .09], sombra: false });
      }
      for (let i = 0; i < 6; i++) {                        // seis rayos
        const a = (i / 6) * TAU, ox = Math.cos(a), oy = Math.sin(a);
        lote('caja', 'maderaClara', wx + ox * c * R * .4, y0 + oy * R * .4, wz - ox * s * R * .4,
          { ry, rz: a, esc: [R * .76, .06, .05], sombra: false });
      }
      lote('cil', 'hierro', wx, y0, wz, { ry: ry + Math.PI / 2, rz: Math.PI / 2, esc: [.26, .18, .26] });
    }
    // Yugo al frente: la vara larga y la horquilla donde se uncen los bueyes.
    const [vx, vz] = L(1.5, 0);
    lote('caja', 'madera', vx, .82, vz, { ry, esc: [1.6, .12, .12] });
    const [yx, yz] = L(2.2, 0);
    lote('caja', 'madera', yx, .95, yz, { ry, esc: [.14, .14, 1.1] });
    for (const lado of [-1, 1]) {
      const [ox2, oz2] = L(2.28, lado * .62);
      lote('caja', 'madera', ox2, .95, oz2, { ry, esc: [.5, .1, .1] });
      lote('cil6', 'hierro', ox2, .86, oz2, { ry, rz: Math.PI / 2, esc: [.34, .05, .34], sombra: false });
    }
    // Carga de sacos.
    const rnd = secuencia(Math.round((x - z) * 7) + 5);
    for (let i = 0; i < 5; i++) {
      const [sx2, sz2] = L(-.7 + i * .37, (rnd() - .5) * .5);
      lote('mata', 'lona', sx2, 1.3 + rnd() * .07, sz2, { esc: [.5, .42, .46], sombra: false });
    }
    world.addCircle(x, z, 1.4);
  }

  // Barril de madera: duelas verticales, tapa y tres aros de hierro. En vez de un cilindro
  // liso las tablas se cuentan una a una, que es lo que se ve a un metro.
  function barril(x, z, { alto = .8, r = .34, ry = 0 } = {}) {
    const duelas = 12, ancho = (TAU * r) / duelas * 1.06;
    for (let i = 0; i < duelas; i++) {
      const a = (i / duelas) * TAU + ry;
      // La tabla lleva el grosor en x (radial) y el ancho en z (tangencial) para que ciña
      // la circunferencia en vez de clavarse de canto.
      lote('caja', 'madera', x + Math.cos(a) * r, alto / 2, z + Math.sin(a) * r,
        { ry: -a, esc: [.05, alto, ancho] });
    }
    lote('cil', 'maderaClara', x, alto - .015, z, { esc: [r * 1.86, .03, r * 1.86] });
    for (const y of [alto * .16, alto * .5, alto * .84])
      lote('cil6', 'hierro', x, y, z, { esc: [r * 2.16, .06, r * 2.16] });
    world.addCircle(x, z, r + .22);
  }

  // Tendedero entre dos postes: la cuerda, las telas que se mecen, las pinzas y el fleco.
  function tendedero(x1, z1, x2, z2, { alto = 2.4, telas = 3, semilla = 5 } = {}) {
    const rnd = secuencia(semilla);
    const largo = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
    lote('caja', 'madera', (x1 + x2) / 2, alto, (z1 + z2) / 2, { ry: -ang, rz: Math.PI / 2, esc: [.04, largo, .04], sombra: false });
    for (const [px, pz] of [[x1, z1], [x2, z2]]) {
      lote('cil', 'madera', px, alto / 2, pz, { esc: [.14, alto, .14] });
      // Amarre: la cuerda da dos vueltas al poste antes de tensarse.
      for (const y of [alto - .05, alto - .17])
        lote('cil6', 'tierraHonda', px, y, pz, { esc: [.34, .05, .34], sombra: false });
    }
    const telasList = [];
    const cajaHija = (padre, w, h, d, x, y, z) => {
      const p = new THREE.Mesh(geo.caja, materialDe('maderaClara'));
      p.scale.set(w, h, d); p.position.set(x, y, z); p.castShadow = false;
      padre.add(p); return p;
    };
    for (let i = 0; i < telas; i++) {
      const t = (i + 1) / (telas + 1), tx = x1 + (x2 - x1) * t, tz = z1 + (z2 - z1) * t;
      const ancho = .85 + rnd() * .35;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ancho, 1.25, 3, 4),
        new THREE.MeshStandardMaterial({ color: PALETA.lona, roughness: .95, side: THREE.DoubleSide, transparent: true, opacity: .94 }));
      mesh.position.set(tx, alto - .72, tz); mesh.rotation.y = -ang;
      scene.add(mesh);
      // Pinzas y fleco cuelgan de la tela como hijos: se mecen con ella y no piden otra
      // llamada de dibujo por prenda.
      cajaHija(mesh, .05, .1, .05, -ancho * .3, .6, .012);
      cajaHija(mesh, .05, .1, .05, ancho * .3, .6, .012);
      const fleco = new THREE.InstancedMesh(geo.caja, materialDe('lona'), 7);
      const f = new THREE.Object3D();
      for (let k = 0; k < 7; k++) {
        f.position.set(-ancho / 2 + .06 + k * ((ancho - .12) / 6), -.66, .001);
        f.scale.set(.035, .12 + (k % 2) * .05, .012);
        f.updateMatrix(); fleco.setMatrixAt(k, f.matrix);
      }
      fleco.instanceMatrix.needsUpdate = true; fleco.frustumCulled = false;
      mesh.add(fleco);
      telasList.push({ mesh, fase: rnd() * 6.28, ang });
    }
    if (telasList.length) animar(t => {
      for (const { mesh, fase, ang: a } of telasList) {
        mesh.rotation.z = Math.sin(t * 1.1 + fase) * .09;
        mesh.rotation.y = -a + Math.sin(t * .7 + fase) * .12;
      }
    });
  }

  // Hamaca del portal: lona que cuelga y se mece entre dos amarres.
  function hamaca(x, y, z, ry, { largo = 2.6 } = {}) {
    const lona = new THREE.Mesh(new THREE.PlaneGeometry(largo, .85, 8, 3),
      new THREE.MeshStandardMaterial({ color: PALETA.lona, roughness: .95, side: THREE.DoubleSide }));
    lona.position.set(x, y, z); lona.rotation.set(0, ry, 0); lona.rotateX(-Math.PI / 2);
    scene.add(lona);
    const pos = lona.geometry.attributes.position;
    const base = Float32Array.from(pos.array);
    animar(t => {
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const caida = (1 - Math.abs(bx) / (largo / 2)) ** 2 * .34;
        pos.setY(i, -caida + Math.sin(t * 1.3 + bx * 2) * .055);
        pos.setZ(i, base[i * 3 + 2]);
      }
      pos.needsUpdate = true;
    });
    const L = local(x, z, ry);
    for (const lado of [-1, 1]) {
      const [px, pz] = L(lado * largo / 2, 0);
      lote('caja', 'maderaClara', px, y, pz, { ry, esc: [.07, .07, .07] });
      // Amarre: el cabo que ata la lona al árbol/poste, con su vuelta de cuerda.
      lote('cil6', 'tierraHonda', px, y, pz, { ry, rz: Math.PI / 2, esc: [.17, .06, .17], sombra: false });
      lote('cil6', 'tierraHonda', px, y + .22, pz, { ry, rz: .2, esc: [.05, .5, .05], sombra: false });
    }
    // Fleco del borde que cuelga: hijo de la lona, así se mece con ella. En el sistema local
    // de la tela la lona cae en x-z, de modo que el borde es y = ±.42 y el «abajo» va en z.
    const fleco = new THREE.InstancedMesh(geo.caja, materialDe('lona'), 9);
    const f = new THREE.Object3D();
    for (let k = 0; k < 9; k++) {
      f.position.set(-largo / 2 + .16 + k * ((largo - .32) / 8), .42, -.06);
      f.scale.set(.035, .03, .12 + (k % 2) * .05);
      f.updateMatrix(); fleco.setMatrixAt(k, f.matrix);
    }
    fleco.instanceMatrix.needsUpdate = true; fleco.frustumCulled = false;
    lona.add(fleco);
  }

  // Nasas: las trampas de mimbre apiladas al sol, con sus aros de red, los corchos que las
  // hacen flotar y la cuerda que las amarra. Sin colisión: van sobre la tabla del muelle.
  function nasas(x, z, { n = 3, semilla = 6 } = {}) {
    const rnd = secuencia(semilla);
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = rnd() * .6;
      const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      const R = .62 - i * .07, y = .16 + i * .04;
      lote('cil', 'hojaSeca', px, y, pz, { rx: Math.PI / 2, esc: [R * 2, .46, R * 2] });
      // Aros de la red: dos cinchos de hierro por nasa.
      for (const dy of [-.15, .12])
        lote('cil6', 'hierro', px, y, pz + dy, { rx: Math.PI / 2, esc: [R * 2.06, .04, R * 2.06], sombra: false });
      // Corchos: flotan alrededor de la pila.
      for (let c = 0; c < 2; c++) {
        const ca = rnd() * TAU, cd = R + .16 + rnd() * .12;
        lote('mata', 'maderaClara', px + Math.cos(ca) * cd, y - .05, pz + Math.sin(ca) * cd,
          { esc: [.12, .15, .12], sombra: false });
      }
    }
    // La cuerda que ata el montón, tendida hacia fuera.
    const ang = rnd() * TAU, len = .9 + rnd() * .4;
    lote('caja', 'tierraHonda', x + Math.cos(ang) * len * .5, .05, z + Math.sin(ang) * len * .5,
      { ry: -ang, esc: [len, .035, .035], sombra: false });
  }

  // Juncos y vegetación de orilla: un cañaveral de alturas muy dispares que mezcla cañas
  // redondas con hojas planas y echa espigas en la punta de algunas varas. Sin colisión.
  function junco(x, z, { n = 7, alto = 1.5, semilla = 7, mate = 'hojaSeca' } = {}) {
    const rnd = secuencia(semilla);
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = rnd() * .5;
      const giro = a + (rnd() - .5) * .8;
      const vuelco = (rnd() - .5) * .45;
      const altoVara = alto * (.3 + rnd() * 1.1);
      const bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
      if (i % 2) {
        // Caña redonda: el cilindro va centrado, así que sube media asta.
        lote('cil6', mate, bx, altoVara * .5, bz,
          { rz: vuelco, rx: (rnd() - .5) * .4, esc: [.07, altoVara, .07], sombra: false });
      } else {
        // Hoja plana: la brizna nace de la raíz y se dobla sola, por eso va a ras de suelo.
        lote('brizna', i % 4 === 0 ? 'hojaClara' : mate, bx, 0, bz,
          { ry: giro, rz: vuelco, esc: [.8, altoVara, altoVara], sombra: false });
      }
      // Espiga: un cono fino en la punta de algunas hojas planas, justo donde acaba la lámina.
      // La brizna se dobla, así que la punta se calcula (misma cuenta que `mataFlor`).
      if (i % 4 === 0) {
        euler.set(0, giro, vuelco);
        puntaVara.set(0, altoVara, CURVA_BRIZNA * altoVara).applyEuler(euler);
        lote('cono', 'hojaSeca', bx + puntaVara.x, puntaVara.y, bz + puntaVara.z,
          { ry: giro, rz: vuelco, esc: [.05, .26, .05], sombra: false });
      }
    }
  }

  // Rotulación del cartel y de la carátula del reloj: cada letra es un juego de trazos
  // [x1,y1,x2,y2] sobre una retícula unidad (y hacia arriba). Antes la palabra eran dos guiones
  // grises; con las barras el texto se lee como texto, y su ancho y su número de barras crecen
  // con la palabra. Los numerales romanos del reloj usan el mismo vocabulario.
  const TRAZOS = {
    A: [[0, 0, .5, 1], [.5, 1, 1, 0], [0, .42, 1, .42]],
    C: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0]],
    D: [[0, 0, 0, 1], [0, 1, 1, .82], [1, .82, 1, .18], [1, .18, 0, 0]],
    E: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, .5, .65, .5]],
    I: [[.5, 0, .5, 1]],
    L: [[0, 1, 0, 0], [0, 0, 1, 0]],
    M: [[0, 0, 0, 1], [0, 1, .5, .4], [.5, .4, 1, 1], [1, 1, 1, 0]],
    N: [[0, 0, 0, 1], [0, 1, 1, 0], [1, 0, 1, 1]],
    O: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0]],
    S: [[1, 1, 0, 1], [0, 1, 0, .5], [0, .5, 1, .5], [1, .5, 1, 0], [1, 0, 0, 0]],
    T: [[0, 1, 1, 1], [.5, 1, .5, 0]],
    U: [[0, 1, 0, .2], [0, .2, .3, 0], [.3, 0, .7, 0], [.7, 0, 1, .2], [1, .2, 1, 1]],
    V: [[0, 1, .5, 0], [.5, 0, 1, 1]],
    X: [[0, 0, 1, 1], [0, 1, 1, 0]],
    '·': [[0, 0, 0, 1], [1, 0, 1, 1], [0, .5, 1, .5]],
  };

  // Escritura por trazos en un plano vertical que mira a +z local, centrada en (x, y) y a la
  // profundidad `z` del plano. `L` es el `local()` del dueño de la pieza, porque el cartel de
  // la entrada y la carátula del reloj miran a lados distintos. `anchoMax` reparte el paso
  // para que el texto entre: sin él, una palabra larga se sale de su tabla.
  function rotular(texto, { L, z = 0, ry = 0, x = 0, y = 0, anchoMax = Infinity, pasoMax = .32, alto = .34, grueso = .045, color = 'tierraHonda' }) {
    const letras = [...String(texto || '')].filter(ch => ch !== ' ');
    const n = Math.max(1, letras.length);
    const paso = Math.min(anchoMax / n, pasoMax), ancho = paso * .68;
    letras.forEach((ch, i) => {
      const trazos = TRAZOS[ch.toUpperCase()] || TRAZOS['·'];
      const cx0 = x + (i - (n - 1) / 2) * paso;
      for (const [ax, ay, bx, by] of trazos) {
        const mx = cx0 + (ax - .5) * ancho, my = y + (ay - .5) * alto;
        const nx = cx0 + (bx - .5) * ancho, ny = y + (by - .5) * alto;
        const dx = nx - mx, dy = ny - my;
        const [px, pz] = L((mx + nx) / 2, z);
        lote('caja', color, px, (my + ny) / 2, pz,
          { ry, rz: Math.atan2(dy, dx), esc: [Math.hypot(dx, dy) + grueso, grueso, .04], sombra: false });
      }
    });
  }

  // Cartel de madera del pueblo a la entrada de la calle principal, sobre base de piedra.
  function cartel(x, z, ry, texto = 'MACONDO') {
    const L = local(x, z, ry);
    for (const lado of [-1, 1]) {
      const [px, pz] = L(lado * .95, 0);
      // Base de piedra: el cartel se asienta en el suelo en vez de flotar.
      lote('caja', 'piedraHonda', px, .05, pz, { esc: [.5, .1, .5] });
      lote('caja', 'piedra', px, .32, pz, { esc: [.4, .56, .4] });
      lote('cil', 'madera', px, 1.15, pz, { esc: [.17, 2.3, .17] });
    }
    lote('caja', 'maderaClara', x, 2.0, z, { ry, esc: [2.5, .78, .14] });
    lote('caja', 'estucoClaro', x, 2.0, z, { ry, esc: [2.2, .56, .16], sombra: false });
    // Cada letra se dibuja barra a barra; el paso se reparte para que el texto entre en la
    // tabla por más largo que sea, y el trazo se inclina con su propio ángulo (rz).
    rotular(texto, { L, z: .11, ry, y: 2.0, anchoMax: 1.9 });
    world.addCircle(x, z, .55);
  }

  // Cerca de estacas: límite de un solar sin tapar la vista. Las estacas alternan altura y se
  // inclinan un poco —una cerca real nunca es un peine— pero los dos largueros no se mueven.
  function cerca(x1, z1, x2, z2, { alto = 1.1, paso = .6 } = {}) {
    const rnd = secuencia(Math.round((x1 + z1 + x2 + z2) * 100) + 1);
    const largo = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
    const n = Math.max(2, Math.round(largo / paso));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const hEstaca = alto * (i % 2 ? .82 : 1.06) + (rnd() - .5) * .07;
      lote('cil', 'madera',
        x1 + (x2 - x1) * t + (rnd() - .5) * .06, hEstaca / 2, z1 + (z2 - z1) * t + (rnd() - .5) * .06,
        { ry: ang + (rnd() - .5) * .14, rz: (rnd() - .5) * .1, rx: (rnd() - .5) * .1, esc: [.1, hEstaca, .1] });
    }
    for (const y of [alto * .74, alto * .34])
      lote('caja', 'maderaClara', (x1 + x2) / 2, y, (z1 + z2) / 2, { ry: -ang, rz: Math.PI / 2, esc: [.07, largo, .06] });
  }

  Object.assign(kit, { ventana, puerta, techo, techoHip, chimenea, casa, palmera, banano, arbusto, maceta, farol, reloj, banca, pozo, carreta, barril, tendedero, hamaca, nasas, junco, cartel, cerca });
  return kit;
}
