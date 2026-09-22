// Jardín del tiempo: setos con portería, el árbol del tiempo (ancla del encuentro
// arbol-tiempo), sendero curvo, arco de bejuco y aperos. Los setos conservan sus mismas
// cajas de colisión: el circuito entra por la portería oeste y sale por la del este.
// La vegetación floral entra por el vocabulario de flora.js (macizos, pétalos y briznas),
// no por icosaedros: de cerca una flor tiene que leerse como flor y no como piedra.
import { secuencia } from '../kit.js';
import { ancla } from '../anclas.js';

export function buildJardin(ctx) {
  const { kit } = ctx;
  const { lote, cil, caja, local } = kit;
  const JX = 25, JZ = -11;                       // centro del jardín

  // ---------- Setos ----------
  const setos = [
    [0, -6.5, 9, .6], [-4.5, -4.2, .6, 4.6], [-4.5, 4.2, .6, 4.6],
    [0, 6.5, 9, .6], [4.5, -3.4, .6, 6.5], [4.5, 4.6, .6, 4],
  ];
  for (const [hx, hz, hw, hd] of setos) {
    const r = secuencia(100 + Math.round((hx + hz) * 10));
    const largo = hw > hd ? hw : hd;
    // Silueta recortada: más lóbulos, más pequeños, a alturas distintas. Antes eran dos
    // cajas grandes por tramo y el seto se leía como un muro de cubos; ahora entra por
    // `lote` —una llamada por material, no una malla por lóbulo— y el borde ondula como
    // topiaria. Los lóbulos se solapan un 50 %: sin solape se ven las juntas.
    const n = Math.max(3, Math.round(largo / .64));
    const paso = largo / n;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = JX + hx + (hw > hd ? (t - .5) * hw : 0) + (r() - .5) * .07;
      const pz = JZ + hz + (hd >= hw ? (t - .5) * hd : 0) + (r() - .5) * .07;
      const ancho = (hw > hd ? paso : hw) * 1.5;
      const fondo = (hd >= hw ? paso : hd) * 1.5;
      const cuerpo = .86 + r() * .34;
      lote('caja', 'hoja', px, cuerpo / 2, pz, { ry: (r() - .5) * .22, esc: [ancho, cuerpo, fondo] });
      // Copete claro: la luz cae de arriba y la brotación nueva va en la cresta, así que el
      // seto tiene un tono más vivo en el borde alto en vez de un cubo de color plano.
      lote('caja', 'hojaClara', px, cuerpo + r() * .07, pz,
        { ry: (r() - .5) * .4, esc: [ancho * .78, .22 + r() * .14, fondo * .78], sombra: false });
    }
    kit.colisionCaja(JX + hx - hw / 2, JZ + hz - hd / 2, JX + hx + hw / 2, JZ + hz + hd / 2);
  }

  // ---------- Sendero curvo de piedra ----------
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = 21.2 + t * 7.4;
    const z = -11 + Math.sin(t * Math.PI) * 1.5 - .4;
    lote('caja', 'piedraHonda', x, .06, z, { ry: -.3 + t * .6, esc: [.85, .07, .62] });
  }

  // ---------- Arco de bejuco en la portería ----------
  const arco = local(20.5, -11, 0);
  for (const lado of [-1, 1]) {
    const [px, pz] = arco(0, lado * 1.85);
    caja('madera', .14, 2.2, .14, px, 1.1, pz);
    cil('hojaClara', .3, .7, px + .1, 2.35, pz, { ry: lado });
  }
  // Cobertura de hojas de verdad a lo largo del arco (antes nueve icosaedros).
  const rh = secuencia(41);
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * (i / 21);
    const [px, pz] = arco(.1 + (rh() - .5) * .34, Math.cos(a) * 1.85);
    // El pétalo crece hacia +z y su cara mira a ±y: `ry` lo abanica hacia fuera del arco y
    // `rx` lo tumba. Antes eran nueve icosaedros de medio metro que se leían como piedras.
    lote('petalo', i % 3 === 2 ? 'hoja' : 'hojaClara', px, 2.2 + Math.sin(a) * .85 + (rh() - .5) * .1, pz, {
      rx: -.2 - rh() * .7, ry: a + 1.2 + (rh() - .5) * 1.1,
      esc: [.24 + rh() * .16, 1, .28 + rh() * .18], sombra: false,
    });
  }
  for (let i = 0; i < 6; i++) {                  // zarcillos que se sueltan del arco
    const a = Math.PI * ((i + .5) / 6);
    const [px, pz] = arco(-.06 + (rh() - .5) * .1, Math.cos(a) * 1.85);
    lote('brizna', 'hojaClara', px, 2.2 + Math.sin(a) * .85, pz, {
      rz: (rh() - .5) * 1.6, ry: a, esc: [.7, .55 + rh() * .4, .55 + rh() * .4], sombra: false,
    });
  }

  // ---------- Árbol del tiempo (ancla del encuentro arbol-tiempo) ----------
  const arbol = ancla('arbol-tiempo');
  const r = secuencia(9);
  cil('tronco', .45, 4.2, arbol.x, 2.1, arbol.z);
  // Raíces: ocho en ronda, de largo distinto, que se apoyan en el suelo. La base deja de
  // ser un cilindro clavado en la tierra.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + .2;
    const largo = 1.05 + r() * .5;
    lote('cil', 'tronco', arbol.x + Math.cos(a) * .5, .16, arbol.z + Math.sin(a) * .5,
      { rz: Math.cos(a) * 1.3, rx: -Math.sin(a) * 1.3, esc: [.3, largo, .3] });
  }
  for (let i = 0; i < 4; i++) {                  // ramas que se abren hacia arriba
    const a = i * 1.6 + .3;
    lote('cil', 'tronco', arbol.x + Math.cos(a) * .55, 4.5, arbol.z + Math.sin(a) * .55,
      { rz: Math.cos(a) * .42, rx: -Math.sin(a) * .42, esc: [.22, 2.2, .22] });
  }
  // Y dos ramas bajas: dan profundidad a la corona desde la altura de la mariposa.
  for (let i = 0; i < 2; i++) {
    const a = 2.4 + i * 2.6;
    lote('cil', 'tronco', arbol.x + Math.cos(a) * .7, 3.1, arbol.z + Math.sin(a) * .7,
      { rz: Math.cos(a) * .78, rx: -Math.sin(a) * .78, esc: [.17, 1.7, .17] });
  }
  // Copa más redonda: más lóbulos en dos pisos para que la corona cierre por arriba.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    lote('esfera', i % 2 ? 'hoja' : 'hojaClara',
      arbol.x + Math.cos(a) * (1 + r() * .9), 4.7 + r() * 1.3, arbol.z + Math.sin(a) * (1 + r() * .9),
      { esc: [2.2 + r(), 1.8 + r() * .8, 2.2 + r()] });
  }
  for (let i = 0; i < 2; i++) {
    const a = i * 2.4 + .6;
    lote('esfera', i ? 'hojaClara' : 'hoja', arbol.x + Math.cos(a) * .9, 6.1 + i * .4, arbol.z + Math.sin(a) * .9,
      { esc: [2.4 + r() * .5, 1.7, 2.4 + r() * .5] });
  }
  lote('esfera', 'hoja', arbol.x, 6.5, arbol.z, { esc: [3.4, 2.2, 3.4] });
  // Musgo y epífitas: briznas al pie del tronco y hojas colgando de las ramas bajas. La
  // madera viva no es un caño liso: en el trópico el tronco cría helechos y bejucos.
  kit.briznas(kit, arbol.x + .85, arbol.z + .35, { n: 7, alto: .34, radio: .5, semilla: 91 });
  kit.briznas(kit, arbol.x - .7, arbol.z - .65, { n: 6, alto: .3, radio: .45, semilla: 92, mate: 'hojaSeca' });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + .4;
    lote('petalo', i % 3 ? 'hojaClara' : 'hoja',
      arbol.x + Math.cos(a) * (1.15 + r() * .5), 3.8 + r() * 1.2, arbol.z + Math.sin(a) * (1.15 + r() * .5),
      { rx: -.9 - r() * 1.2, ry: a, esc: [.3, 1, .34], sombra: false });
  }
  kit.colisionCirculo(arbol.x, arbol.z, .7);

  // ---------- Bancal, maceteros y aperos ----------
  const banca = ancla('objeto-espiral');         // la espiral de mariposas gira sobre ella
  kit.banca(banca.x, banca.z, .5);
  for (const [mx, mz, s] of [[21.4, -13.6, 61], [27.6, -13.9, 62], [27.9, -9.4, 63], [21.6, -9.2, 64]]) {
    kit.maceta(mx, mz, { r: .42, semilla: s });
    kit.arbusto(mx + .7, mz + .6, { r: .5, alto: .9, semilla: s + 2 });
  }
  for (const [bx, bz, s] of [[23.4, -14.2, 71], [26.4, -8.1, 72]]) {   // bancales de flores
    lote('caja', 'madera', bx, .18, bz, { esc: [2.4, .36, 1.1] });
    // Matas de verdad (tallo, hoja y corola) repartidas en el sistema local del bancal.
    // Antes eran ocho icosaedros de 22 cm y un tallo de seis caras: desde el aire el
    // macizo se leía como un puñado de piedras de color. Tres colores alternados.
    kit.macizoFloral(kit, bx, bz, {
      ancho: 2.05, fondo: .72, y: .36, n: 7, alto: .4,
      colores: ['flor', 'florRoja', 'blanco'], centro: 'amarillo', semilla: s,
    });
  }
  cil('piedra', .3, .5, 28.4, .25, -12.2);                     // poyo con regadera
  cil('hierro', .12, .34, 28.4, .62, -12.2);
  cil('hierro', .05, .46, 28.62, .66, -12.2, { rz: -1.1 });
  kit.cerca(20.4, -15.4, 24.6, -15.4, { alto: .9 });
}
