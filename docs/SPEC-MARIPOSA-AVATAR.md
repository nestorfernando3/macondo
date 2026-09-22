# Avatar de mariposa amarilla · especificación de mejora

Instrucción de trabajo · 21 de septiembre de 2026

Estado: **implementada y verificada** (21 de septiembre de 2026). La geometría, los signos de
las bisagras, el mapeo de textura y el costo se validaron primero en Node contra Three.js 0.180
y después en el navegador con poses congeladas (§8.3). El código de §5 es el que está hoy en
`src/world/butterflyAvatar.js`; los números de §6 son mediciones, y §6.1 registra los tres
ajustes que solo aparecieron al mirar la pantalla.

Ámbito: **solo el avatar del jugador** (la mariposa que vuela y que la cámara persigue).
Las mariposas del pueblo —bandada, espiral del jardín y ambiente— no se tocan en esta
entrega; tienen su propia fase 2 y una advertencia de rendimiento en §9.

---

## 1. Qué hay hoy y por qué no basta

`src/world/butterflyAvatar.js` resuelve la silueta con dos planos rectangulares sin luz
(`MeshBasicMaterial`) y una cápsula. Funciona —se lee como mariposa a 4,8 m y no cuesta
nada— pero tiene cuatro problemas visibles en el encuadre real del paseo:

| Problema | Consecuencia en pantalla |
|---|---|
| El ala es un rectángulo de 0,46 × 0,34 m | Se ve como una tarjeta; no hay ala anterior ni posterior, ni punta, ni cola. |
| Material básico, sin textura ni luz | El ala es un color plano: no responde a la luz de la tarde ni a la niebla. |
| Una sola onda mueve las dos alas | Aleteo de juguete articulado: las cuatro superficies suben y bajan al tiempo. |
| En reposo aletea a 9 Hz | Una mariposa quieta parece un colibrí; no hay pose de descanso. |

## 2. Lo que no se toca

Estas cuatro restricciones son contrato con el resto del paseo. Romperlas obliga a
repetir la verificación de navegación completa.

1. **Firma y retorno del módulo.** `createButterfly(scene)` → `{ group, update(t, speed01, bank) }`.
   `PlayerController.attachAvatar` y `__macondo.player.avatar` (gancho de CDP) dependen de eso.
2. **`PlayerController` es el único dueño del movimiento y de la cámara.** El avatar no lee
   input, no consulta `matchMedia` para decidir movimiento y no toca la cámara.
3. **Quién escribe cada rotación del grupo:** `PlayerController` escribe `group.rotation.y`
   (rumbo) y `group.position`; el avatar escribe `group.rotation.z` (`bank * .5`). Nadie
   escribe `group.rotation.x`. `group.rotation.order` sigue siendo `'YXZ'`.
4. **Escala humana.** La envergadura se conserva: el pueblo está modelado en metros y la
   mariposa ya está calibrada a ojo contra él (hoy 0,92 m de punta a punta; la propuesta, 0,89 m).

## 3. El encuadre manda (leer antes de diseñar)

La cámara perseguidora está a 4,8 m del avatar con `orbitPitch` 0,34: son **4,52 m detrás y
2,7 m por encima**, unos 31° sobre la horizontal, con FOV 60°, mirando a `player.position +
0,5 m`. En ese encuadre la mariposa ocupa **menos del 10 % de la anchura de pantalla**. De ahí
salen las tres decisiones que importan más que cualquier detalle anatómico:

- **La silueta y el contraste mandan.** Un borde marginal oscuro a lo largo de todo el
  contorno es lo que hace que la forma se lea; los detalles internos casi no se ven.
- **El ángulo lo es todo, y no es el que parece.** La normal del ala vive en el plano x-y
  (el ala gira sobre un eje que va de proa a popa), así que una cámara casi horizontal la ve
  de canto sea cual sea la elevación: a 10° sobre el ala, la mariposa se ve como una raya.
  Los 31° del paseo son los que salvan la lectura, y por eso **las capturas de revisión deben
  hacerse desde ese mismo ángulo**, no desde uno cómodo para la cámara.
- **Plana o levantada, cada pose lee distinto.** El ala plana proyecta más área, pero en una
  franja fina (0,85 × 0,08 m) que se lee como una raya; el ala levantada proyecta menos área
  pero en forma de uve compacta que se lee como mariposa. La carrera pasa por las dos: el
  reposo se queda arriba (≈ +35°) y el vuelo barre de −53° a +65°.
