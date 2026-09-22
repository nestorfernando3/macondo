// FPS del paseo y coste de dibujo en tres encuadres.
//
// OJO: estas cifras salen de Chrome headless con SwiftShader (rasterizador por CPU), así que
// son un SUELO, no una medida de dispositivo. Sirven para comparar antes/después de un cambio
// y para vigilar llamadas y triángulos; las metas del spec (≥30 FPS móvil, ≥50 escritorio)
// siguen pendientes de un equipo real.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

const ENCUADRES = [['plaza', 0, 12, 0], ['puerto', -29.5, 8, Math.PI / 2], ['mirador', 17, 22, 0]];
let peor = Infinity;
for (const [nombre, x, z, yaw] of ENCUADRES) {
  await s.js(`(() => { const m = window.__macondo;
    m.player.place(${x}, ${z}, ${yaw});
    window.__fps = { n: 0, t0: performance.now() };
    if (!window.__contando) { window.__contando = true; (function f(){ window.__fps.n++; requestAnimationFrame(f); })(); } })()`);
  await new Promise(r => setTimeout(r, 3500));
  const lectura = JSON.parse(await s.js(`(() => { const f = window.__fps;
    const s = window.__macondo, info = s.experience.renderer.info;
    return JSON.stringify({ fps: +(f.n / ((performance.now() - f.t0) / 1000)).toFixed(1),
      llamadas: info.render.calls, triangulos: info.render.triangles }) })()`));
  console.log(`${nombre.padEnd(8)} ${String(lectura.fps).padStart(5)} FPS · ${String(lectura.llamadas).padStart(4)} llamadas · ${String(lectura.triangulos).padStart(6)} triángulos`);
  peor = Math.min(peor, lectura.fps);
  // Se afirma sobre lo determinista (llamadas y triángulos). El FPS del banco por CPU varía
  // ±20 % con la carga de la máquina: se informa y sólo se vigila que no sea catastrófico.
  s.afirmar(lectura.llamadas < 400, `${nombre}: ${lectura.llamadas} llamadas pasa el presupuesto`);
  s.afirmar(lectura.triangulos < 150000, `${nombre}: ${lectura.triangulos} triángulos pasa el presupuesto`);
}
console.log('PEOR FPS (SwiftShader, suelo orientativo):', peor);
s.afirmar(peor >= 5, `el peor encuadre baja de 5 FPS en el banco: ${peor}`);
await s.cerrar();
