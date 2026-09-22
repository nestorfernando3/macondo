import * as THREE from 'three';

// La mariposa amarilla del jugador. Aquí viven su forma y su aleteo; PlayerController
// la coloca y le pasa velocidad normalizada (0…1) y alabeo (−1…1). No toca la cámara.
//
// Tres decisiones sostienen el resultado:
// 1. El contorno de cada ala se escribe UNA sola vez (CONTORNOS) y de ahí salen la malla
//    (Shape → ShapeGeometry) y la textura pintada en canvas: nunca se desalinean.
// 2. El cuerpo entero es un solo LatheGeometry (perfil de radios): cabeza, tórax y
//    abdomen en una malla, con silueta orgánica en vez de primitivas apiladas.
// 3. El ala posterior aletea con retraso respecto de la anterior (DESFASE): ese desfase
//    es la diferencia entre una mariposa viva y un juguete articulado.

export const PALETA = {
  amarillo: 0xf5c542,   // el mismo amarillo del pueblo (MAT.amarillo)
  borde: 0x5a3c22,
  crema: 0xfdf3d8,
  cuerpo: 0x6b4a2f,
  ojo: 0x241a12,
};

// Ala derecha en metros: x hacia afuera, y hacia adelante (el −z del mundo).
// La raíz queda en el origen; el ala izquierda es esta misma, espejada con scale.x = −1.
export const CONTORNOS = {
  anterior: [
    ['M', .030, .060],
    ['Q', .200, .115, .320, .090],
    ['Q', .400, .065, .425, .005],
    ['Q', .415, -.050, .360, -.055],
    ['Q', .200, -.075, .070, -.035],
    ['Q', .015, -.010, .030, .060],
  ],
  posterior: [
    ['M', .028, -.010],
    ['Q', .190, -.030, .300, -.085],
    ['Q', .375, -.140, .355, -.225],
    ['Q', .340, -.265, .300, -.255],
    ['Q', .300, -.300, .245, -.285],
    ['Q', .245, -.345, .185, -.375],
    ['Q', .130, -.300, .060, -.160],
    ['Q', .015, -.060, .028, -.010],
  ],
};

// Cuerpo completo, de la frente a la punta del abdomen: [largo, radio] en metros.
export const PERFIL_CUERPO = [
  [0, 0], [.010, .018], [.030, .026], [.050, .020], [.075, .028], [.105, .026],
  [.115, .017], [.140, .024], [.190, .022], [.250, .014], [.290, .006], [.300, 0],
];

const HOMBRO = { x: .022, y: .014, z: -.030 };  // bisagra de las cuatro alas
const SEPARACION = .0025;                       // la posterior va por debajo: evita el parpadeo
const CABEZA_Z = -.130;                         // la cabeza queda delante del origen

// Reposo (quieta) contra vuelo (a toda velocidad). Ajustables mirando la captura.
const REPOSO = { hz: 2.2, amp: .30, base: .62 };
const VUELO = { hz: 5, amp: .90, base: .16 };
const DESFASE = .85;      // radianes de retraso del ala posterior
const TORSION = .28;      // curvatura del ala durante la carrera
const BARRIDO = .10;      // barrido del ala hacia atrás
const ELEV_FIJA = .45;    // pose fija con movimiento reducido (legible, nunca de canto)
const TAU = Math.PI * 2;

const QUIETO = typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

const geoCache = new Map(), texCache = new Map();

function formaAla(cmds) {
  const forma = new THREE.Shape();
  for (const [op, ...p] of cmds) {
    if (op === 'M') forma.moveTo(p[0], p[1]);
    else if (op === 'Q') forma.quadraticCurveTo(p[0], p[1], p[2], p[3]);
    else forma.lineTo(p[0], p[1]);
  }
  return forma;
}

// ShapeGeometry deja los UV en unidades del contorno (0,03…0,425 en u): hay que
// reescalarlos a 0…1 o la textura aparece desplazada y repetida. Paso obligatorio.
function uv01(geo) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i,
      (pos.getX(i) - min.x) / (max.x - min.x),
      (pos.getY(i) - min.y) / (max.y - min.y));
  }
  uv.needsUpdate = true;
  return geo;
}

