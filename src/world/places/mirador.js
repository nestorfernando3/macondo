// Mirador de las historias: meseta con rampa, barandas y vista del pueblo. Conserva la
// meseta, la rampa, sus anillos de colisión y las páginas suspendidas (ancla del
// encuentro pagina) tal como estaban: el circuito llega volando a 5,1 m.
import * as THREE from 'three';
import { secuencia } from '../kit.js';
import { ancla } from '../anclas.js';

// Maguey: roseta de hojas carnosas que salen del centro y se abren en abanico. Cada hoja es
// un cono tumbado; con el orden de Euler 'XYZ' del `lote` el tumbo va en z y el rumbo en y
// —igual que las aves y las hojas de palmera—, así que la hoja se levanta con z y el abanico
// gira con y, y la base del cono cae siempre en el cogollo de la roseta.
function maguey(kit, x, y, z, { hojas = 9, alto = .55, ancho = .13, inclina = .82, semilla = 1 } = {}) {
  const { lote } = kit;
  const r = secuencia(semilla);
  for (let i = 0; i < hojas; i++) {
    const a = (i / hojas) * Math.PI * 2 + r() * .3;
    const inc = inclina * (.85 + r() * .3), largo = alto * (.72 + r() * .55);
    const dx = Math.sin(inc) * Math.cos(a), dy = Math.cos(inc), dz = Math.sin(inc) * Math.sin(a);
    lote('cono', i % 4 === 3 ? 'hojaSeca' : 'hojaClara',
      x + dx * largo / 2, y + dy * largo / 2, z + dz * largo / 2,
      { ry: Math.PI - a, rz: inc, esc: [ancho * .55, largo, ancho], sombra: false });
  }
  lote('mata', 'hojaSeca', x, y + .06, z, { esc: [.32, .24, .32] });   // cogollo seco del centro
}