- **La envergadura es lo que se ve.** La anchura (0,89 m) sobrevive a la perspectiva; la
  cuerda del ala se comprime. Alas largas y limpias leen mejor que alas redondas y cortas.

## 4. Diseño

### 4.1 Alas: anterior y posterior por lado

Cuatro alas, cada una con su bisagra en el mismo hombro (una articulación por ala, como el
insecto real): la anterior apunta hacia adelante y afuera, la posterior hacia atrás y
afuera, con la cola característica de las amarillas. El contorno se dibuja con curvas
cuadráticas —nada de rectángulos— y se espeja para el lado izquierdo.

| | Ala anterior | Ala posterior |
|---|---|---|
| Extensión (medida) | x 0,027 → 0,425 m; z −0,098 → +0,062 m | x 0,025 → 0,359 m; z +0,010 → +0,375 m |
| Área (medida) | 0,051 m² | 0,072 m² |
| Coste | 58 triángulos | 82 triángulos |
| Papel | borde de ataque, ápice oscuro | cola, ocelo, mayor superficie amarilla |

La bisagra del ala anterior queda 2,5 mm **por encima** de la del ala posterior: las dos
alas se solapan junto al tórax y, coplanares, parpadearían por profundidad (z-fighting).

### 4.2 Cuerpo: un solo perfil

En vez de apilar primitivas (cápsula + esferas), el cuerpo entero es **un `LatheGeometry`**
con un perfil de radios: frente de la cabeza, cabeza, cuello, tórax, cintura, abdomen y
punta. Es una sola malla, con silueta orgánica y continuidad real entre segmentos.

Detalle mínimo que sí aporta: dos ojos salientes y dos antenas con maza, hijas de un grupo
anclado a la cabeza. Las patas se omiten a propósito: a 4,8 m son invisibles y costarían
seis mallas.

| Parte | Medida | Coste |
|---|---|---|
| Cuerpo (lathe, 12 puntos × 12 radiales) | 0,30 m de largo; radio máximo 0,028 m | 264 triángulos |
| Ojos (2 esferas) | r 0,010 m, sobresalen del perfil de la cabeza | 80 c/u |
| Antenas (2 tubos + 2 mazas) | 0,13 m de largo, maza r 0,0075 m | 80 c/u |

### 4.3 Textura: el mismo contorno, pintado

Las alas no llevan archivo de imagen. Se pintan **una vez** en un canvas de 256² a partir
de la **misma tabla de contorno** que genera la malla, de modo que el dibujo nunca se
desalinea del borde:

- fondo amarillo con degradado de raíz a punta (de `#f7d95c` a `#e8b32a`);
- banda marginal oscura de todo el contorno, pintada con `clip()` y un trazo grueso: solo
  sobrevive la mitad interior del trazo, así que la banda queda siempre dentro del ala;
- seis venas tenues desde la raíz;
- en el ala anterior, un ápice oscuro; en la posterior, un ocelo (anillo crema con centro
  oscuro), las dos señales que hacen que una mariposa amarilla se lea como tal;
- un filete claro sobre el borde de ataque, que es lo que a esta escala sugiere el brillo.

### 4.4 Materiales

`MeshStandardMaterial` (ya no básico) con la textura, `side: DoubleSide`, rugosidad 0,52 y
un `emissive` ámbar muy suave (`emissiveIntensity` 0,16). Ese brillo propio es intencional:
es el mismo recurso del realismo mágico que ya usan el faro y el beacon, y evita que la
mariposa se pierda contra la vegetación oscura.

Dos materiales (uno por tipo de ala), compartidos por las cuatro mallas.

### 4.5 Aleteo: el desfase es el alma

| Parámetro | Quieta (`speed01` 0) | Volando (`speed01` 1) | Significado |
|---|---|---|---|
| `hz` | 2,2 | 14 | Frecuencia del ciclo |
| `amp` | 0,30 | 1,05 | Amplitud de la carrera (rad) |
| `base` | 0,62 | 0,08 | Elevación base (rad) |

- El ala **anterior** marca el compás; la **posterior** llega `DESFASE` = 0,85 rad después.
  En reposo eso se lee como un abanico lento; en vuelo, como el golpe de las cuatro
  superficies en cascada.
- **Torsión**: en la bajada el borde de ataque baja (como el ala real cuando empuja aire).
  Por eso la torsión sigue a `cos(c)`, no a `sen(c)`, y se aplica igual en los dos lados.
