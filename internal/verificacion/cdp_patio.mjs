// Vistas del patio de la casa de la memoria: dentro del recinto, mirando al sur y al norte.
// Es revisión visual (el patio no es uno de los cinco lugares del mapa), no navegación.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();
await s.js(`document.body.classList.remove('exploring');
  for (const sel of ['#hud', '#caption']) { const el = document.querySelector(sel); if (el) el.hidden = true; }`);

for (const [nombre, yaw] of [['patio_vista_sur', Math.PI], ['patio_vista_norte', 0]]) {
  await s.js(`window.__macondo.player.place(0.2, -13.2, ${yaw})`);
  await s.esperar(`Math.abs(window.__macondo.player.position.z + 13.2) < .3`, { tope: 4000 });
  await new Promise(r => setTimeout(r, 400));
  await s.captura(nombre);
  // El patio está cerrado por muros: ni el vuelo ni la cámara deben salirse del recinto.
  const dentro = await s.js(`(() => { const p = window.__macondo.player.position;
    return p.x > -3.6 && p.x < 3.6 && p.z > -19 && p.z < -11 })()`);
  s.afirmar(dentro, `${nombre}: la mariposa quedó fuera del patio`);
}
await s.cerrar();