export function buildMirador(ctx) {
  const { kit, scene } = ctx;
  const { lote, cil, caja, local, animar } = kit;
  const MX = 17, MZ = 23, MT = 3;                        // centro y altura de la meseta
  const ground0 = z => MT * Math.min(1, Math.max(0, (z - 14) / 3.5));

  // ---------- Cerro y meseta ----------
  const cerro = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 9.5, MT, 20), kit.m('tierra'));
  cerro.position.set(MX, MT / 2, MZ); cerro.receiveShadow = cerro.castShadow = true; scene.add(cerro);
  kit.world.addPlateau(MX, MZ, 7.5, MT);
  // Anillo de piedra de la falda: sostiene el cerro y da escala. Cada piedra va A LO LARGO de
  // la circunferencia —con `ry: -a` el eje z local es la tangente— y mide 2,35 m para un paso
  // de 2,08: cierran el anillo con un 10 % de solape. Antes medían 0,7 m en tangente y dejaban
  // un hueco de 1,4 m entre una y otra, así que se leían como una fila de monolitos sueltos.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 8.6 + (i % 2) * .22;
    lote('caja', 'piedraHonda', MX + Math.cos(a) * r, MT * .35, MZ + Math.sin(a) * r,
      { ry: -a, esc: [.75, 1.1, 2.35] });
  }
  const plazaMirador = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.4, .12, 20), kit.m('piedra'));
  plazaMirador.position.set(MX, MT + .02, MZ); plazaMirador.receiveShadow = true; scene.add(plazaMirador);

  // ---------- Rampa ----------
  kit.world.addRamp(15.6, 14, 18.4, 17.6, (x, z) => MT * Math.min(1, Math.max(0, (z - 14) / 3.5)));
  const rampa = new THREE.Mesh(new THREE.BoxGeometry(2.4, .25, 4.61), kit.m('piedra'));
  rampa.position.set(MX, 1.38, 15.75); rampa.rotation.x = -Math.atan2(MT, 3.5);
  rampa.castShadow = rampa.receiveShadow = true; scene.add(rampa);
  kit.colisionCaja(15.7, 14, 16, 17.7);
  kit.colisionCaja(18, 14, 18.3, 17.7);
  for (let z = 14.3; z < 17.6; z += .9) {
    const y = ground0(z);
    for (const px of [15.85, 18.15]) {
      lote('cil', 'madera', px, y + .45, z, { esc: [.11, .9, .11] });
      lote('caja', 'maderaClara', px, y + .86, z, { esc: [.13, .07, .9] });
    }
  }
  // Escalones de piedra al pie de la rampa.
  for (let i = 0; i < 3; i++) {
    lote('caja', 'piedra', MX, .1 + i * .1, 13.6 - i * .45, { esc: [2.6, .18, .5] });
  }

  // ---------- Anillos de colisión del borde (idénticos a la versión anterior) ----------
  kit.colisionCaja(9.2, 30.2, 24.8, 30.8);
  kit.colisionCaja(9.2, 15.2, 15.6, 15.8);
  kit.colisionCaja(18.4, 15.2, 24.8, 15.8);
  kit.colisionCaja(9.2, 15.2, 9.8, 30.8);
  kit.colisionCaja(24.2, 15.2, 24.8, 30.8);
  kit.colisionCaja(8.5, 13.6, 15.5, 14.2);
  kit.colisionCaja(18.5, 13.6, 25.5, 14.2);
  kit.colisionCaja(8.5, 31.6, 25.5, 32.2);
  kit.colisionCaja(8.1, 13.6, 8.7, 32.2);
  kit.colisionCaja(25.3, 13.6, 25.9, 32.2);
  kit.colisionCaja(8.7, 13.6, 11, 16);
  kit.colisionCaja(23, 13.6, 25.3, 16);

  // ---------- Baranda de la meseta (postes de madera y cuerda) ----------
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * 2 * i / 22;
    if (Math.abs(a - Math.PI * 1.5) < .4) continue;      // hueco hacia la rampa
    lote('cil', 'madera', MX + Math.cos(a) * 7.05, MT + .48, MZ + Math.sin(a) * 7.05, { esc: [.11, .98, .11] });
    lote('caja', 'maderaClara', MX + Math.cos(a) * 7.05, MT + .9, MZ + Math.sin(a) * 7.05, { esc: [.14, .07, .5] });
  }
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(7.05, .04, 6, 44), kit.m('madera'));
  anillo.rotation.x = Math.PI / 2; anillo.position.set(MX, MT + .92, MZ); scene.add(anillo);

  // ---------- Bancas de piedra y catalejo ----------
  for (const [bx, bz] of [[13.5, 25.5], [20.5, 21.5], [18.6, 26.6]]) {
    const ancho = bz === 26.6 ? 2.4 : 1.8;
    const ry = Math.atan2(bz - MZ, bx - MX) + Math.PI / 2;
    caja('banco', ancho, .45, .55, bx, MT + .33, bz, ry);
    for (const lado of [-1, 1]) {                  // patas de piedra: la losa ya no flota
      lote('caja', 'piedra', bx + Math.cos(ry) * lado * (ancho / 2 - .2), MT + .09,
        bz - Math.sin(ry) * lado * (ancho / 2 - .2), { ry, esc: [.17, .26, .44] });
    }
  }
  // Catalejo sobre trípode de hierro y tubo de latón: era un bipode con un tubo del mismo
  // hierro que las patas y se leía como un hierro más.
  const local2 = local(15.4, 27.4, -.9);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + .5;
    const [px, pz] = local2(Math.cos(a) * .44, Math.sin(a) * .44);
    lote('cil', 'hierro', (px + 15.4) / 2, MT + .5, (pz + 27.4) / 2,
      { ry: -a, rz: .42, esc: [.07, 1.1, .07] });
  }
  const [tx, tz] = local2(0, 0);
  // El tubo se tumba sólo con x (girar en y no cambia el eje de un cilindro): su eje es
  // (0, cos, −sin), y a lo largo de él se corren las anillas y el bastón del ocular.
  const tubo = cil('amarillo', .1, .98, tx, MT + 1.08, tz, { rx: -.35, ry: -.9 });
  tubo.castShadow = true;
  for (const u of [-.3, .3]) lote('cil', 'hierro', tx, MT + 1.08 + u * .94, tz - u * .34, { rx: -.35, esc: [.24, .07, .24] });
  lote('cil', 'hierro', tx, MT + 1.08, tz, { rx: -.35, esc: [.12, 1.2, .12] });   // ocular y objetivo

  // ---------- Cuaderno abierto sobre la piedra (ancla del encuentro pagina) ----------
  const pagina = ancla('pagina');
  const cuad = local(pagina.x + .9, pagina.z + .7, .3);
  const [cx, cz] = cuad(0, 0);
  lote('caja', 'madera', cx, MT + .12, cz, { ry: .3, esc: [.34, .02, .46] });
  lote('caja', 'blanco', cx, MT + .16, cz, { ry: .3, esc: [.3, .045, .42] });
  const [lx, lz] = cuad(.1, 0);
  lote('caja', 'coral', lx, MT + .19, lz, { ry: .3, esc: [.03, .012, .2] });

  // ---------- Páginas suspendidas (fenómeno y ancla del encuentro pagina) ----------
  const papelMat = new THREE.MeshStandardMaterial({
    color: 0xfbf6ea, side: THREE.DoubleSide, transparent: true, opacity: .95,
    emissive: 0xfff8e0, emissiveIntensity: .45,
  });
  const paginas = [];
  for (let i = 0; i < 7; i++) {
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(.45, .62), papelMat);
    const a = Math.PI * (.15 + .7 * i / 6);
    pg.position.set(pagina.x + Math.cos(a) * 2.6, MT + 1.55 + Math.sin(i * 2.1) * .35, pagina.z + .5 + Math.sin(a) * 2.6);
    pg.userData.fase = i * .9;
    scene.add(pg); paginas.push(pg);
  }
  animar(t => {
    paginas.forEach((pg, i) => {
      pg.position.y += Math.sin(t * 1.1 + pg.userData.fase) * .0015;
      pg.rotation.y = t * .4 + i;
      pg.rotation.x = Math.sin(t * .7 + i) * .25;
    });
  });

  // ---------- Asta con la bandera de viento ----------
  const asta = local(14.8, 24.5, 0);
  cil('madera', .06, 2.6, 14.8, MT + 1.3, 24.5);
  lote('cil', 'piedraHonda', 14.8, MT + .12, 24.5, { esc: [.44, .24, .44] });
  const flagGeo = new THREE.PlaneGeometry(1.1, .5, 6, 1);
  flagGeo.translate(.55, 0, 0);
  const bandera = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
    color: kit.PALETA.amarillo, side: THREE.DoubleSide, roughness: .8,
  }));
  bandera.position.set(14.8, MT + 2.3, 24.5); bandera.castShadow = true; scene.add(bandera);
  const posB = bandera.geometry.attributes.position;
  const baseB = Float32Array.from(posB.array);
  animar(t => {
    for (let i = 0; i < posB.count; i++) {
      const x = baseB[i * 3];
      posB.setZ(i, Math.sin(t * 4 - x * 4) * .07 * (x / 1.1));
    }
    posB.needsUpdate = true;
    bandera.rotation.y = Math.sin(t * .5) * .4;
  });
  kit.colisionCirculo(14.8, 24.5, .3);

  // ---------- Vegetación xerófila del borde ----------
  const r = secuencia(303);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * .3;
    const rr = 5.4 + r() * 1.4;
    kit.arbusto(MX + Math.cos(a) * rr, MZ + Math.sin(a) * rr,
      { r: .5 + r() * .3, alto: .7 + r() * .4, mate: i % 3 ? 'hoja' : 'hojaSeca', semilla: 310 + i, y: MT });
  }
  // Magueyes y pasto seco: el risco es monte xerófilo, no un prado. Las briznas entran por
  // `briznas` —y por tanto por `mecer`—, así que el viento del pueblo las mueve junto con las
  // palmeras y el mirador deja de estar quieto. Ninguna de las dos piezas registra colisión.
  const r2 = secuencia(404);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + .55;
    const rr = 6.0 + r2() * .9;
    maguey(kit, MX + Math.cos(a) * rr, MT, MZ + Math.sin(a) * rr,
      { hojas: 8, alto: .5 + r2() * .25, semilla: 610 + i });
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 1.0;
    const rr = 5.6 + r2() * 1.2;
    kit.briznas(kit, MX + Math.cos(a) * rr, MZ + Math.sin(a) * rr,
      { n: 6, alto: .32, radio: .34, semilla: 700 + i, mate: 'hojaSeca', y: MT });
  }
}