- **Barrido**: las alas hacen un pequeño recorrido hacia atrás fuera de fase (`sen(c − 1,2)`).
- **Antenas**: un vaivén lento e independiente del aleteo (2,2 rad/s).
- Con **movimiento reducido** la mariposa se queda en una pose fija y legible
  (`ELEV_FIJA` = 0,45 rad, alas arriba). No se congela en la pose de vuelo: quedaría de
  canto e invisible.

## 5. Código propuesto

Reemplaza por completo `src/world/butterflyAvatar.js`. Conserva la firma y el retorno.
Los tres números validados (contornos, perfil y desfase) están medidos; el resto son
valores de partida para ajustar mirando la captura de §7.

```js
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
const VUELO = { hz: 14, amp: 1.05, base: .08 };
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

      const s = Math.max(0, Math.min(1, speed01));
      const hz = REPOSO.hz + (VUELO.hz - REPOSO.hz) * s;
      const amp = REPOSO.amp + (VUELO.amp - REPOSO.amp) * s;
      const base = REPOSO.base + (VUELO.base - REPOSO.base) * s;
      const c = t * hz * TAU;

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
```

**Cambio opcional de una línea en `src/main.js`** (nitidez del ala en ángulos rasantes):

```js
player.attachAvatar(createButterfly(experience.scene, { renderer: experience.renderer }));
```

Sin ese argumento el módulo funciona igual (anisotropía 1); solo se pierde algo de nitidez
en el borde del ala cuando la cámara mira muy de canto.

## 6. Mediciones

Primero en Node contra Three.js 0.180 (sin navegador) y después en la escena real por CDP
(`internal/verificacion/cdp_mariposa.mjs`). La columna «hecha» es lo que reporta el renderer
con el avatar ya en el paseo:

| | Antes | Hecha |
|---|---|---|
| Envergadura | 0,92 m | 0,89 m (0,425 + 0,022 de bisagra, por lado) |
| Superficie de ala | 0,31 m² (dos rectángulos) | 0,25 m² (cuatro alas con contorno) |
| Triángulos | 116 | 1024 |
| Mallas | 3 | 11 |
| Texturas en memoria | 1 (el mapa de sombras) | 3 (+2 de 256², generadas en el cliente) |
| Bundle | 549,70 kB · 145,83 kB gzip | 579,97 kB · 155,55 kB gzip (**+9,7 kB gzip**) |

El costo en bundle no son las ∼320 líneas del módulo: es la maquinaria de curvas de Three.js
que el proyecto no usaba en ninguna parte (`Shape`/`Path`/`CurvePath`/`Curve`, earcut y las
geometrías `Shape`, `Lathe` y `Tube`). Comprobado: antes del cambio el bundle tenía **cero**
ocurrencias de `triangulateShape`, `currentPoint` y `extractPoints`. Earcut por sí solo es
despreciable (∼360 B gzip de fuente); el grueso es la cadena de curvas y `TubeGeometry`. Si
algún día hay que recortarlo, el candidato son las antenas con cilindros (≈2,5 kB gzip);
quitar earcut exigiría triangular el ala a mano y no compensa.

Comprobaciones de signo (que es donde falla este tipo de módulo):

- `elevación +0,5` sube **las dos** puntas (y pasa de 0,014 a 0,218).
- `barrido +0,20` lleva **las dos** puntas hacia atrás (z pasa de −0,035 a +0,050).
- `torsión +0,30` sube el borde de ataque en los dos lados (y pasa de −0,015 a +0,043).
- Carrera completa: punta entre y = +0,397 y y = −0,324; el ala nunca toca el cuerpo
  (radio máximo 0,028).

### 6.1 Ajustes que solo aparecieron al mirar la pantalla

Los tres se corrigieron en la misma sesión y están ya en el código de §5:

1. **La banda marginal se comía el ala.** Con un `lineWidth` fijo de 46 px sobre un ala de
   101 px de cuerda, las bandas de los dos bordes se tocaban: la mariposa se veía marrón con
   una franja amarilla. Ahora el grosor es proporcional (∼1,4 cm) y el ala se lee amarilla
   con borde oscuro.
2. **El ala que baja quedaba a contraluz.** La luz viene de arriba, así que en la carrera el
   ala descendente se veía casi negra. Se resolvió con emisión modulada por la textura
   (`emissiveMap`) en vez de subir el `emissive` plano, que habría lavado el borde oscuro.
3. **La revisión se hacía desde un ángulo que no existe.** Las primeras capturas, desde un
   punto casi horizontal, mostraban alas de canto y hacían pensar que el modelo estaba mal.
   El guion de §8.3 usa ahora el ángulo real del paseo más un primer plano equivalente; sin
   eso, cualquier ajuste posterior se hace a ciegas.

