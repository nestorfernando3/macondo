// Circuito guiado completo: casa → jardín → puerto → mirador, con captura en cada llegada.
// Espera por condición (no por tiempo fijo): el paso del recorrido depende de los FPS del
// renderizador de pruebas.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

async function irA(nombre) {
  await s.js(`(() => { document.querySelector('#open-map').click();
    const b = [...document.querySelectorAll('#map-destinations button')].find(x => x.textContent.includes(${JSON.stringify(nombre)}));
    if (!b) return 'no-btn'; b.click(); return 'ok'; })()`);
  const abrio = await s.js(`document.querySelector('#map').open`);
  if (abrio) await s.js(`document.querySelector('#map').close()`);
  const t = await s.esperar(`!window.__macondo.tour.active &&
    (document.querySelector('#tour-msg').textContent || '').startsWith('Llegaste')`, { tope: 150000 });
  const estado = JSON.parse(await s.js(`JSON.stringify({
    lugar: document.querySelector('#place-name').textContent,
    msg: document.querySelector('#tour-msg').textContent,
    pos: (() => { const p = window.__macondo.player.position; return [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)]; })()
  })`));
  console.log(`${nombre} (${(t / 1000).toFixed(1)}s):`, JSON.stringify(estado));
  s.afirmar(t >= 0, `${nombre}: no llegó en 150 s`);
  s.afirmar(estado.msg.startsWith('Llegaste'), `${nombre}: mensaje inesperado «${estado.msg}»`);
  await s.captura(`tour_${nombre.toLowerCase()}`);
  await s.js(`document.querySelector('#tour-stop').click()`);
  return estado;
}

for (const [etiqueta, rotulo] of [['casa', 'Casa'], ['jardin', 'Jard'], ['puerto', 'Puer'], ['mirador', 'Mira']]) {
  await irA(rotulo);
}

const progreso = await s.js(`document.querySelector('#progress').textContent`);
console.log('PROGRESO:', progreso);
s.afirmar(/4 \/ 4/.test(progreso), `progreso final: ${progreso}`);

// El muelle se vuela a 2,4 m (tabla a 0,35 m) y la meseta a 5,1 m: son las alturas pactadas.
const puerto = JSON.parse(await s.js(`JSON.stringify((() => { window.__macondo.player.place(-29.5, 8, Math.PI/2);
  return window.__macondo.player.position.y; })())`));
s.afirmar(Math.abs(puerto - 2.45) < .2, `el muelle no está a 2,45 m de vuelo sino a ${puerto}`);
await s.cerrar();
