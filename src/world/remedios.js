// Remedios, la bella, subiendo al cielo con las sábanas de bramante.
//
// Es la escena del capítulo 12: Fernanda quiere doblar en el jardín sus sábanas de bramante y
// un viento de luz se las arranca de las manos. Aquí esa tarde se repite en ciclo, porque el
// paseo no tiene principio ni final: quien llega al jardín en cualquier momento la ve subir.
// La ascensión arranca del tendal (el ancla «sabanas-bramante», que también es su encuentro),
// gana 37 m y se apaga sola en el aire alto, de modo que el reinicio del ciclo no se ve nunca:
// cuando vuelve a empezar está a ras de suelo y con opacidad cero, y los dos extremos se
// cruzan invisibles.
//
// La subida NO es lineal: con el exponente de `SUBIDA` se demora abajo —donde la mariposa la
// mira de cerca y hay algo que ver— y se acelera justo cuando ya se está desvaneciendo. Una
// recta la tenía la mitad del ciclo a media altura, que es donde menos se lee.
//
// Todo cuelga de `kit.animar`, así que «Pausar movimiento» la congela donde esté. Con
// `prefers-reduced-motion` se construye en pose fija a media subida: sin ese caso quedaría
// invisible, porque `village.update` sólo corre con el reloj del pueblo andando y en reposo la
// ascensión se quedaría en su fotograma cero, que es opacidad cero.
import * as THREE from 'three';
import { ancla } from './anclas.js';
import { LOCATIONS } from '../data/locations.js';

const CICLO = 62;          // segundos de una ascensión completa
// Arranca POR ENCIMA del cordel (2,4 m). A la altura del tendal, su vestido de bramante y la
// ropa tendida son el mismo color y la misma altura, y a distancia de juego —la cámara va 4,8 m
// detrás de la mariposa, así que se la mira desde unos 8 m— las dos piezas se fundían en una
// sola mancha clara. Sobre el cordel se lee desde el primer fotograma como lo que es.
const ARRANQUE = 2.6;
const CUMBRE = 38;         // se apaga antes de llegar al techo de la niebla
const SUBIDA = 1.55;       // exponente de la subida: se demora abajo y se acelera al irse
const DERIVA_X = 2;        // el viento se la lleva hacia el este…
const DERIVA_Z = 7;        // …y hacia el sur, que es lo que deja verla desde el jardín
const POSE_FIJA = .34;     // fotograma de la pose con movimiento reducido

// Rampa 0→1 acotada, y su versión suavizada. El ciclo de opacidad se arma con dos de estas:
// una de entrada y otra de salida, y en medio un tramo entero a plena vista.
const rampa = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
const suave = x => x * x * (3 - 2 * x);

// Ondula una sábana sobre su malla de reposo. Las sábanas se llevan en el aire y tienen que
// aletear —«el deslumbrante aleteo de las sábanas que subían con ella»—; un plano rígido que
// sólo gira se lee como una tabla. Son 30 vértices por sábana: moverlos es más barato que
// ordenar mallas hijas, y da la única silueta que esta escena no puede fingir.
function ondular(geo, reposo, t, fase) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = reposo[i * 3], y = reposo[i * 3 + 1];
    p.setZ(i, Math.sin(x * 2.2 + t * 2.6 + fase) * .12 + Math.sin(y * 2.8 - t * 1.8 + fase) * .07);
  }
  p.needsUpdate = true;
}

