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
    // El seto mide entre 0,86 y 1,2 m más el copete: se pasa por encima, como el vuelo de
    // crucero (2,1 m) pide, y sólo detiene a ras de suelo.
    kit.colisionCaja(JX + hx - hw / 2, JZ + hz - hd / 2, JX + hx + hw / 2, JZ + hz + hd / 2, 1.45);
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
  // La pieza vive en el kit (`kit.arbol`) y aquí sólo se dice dónde y de qué tamaño: es el
  // único árbol del pueblo que se mira a un metro, así que es el que lleva ramas a la vista,
  // helechos en la corteza y flores —las que después caen por la capa de vida—.
  const arbol = ancla('arbol-tiempo');
  kit.arbol(arbol.x, arbol.z, { alto: 4.3, radio: .48, copa: 2.4, yCopa: 6.2, altoCopa: 1.6, ramas: 5, semilla: 9, manojos: 28, hojas: 4, colgantes: 7, helechos: 4, flores: 10 });
  // Musgo y epífitas al pie: la madera viva no es un caño liso y la base del tronco cría
  // hierba y helechos, que es donde la mariposa se posa.
  kit.briznas(kit, arbol.x + .85, arbol.z + .35, { n: 7, alto: .34, radio: .5, semilla: 91 });
  kit.briznas(kit, arbol.x - .7, arbol.z - .65, { n: 6, alto: .3, radio: .45, semilla: 92, mate: 'hojaSeca' });
  kit.colisionCirculo(arbol.x, arbol.z, .7, 4.2);      // el tronco; la copa se atraviesa volando

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

  // ---------- El tendal de bramante (ancla «sabanas-bramante») ----------
  // La tarde de marzo del capítulo 12 empieza aquí: Fernanda dobla en el jardín sus sábanas de
  // bramante y pide ayuda a las mujeres de la casa. El tendal es el ancla del encuentro, y de
  // él sale la ascensión que dibuja src/world/remedios.js — por eso las dos piezas leen la
  // misma coordenada en vez de repetir el literal. Va en el claro del norte, el único tramo del
  // jardín sin macetas, bancales ni el árbol del tiempo, y deja libres las doce aproximaciones
  // que vigila el invariante `encuentros`.
  const tendal = ancla('sabanas-bramante');
  kit.tendedero(tendal.x - 1.8, tendal.z, tendal.x + 1.8, tendal.z, { alto: 2.4, telas: 3, semilla: 33 });
  // Los dos postes paran a ras —el vuelo de crucero (2,1 m) mira por debajo del cordel, a
  // 2,4 m—, y el cordel y la ropa se atraviesan volando, como el resto de los tendederos.
  for (const lado of [-1, 1]) kit.colisionCirculo(tendal.x + lado * 1.8, tendal.z, .14, 2.4);
}