## 7. Pasos de implementación (ejecutados)

1. Reescribir `src/world/butterflyAvatar.js` con §5. Ningún otro archivo es obligatorio:
   ese es el corte verificable.
2. `node --test tests/architecture.test.js` y `npm run build` (debe seguir compilando sin
   errores; el bundle sube ~2 KB gzip y no se añaden módulos).
3. Mirarlo en pantalla antes de tocar nada más: `npm run dev` y el guion CDP de §8.3.
   Ajustar a ojo, en este orden: `amp` de vuelo, `hz` de reposo, `ELEV_FIJA`, el grosor de
   la banda marginal (hoy `lineWidth` 46) y el brillo (`emissiveIntensity`).
4. Añadir las dos pruebas de §8.1 (leen el módulo en Node; no necesitan DOM).
5. Regresión de paseo: `cdp_circuito`, `cdp_fisica`, `cdp_lectura` contra `npm run dev`
   en el puerto 5175, con la consola limpia.
6. Cierre: entrada nueva al principio de `internal/HANDOFF.md` y una línea en `README.md`.

## 8. Verificación

### 8.1 Pruebas en Node (añadir a `tests/architecture.test.js`)

```js
import { CONTORNOS, PERFIL_CUERPO, geometriaAla } from '../src/world/butterflyAvatar.js';

test('la mariposa conserva su envergadura y sus alas apuntan a lados distintos', () => {
  const anterior = geometriaAla('anterior'); anterior.computeBoundingBox();
  const posterior = geometriaAla('posterior'); posterior.computeBoundingBox();
  const a = anterior.boundingBox, p = posterior.boundingBox;
  assert.ok(a.max.x > .40 && a.max.x < .45, 'media envergadura del ala anterior');
  assert.ok(a.min.z < -.09 && a.max.z < .08, 'el ala anterior va hacia adelante');
  assert.ok(p.max.z > .35, 'el ala posterior llega más atrás que el abdomen');
  assert.ok(p.min.z > 0, 'el ala posterior no invade el frente');
});

test('el cuerpo es un perfil cerrado y los contornos son finitos', () => {
  assert.equal(PERFIL_CUERPO[0][1], 0);
  assert.equal(PERFIL_CUERPO.at(-1)[1], 0);
  assert.equal(PERFIL_CUERPO.at(-1)[0], .300);
  for (let i = 1; i < PERFIL_CUERPO.length; i++)
    assert.ok(PERFIL_CUERPO[i][0] > PERFIL_CUERPO[i - 1][0], 'el perfil avanza sin retroceder');
  for (const [clave, cmds] of Object.entries(CONTORNOS)) {
    assert.ok(cmds.length >= 6, clave);
    assert.ok(cmds.every(c => c.slice(1).every(Number.isFinite)), clave);
  }
});
```

Importar el módulo en Node funciona porque la textura está protegida por
`typeof document === 'undefined'`.

### 8.2 Métricas

Con la escena en el paseo, desde CDP:

```js
const { renderer } = window.__macondo.experience;
({ llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles,
   texturas: renderer.info.memory.textures });
```

Esperado: +8 llamadas y +2 texturas respecto de la línea base tomada antes del cambio.
Anotar los dos valores en el handoff; si las llamadas suben más de 20, algo se está
construyendo por instancia en vez de reutilizar el caché del módulo.

### 8.3 Capturas de cerca (revisión visual)

`internal/verificacion/cdp_mariposa.mjs`, calcado de `cdp_probe.mjs` (Chrome headless,
puerto CDP 9335, `http://127.0.0.1:5175/`). Con la pose congelada las capturas son
repetibles y comparables entre ajustes:

```js
const { player, experience } = window.__macondo;
document.querySelector('#hud').hidden = true;
player.enabled = false;                      // deja de reescribir la pose cada frame
const g = player.avatar.group;
g.position.set(0, 2.1, 4); g.rotation.set(0, 0, 0);
experience.camera.position.set(0.9, 2.5, 1.6);   // a 2 m, de cerca
experience.camera.lookAt(0, 2.1, 4);
player.avatar.update(0, 0, 0);               // quieta
// repetir con update(0, 1, 0) (vuelo) y update(0, 1, .8) (giro con alabeo)
```

Cuatro capturas: quieta, vuelo, giro y tres cuartos (para ver el patrón del ala). Más una
del paseo normal, de espaldas, para juzgar el encuadre real de §3.

### 8.4 Regresión

