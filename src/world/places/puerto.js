// Puerto de la espera: río, muelle transitable, bote, banco con la carta del correo y el
// faro del muelle (ancla del encuentro objeto-faro). El agua, las rampas del muelle y sus
// cajas de colisión quedan exactamente como estaban: el circuito vuela a 2,4 m por encima.
import * as THREE from 'three';
import { createRiver, riverHeight } from '../water.js';
import { ancla } from '../anclas.js';
import { secuencia } from '../kit.js';

// La banca del correo: ahí cae la carta plegada del efecto `correo.carta-plegada`. Se exporta
// para que el efecto lea la misma coordenada y la misma superficie en vez de repetirlas.
export const BANCA_DEL_CORREO = { x: -27.5, z: 8.8, alto: .45, superficie: .805 };

// ---------- Geometría del bote ----------
// El casco se barre por estaciones: en cada punto del largo (0 popa … 1 proa) se calcula una
// sección en U —manga, fondo y borda— y las secciones se cosen en una malla. La proa cierra
// en V (la manga tiende a cero) y la popa en espejo; el casco y su contra-cara interior se
// unen por el borde, así que el bote se ve hueco por dentro sin una sola cara de revés.
// Antes eran siete cajas planas: de cerca se leía como una caja flotando.
const LARGO_BOTE = 2.9, MANGA_BOTE = 1.1, PUNTAL_BOTE = .44, Y0_BOTE = -.09;
const EST_BOTE = 13, COST_BOTE = 9, ESPESOR_BOTE = .07;

// La y0 hunde el casco en el agua del grupo: el origen del bote está a la altura de la
// superficie del río (lo coloca la animación) y la animación lo deja 3,5 cm más arriba, así que
// la línea de flotación cae en y = −0,035 dentro del bote. Con y0 = −0,13 el suelo INTERIOR
// quedaba en −0,051 —por debajo de la flotación— y el plano opaco del río tapaba la sentina:
// se veía agua dentro del bote. El margen es estrecho y conviene no perderlo de vista: el suelo
// interior tiene que quedar por encima de −0,035 y el exterior por debajo.
const perfilBote = {
  x: s => (s - .5) * LARGO_BOTE + .10 * LARGO_BOTE * Math.pow(Math.max(0, 2 * s - 1), 2),
  b: s => Math.max(.018, (MANGA_BOTE / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(s, 2.6))) * (.45 + .55 * Math.min(1, s * 3.2))),
  borda: s => PUNTAL_BOTE * (.88 + .30 * Math.pow(Math.abs(2 * s - 1), 1.8)),
  fondo: s => PUNTAL_BOTE * (.02 + .20 * Math.pow(Math.abs(2 * s - 1), 2.2)),
};

// Punto de la borda (borde superior) en la estación `s` y el costado `v` (0 babor, 1 estribor).
function bordaBote(s, v) {
  return [perfilBote.x(s), perfilBote.borda(s) + Y0_BOTE, -Math.cos(Math.PI * v) * perfilBote.b(s)];
}

