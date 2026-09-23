// Capa de vida del pueblo: fauna instanciada, humo de chimeneas, luz de ventanas, polvo a
// contraluz, viento en la vegetación y agua en movimiento. Todo entra por el mismo
// acumulador del kit, así que cada familia de bichos o partículas cuesta UNA llamada de
// dibujo; y todo cuelga de `kit.actualizar`, que main.js congela con el chip «Pausar
// movimiento» y con `prefers-reduced-motion` (spec §89: sin efectos continuos).
//
// Ojo con el orden de Euler: en 'XYZ' (el de por defecto) la rotación z se aplica primero
// y la x al final. Por eso los cuerpos alargados (aves, libélulas) tumban su eje con z y
// giran con y; poner el tumbo en x los dejaría apuntando al norte del mundo. Y por lo mismo
// un ALABEO no cabe en `rotation.x`: iría sobre el eje del mundo y no sobre el del cuerpo.
// Para alabear —el banqueo de las aves— va `o.rotateX(...)` después del rumbo: es local.
import * as THREE from 'three';
import { secuencia } from './kit.js';
import { ancla, superficieDe } from './anclas.js';
import { geometriaAla, materialAlaSimple } from './butterflyAvatar.js';

// Giro sobre Y para un modelo cuyo frente es -z (la convención del avatar).
const rumboZ = (vx, vz) => Math.atan2(-vx, -vz);
// Giro sobre Y para un modelo tumbado con z, cuyo frente queda en +x. Trampa pagada aquí:
// ry(ψ) lleva +x a (cos ψ, 0, −sen ψ), así que apuntar el frente a (vx, vz) pide atan2(−vz, vx).
// Con el signo anterior —atan2(vz, vx)— aves y libélulas volaban espejadas: de costado en los
// extremos de su elipse y de cola en el centro. Con un cono y un palo de 4 cm nadie lo vio;
// con silueta de verdad salta a la vista.
const rumboX = (vx, vz) => Math.atan2(-vz, vx);

