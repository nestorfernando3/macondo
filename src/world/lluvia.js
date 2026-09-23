import * as THREE from 'three';
import { secuencia } from './azar.js';

// ============================================================================
// La lluvia del capítulo 16 —el aguacero que dura años— como fenómeno de la
// instalación. No es física de fluidos: es una capa ligera y creíble, apagada
// por defecto y encendible desde la interfaz por el integrador. El sonido no
// vive aquí: lo pone el integrador.
//
// DOS llamadas de dibujo, y ni una más
//   1) `gotas` — UN InstancedMesh que reúne la cortina y el rebote. Gotas y
//      salpicaduras comparten la misma geometría (un plano de dos triángulos):
//      la gota es ese plano de canto, estirado en vertical y girado al azar; la
//      salpicadura es el mismo plano tumbado y encogido hasta el ancho de un
//      rizo. Así la cortina y su salpicadura caben en una sola llamada.
//   2) `velo`  — un cilindro abierto, gris y translúcido, que envuelve la
//      cortina: la humedad suspendida. Una malla, sin instanciar.
//   Sin sombras, sin postprocesado y con `depthWrite:false` en las dos capas
//   transparentes (como la espuma y el humo de ambient.js).
//
// Cómo se enciende y se apaga
//   `set(nivel)` acepta 0 (apagado), 1 (llovizna) y 2 (aguacero); se puede
//   llamar en cualquier momento y es idempotente. Nace APAGADO: `crearLluvia`
//   devuelve el sistema con `visible` en falso, así que la escena intacta no
//   cambia ni un triángulo visible hasta que alguien llame a `set(1)` o
//   `set(2)`. `set(0)` lo apaga de nuevo.
//
// La firma de la posición (decisión)
//   `update(dt, pos?)`, con `pos` OPCIONAL y de forma `{ x, y, z }` —cualquier
//   objeto con esos tres números, por ejemplo `player.position`—. La cortina
//   sigue a la mariposa en horizontal y su banda vertical va de `pos.y −
//   CORTINA_BAJO` (la base, donde rebotan las salpicaduras) a `pos.y −
//   CORTINA_BAJO + CORTINA_ALTO` (por encima de la cabeza). Si `pos` se omite,
//   la cortina se queda donde estaba. Se eligió el argumento de `update` y no
//   un objeto guardado por `set` porque `set` es estado y `update` es el
//   fotograma: la posición llega en cada tick y no hay que recordarla entre
//   llamadas.
//
// Movimiento reducido (prefers-reduced-motion)
//   Las gotas se reparten pero se quedan QUIETAS: `update` no anima la caída
//   —nada de movimiento continuo—. La cortina sí sigue a la mariposa cuando
//   llega `pos`, que no es movimiento propio sino el que navega. `visible`
//   sigue en falso hasta que el integrador encienda con `set(1|2)`.
//
// Coste
//   Menos de ~1 300 triángulos equivalentes y CERO asignaciones por fotograma:
//   `update` sólo recompone matrices sobre un `Object3D` reutilizable.
// ============================================================================

const TAU = Math.PI * 2;

// La preferencia se lee una vez, al cargar el módulo, como en beacon.js y
// ambient.js: es una decisión de la sesión, no algo que cambie a media función.
const QUIETO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Medidas de la cortina, en metros.
const CORTINA_ALTO = 10;    // cuánto sube la banda por encima de la base
const CORTINA_BAJO = 1.7;   // a qué profundidad bajo la mariposa queda la base (el «suelo» de la cortina)
const ANCHO_GOTA = .02;     // grosor de una gota
const SALPICADURAS = 14;    // rizos discretos sobre la base
const SALTO_RIZO = 1.15;    // ciclos por segundo de un rizo

// Cómo se ve cada nivel. `fraccion` recorta cuántas gotas se dibujan —bajar
// `InstancedMesh.count` es lo más barato que hay: no se toca ni una matriz—;
// la llovizna nunca llega a las salpicaduras, que van al final de la lista.
const NIVELES = {
  1: { fraccion: .45, opacidad: .34, velocidad: .55, velo: .055 },   // llovizna
  2: { fraccion: 1, opacidad: .58, velocidad: 1, velo: .13 },        // aguacero
};