// Une geometrías en una sola malla, sin depender de three/examples. El bote se mueve entero
// —la misma animación lo mece con el río—, así que su herraje viaja en el menor número de
// llamadas de dibujo posible.
function fusionar(geometrias) {
  const partes = geometrias.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of partes) total += g.attributes.position.count;
  const posicion = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let p3 = 0, p2 = 0;
  for (const g of partes) {
    posicion.set(g.attributes.position.array, p3);
    if (g.attributes.normal) normal.set(g.attributes.normal.array, p3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, p2);
    p3 += g.attributes.position.count * 3;
    p2 += g.attributes.position.count * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posicion, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

// Caja y tubo ya colocados, en el mismo orden de Euler 'XYZ' que `lote`: el tumbo en z va
// primero, el giro en y después y la inclinación en x al final.
function cajaEn(w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  if (rx) g.rotateX(rx);
  g.translate(x, y, z);
  return g;
}
function tuboEn(r, h, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(.5, .5, 1, 8);
  g.scale(r * 2, h, r * 2);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  if (rx) g.rotateX(rx);
  g.translate(x, y, z);
  return g;
}

// El casco: dos superficies (exterior e interior) cosidas por el borde del bote.
function geoCasco() {
  const superficie = (es) => {
    const P = [];
    for (let i = 0; i < EST_BOTE; i++) {
      const s = i / (EST_BOTE - 1);
      const x = perfilBote.x(s);
      const b = Math.max(.004, perfilBote.b(s) - es);
      const borda = perfilBote.borda(s) - es, fondo = perfilBote.fondo(s) + es;
      for (let j = 0; j < COST_BOTE; j++) {
        const v = j / (COST_BOTE - 1);
        // El seno ablanda la quilla: exponente < 1 deja el fondo redondo y no en V cerrada.
        const caida = Math.pow(Math.sin(Math.PI * v), .72);
        P.push(x, borda - (borda - fondo) * caida + Y0_BOTE, -Math.cos(Math.PI * v) * b);
      }
    }
    return P;
  };
  const fuera = superficie(0), dentro = superficie(ESPESOR_BOTE);
  const pos = [];
  const vx = (p, k) => [p[k * 3], p[k * 3 + 1], p[k * 3 + 2]];
  const tri = (a, b, c) => { pos.push(...a, ...b, ...c); };
  const idx = (i, j) => i * COST_BOTE + j;
  for (let i = 0; i < EST_BOTE - 1; i++)
    for (let j = 0; j < COST_BOTE - 1; j++) {
      const A = idx(i, j), B = idx(i + 1, j), C = idx(i, j + 1), D = idx(i + 1, j + 1);
      tri(vx(fuera, A), vx(fuera, B), vx(fuera, C));
      tri(vx(fuera, B), vx(fuera, D), vx(fuera, C));
      // La cara interior gira al revés: su normal tiene que mirar a la sentina, no al agua.
      tri(vx(dentro, A), vx(dentro, C), vx(dentro, B));
      tri(vx(dentro, B), vx(dentro, C), vx(dentro, D));
    }
  // Borde: recorre la borda de babor, la proa, la de estribor y el espejo de popa, y cose
  // cada punto exterior con su pareja interior. Es a la vez la regala y el remate del espejo.
  const vuelta = [];
  for (let i = 0; i < EST_BOTE; i++) vuelta.push(idx(i, 0));
  for (let j = 1; j < COST_BOTE; j++) vuelta.push(idx(EST_BOTE - 1, j));
  for (let i = EST_BOTE - 2; i >= 0; i--) vuelta.push(idx(i, COST_BOTE - 1));
  for (let j = COST_BOTE - 2; j >= 1; j--) vuelta.push(idx(0, j));
  for (let k = 0; k < vuelta.length; k++) {
    const a = vuelta[k], b = vuelta[(k + 1) % vuelta.length];
    tri(vx(fuera, a), vx(fuera, b), vx(dentro, a));
    tri(vx(fuera, b), vx(dentro, b), vx(dentro, a));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// Herraje: regalas, quilla, roda, espejo y bancos, en una sola malla.
function geoHerraje() {
  const partes = [];
  const borde = (s, v) => bordaBote(s, v);
  for (const v of [0, 1]) partes.push(geoRegala(v));
  const paso = 2;                          // la quilla es recta: dos estaciones por tramo bastan
  for (let i = 0; i < EST_BOTE - 1; i += paso) {              // quilla al fondo
    const j = Math.min(EST_BOTE - 1, i + paso);
    const a = [perfilBote.x(i / (EST_BOTE - 1)), perfilBote.fondo(i / (EST_BOTE - 1)) + Y0_BOTE - .01, 0];
    const b = [perfilBote.x(j / (EST_BOTE - 1)), perfilBote.fondo(j / (EST_BOTE - 1)) + Y0_BOTE - .01, 0];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    partes.push(cajaEn(len * 1.06, .05, .11, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0,
      0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])));
  }
  const proa = perfilBote.x(1), popa = perfilBote.x(0);
  partes.push(cajaEn(.08, perfilBote.borda(1) - perfilBote.fondo(1) + .06, .12,      // roda
    proa, (perfilBote.borda(1) + perfilBote.fondo(1)) / 2 + Y0_BOTE, 0, 0, 0, -.2));
  partes.push(cajaEn(.07, perfilBote.borda(0) - perfilBote.fondo(0), perfilBote.b(0) * 1.9,  // espejo
    popa - .02, (perfilBote.borda(0) + perfilBote.fondo(0)) / 2 + Y0_BOTE, 0));
  const piso = perfilBote.fondo(.5) + ESPESOR_BOTE + Y0_BOTE;
  for (const s of [.24, .52, .80]) {                          // bancos
    partes.push(cajaEn(.32, .06, perfilBote.b(s) * 1.56, perfilBote.x(s), piso + .13, 0));
  }
  for (const [s, v] of [[.32, 0], [.32, 1], [.68, 0], [.68, 1]]) {   // toletes
    const p = borde(s, v);
    partes.push(tuboEn(.05, .16, p[0], p[1] + .06, p[2], 0, 0, 0));
  }
  return fusionar(partes);
}

// Los dos remos descansan dentro del bote, cruzados sobre los bancos: la pala hacia proa.
function geoRemos() {
  const partes = [];
  const piso = perfilBote.fondo(.5) + ESPESOR_BOTE + Y0_BOTE;
  for (const lado of [-1, 1]) {
    const z = lado * .17, y = piso + .2, x = .06;
    partes.push(tuboEn(.035, 1.75, x, y, z, 0, lado * .13, Math.PI / 2));
    partes.push(cajaEn(.34, .035, .15, x + .72, y, z + lado * .05, 0, lado * .13, 0));
  }
  return fusionar(partes);
}

// La regala, barrida a lo largo de la borda: una cinta continua con su canto. Antes eran cajas
// sueltas por tramo y en las curvas quedaban muescas entre una y otra —se leía como una cadena
// de bloques—. Mismo criterio que el casco: una superficie barrida por estaciones.
function geoRegala(v) {
  const ANCHO = .14, CANTO = .07, SUBE = .035;
  const filas = [];
  for (let i = 0; i < EST_BOTE; i++) filas.push(bordaBote(i / (EST_BOTE - 1), v));
  const lats = filas.map((_, i) => {
    const a = filas[Math.max(0, i - 1)], b = filas[Math.min(EST_BOTE - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[2] - a[2], l = Math.hypot(tx, tz) || 1;
    return [-tz / l, tx / l];             // normal horizontal a la tangente
  });
  // La normal lateral apunta al centro del bote: el canto de fuera es el contrario en babor.
  const fuera = v ? 1 : -1;
  // Sección rectangular de la regala, recorrida en orden: 0 arriba-fuera, 1 arriba-dentro,
  // 2 abajo-dentro, 3 abajo-fuera. Se barre entera entre estaciones: cuatro caras, un tubo.
  const esquina = (i, k) => {
    const p = filas[i], [nx, nz] = lats[i];
    const lado = (k === 0 || k === 3) ? 1 : -1;
    const dy = (k === 0 || k === 1) ? SUBE : SUBE - CANTO;
    return [p[0] + nx * lado * fuera * ANCHO / 2, p[1] + dy, p[2] + nz * lado * fuera * ANCHO / 2];
  };
  const pos = [];
  // El sentido del triángulo se decide con la normal de referencia, no a ojo: si sale al revés,
  // la cara no se ve (el material es de una sola cara) y la regala desaparece.
  const tri = (a, b, c, ref) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) pos.push(...a, ...c, ...b);
    else pos.push(...a, ...b, ...c);
  };
  for (let i = 0; i < EST_BOTE - 1; i++) {
    const sec = [0, 1, 2, 3].map(k => esquina(i, k));
    const sec2 = [0, 1, 2, 3].map(k => esquina(i + 1, k));
    // El eje del tramo es la media de las ocho esquinas: la referencia de cada cara es el vector
    // que va del eje a su centro, así que apunta siempre hacia fuera del tubo.
    const eje = [0, 1, 2].map(c => (sec[0][c] + sec[1][c] + sec[2][c] + sec[3][c] + sec2[0][c] + sec2[1][c] + sec2[2][c] + sec2[3][c]) / 8);
    for (let k = 0; k < 4; k++) {
      const A = sec[k], B = sec[(k + 1) % 4], C = sec2[k], D = sec2[(k + 1) % 4];
      const ref = [0, 1, 2].map(c => (A[c] + B[c] + C[c] + D[c]) / 4 - eje[c]);
      tri(A, C, B, ref); tri(C, D, B, ref);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Se cachean: la aldea se construye varias veces (una por prueba) y el barrido no cambia.
const cacheBote = { casco: null, herraje: null, remos: null };
const piezaBote = (clave, construir) => (cacheBote[clave] ??= construir());

export function buildPuerto(ctx) {
  const { kit, scene } = ctx;
  const { lote, cil, caja, local, animar } = kit;

  // ---------- Río ----------
  createRiver(scene, kit);

  // El agua no se cruza: mismas cajas de colisión que la versión anterior (el muelle queda
  // libre entre z 6,4 y 9,6, y su tramo oeste cierra a partir de x −36,3).
  kit.colisionCaja(-48, -48, -24.3, 6.4);
  kit.colisionCaja(-48, 9.6, -24.3, 48);
  kit.colisionCaja(-48, 6.4, -36.3, 9.6);

  // Ribera opuesta: sostiene los árboles y hace legible el cauce.
  const ribera = new THREE.Mesh(new THREE.PlaneGeometry(16,120),kit.m('arena'));
  ribera.rotation.x = -Math.PI/2; ribera.position.set(-58,.14,-5); scene.add(ribera);
  const vegetacionRibera = new THREE.Mesh(new THREE.PlaneGeometry(14,120),kit.m('hoja'));
  vegetacionRibera.rotation.x=-Math.PI/2; vegetacionRibera.position.set(-59,.16,-5); scene.add(vegetacionRibera);

  // Orilla lejana: árboles al oeste del río para dar profundidad. Cada uno lleva ahora copa
  // por lóbulos de tres tonos y dos raíces a la vista que se agarran a la arena. Como están
  // al otro lado del agua y fuera del cuadro de sombras, todo entra por `lote` (sin sombra):
  // seis árboles no cuestan seis mallas y el detalle es el que la distancia admite.
  for (const [tx, tz, s, semilla] of [[-52, 2, 1.4, 501], [-55, 10, 1.2, 502], [-51, 16, 1.5, 503],
    [-57, -4, 1.3, 504], [-53, 22, 1.1, 505], [-58, 14, 1.6, 506]]) {
    const r = secuencia(semilla), alto = 3 * s;
    lote('cil6', 'tronco', tx, alto / 2, tz, { esc: [.44 * s, alto, .44 * s] });
    for (let i = 0; i < 2; i++) {                          // raíces expuestas sobre la arena
      const a = r() * Math.PI * 2;
      lote('cil6', 'tronco', tx + Math.cos(a) * .34 * s, .14, tz + Math.sin(a) * .34 * s,
        { rz: Math.cos(a) * 1.12, rx: -Math.sin(a) * 1.12, esc: [.21 * s, 1.25 * s, .21 * s] });
    }
    for (let i = 0; i < 3; i++) {                          // copa irregular, tres tonos
      const a = (i / 3) * Math.PI * 2 + r() * .6, d = (.55 + r() * .7) * s;
      lote('esfera', i === 1 ? 'hojaClara' : (i === 2 ? 'hojaSeca' : 'hoja'),
        tx + Math.cos(a) * d, alto + .6 * s + r() * .9 * s, tz + Math.sin(a) * d,
        { esc: [1.9 * s * (.8 + r() * .4), 1.5 * s, 1.9 * s * (.8 + r() * .4)] });
    }
    lote('esfera', 'hoja', tx, alto + .8 * s, tz, { esc: [2.1 * s, 1.6 * s, 2.1 * s] });
  }
  // Matorral bajo de la ribera: manchas de verde que rompen la línea de la arena. Esfera de
  // pocas caras —de una orilla a otra hay más de 35 m—, en vez de la esfera de 80 del pueblo.
  for (let i = 0; i < 6; i++) {
    const bx = -61 - (i % 3) * 1.4, bz = -17 + i * 7.4;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i;
      lote('mata', i % 3 ? 'hoja' : 'hojaSeca', bx + Math.cos(a) * .28, .34 + .16 * (k % 2), bz + Math.sin(a) * .28,
        { esc: [1.5, 1.1, 1.5], sombra: false });
    }
  }
  // Juncos y arena de la orilla. Se dejan libres los 6 m del embarcadero (z 4…12) para que
  // el vuelo entre a la rampa del muelle sin cañaveral en medio.
  let juncoN = 0;
  for (let z = -18; z <= 30; z += 2.1) {
    if (z > 3.5 && z < 12.5) continue;
    kit.junco(-23.6 - (juncoN % 3) * .55, z, { n: 6, alto: 1.4, semilla: 200 + juncoN });
    juncoN++;
  }
  for (let z = -17; z <= 30; z += 2.6) {
    if (z > 3.5 && z < 12.5) continue;
    lote('cil', 'arena', -23.9, .05, z, { esc: [1.4, .1, 2.6], sombra: false });
  }

  // ---------- Muelle ----------
  // Altura transitable: la tabla del muelle a 0,35 m y una transición corta desde la orilla.
  // Sin estas dos rampas el vuelo cruza el muelle a la altura de la arena.
  kit.world.addRamp(-36, 6.7, -24, 9.3, () => .35);
  kit.world.addRamp(-24, 6.7, -22.8, 9.3, x => .35 * ((-22.8 - x) / 1.2));
  caja('madera', 12, .35, 2.6, -30, .17, 8);
  for (let i = 0; i < 22; i++) {                          // tablones
    lote('caja', 'maderaClara', -35.9 + i * .54, .36, 8, { esc: [.44, .04, 2.5] });
  }
  for (let i = 0; i < 6; i++) {                           // pilotes con cabeza y aro
    for (const pz of [6.9, 9.1]) {
      const px = -25.5 - i * 2;
      cil('madera', .11, 1.5, px, .55, pz);
      lote('cil', 'hierro', px, .42, pz, { esc: [.3, .06, .3] });
      lote('esfera', 'maderaClara', px, 1.32, pz, { esc: [.3, .24, .3] });
    }
  }
  for (const pz of [6.9, 9.1]) {                          // pasamanos de cuerda
    lote('caja', 'maderaClara', -30, .95, pz, { rz: Math.PI / 2, esc: [.07, 11.6, .07], sombra: false });
  }
  kit.colisionCirculo(-34, 8.1, .6);
  cil('madera', .42, .5, -34.2, .42, 8.1);                 // cabrestante
  cil('maderaClara', .3, .18, -34.2, .74, 8.1);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    lote('caja', 'madera', -34.2 + Math.cos(a) * .38, .78, 8.1 + Math.sin(a) * .38,
      { ry: -a, esc: [.5, .07, .07] });
  }
  for (const [px, pz, r] of [[-25.2, 9.2, .22], [-31.4, 9.2, .22]]) {   // norays
    cil('hierro', r, .34, px, .5, pz);
    lote('cil', 'hierro', px, .67, pz, { esc: [r * 2.6, .1, r * 2.6] });
    kit.colisionCirculo(px, pz, r + .2);
  }
  kit.barril(-26.6, 9.05, { alto: .78, r: .33 });
  kit.barril(-27.4, 8.95, { alto: .62, r: .3 });
  kit.nasas(-29.4, 9.05, { n: 3, semilla: 81 });
  caja('madera', .9, .6, .7, -32.4, .65, 9.0);             // cajas de pesca
  caja('maderaClara', .7, .5, .6, -32.5, 1.2, 8.95, .2);

  // ---------- Bote amarrado ----------
  // Sigue siendo un Group con la misma animación (la que lee `riverHeight` y lo mece con el
  // río); lo que cambió es la pieza: un casco barrido por estaciones, hueco por dentro, en
  // vez de siete cajas planas. Sus tres mallas (casco, herraje y remos) viajan juntas.
  const bote = new THREE.Group(); bote.position.set(-31.5, .12, 3.2); bote.rotation.y = .4; scene.add(bote);
  const casco = new THREE.Mesh(piezaBote('casco', geoCasco), kit.m('madera'));
  casco.castShadow = casco.receiveShadow = true; bote.add(casco);
  const herraje = new THREE.Mesh(piezaBote('herraje', geoHerraje), kit.m('maderaClara'));
  herraje.castShadow = true; bote.add(herraje);
  const remos = new THREE.Mesh(piezaBote('remos', geoRemos), kit.m('maderaClara'));
  remos.castShadow = true; bote.add(remos);
  // La red va enrollada en la sentina, no extendida: antes era un plano translúcido de
  // 1,4 × 0,95 m y se leía como una cartulina verde metida en el bote. Dos rollos tumbados
  // caben de sobra en los 24 cm de puntal interior.
  const red = new THREE.Mesh(fusionar([
    tuboEn(.08, 1, -.4, .075, -.06, 0, 0, Math.PI / 2),
    tuboEn(.06, .78, -.34, .075, .1, 0, .12, Math.PI / 2),
  ]), kit.m('hojaSeca'));
  red.castShadow = true; bote.add(red);
  animar(t => { bote.position.y = riverHeight(-31.5, 3.2, t) + .035; bote.rotation.z = (riverHeight(-30.5,3.2,t)-riverHeight(-32.5,3.2,t))*.5; bote.rotation.x = (riverHeight(-31.5,3.7,t)-riverHeight(-31.5,2.7,t)); });

  // ---------- Banco del correo (ahí cae la carta del efecto) ----------
  caja('banco', 1.7, BANCA_DEL_CORREO.alto, .55, BANCA_DEL_CORREO.x,
    BANCA_DEL_CORREO.superficie - BANCA_DEL_CORREO.alto / 2, BANCA_DEL_CORREO.z, Math.PI / 2);

  // ---------- Atril con la carta sin abrir (ancla del encuentro carta) ----------
  const sobre = ancla('carta');
  const atril = caja('madera', .55, .7, .05, sobre.x, .9, sobre.z, 0);
  atril.rotation.x = -.35;
  lote('cil', 'madera', sobre.x, .45, sobre.z, { esc: [.14, .9, .14] });
  lote('caja', 'madera', sobre.x, .12, sobre.z, { esc: [.7, .22, .7] });
  const papel = new THREE.Mesh(new THREE.PlaneGeometry(.4, .5), kit.m('blanco'));
  papel.position.set(sobre.x, .95, sobre.z - .07); papel.rotation.x = -.35; scene.add(papel);

  // ---------- Faro del muelle (ancla del encuentro objeto-faro) ----------
  const torre = ancla('objeto-faro');
  const FX = torre.x, FZ = torre.z;
  cil('piedraHonda', .62, .5, FX, .25, FZ);
  cil('blanco', .45, 4.4, FX, 2.65, FZ);
  for (const y of [1.2, 2.6, 4.0]) cil('coral', .48, .62, FX, y, FZ);
  cil('blanco', .38, .5, FX, 5.05, FZ);
  const linterna = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .55, 10), kit.mat.linterna);
  linterna.position.set(FX, 5.05, FZ); scene.add(linterna);
  cil('hierro', .42, .12, FX, 5.38, FZ);
  cil('teja', .34, .3, FX, 5.58, FZ);
  lote('cono', 'teja', FX, 5.9, FZ, { esc: [.76, .42, .76] });
  for (let i = 0; i < 8; i++) {                            // baranda de la galería
    const a = (i / 8) * Math.PI * 2;
    lote('cil', 'hierro', FX + Math.cos(a) * .44, 4.65, FZ + Math.sin(a) * .44, { esc: [.06, .5, .06] });
  }
  lote('cil', 'hierro', FX, 4.9, FZ, { esc: [1.0, .06, 1.0] });
  animar(t => { linterna.material.emissiveIntensity = Math.sin(t * 2.2) > .55 ? 2.4 : .15; });
  kit.colisionCirculo(FX, FZ, .55);
}
