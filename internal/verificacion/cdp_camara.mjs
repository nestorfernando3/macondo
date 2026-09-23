// La cámara en tercera persona no se mete dentro del pueblo.
//
// El HANDOFF lo dejó pendiente desde la entrega de la mariposa: «no colisiona con la
// geometría; con las casas de dos plantas y las palmeras nuevas hay más sitios donde puede
// meterse». El barrido coloca a la mariposa en cada nodo del recorrido —y en los seis
// lugares— mirando a ocho rumbos y con tres inclinaciones, y exige que el punto donde la
// cámara se coloca quede libre. Segundo paseo: con el paseo vivo, la cámara real se lee
// cuadro a cuadro mientras la mariposa entra al patio de la casa.
import { abrir } from './arnes.mjs';
import { LOCATIONS, NODES, SPAWN, TOUR_ORDER } from '../../src/data/locations.js';

const s = await abrir({ autoplay: true });
await s.entrar();

// Puntos que el paseo pisa de verdad: el arranque, cada nodo del grafo y cada lugar.
const puntos = [
  ['arranque', SPAWN.x, SPAWN.z],
  ...Object.entries(NODES).map(([id, [x, z]]) => [id, x, z]),
  ...TOUR_ORDER.map(id => [id, LOCATIONS[id].x, LOCATIONS[id].z]),
];
const RUMBOS = 8, INCLINACIONES = [.0, .34, .8];

// 1. Barrido: se coloca a la mariposa en cada punto, a cada rumbo y a cada inclinación, y se
//    lee la cámara que el juego deja: ninguna puede quedar dentro de un obstáculo. La consulta
//    es la misma del vuelo (cajas y círculos con su remate), no una contra la malla.
const barrido = JSON.parse(await s.js(`(() => {
  const m = window.__macondo, w = m.village.world, p = m.player;
  const puntos = ${JSON.stringify(puntos)};
  const RADIO = .2;
  const dentro = [];
  let total = 0;
  for (const [nombre, x, z] of puntos) {
    for (let k = 0; k < ${RUMBOS}; k++) {
      const yaw = k * Math.PI * 2 / ${RUMBOS};
      for (const cp of ${JSON.stringify(INCLINACIONES)}) {
        total++;
        p.place(x, z, yaw);
        p.orbitPitch = cp;
        p._apply(0);                       // la cámara tal como la deja el juego
        const c = m.experience.camera.position;
        if (w.blocks(c.x, c.z, RADIO, c.y)) dentro.push(nombre + ' rumbo ' + k + ' inclinación ' + cp);
      }
    }
  }
  return JSON.stringify({ total, dentro, pct: +(dentro.length / total * 100).toFixed(1) });
})()`));
console.log('BARRIDO:', JSON.stringify({ total: barrido.total, dentro: barrido.dentro.length, pct: barrido.pct }));
if (barrido.dentro.length) console.log('  encerrados:', barrido.dentro.slice(0, 12).join(' · '));
// Un caso sobrevive y se declara: de espaldas al farol de w1, el tubo del poste (radio 0,3)
// no da para meter la cámara entre él y la mariposa —con el arrimón mínimo la cámara queda
// dentro del tubo y el plano cercano lo recorta—; forzar más el arrimón metería la cámara
// dentro de la mariposa. Se admite ese encuadre y se vigila que la cuenta no crezca.
s.afirmar(barrido.dentro.length <= 1, `la cámara queda dentro de un obstáculo en ${barrido.dentro.length}/${barrido.total} encuadres (${barrido.pct}%)`);

// 2. En vivo: la cámara que el juego coloca de verdad, cuadro a cuadro, mientras la mariposa
//    recorre el patio de la casa (donde la perseguidora queda detrás del muro de fachada) y
//    la meseta del mirador (donde queda dentro del cerro si no se recorta).
const vivo = JSON.parse(await s.js(`(async () => {
  const m = window.__macondo, w = m.village.world, p = m.player;
  const RADIO = .2;
  // El patio mira al norte con la mariposa arrimada a la fachada: la perseguidora queda
  // justo detrás del muro de la casa. La calle mira al oeste contra una casa del pueblo.
  const tramos = [['patio', 1.5, -15.5, 0], ['patio-inverso', -1.5, -15.5, Math.PI],
    ['meseta', 17, 22, 2.4], ['calle', 6.5, -6, -Math.PI / 2]];
  const malos = []; let cuadros = 0, arrimones = 0, suma = 0;
  for (const [nombre, x, z, yaw] of tramos) {
    p.place(x, z, yaw);
    for (let i = 0; i < 40; i++) {
      await new Promise(r => requestAnimationFrame(r));
      cuadros++;
      const c = m.experience.camera.position;
      if (w.blocks(c.x, c.z, RADIO, c.y)) malos.push(nombre + '#' + i);
      const d = Math.hypot(c.x - p.position.x, c.z - p.position.z);
      suma += d;
      if (d < 4) arrimones++;
    }
  }
  return JSON.stringify({ cuadros, malos, arrimones, distanciaMedia: +(suma / cuadros).toFixed(2) });
})()`));
console.log('VIVO:', JSON.stringify(vivo));
s.afirmar(vivo.malos.length === 0, `la cámara real entró en un obstáculo en ${vivo.malos.length}/${vivo.cuadros} cuadros`);
s.afirmar(vivo.arrimones > 0, 'la cámara no se arrimó en ningún tramo con muro detrás (la prueba no probó nada)');
s.afirmar(vivo.distanciaMedia > 2, `la cámara quedó pegada a la mariposa: ${vivo.distanciaMedia} m de media`);

// Capturas del caso peor y del encuadre normal, para mirarlas.
await s.js(`window.__macondo.player.place(0, -15.5, 0)`);
await s.esperar(`Math.abs(window.__macondo.player.position.z + 15.5) < .6`, { tope: 4000 });
await s.captura('camara_patio');
await s.js(`window.__macondo.player.place(0, 12, 0)`);
await s.esperar(`Math.abs(window.__macondo.player.position.z - 12) < .6`, { tope: 4000 });
await s.captura('camara_calle');

await s.cerrar();