El avatar no interviene en colisiones ni en cámara, pero está en el ciclo del paseo: repetir
`cdp_circuito`, `cdp_fisica` y `cdp_lectura` contra `npm run dev` en el 5175 y confirmar
consola limpia.

## 9. Trampas (evitar el ensayo y error)

1. **UV sin reescalar.** Los UV crudos de `ShapeGeometry` van de 0,030 a 0,425 en u y de
   0,002 a 0,098 en v: casi toda el ala cae fuera del espacio 0…1 de la textura y se ve
   repetida y arrastrada. `uv01()` no es opcional.
2. **Alas coplanares.** Anterior y posterior se solapan junto al tórax; sin los 2,5 mm de
   separación vertical el solapamiento parpadea. Es un error que solo aparece en movimiento.
3. **`colorSpace`.** Sin `tex.colorSpace = THREE.SRGBColorSpace` el amarillo se ve lavado
   contra el resto de la paleta Caribe (el renderer ya trabaja en sRGB).
4. **Congelar en la pose equivocada.** Con movimiento reducido, fijar la elevación de vuelo
   (0,08 rad) deja las alas de canto: la mariposa desaparece. De ahí `ELEV_FIJA`.
5. **Orden de Euler de la bisagra.** Debe ser `'YZX'`. Con el orden por defecto, el barrido
   gira la carrera y el ala se cruza sobre el cuerpo.
6. **Tres dueños de `group.rotation`.** `PlayerController` escribe `.y`, el avatar `.z`.
   Si alguien empieza a escribir `.x`, el rumbo y el alabeo se desacoplan.
7. **Geometrías y texturas por instancia.** Todo se construye una sola vez y se guarda en
   los `Map` del módulo. Hoy hay una sola mariposa, pero la fase 2 instancia decenas.
8. **Resolución del contorno.** Con `segmentos` por debajo de 10 las puntas y la cola se
   ven facetadas; 12 es el mínimo razonable y es lo que se midió.
9. **La sombra del ala es subpíxel.** Con el mapa de sombras actual (2048 sobre 100 m de
   lado) una sombra de 0,9 m mide ~2 píxeles: no prometer "sombra de mariposa en el suelo".
   `castShadow` se deja puesto por corrección, no porque se vea.
10. **El vaivén no está acoplado al aleteo.** `PlayerController` hace oscilar el grupo a
    10–18 Hz mientras el ciclo de alas va de 2,2 a 14 Hz. Se ve bien, pero no son el mismo
    latido. Acoplarlos es un cambio en `PlayerController`: si se hace, repetir
    `cdp_circuito` y `cdp_fisica`.
11. **No reutilizar este modelo tal cual en las mariposas del pueblo.** Ver §10.
12. **Nada de grosores fijos en la textura.** El lienzo escala con el ala, así que un valor en
    píxeles que se ve bien en el ala anterior se come la posterior. Todo lo que se pinte va en
    proporción a `escala` (§6.1).
13. **Revisar desde el ángulo del paseo.** Una captura desde un punto cómodo miente: el ala
    se ve de canto y el modelo parece roto cuando no lo está (§6.1).

## 10. Fase 2 (opcional, no en esta entrega)

El pueblo tiene 45 mariposas simples (26 ambientales, 9 de la espiral del jardín y 10 de la
bandada) construidas con el mismo `wingGeo` compartido y `MeshBasicMaterial`. Se pueden
mejorar **sin añadir una sola llamada de dibujo**, porque hoy ya son dos mallas por
mariposa: basta cambiar la geometría por `geometriaAla('anterior')` y el material por uno
`MeshBasicMaterial` con la textura pintada.

Dos cuidados: el origen de la nueva geometría es la raíz del ala, así que el desplazamiento
pasa de `±0,1` a `±0,02`; y estas mariposas no llevan cuerpo ni antenas (a la distancia a la
que se ven no aportan y multiplicarían las mallas por cinco).

## 11. Fuera de alcance

Patas, probóscide, animación de aterrizaje, mariposa posada, sombra proyectada propia,
texturas de archivo (el ala se pinta en el cliente), cambios en `PlayerController` y
cualquier variación de la escala del avatar.

## 12. Estado y qué sigue

Implementado, verificado y cerrado. Para el agente siguiente: el avatar es el de §5, las
mediciones son las de §6 y los tropiezos ya pagados están en §6.1 y §9. Queda pendiente la
fase 2 de §10 (las 45 mariposas del pueblo) y, si alguien quiere acoplar el vaivén del grupo
al ciclo de aleteo, eso toca `PlayerController` y exige su propia regresión de navegación.