export function crearVida(ctx) {
  const { kit, scene, camera } = ctx;
  const { movil, animar, m } = kit;
  const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = secuencia(13);
  const TAU = Math.PI * 2;

  // ---------- Mariposas del pueblo (fase 2 de §10: alas pintadas, instanciadas) ----------
  // Tres familias en la misma malla: las 26 sueltas, las 9 de la espiral del jardín y las
  // 10 de la bandada que cruza la plaza. Antes eran ~90 mallas; ahora son 4 llamadas.
  const SUELTAS = 26, ESPIRAL = 9, TOTAL = SUELTAS + ESPIRAL + 10;
  // La espiral gira sobre la banca del jardín y los pétalos caen del árbol del tiempo: las
  // dos posiciones salen de sus anclas de encuentro, no de literales repetidos.
  const banca = ancla('objeto-espiral');
  const espiral = { x: banca.x, z: banca.z, y: superficieDe('objeto-espiral', 0) };
  const arbol = ancla('arbol-tiempo');
  const sueltas = [];
  for (let i = 0; i < SUELTAS; i++) {
    sueltas.push({
      radio: 6 + rnd() * 16, altura: 1.6 + rnd() * 3, vel: .12 + rnd() * .15,
      fase: rnd() * TAU, k: .5 + rnd() * .6,
    });
  }
  const bandada = [];
  for (let i = 0; i < 10; i++) bandada.push({ off: i * .55 });

  const salida = { x: 0, y: 0, z: 0, rumbo: 0, escala: .5, aleteo: 0 };
  function ubicar(i, t) {
    if (i < SUELTAS) {
      const b = sueltas[i], a = t * b.vel + b.fase;
      salida.x = Math.cos(a) * b.radio;
      salida.z = Math.sin(a * .8) * b.radio * .7;
      salida.y = b.altura + Math.sin(t * 1.3 + b.fase) * .4;
      salida.rumbo = rumboZ(-Math.sin(a) * b.radio, Math.cos(a * .8) * b.radio * .7 * .8);
      salida.escala = .5; salida.aleteo = t * 14 + b.fase;
    } else if (i < SUELTAS + ESPIRAL) {
      const k = i - SUELTAS, ang = k * .75 + t * .9;
      const r = .18 + Math.sin(k * .8) * .09;
      salida.x = espiral.x + Math.cos(ang) * r;
      salida.z = espiral.z + Math.sin(ang) * r;
      salida.y = espiral.y + k * .17 + Math.sin(t * 2 + k) * .05;
      salida.rumbo = ang + Math.PI / 2;
      salida.escala = .34; salida.aleteo = t * 10 + k;
    } else {
      const f = bandada[i - SUELTAS - ESPIRAL];
      const z = 26 - ((t % 22) / 22) * 44;                 // cruza la plaza hacia la casa
      salida.x = Math.sin(t * 2 + f.off * 2) * 1.6 + (f.off % 3) - 1;
      salida.z = z - f.off * .8;
      salida.y = 3.2 + Math.sin(t * 3 + f.off) * .5;
      salida.rumbo = Math.PI;
      salida.escala = .42; salida.aleteo = t * 16 + f.off;
    }
  }

  const escalaAla = { anterior: 1, posterior: .9 };
  const material = {
    anterior: materialAlaSimple('anterior', ctx.renderer),
    posterior: materialAlaSimple('posterior', ctx.renderer),
  };
  const DESFASE = .85;                                     // el ala posterior va detrás (spec §4.5)
  const PLEGADO = .55;                                     // pose fija con movimiento reducido
  for (const clave of ['anterior', 'posterior']) {
    for (const lado of [1, -1]) {
      movil(geometriaAla(clave), material[clave], TOTAL, (o, i, t) => {
        ubicar(i, quieto ? i * 3.1 : t);
        const elev = quieto ? PLEGADO : Math.sin(salida.aleteo + (clave === 'posterior' ? DESFASE : 0)) * .95 + .1;
        o.position.set(salida.x, salida.y, salida.z);
        o.rotation.set(0, salida.rumbo, elev * lado);
        o.scale.set(salida.escala * escalaAla[clave] * lado, salida.escala * escalaAla[clave], salida.escala * escalaAla[clave]);
      });
    }
  }

  // ---------- Fauna ----------
  if (!quieto) creaAves(kit, rnd);
  creaLibelulas(kit, quieto, rnd);
  if (!quieto && kit.chimeneas.length) creaHumo(kit, rnd);
  if (!quieto) creaPolvo(kit, rnd);
  creaPetalos(kit, camera, quieto, rnd, arbol);

  // ---------- Agua ----------
  creaAgua(kit, scene, quieto, rnd);

  // ---------- Viento en la vegetación ----------
  kit.crearViento((o, item, t) => {
    const vaiven = quieto ? .05 : Math.sin(t * 1.1 + item.fase) * item.amp;
    o.position.set(item.x, item.y, item.z);
    // `rx ?? 0`: una pieza que se registre sin vuelco no puede dejar la rotación en NaN.
    // Pasó —`banano()` no lo pasaba— y el NaN no se quedaba en su hoja: el `tmp` que el kit
    // comparte entre familias quedaba envenenado y las gotas de la fuente del pueblo entero
    // dejaron de dibujarse. Ver el mismo blindaje en `kit.movil`.
    o.rotation.set(item.rx ?? 0, item.ry, item.rz + vaiven);
    o.scale.set(item.esc[0], item.esc[1], item.esc[2]);
  });

  // La luz de las ventanas respira: un solo material para todas, así que late al unísono.
  const luzVentanas = m('ventanaLuz');
  const colorBase = new THREE.Color(0xffdcab), colorTenue = new THREE.Color(0xffa955);
  if (!quieto) animar(t => {
    const k = .5 + Math.sin(t * .35) * .5;
    luzVentanas.color.copy(colorTenue).lerp(colorBase, .55 + k * .45);
  });

  return { update() {} };   // la animación vive en kit.actualizar (móviles + animados)
}

// ---------- Siluetas de fauna ----------
// Aves y libélulas dejaron de ser un cono y un palo. Cada silueta se funde UNA vez aquí y
// todas sus instancias comparten la malla. Ninguna se construye con movimiento reducido,
// salvo la libélula, que sí existe —en pose fija.

// Funde geometrías de three y triángulos sueltos en una sola malla. Solo viaja la posición:
// el material plano de las aves no lee normales ni texturas, y lo que importa es que la
// familia entera quepa en una llamada de dibujo. Los normales se recalculan al final porque
// el cuerpo de la libélula sí va con material con luz (`hojaClara`). flora.js tiene un
// `fusionar` con el mismo oficio, pero es privado: un privado no se importa.
function fusionar(geometrias, sueltos) {
  const partes = geometrias.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of partes) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3 + sueltos.length);
  let p = 0;
  for (const g of partes) { pos.set(g.attributes.position.array, p); p += g.attributes.position.count * 3; }
  pos.set(sueltos, p);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();                    // no indexado: cara plana, como el modelo entero
  return geo;
}

