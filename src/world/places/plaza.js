// Plaza de llegada: piso de piedra, fuente, el reloj de la llegada, bancas, faroles,
// puesto de mercado y árboles de sombra. Conserva las colisiones de la versión anterior
// (fuente, reloj, bancas) porque el grafo del recorrido las esquiva.
import * as THREE from 'three';
import { createFountain } from '../water.js';
import { secuencia } from '../kit.js';
import { ancla } from '../anclas.js';

export function buildPlaza(ctx) {
  const { kit, scene } = ctx;
  const { lote, cil, local, animar } = kit;

  // ---------- Piso ----------
  cil('piedraHonda', 4.6, .1, 0, .05, 0);
  cil('piedra', 3.9, .08, 0, .12, 0);
  // Orla de piedra: losas tangentes que forman un borde continuo, no escombros sueltos.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    lote('caja', 'piedraHonda', Math.cos(a) * 3.5, .14, Math.sin(a) * 3.5,
      { ry: Math.PI / 2 - a, esc: [1.02, .12, .42] });
  }
  cil('tierraHonda', 1.55, .06, 0, .15, 0);

  // ---------- Fuente ----------
  cil('piedraHonda', 1.4, .18, 0, .09, 0);
  cil('piedra', 1.05, .28, 0, .3, 0);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(1.01,.08,6,24),kit.m('piedra'));
  borde.rotation.x = Math.PI/2; borde.position.y=.65; scene.add(borde);
  cil('agua', .95, .06, 0, .61, 0);
  cil('piedra', .34, 1.02, 0, 1.16, 0);
  cil('piedraHonda', .58, .16, 0, 1.66, 0);
  cil('agua', .5, .06, 0, 1.74, 0);
  for (let i = 0; i < 4; i++) {                       // mascarones; el agua sale por ellos
    const a = (i / 4) * Math.PI * 2 + .4;
    lote('caja', 'piedraHonda', Math.cos(a) * .5, 1.62, Math.sin(a) * .5, { ry: -a, esc: [.24, .18, .15] });
  }
  for (let i = 0; i < 3; i++) {                       // hojas de agua en la taza
    const a = i * 2.1 + .6, d = .34 + i * .17;
    lote('cil', 'hojaClara', Math.cos(a) * d, .64, Math.sin(a) * d, { esc: [.36, .012, .3], sombra: false });
  }
  createFountain(kit);
  kit.colisionCirculo(0, 0, .95);

  // ---------- Reloj de la llegada (ancla del encuentro objeto-reloj) ----------
  // La pieza vive en el kit: aquí sólo se dice dónde está y hacia dónde mira la carátula, que
  // es hacia el camino de llegada, no hacia la fuente.
  const reloj = ancla('objeto-reloj');
  kit.reloj(reloj.x, reloj.z, .55);

  // ---------- Bancas, macetas y faroles ----------
  for (const [bx, bz] of [[6.4, 3.4], [-6.4, -3.4], [4.6, -4.4]]) {
    kit.banca(bx, bz, Math.atan2(bz, bx) + Math.PI / 2);
  }
  for (const [px, pz, s] of [[2.6, -2.6, 31], [-2.6, 2.6, 32], [3.8, .5, 33], [-3.6, -.8, 34]]) {
    kit.maceta(px, pz, { r: .34, semilla: s });
  }
  for (const [fx2, fz2, ry] of [[7.9, 6.4, Math.PI], [-7.9, -6.4, 0], [7.2, -6.4, Math.PI], [-7.2, 6.4, 0]]) {
    kit.farol(fx2, fz2, { alto: 3.6, ry });
  }

  // ---------- Puesto de mercado con toldo ----------
  const PX = 8.2, PZ = -3.4, PRY = -.35;
  const LP = local(PX, PZ, PRY);
  for (const lado of [-1, 1]) {
    const [px, pz] = LP(lado * 1.05, .2);
    lote('cil', 'madera', px, 1.25, pz, { esc: [.14, 2.5, .14] });
  }
  const [tx, tz] = LP(0, 0);
  const toldo = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.1, 6, 4),
    new THREE.MeshStandardMaterial({ color: kit.PALETA.lona, roughness: .95, side: THREE.DoubleSide }));
  toldo.position.set(tx, 2.36, tz); toldo.rotation.set(-Math.PI / 2, 0, PRY);
  toldo.castShadow = true; scene.add(toldo);
  const posT = toldo.geometry.attributes.position;
  const baseT = Float32Array.from(posT.array);
  animar(t => {
    for (let i = 0; i < posT.count; i++) {
      const x = baseT[i * 3], y = baseT[i * 3 + 1];
      posT.setZ(i, -0.18 * (1 - Math.abs(x) / 1.45) + Math.sin(t * 1.7 + x * 2) * .045 * (1 - Math.abs(y) / 1.05));
    }
    posT.needsUpdate = true;
  });
  lote('caja', 'maderaClara', PX, .84, PZ, { ry: PRY, esc: [2.4, .12, 1.4] });
  lote('caja', 'madera', PX, .42, PZ, { ry: PRY, esc: [2.2, .74, 1.2] });
  // El mostrador dejó de ser siete bolas de color: ahora es una cesta tejida con la fruta
  // dentro —cada una con su hoja— y una balanza de dos platos colgada del brazo del puesto.
  const rnd = secuencia(77);
  const [ex, ez] = LP(-.6, .05);                        // cesta de mimbre sobre la tabla
  for (let i = 0; i < 10; i++) {                        // costillas tejidas, abriéndose
    const a = (i / 10) * Math.PI * 2;
    lote('caja', i % 2 ? 'maderaClara' : 'madera', ex + Math.cos(a) * .32, 1.06, ez + Math.sin(a) * .32,
      { ry: -a, rz: -.13, esc: [.1, .44, .04] });
  }
  for (const y of [.98, 1.13, 1.26]) lote('cil', 'maderaClara', ex, y, ez, { esc: [.72, .03, .72], sombra: false });
  lote('cil', 'madera', ex, .98, ez, { esc: [.66, .04, .66], sombra: false });
  const frutas = ['hojaSeca', 'florRoja', 'amarillo', 'florRoja'];
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2 + i, d = rnd() * .2;
    const fx = ex + Math.cos(a) * d, fz = ez + Math.sin(a) * d, fy = 1.14 + (i % 2) * .09;
    lote('esfera', frutas[i % 4], fx, fy, fz, { esc: [.19 + rnd() * .06, .18, .19], sombra: false });
    lote('petalo', 'hojaClara', fx, fy + .09, fz, { ry: a * 2, rx: -.55, esc: [.17, 1, .11], sombra: false });
  }
  const [ax2, az2] = LP(1.05, 0);                        // balanza colgada del poste
  lote('caja', 'hierro', ax2, 2.06, az2, { ry: PRY, esc: [.72, .05, .05] });
  for (const lado of [-1, 1]) {
    const [gx, gz] = LP(1.05 + lado * .3, 0);
    lote('caja', 'maderaClara', gx, 1.87, gz, { ry: PRY, esc: [.03, .34, .03], sombra: false });
    lote('cil', 'hierro', gx, 1.66, gz, { esc: [.32, .05, .32], sombra: false });
  }
  kit.colisionCirculo(PX, PZ, .95);

  // ---------- Árboles de sombra ----------
  // La copa era un tronco con tres esferas. Ahora son lóbulos irregulares de tres tonos —el
  // de arriba recibe la luz, el de abajo se hunde—, con las raíces a la vista y la luz
  // moteada del follaje posada al pie. Sin raíces ni moteado, un árbol a la intemperie se
  // lee pegado a la tierra, y sin lóbulos de sobra, como una bola.
  for (const [tx2, tz2, semilla] of [[5.5, -5.5, 41], [-6.8, 5.6, 42]]) {
    const r = secuencia(semilla);
    cil('tronco', .26, 3.2, tx2, 1.6, tz2);
    for (let i = 0; i < 3; i++) {                       // raíces que agarran el suelo
      const a = (i / 3) * Math.PI * 2 + r() * .6;
      lote('cil', 'tronco', tx2 + Math.cos(a) * .5, .16, tz2 + Math.sin(a) * .5,
        { rz: Math.cos(a) * 1.05, rx: -Math.sin(a) * 1.05, esc: [.2, 1.15, .2], sombra: false });
    }
    const tonos = ['hoja', 'hojaClara', 'hoja', 'hojaSeca'];
    for (let i = 0; i < 6; i++) {                       // copa irregular por lóbulos
      const a = (i / 6) * Math.PI * 2 + r() * .8;
      const d = .4 + r() * 1.1;
      lote('esfera', tonos[i % 4], tx2 + Math.cos(a) * d, 3.5 + r() * 1.5, tz2 + Math.sin(a) * d,
        { esc: [1.5 + r() * .9, 1.3 + r() * .6, 1.5 + r() * .9] });
    }
    for (let i = 0; i < 3; i++) {                       // luz moteada al pie
      const a = r() * Math.PI * 2, d = .7 + r() * 1.4;
      lote('cil', 'hojaSeca', tx2 + Math.cos(a) * d, .17, tz2 + Math.sin(a) * d,
        { esc: [.5 + r() * .5, .015, .4 + r() * .4], sombra: false });
    }
    kit.colisionCirculo(tx2, tz2, .5);
  }
}