export function geometriaAla(clave, segmentos = 12) {
  if (geoCache.has(clave)) return geoCache.get(clave);
  const geo = uv01(new THREE.ShapeGeometry(formaAla(CONTORNOS[clave]), segmentos));
  geo.rotateX(-Math.PI / 2);   // el contorno se tiende: +y del dibujo pasa a −z (adelante)
  geoCache.set(clave, geo);
  return geo;
}

function geometriaCuerpo(radiales = 12) {
  if (geoCache.has('cuerpo')) return geoCache.get('cuerpo');
  const perfil = PERFIL_CUERPO.map(([largo, radio]) => new THREE.Vector2(radio, largo));
  const geo = new THREE.LatheGeometry(perfil, radiales);
  geo.rotateX(Math.PI / 2);          // el eje del cuerpo pasa a z, el abdomen hacia +z
  geo.translate(0, 0, CABEZA_Z);     // y la cabeza queda delante
  geoCache.set('cuerpo', geo);
  return geo;
}

// Extensión real del contorno (puntos de la curva, no puntos de control): es la caja que
// usan a la vez la geometría y el dibujo, por eso coinciden al píxel.
function cajaDe(cmds, segmentos = 12) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const { x, y } of formaAla(cmds).getPoints(segmentos)) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, ancho: x1 - x0, alto: y1 - y0 };
}

// Pinta el ala con el MISMO contorno de la malla. Sin archivo de imagen y sin red.
function texturaAla(clave, renderer = null) {
  if (texCache.has(clave)) return texCache.get(clave);
  if (typeof document === 'undefined') { texCache.set(clave, null); return null; }

  const L = 256, M = 12;                        // lienzo y margen en píxeles
  const caja = cajaDe(CONTORNOS[clave]);
  const escala = (L - M * 2) / Math.max(caja.ancho, caja.alto);
  const ax = (x) => M + (x - caja.x0) * escala;
  const ay = (y) => L - M - (y - caja.y0) * escala;   // el lienzo crece hacia abajo

  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = L;
  const g = lienzo.getContext('2d');

  const trazar = () => {
    g.beginPath();
    for (const [op, ...p] of CONTORNOS[clave]) {
      if (op === 'M') g.moveTo(ax(p[0]), ay(p[1]));
      else if (op === 'Q') g.quadraticCurveTo(ax(p[0]), ay(p[1]), ax(p[2]), ay(p[3]));
      else g.lineTo(ax(p[0]), ay(p[1]));
    }
    g.closePath();
  };

  const fondo = g.createLinearGradient(ax(caja.x0), 0, ax(caja.x1), 0);
  fondo.addColorStop(0, '#f7d95c');
  fondo.addColorStop(.55, '#f2c53c');
  fondo.addColorStop(1, '#e8b32a');
  trazar();
  g.fillStyle = fondo;
  g.fill();

  g.save();
  trazar();
  g.clip();                                   // todo lo que sigue queda dentro del ala

  // Banda marginal: el clip deja solo la mitad interior del trazo. Va proporcional al ala
  // (∼1,4 cm), no con un valor fijo: con 46 px la banda se comía el ala entera y se veía marrón.
  const banda = Math.max(8, escala * .015);
  g.strokeStyle = 'rgba(90,60,34,.92)';
  g.lineWidth = banda * 2;
  trazar();
  g.stroke();

  g.strokeStyle = 'rgba(90,60,34,.32)';        // venas
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    g.beginPath();
    g.moveTo(ax(.02), ay(clave === 'anterior' ? .01 : -.03));
    g.lineTo(ax(caja.x1 * (.55 + .45 * t)), ay(caja.y0 + caja.alto * (.08 + .84 * t)));
    g.stroke();
  }

  if (clave === 'anterior') {                  // ápice oscuro
    const halo = g.createRadialGradient(ax(.39), ay(-.04), 2, ax(.39), ay(-.04), Math.max(14, escala * .05));
    halo.addColorStop(0, 'rgba(74,48,26,.95)');
    halo.addColorStop(1, 'rgba(74,48,26,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, L, L);
  } else {                                     // ocelo
    const ox = ax(.245), oy = ay(-.215);
    g.beginPath(); g.arc(ox, oy, 17, 0, TAU); g.fillStyle = 'rgba(74,48,26,.9)'; g.fill();
    g.beginPath(); g.arc(ox, oy, 9, 0, TAU); g.fillStyle = '#fdf3d8'; g.fill();
    g.beginPath(); g.arc(ox, oy, 4.5, 0, TAU); g.fillStyle = 'rgba(74,48,26,.95)'; g.fill();
  }

  g.restore();

  trazar();                                    // filete claro del borde de ataque
  g.strokeStyle = 'rgba(255,248,214,.35)';
  g.lineWidth = 2.5;
  g.stroke();

  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;       // sin esto el amarillo sale lavado
  if (renderer) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texCache.set(clave, tex);
  return tex;
}