// Triángulo suelto escrito por los DOS lados (mismos vértices, orden invertido). Las láminas
// —alas y cola— tienen que verse desde arriba y desde abajo: la mariposa vuela bajo y las
// mira desde la panza, que es justo el lado donde una cara suelta desaparece.
function dosLados(destino, a, b, c) { destino.push(...a, ...b, ...c, ...a, ...c, ...b); }

// Silueta de ave: cuerpo, cabeza, cola ahorquillada y dos alas barridas, en ±z y con el
// frente en +x (la convención tumbada de este archivo). 28 triángulos que las doce comparten.
function geometriaAve() {
  const sueltos = [];
  for (const lado of [1, -1]) {
    // Ala barrida: la punta va por detrás del hombro y sube un poco (dédalo en V).
    dosLados(sueltos, [.10, .02, lado * .06], [-.16, .01, lado * .05], [-.30, .05, lado * .54]);
    dosLados(sueltos, [.10, .02, lado * .06], [-.30, .05, lado * .54], [-.09, .07, lado * .62]);
  }
  dosLados(sueltos, [-.24, .02, -.10], [-.24, .02, .10], [-.58, .05, .09]);      // cola
  dosLados(sueltos, [-.24, .02, -.10], [-.58, .05, .09], [-.58, .05, -.09]);
  const cuerpo = new THREE.OctahedronGeometry(.5, 0).scale(.58, .2, .2);
  const cabeza = new THREE.OctahedronGeometry(.5, 0).scale(.17, .16, .16).translate(.33, .015, 0);
  return fusionar([cuerpo, cabeza], sueltos);
}

// Aves que cruzan alto, planeando, en un solo InstancedMesh. El alabeo llega con `rotateX`
// DESPUÉS del rumbo: en Euler 'XYZ' la x se aplica la última y sobre el eje del mundo, así
// que el banqueo tiene que ser una rotación local del cuerpo ya girado. El alabeo lento
// —catorce segundos de vuelta— es lo que las lee como planeadoras y no como conos flotando;
// el fijo las inclina hacia la curva que ya están tomando (su elipse gira siempre al mismo
// lado). El cabeceo sí va en `z`, cuerpo a cuerpo, y por eso módico.
function creaAves(kit, rnd) {
  const aves = [];
  for (let i = 0; i < 12; i++) {
    aves.push({
      radio: 26 + rnd() * 16, altura: 13 + rnd() * 7, vel: .05 + rnd() * .04, fase: rnd() * 6.28,
      tamano: .55 + rnd() * .4, planeo: .35 + rnd() * .45, fasePlaneo: rnd() * 6.28,
    });
  }
  kit.movil(geometriaAve(), 'ave', aves.length, (o, i, t) => {
    const a = aves[i], ang = t * a.vel + a.fase;
    const vx = -Math.sin(ang) * a.radio, vz = Math.cos(ang) * a.radio * .7 * .8;
    o.position.set(Math.cos(ang) * a.radio, a.altura + Math.sin(t * .4 + a.fase) * 1.2, Math.sin(ang) * a.radio * .7);
    o.rotation.set(0, rumboX(vx, vz), Math.sin(t * .5 + a.fase) * .12);
    o.rotateX(.28 + Math.sin(t * .45 + a.fasePlaneo) * a.planeo);
    o.scale.setScalar(a.tamano);
  }, { sombra: false });
}

// Libélula: abdomen largo y afilado, tórax, cabeza con ojos y CUATRO alas. El cuerpo se funde
// en una malla y las alas en otra —dos llamadas, la excepción que el presupuesto permite para
// un modelo de dos piezas— porque el ala tiene que batir por su cuenta y una instancia que
// gira entera no lo finge. Todo mira hacia +x, como las aves, así que comparte `rumboX`.
function geometriaCuerpoLibelula() {
  // El abdomen es un cono ABIERTO: su base queda dentro del tórax y la cara que le falta no
  // se ve nunca. Seis caras en vez de doce, y sigue siendo una aguja que se afila hacia atrás.
  const abdomen = new THREE.ConeGeometry(.5, 1, 6, 1, true)
    .rotateZ(Math.PI / 2)                       // el vértice pasa a −x: la punta de la cola
    .scale(.88, .11, .11).translate(-.34, 0, 0);
  const torax = new THREE.OctahedronGeometry(.5, 0).scale(.26, .17, .17).translate(.13, 0, 0);
  const cabeza = new THREE.OctahedronGeometry(.5, 0).scale(.16, .14, .14).translate(.3, .015, 0);
  // Los dos ojos de facetas son la firma de una libélula: dos motas a los lados de la cabeza.
  const ojos = [1, -1].map(s => new THREE.OctahedronGeometry(.5, 0).scale(.1, .1, .1).translate(.28, .05, s * .07));
  return fusionar([abdomen, torax, cabeza, ...ojos], []);
}

