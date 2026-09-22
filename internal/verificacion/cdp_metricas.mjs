// Coste de dibujo del pueblo: congela la mariposa en cada lugar, mira desde el encuadre
// real del paseo y escribe metricas_<nombre>.json con llamadas, triángulos y mallas.
// Es el instrumento para comparar antes/después de un cambio de modelos o de vida.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { abrir } from './arnes.mjs';

const nombre = process.argv[3] || 'metricas_despues.json';
const s = await abrir({ autoplay: true, out: process.argv[2] });
s.permitir(/modo sin 3D solicitado/);
await s.entrar();

await s.js(`(() => { const m = window.__macondo;
  m.player.enabled = false;
  document.body.classList.add('exploring');
  for (const sel of ['#hud', '#caption', '#transition', '#vignette', 'header', 'main']) {
    const el = document.querySelector(sel); if (el) el.hidden = true;
  } })()`);

// yaw 0 mira al norte (-z); +π/2 al oeste; -π/2 al este.
const LUGARES = [
  ['plaza', 0, 12, 0],
  ['casa', 0, -8, 0],
  ['jardin', 23.4, -11.5, -Math.PI / 2],   // dentro del jardín: la cámara queda libre
  ['puerto', -29.5, 8, Math.PI / 2],
  ['mirador', 17, 22, 0],
];

const salida = {};
for (const [lugar, x, z, yaw] of LUGARES) {
  const lectura = JSON.parse(await s.js(`(() => {
    const m = window.__macondo, r = m.experience.renderer;
    m.player.place(${x}, ${z}, ${yaw});
    const p = m.player.position;
    const fx = -Math.sin(${yaw}), fz = -Math.cos(${yaw});
    m.experience.camera.position.set(p.x - fx * 4.52, p.y + 2.7, p.z - fz * 4.52);
    m.experience.camera.lookAt(p.x, p.y + .5, p.z);
    m.experience.renderer.render(m.experience.scene, m.experience.camera);
    let mallas = 0, instanciadas = 0;
    m.experience.scene.traverse(o => { if (!o.isMesh) return; mallas++; if (o.isInstancedMesh) instanciadas++; });
    return JSON.stringify({ llamadas: r.info.render.calls, triangulos: r.info.render.triangles,
      mallas, instanciadas, texturas: r.info.memory.textures,
      pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)] });
  })()`));
  salida[lugar] = lectura;
  console.log(`${lugar.padEnd(8)} ${String(lectura.llamadas).padStart(4)} llamadas · ${String(lectura.triangulos).padStart(6)} triángulos · ${lectura.mallas} mallas`);
  await new Promise(r => setTimeout(r, 250));
  await s.captura(`pueblo_${nombre.replace('.json', '')}_${lugar}`);
  s.afirmar(lectura.llamadas < 400, `${lugar}: ${lectura.llamadas} llamadas pasa el presupuesto`);
}

const total = JSON.parse(await s.js(`(() => { const r = window.__macondo.experience.renderer;
  return JSON.stringify({ llamadas: r.info.render.calls, triangulos: r.info.render.triangles,
    programas: r.info.programs?.length ?? 0, texturas: r.info.memory.textures,
    geometrias: r.info.memory.geometries }) })()`));
console.log('TOTAL:', JSON.stringify(total));
writeFileSync(join(s.out, nombre), JSON.stringify({ lugares: salida, total }, null, 1));
console.log('ESCRITO:', join(s.out, nombre));
await s.cerrar();