function materialAla(clave, renderer) {
  const mapa = texturaAla(clave, renderer);
  return new THREE.MeshStandardMaterial({
    map: mapa,
    color: mapa ? 0xffffff : PALETA.amarillo,  // en Node (sin canvas) queda el color plano
    side: THREE.DoubleSide,
    roughness: .52,
    metalness: 0,
    shadowSide: THREE.DoubleSide,
    // Brillo propio modulado por la propia textura: la luz viene de arriba y el ala que
    // baja queda a contraluz (se veía marrón justo en la carrera). Con emisión, el amarillo
    // sigue leyéndose y el borde marginal se queda oscuro, como debe.
    emissive: new THREE.Color(mapa ? 0xffffff : 0xffc63c),
    emissiveMap: mapa,
    emissiveIntensity: .38,
  });
}

// Ala para las mariposas del pueblo (fase 2 de §10): misma geometría y misma textura
// pintada, pero material sin luces ni emisión, porque aquí hay decenas y siempre se ven
// de lejos. En Node (sin canvas) cae al amarillo plano y la prueba sigue corriendo.
export function materialAlaSimple(clave, renderer = null) {
  const mapa = texturaAla(clave, renderer);
  return new THREE.MeshBasicMaterial({
    map: mapa, color: mapa ? 0xffffff : PALETA.amarillo, side: THREE.DoubleSide,
  });
}

// Elevación positiva = ala arriba. La izquierda lleva signos contrarios porque su malla va
// espejada; la torsión es la misma en los dos lados y por eso comparte signo.
function posar(bisagra, elev, tors, barrido) {
  bisagra.rotation.set(tors, barrido, elev);
}