// Ala suelta: raíz en el origen y largo hacia +z —igual que el pétalo—, para que el barrido
// sea un giro en `y` y el batido uno en `x`. Larga y estrecha, con la punta redondeada.
function geometriaAlaLibelula() {
  const sueltos = [];
  dosLados(sueltos, [.09, 0, 0], [-.05, 0, .14], [.07, .01, .94]);
  dosLados(sueltos, [-.05, 0, .14], [-.07, .01, .97], [.07, .01, .94]);
  return fusionar([], sueltos);
}

// Libélulas sobre el río, a ras del agua. Seis cuerpos y sus veinticuatro alas; el vuelo de
// cada una sale de `ubica` y el ala lo repite para saber dónde quedó la raíz —recalcular es
// más barato que ordenar dos mallas y dependía de que la primera fuera la de arriba—.
function creaLibelulas(kit, quieto, rnd) {
  const libs = [];
  for (let i = 0; i < 6; i++) {
    libs.push({
      x: -26 - rnd() * 8, z: -2 + rnd() * 14, alto: .8 + rnd() * .8,
      fase: rnd() * 6.28, vel: .5 + rnd() * .4, tamano: .12 + rnd() * .03,
    });
  }
  const sitio = { x: 0, y: 0, z: 0, rumbo: 0, cabeceo: 0 };
  function ubica(l, t) {
    const ang = t * l.vel + l.fase;
    sitio.x = l.x + Math.cos(ang) * 1.4;
    sitio.z = l.z + Math.sin(ang * .8) * 1.6;
    sitio.y = .9 + l.alto + Math.sin(ang * 1.7) * .3;
    sitio.rumbo = rumboX(-Math.sin(ang) * 1.4, Math.cos(ang * .8) * 1.6 * .8);
    sitio.cabeceo = quieto ? .05 : Math.sin(t * 3 + l.fase) * .13;
  }
  kit.movil(geometriaCuerpoLibelula(), 'hojaClara', libs.length, (o, i, t) => {
    const l = libs[i];
    ubica(l, quieto ? l.fase * 3 : t);
    o.position.set(sitio.x, sitio.y, sitio.z);
    o.rotation.set(0, sitio.rumbo, sitio.cabeceo);
    o.scale.setScalar(l.tamano);
  }, { sombra: false });

  // Cuatro alas por libélula: par delantero y trasero, izquierda y derecha. La raíz vive en
  // la geometría, así que la instancia sólo lleva rumbo, barrido y batido. Las dos del mismo
  // lado baten juntas: el signo se invierte por lado porque el ala derecha ya viene espejada
  // (girada media vuelta), y con el mismo signo subiría mientras la izquierda baja.
  kit.movil(geometriaAlaLibelula(), 'hojaClara', libs.length * 4, (o, i, t) => {
    const l = libs[i >> 2], k = i & 3, lado = k & 1 ? -1 : 1, trasero = k >> 1;
    ubica(l, quieto ? l.fase * 3 : t);
    const e = l.tamano * .92, c = Math.cos(sitio.rumbo), s = Math.sin(sitio.rumbo);
    const dx = (trasero ? .02 : .2) * e;                 // dónde nace el ala sobre el tórax
    o.position.set(sitio.x + dx * c, sitio.y + .02 * e, sitio.z - dx * s);
    const barrido = trasero ? .34 : .14;                 // el par trasero abre más hacia atrás
    const latido = quieto ? .3 : Math.sin(t * 30 + l.fase) * .55;
    o.rotation.set(latido * lado, sitio.rumbo + (lado > 0 ? -barrido : Math.PI + barrido), 0);
    o.scale.setScalar(e);
  }, { sombra: false });
}