export function crearRemedios(ctx) {
  const { kit, scene } = ctx;
  const tendal = ancla('sabanas-bramante');
  const jardin = LOCATIONS.jardin;
  const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Materiales propios y no los del kit: tienen que apagarse. `vestido` lleva emisión porque
  // ella sube contra un cielo muy claro (#9ed4e4) y sin luz propia el vestido blanco se
  // pierde en el fondo justo cuando más alta está. Es también lo que pide el texto: la
  // «palidez intensa» que Amaranta advierte antes de que empiece a elevarse.
  const materiales = [
    new THREE.MeshStandardMaterial({ color: 0xfdfaf2, roughness: .8, transparent: true, emissive: 0xfff0cf, emissiveIntensity: .34 }),
    new THREE.MeshStandardMaterial({ color: 0xd8a882, roughness: .8, transparent: true }),
    new THREE.MeshStandardMaterial({ color: 0x2b1d17, roughness: .9, transparent: true }),
    new THREE.MeshStandardMaterial({ color: 0xfaf4e6, roughness: .95, side: THREE.DoubleSide, transparent: true, opacity: .96, emissive: 0xfff3d8, emissiveIntensity: .16 }),
  ];
  const [vestido, piel, cabello, sabana] = materiales;

  const raiz = new THREE.Group();
  // Con nombre, para que la verificación la encuentre sin adivinar por un número mágico: los
  // guiones la buscaban por `emissiveIntensity === .24` y bastaba retocar el brillo del vestido
  // para que dejaran de verla y culparan al producto. Es el mismo oficio que `window.__macondo`.
  raiz.name = 'remedios';
  raiz.scale.setScalar(1.2);          // ≈1,9 m de estatura: la escala humana del pueblo
  scene.add(raiz);

  const pieza = (geo, mat, x, y, z) => {
    const malla = new THREE.Mesh(geo, mat);
    malla.position.set(x, y, z);
    malla.castShadow = false;         // en el cielo no proyecta: el mapa de sombras no la paga
    raiz.add(malla);
    return malla;
  };

  // Vestido: un solo tubo ahusado del pecho al ruedo. La falda y el torso eran dos piezas y se
  // veía la costura; con una sola, el cuerpo entero se resuelve en una llamada de dibujo.
  // Va cerrado por abajo: la mariposa vuela a 2,1 m y la mira desde la panza, así que un
  // ruedo abierto dejaría ver el interior del vestido.
  pieza(new THREE.CylinderGeometry(.16, .43, 1.32, 12), vestido, 0, .66, 0);
  // Cabeza y cabello: dos esferas, la del pelo algo mayor y corrida atrás, que es lo que deja
  // ver la cara de frente.
  pieza(new THREE.SphereGeometry(.115, 12, 10), piel, 0, 1.42, 0);
  pieza(new THREE.SphereGeometry(.135, 12, 10), cabello, 0, 1.46, -.03);
  // El brazo del saludo, con el origen en el hombro —la geometría se corre media asta hacia
  // abajo para que girar el hombro sea girar `rotation.z` y nada más—.
  const brazo = pieza(
    new THREE.CylinderGeometry(.045, .038, .52, 8).translate(0, -.26, 0), piel, .17, 1.28, 0,
  );

  // Las dos sábanas que suben con ella, cada una con su malla de reposo para poder ondularlas.
  // Pequeñas y pegadas al cuerpo a propósito: una sábana de 1,5 m vista desde 8 m es un panel
  // blanco de dos metros y medio de alto que se come la figura entera. El texto pide que
  // aleteen con ella, no que la tapen.
  const sabanas = [[-.44, 1.66, .12, .82, .62, 0], [.48, 1.84, -.14, .76, .68, 2.1]].map(
    ([x, y, z, ancho, alto, fase]) => {
      const geo = new THREE.PlaneGeometry(ancho, alto, 5, 4);
      const malla = pieza(geo, sabana, x, y, z);
      return { geo, malla, fase, reposo: Float32Array.from(geo.attributes.position.array) };
    },
  );

  kit.animar(t => {
    const u = quieto ? POSE_FIJA : ((t / CICLO) % 1 + 1) % 1;
    const k = u ** SUBIDA;

    // Opacidad: entra desvanecida a ras de suelo y sale desvanecida en lo alto, así que el
    // salto de `u = 1` a `u = 0` ocurre con la figura ya invisible y el ciclo no se delata.
    const alfa = suave(rampa(u, 0, .05)) * (1 - suave(rampa(u, .72, .95)));
    raiz.visible = alfa > .012;        // apagada del todo, tampoco se dibuja
    if (!raiz.visible) return;
    for (const m of materiales) m.opacity = alfa;

    const x = tendal.x + DERIVA_X * k + Math.sin(k * 5) * .35;
    const z = tendal.z + DERIVA_Z * k;
    raiz.position.set(x, ARRANQUE + (CUMBRE - ARRANQUE) * k, z);

    // Mira hacia el jardín mientras sube: la cara se le ve desde donde está el tendal y, al
    // derivar, el rumbo se corrige solo en vez de quedarse girada al punto de partida. El
    // frente del modelo es −z, que es la convención del avatar, así que el rumbo es
    // atan2(−dx, −dz) con (dx, dz) la dirección que debe mirar.
    raiz.rotation.y = Math.atan2(x - jardin.x, z - jardin.z);

    // «Le decía adiós con la mano.» El saludo va en el hombro y se para con la figura; con
    // movimiento reducido queda a media seña, que es una pose y no un gesto congelado a medias.
    brazo.rotation.z = 2.45 + (quieto ? .2 : Math.sin(t * 4.2) * .38);

    for (const s of sabanas) {
      ondular(s.geo, s.reposo, quieto ? 0 : t, s.fase);
      // Giros cortos. Con amplitudes de medio radián las sábanas se ponían de canto frente a la
      // cámara y se leían como dos paneles blancos, no como ropa: abanicarse sin llegar nunca a
      // mirar de frente es lo que las mantiene siendo tela.
      s.malla.rotation.set(
        quieto ? .18 : Math.sin(t * 1.15 + s.fase) * .2,
        s.fase * .6 + (quieto ? 0 : Math.sin(t * .7 + s.fase) * .28),
        quieto ? .12 : Math.sin(t * .85 + s.fase) * .16,
      );
    }
  });
}