// `scene` es la escena de la experiencia; `radio` y `cantidad` son el alcance
// horizontal de la cortina (m) y cuántas gotas se reparten por ella.
export function crearLluvia(scene, { radio = 10, cantidad = 600 } = {}) {
  const gotasN = Math.max(1, Math.floor(cantidad));
  const rnd = secuencia(41);

  // --- Datos por instancia: se calculan UNA vez, fuera del fotograma ---
  const offX = new Float32Array(gotasN), offZ = new Float32Array(gotasN);
  const fase = new Float32Array(gotasN), vel = new Float32Array(gotasN);
  const giro = new Float32Array(gotasN), largo = new Float32Array(gotasN);
  for (let i = 0; i < gotasN; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * radio;   // sqrt: reparto parejo en el disco
    offX[i] = Math.cos(a) * r; offZ[i] = Math.sin(a) * r;
    fase[i] = rnd();                    // desfase de caída: no bajan todas a la vez
    vel[i] = .5 + rnd() * .55;          // ciclos por segundo de cada gota
    giro[i] = rnd() * TAU;              // orientación alrededor de la vertical (se ve de canto)
    largo[i] = .22 + rnd() * .26;       // estela de la gota
  }
  const sX = new Float32Array(SALPICADURAS), sZ = new Float32Array(SALPICADURAS);
  const faseS = new Float32Array(SALPICADURAS), sMax = new Float32Array(SALPICADURAS);
  for (let i = 0; i < SALPICADURAS; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * radio * .7;
    sX[i] = Math.cos(a) * r; sZ[i] = Math.sin(a) * r;
    faseS[i] = rnd();
    sMax[i] = .12 + rnd() * .2;         // radio máximo del rizo
  }

  // --- Geometrías y materiales (una geometría por llamada de dibujo) ---
  const plano = new THREE.PlaneGeometry(1, 1);                       // 2 triángulos
  const materialGotas = new THREE.MeshBasicMaterial({
    color: 0xcfe4ec, transparent: true, opacity: NIVELES[2].opacidad,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const cilindro = new THREE.CylinderGeometry(radio * 1.15, radio * 1.15, CORTINA_ALTO, 16, 1, true); // 32 triángulos
  const materialVelo = new THREE.MeshBasicMaterial({
    color: 0x94a7ac, transparent: true, opacity: NIVELES[2].velo,
    depthWrite: false, side: THREE.BackSide,   // desde dentro se ve la pared de enfrente: un velo, no dos
  });

  const gotas = new THREE.InstancedMesh(plano, materialGotas, gotasN + SALPICADURAS);
  gotas.castShadow = gotas.receiveShadow = false;   // sin sombras, por contrato
  gotas.frustumCulled = false;                      // sus instancias se mueven con la mariposa
  gotas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const velo = new THREE.Mesh(cilindro, materialVelo);
  velo.position.y = CORTINA_ALTO / 2;               // centrado en la banda
  velo.castShadow = velo.receiveShadow = false;

  const capa = new THREE.Group();
  capa.name = 'lluvia';
  capa.add(gotas, velo);
  capa.visible = false;                             // apagado por defecto: la escena no cambia
  scene.add(capa);

  // --- Estado ---
  const dummy = new THREE.Object3D();   // reutilizable: ni un `new` dentro de update
  let t = 0;                            // reloj propio; sólo avanza con la lluvia visible y en movimiento
  let factorVel = NIVELES[2].velocidad;

  // Recoloca todas las instancias para el tiempo `t`. Es lo único que hace update.
  function colocar() {
    for (let i = 0; i < gotasN; i++) {
      const u = ((t * vel[i]) % 1 + 1) % 1;             // 0 arriba, 1 en la base
      dummy.position.set(offX[i], CORTINA_ALTO * (1 - u), offZ[i]);
      dummy.rotation.set(0, giro[i], 0);
      dummy.scale.set(ANCHO_GOTA, largo[i], 1);
      dummy.updateMatrix();
      gotas.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < SALPICADURAS; i++) {
      const u = ((t * SALTO_RIZO + faseS[i]) % 1 + 1) % 1;
      const s = Math.sin(u * Math.PI) * sMax[i];        // nace, crece y muere: sin opacidad por instancia
      dummy.position.set(sX[i], .03, sZ[i]);
      dummy.rotation.set(-Math.PI / 2, 0, 0);           // el plano, tumbado en el suelo
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      gotas.setMatrixAt(gotasN + i, dummy.matrix);
    }
    gotas.instanceMatrix.needsUpdate = true;
  }
  colocar();                            // la cortina queda armada aunque nadie la anime todavía

  return {
    get visible() { return capa.visible; },   // para verificación CDP

    set(nivel) {
      const n = nivel >= 2 ? 2 : nivel >= 1 ? 1 : 0;
      capa.visible = n > 0;
      if (!n) return;
      const c = NIVELES[n];
      // La llovizna sólo dibuja gotas; el aguacero suma las salpicaduras, que van al final.
      gotas.count = n === 2 ? gotasN + SALPICADURAS : Math.floor(gotasN * c.fraccion);
      materialGotas.opacity = c.opacidad;
      materialVelo.opacity = c.velo;
      factorVel = c.velocidad;
    },

    update(dt, pos) {
      if (pos) capa.position.set(pos.x, pos.y - CORTINA_BAJO, pos.z);
      if (!capa.visible || QUIETO) return;   // apagada o con movimiento reducido: nada que animar
      t += dt * factorVel;
      colocar();
    },

    dispose() {
      scene.remove(capa);
      capa.clear();
      gotas.dispose();
      plano.dispose(); materialGotas.dispose();
      cilindro.dispose(); materialVelo.dispose();
    },
  };
}
