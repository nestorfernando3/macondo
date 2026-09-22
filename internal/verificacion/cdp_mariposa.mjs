// Revisión visual del avatar: congela al jugador y captura poses repetibles más las
// métricas del renderer. El avatar es el de SPEC-MARIPOSA-AVATAR.md §5: 11 mallas,
// 1024 triángulos y textura pintada.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

// Congela la pose y limpia el encuadre (fuera HUD, subtítulos, viñeta y portada).
await s.js(`(() => { const m = window.__macondo;
  m.player.enabled = false;
  document.body.classList.add('exploring');
  for (const sel of ['#hud', '#caption', '#transition', '#vignette', 'header', 'main']) {
    const el = document.querySelector(sel); if (el) el.hidden = true;
  } })()`);

const CAMARAS = {
  detalle: { pos: [0.70, 3.15, 2.60], mira: [0.02, 2.12, 4] },
  giro: { pos: [1.45, 3.05, 2.70], mira: [0, 2.10, 4] },
  juego: { pos: [0, 4.80, 8.52], mira: [0, 2.60, 4] },
};
const POSES = [
  ['quieta', 0, 0, 0, 'detalle'],
  ['vuelo_arriba', 0.01785, 1, 0, 'detalle'],
  ['vuelo_abajo', 0.05357, 1, 0, 'detalle'],
  ['vuelo_giro', 0.01785, 1, 0.9, 'giro'],
  ['juego_arriba', 0.01785, 1, 0, 'juego'],
  ['juego_plano', 0.03570, 1, 0, 'juego'],
];
for (const [nombre, t, vel, banco, cam] of POSES) {
  const c = CAMARAS[cam];
  await s.js(`(() => { const m = window.__macondo, g = m.player.avatar.group;
    g.position.set(0, 2.1, 4); g.rotation.set(0, 0, 0);
    m.player.avatar.update(${t}, ${vel}, ${banco});
    m.experience.camera.position.set(${c.pos[0]}, ${c.pos[1]}, ${c.pos[2]});
    m.experience.camera.lookAt(${c.mira[0]}, ${c.mira[1]}, ${c.mira[2]}); })()`);
  await new Promise(r => setTimeout(r, 320));
  await s.captura(`mariposa_${nombre}`);
}

const m = JSON.parse(await s.js(`(() => { const m = window.__macondo, r = m.experience.renderer;
  let mallas = 0, tri = 0;
  m.player.avatar.group.traverse(o => { if (!o.isMesh) return; mallas++;
    tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return JSON.stringify({ mallasAvatar: mallas, triangulosAvatar: tri,
    texturaAla: !!m.player.avatar.group.children[0].children[0].material.map,
    llamadas: r.info.render.calls, triangulos: r.info.render.triangles }) })()`));
console.log('METRICAS:', JSON.stringify(m));
s.afirmar(m.mallasAvatar === 11, `el avatar tiene ${m.mallasAvatar} mallas y debería tener 11`);
s.afirmar(m.triangulosAvatar === 1024, `el avatar tiene ${m.triangulosAvatar} triángulos y deberían ser 1024`);
s.afirmar(m.texturaAla, 'el ala perdió su textura pintada');
await s.cerrar();