// Humo: cada bocanada sube, se abre y se deshace encogiendo. Una malla para todo el humo.
function creaHumo(kit, rnd) {
  const bocas = kit.chimeneas.filter((_, i) => i % 2 === 0).slice(0, 4);
  const porBoca = 9, humo = [];
  for (let b = 0; b < bocas.length; b++)
    for (let i = 0; i < porBoca; i++) humo.push({ boca: b, fase: (i / porBoca) + rnd() * .05, vaiven: rnd() });
  kit.movil(kit.geo.humo, 'humo', humo.length, (o, i, t) => {
    const h = humo[i], boca = bocas[h.boca];
    const ciclo = ((t * .16 + h.fase) % 1 + 1) % 1;
    const ancho = Math.max(0, ciclo < .6 ? .26 + ciclo * 2.2 : 1.58 * (1 - (ciclo - .6) / .4));
    // Sube de prisa al salir caliente y se va frenando al enfriarse: la recta de antes hacía
    // que la columna trepara parejo hasta el techo. Y la bocanada va estirada en y —un humo
    // esférico se lee como pelota—, con el viento del pueblo creciendo con la altura.
    const sube = 1 - (1 - ciclo) * (1 - ciclo);
    o.position.set(
      boca.x + Math.sin(ciclo * 4 + h.vaiven * 6.28) * .55 * ciclo,
      boca.y + sube * 3.6,
      boca.z + Math.cos(ciclo * 3.4 + h.vaiven * 6.28) * .5 * ciclo + sube * 1.2,
    );
    o.rotation.set(ciclo * 2, ciclo * 3, 0);
    o.scale.set(ancho, ancho * 1.22, ancho);
  }, { sombra: false });
}

// Polvo dorado: lo que hace que la tarde se vea a contraluz.
function creaPolvo(kit, rnd) {
  const motas = [];
  for (let i = 0; i < 44; i++) {
    motas.push({
      x: (rnd() - .5) * 46, y: .9 + rnd() * 4.2, z: (rnd() - .5) * 46,
      fase: rnd() * 6.28, deriva: .12 + rnd() * .28, radio: .4 + rnd() * .8,
    });
  }
  kit.movil(kit.geo.mota, 'polvo', motas.length, (o, i, t) => {
    const m2 = motas[i], a = t * m2.deriva + m2.fase;
    o.position.set(m2.x + Math.cos(a) * m2.radio, m2.y + Math.sin(a * .7) * .7, m2.z + Math.sin(a * .6) * m2.radio);
    o.scale.setScalar(.05 + Math.sin(a * 1.6) * .012);
  }, { sombra: false });
}