export function createButterfly(scene, { renderer = null, quieto = QUIETO } = {}) {
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';
  group.name = 'mariposa-jugador';

  const materiales = { anterior: materialAla('anterior', renderer), posterior: materialAla('posterior', renderer) };
  const alas = { anterior: [], posterior: [] };   // en cada par: [derecha, izquierda]

  for (const clave of ['anterior', 'posterior']) {
    for (const lado of [1, -1]) {
      const bisagra = new THREE.Group();
      bisagra.rotation.order = 'YZX';             // torsión, luego carrera, luego barrido
      bisagra.position.set(
        HOMBRO.x * lado,
        HOMBRO.y + (clave === 'anterior' ? SEPARACION : -SEPARACION),
        HOMBRO.z);
      const malla = new THREE.Mesh(geometriaAla(clave), materiales[clave]);
      malla.scale.x = lado;                       // el ala izquierda es la derecha, espejada
      malla.castShadow = true;
      bisagra.add(malla);
      group.add(bisagra);
      alas[clave].push(bisagra);
    }
  }

  const cuerpo = new THREE.Mesh(geometriaCuerpo(),
    new THREE.MeshStandardMaterial({ color: PALETA.cuerpo, roughness: .72, metalness: 0 }));
  cuerpo.castShadow = true;
  group.add(cuerpo);

  const matOscuro = new THREE.MeshStandardMaterial({ color: PALETA.ojo, roughness: .4 });
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 0, CABEZA_Z);
  for (const lado of [1, -1]) {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(.010, 8, 6), matOscuro);
    ojo.position.set(.020 * lado, .008, .036);
    cabeza.add(ojo);
  }
  const antenas = [];
  const geoMaza = new THREE.SphereGeometry(.0075, 8, 6);
  for (const lado of [1, -1]) {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(.007 * lado, .012, .012),
      new THREE.Vector3(.030 * lado, .042, -.020),
      new THREE.Vector3(.056 * lado, .070, -.070),
      new THREE.Vector3(.072 * lado, .080, -.105),
    ]);
    const maza = new THREE.Mesh(geoMaza, matOscuro);
    maza.position.copy(curva.getPoint(1));
    const antena = new THREE.Group();
    antena.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 10, .0032, 4, false), matOscuro), maza);
    cabeza.add(antena);
    antenas.push(antena);
  }
  group.add(cabeza);

  scene.add(group);

  let ultimoTiempo = null;
  let fase = 0;
  let velocidadSuave = 0;

  return {
    group,
    // speed01: 0 quieta (alas semielevadas que abanican despacio) → 1 volando rápido.
    // bank: −1…1, el alabeo que ya calcula PlayerController.
    update(t, speed01 = 0, bank = 0) {
      group.rotation.z = bank * .5;              // convención vigente: no cambiar

      const [derAnterior, izqAnterior] = alas.anterior;
      const [derPosterior, izqPosterior] = alas.posterior;

      if (quieto) {                              // movimiento reducido: pose fija legible
        posar(derAnterior, ELEV_FIJA, 0, 0); posar(izqAnterior, -ELEV_FIJA, 0, 0);
        posar(derPosterior, ELEV_FIJA, 0, 0); posar(izqPosterior, -ELEV_FIJA, 0, 0);
        return;
      }

      // Integrar la frecuencia conserva el ciclo al acelerar o frenar.
      // Limitar el intervalo evita saltos al volver de una pestaña inactiva.
      const dt = ultimoTiempo === null ? 0 : Math.max(0, Math.min(.05, t - ultimoTiempo));
      ultimoTiempo = t;
      const objetivo = Math.max(0, Math.min(1, speed01));
      const anterior = velocidadSuave;
      const decaimiento = Math.exp(-dt / .22);
      velocidadSuave = objetivo + (anterior - objetivo) * decaimiento;
      const s = velocidadSuave;
      const integralVelocidad = objetivo * dt + (anterior - objetivo) * .22 * (1 - decaimiento);
      fase = (fase + TAU * (REPOSO.hz * dt + (VUELO.hz - REPOSO.hz) * integralVelocidad)) % TAU;
      const amp = REPOSO.amp + (VUELO.amp - REPOSO.amp) * s;
      const base = REPOSO.base + (VUELO.base - REPOSO.base) * s;
      const c = fase;

      // La anterior marca el compás; la posterior llega DESFASE radianes después.
      const elevAnterior = base + Math.sin(c) * amp;
      const elevPosterior = base + Math.sin(c - DESFASE) * amp;
      // En la bajada el borde de ataque baja: por eso la torsión sigue a cos(c).
      const torsion = Math.cos(c) * TORSION * (.35 + .65 * s);
      const barrido = Math.sin(c - 1.2) * BARRIDO;

      posar(derAnterior, elevAnterior, torsion, -barrido);
      posar(izqAnterior, -elevAnterior, torsion, barrido);
      posar(derPosterior, elevPosterior, torsion * .85, -barrido);
      posar(izqPosterior, -elevPosterior, torsion * .85, barrido);

      const vaiven = Math.sin(t * 2.2) * .05;    // las antenas acompañan el aire
      for (const antena of antenas) antena.rotation.x = vaiven;
    },
  };
}