// Pétalos del árbol del tiempo: se sueltan de la copa, caen girando y derivan con el aire.
//
// Antes eran `kit.geo.cono` —un cono de seis caras— de 12 cm escalado en y: de cerca se leían
// como esquirlas rosadas. Ahora es el pétalo de flora.js (la raíz en el origen, crece hacia +z,
// cara hacia ±y, ya de dos caras) a 9–14 cm, con tumbo de los TRES ejes, deriva lateral y un
// batido rápido encima. Tres materiales de flor reparten la caída en tres llamadas: con una
// sola tinta la lluvia se lee como confeti. Y se conserva lo que ya hacía: el pétalo que
// pasaría por delante de la cámara se encoge a cero en vez de dibujarse en la cara — pero
// encogiéndose de verdad, entre 1,1 m y 2,7 m, no de un salto.
const TINTAS_PETALO = ['flor', 'florRoja', 'blanco'];
function creaPetalos(kit, camera, quieto, rnd, arbol) {
  // La copa del árbol del tiempo vive a y≈6,2 con radio ~2,4 (places/jardin.js): de ahí caen,
  // no del aire a un metro del suelo como antes.
  const COPA = 6.1, RADIO = 2.2, SUELO = .07;
  const petalos = [];
  for (let i = 0; i < 26; i++) {
    petalos.push({
      a: rnd() * 6.28, r: rnd() * RADIO,                     // dónde nace, dentro de la copa
      fase: rnd(),                                           // desfase: no caen todas a la vez
      dur: 6.5 + rnd() * 3.5,                                // segundos hasta tocar la hierba
      largo: .09 + rnd() * .05,                              // 9–14 cm: el pétalo unidad mide 1 m
      viento: rnd() * 6.28, paso: .6 + rnd() * .9,           // hacia dónde la lleva el aire, y cuánto
      balanceo: 1.4 + rnd() * 1.6, faseBalanceo: rnd() * 6.28,
      tumbo: [1.3 + rnd() * .9, .6 + rnd() * .7, 1 + rnd() * .8],   // giro por eje (rad/s)
      orienta: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28],          // de dónde arranca el giro
    });
  }
  // El reparto entre los tres materiales se decide aquí, en el momento de abrir los lotes:
  // cada `movil` es una llamada de dibujo y no se puede cambiar de material dentro del lote.
  const trozos = TINTAS_PETALO.map(() => []);
  petalos.forEach((p, i) => trozos[i % TINTAS_PETALO.length].push(p));
  for (let k = 0; k < TINTAS_PETALO.length; k++) {
    kit.movil(kit.geo.petalo, TINTAS_PETALO[k], trozos[k].length, (o, i, t) => {
      const p = trozos[k][i];
      // u: 0 al soltarse de la copa, 1 cuando ya está posado en la hierba. Con movimiento
      // reducido el ciclo se congela en la fase de cada pétalo y quedan repartidos por el aire.
      const u = quieto ? p.fase * .8 : ((t / p.dur + p.fase) % 1 + 1) % 1;
      const caida = Math.min(1, u / .8);                     // toca el suelo al 80 % del ciclo
      const deriva = p.paso * caida * 2.4;                   // 1,4–3,6 m de viento en la caída
      const fl = quieto ? p.fase * 3 : Math.sin(t * p.balanceo + p.faseBalanceo);
      const lateral = fl * (.1 + .22 * caida);               // el vaivén crece mientras cae
      const x = arbol.x + Math.cos(p.a) * (.25 + p.r)
        + Math.cos(p.viento) * deriva + Math.sin(p.viento) * lateral;
      const z = arbol.z + Math.sin(p.a) * (.25 + p.r)
        + Math.sin(p.viento) * deriva - Math.cos(p.viento) * lateral;
      const y = COPA - (COPA - SUELO) * caida;
      // El tumbo corre con el reloj del ciclo y se detiene al tocar el suelo; encima lleva el
      // batido rápido del pétalo que baja, que es lo que hace un papel al caer.
      const vuelta = quieto ? p.fase * 6 : Math.min(u, .8) * p.dur;
      const batido = quieto ? 0 : Math.sin(t * 4.2 + p.faseBalanceo) * .45;
      const dx = x - camera.position.x, dz = z - camera.position.z, d2 = dx * dx + dz * dz;
      const cerca = quieto ? 1 : Math.min(1, Math.max(0, (d2 - 1.2) / 6.3));
      const fin = u < .8 ? 1 : 1 - (u - .8) / .2;            // se apaga ya posado, sin salto
      o.position.set(x, y, z);
      o.rotation.set(
        p.orienta[0] + vuelta * p.tumbo[0] + batido,
        p.orienta[1] + vuelta * p.tumbo[1],
        p.orienta[2] + vuelta * p.tumbo[2],
      );
      o.scale.setScalar(p.largo * Math.min(cerca, fin));
    }, { sombra: false });
  }
}

// Agua: espuma en la orilla, brillos del sol y ondas en la fuente. El río en sí es opaco
// (una lámina translúcida sobre toda la superficie cuesta carísimo en rasterizadores de
// CPU y no se veía mejor), así que aquí sólo van capas pequeñas.
function creaAgua(kit, scene, quieto, rnd) {
  const espuma = new THREE.Mesh(new THREE.PlaneGeometry(.9, 76), kit.m('espuma'));
  espuma.rotation.x = -Math.PI / 2; espuma.position.set(-24.1, .13, -6);
  scene.add(espuma);
  if (!quieto) kit.animar(t => {
    espuma.material.opacity = .07 + Math.sin(t * .9) * .05;
    espuma.position.x = -24.1 + Math.sin(t * .9) * .18;
  });

  // Ondas concéntricas en la taza de la fuente.
  const ondas = [];
  for (let i = 0; i < 4; i++) ondas.push(i / 4);
  kit.movil(new THREE.TorusGeometry(.5, .018, 4, 18), 'espuma', ondas.length, (o, i, t) => {
    const c = quieto ? ondas[i] : ((t * .32 + ondas[i]) % 1 + 1) % 1;
    o.position.set(0, .65, 0);
    o.rotation.set(Math.PI / 2, 0, 0);
    o.scale.setScalar(.4 + c * 1.05);
  }, { sombra: false });
}
