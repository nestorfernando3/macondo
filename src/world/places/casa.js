// Casa de la memoria: fachada cálida, umbral abierto y patio con mesa, tazas, sábanas
// que flotan y jardineras. La mesa, su silla y la taza del efecto salen del ancla del
// encuentro `objeto-mesa` (src/data/encounters.js): aquí no se repite ninguna coordenada.
import * as THREE from 'three';
import { ancla, superficieDe } from '../anclas.js';
import { secuencia } from '../kit.js';

export function buildCasa(ctx) {
  const { kit, scene } = ctx;
  const { lote, cil, caja, local, animar } = kit;

  const CW = 7, CH = 3.2;
  // ---------- Muros (misma planta y mismo hueco de puerta que antes) ----------
  caja('estuco', CW / 2 - .8, CH, .35, -(CW / 4 + .4), CH / 2, -11);
  caja('estuco', CW / 2 - .8, CH, .35, CW / 4 + .4, CH / 2, -11);
  caja('madera', 1.7, .5, .4, 0, CH - .25, -11);              // dintel
  caja('coral', .35, CH, 8, -CW / 2, CH / 2, -15);            // muros laterales
  caja('coral', .35, CH, 8, CW / 2, CH / 2, -15);
  caja('coral', CW, CH, .35, 0, CH / 2, -19);                 // fondo del patio
  // Zócalo y alero: dos líneas horizontales que asientan la casa en el suelo.
  for (const [w, d, x, z] of [[CW + .3, .3, 0, -11], [.3, 8, -CW / 2, -15], [.3, 8, CW / 2, -15]]) {
    lote('caja', 'coralHondo', x, .16, z, { esc: [w, .32, d] });
  }
  lote('caja', 'maderaClara', 0, CH + .12, -10.86, { esc: [CW + .5, .22, .18] });
  techoPrincipal(kit, CH);

  // ---------- Vanos de la fachada ----------
  const hojas = local(0, -11, 0);
  for (const lado of [-1, 1]) {                               // hojas de la puerta, abiertas
    const [px, pz] = hojas(lado * .72, -.34);
    lote('caja', 'turquesa', px, 1.18, pz, { ry: -lado * 1.25, esc: [1.34, 2.34, .08] });
    const [mx, mz] = hojas(lado * .42, -.62);
    lote('caja', 'turquesaClaro', mx, 1.08, mz, { ry: -lado * 1.25, esc: [.9, 1.6, .03], sombra: false });
  }
  // Ventanas y macetas al frente. La fachada mira a +z (hacia la calle): por eso el giro
  // es 0 —con π los vanos quedaban enterrados dentro del muro— y el corrimiento va en +z.
  for (const lado of [-1, 1]) {
    const [vx, vz] = hojas(lado * 2.15, .26);
    kit.ventana(vx, 1.85, vz, 0, { ancho: .9, alto: 1.15, luz: lado < 0 });
    const [px2, pz2] = hojas(lado * 1.05, .34);
    kit.maceta(px2, pz2, { r: .26, semilla: lado < 0 ? 51 : 52 });
  }
  // Escalón del umbral y colisión de fachada (idénticas a la versión anterior).
  lote('caja', 'piedra', 0, .07, -10.75, { esc: [2.4, .14, .9] });
  kit.colisionCaja(-3.7, -11.2, -.8, -10.8);
  kit.colisionCaja(.8, -11.2, 3.7, -10.8);
  kit.colisionCaja(-3.7, -19.3, -3.3, -10.8);
  kit.colisionCaja(3.3, -19.3, 3.7, -10.8);
  kit.colisionCaja(-3.7, -19.3, 3.7, -18.7);
  // Los muros que dan a la calle también tapan la vista: el hueco de la puerta queda
  // transparente, así que desde el umbral sí se ve (y se explora) la mesa del patio.
  for (const [x1, z1, x2, z2] of [[-3.7, -11.2, -.8, -10.8], [.8, -11.2, 3.7, -10.8]]) {
    kit.world.addSight(x1, z1, x2, z2);
  }

  // ---------- Patio ----------
  lote('plancha', 'tierraHonda', 0, .05, -15, { rx: -Math.PI / 2, esc: [6.9, 8, 1] });
  for (let i = 0; i < 9; i++)                                 // losas del patio
    lote('caja', 'piedraHonda', -2.8 + i * .7, .07, -15, { esc: [.66, .05, 7.6] });

  // Mesa con tazas: su sitio y la altura del tablero salen del ancla del encuentro, así que
  // mover la mesa es cambiar un número en src/data/encounters.js.
  const mesa = ancla('objeto-mesa');
  const tablero = superficieDe('objeto-mesa', 0);
  const enMesa = local(mesa.x, mesa.z, 0);
  cil('madera', 1.05, .08, mesa.x, tablero - .04, mesa.z);
  cil('madera', .09, .95, mesa.x, (tablero - .08) / 2, mesa.z);
  for (const [dx, dz] of [[-.4, .3], [.35, .3]]) {
    const [tx, tz] = enMesa(dx, dz);
    cil('blanco', .09, .14, tx, tablero + .07, tz);            // tazas sobre el tablero
  }
  for (const [cx, cz] of [[-2.2, -17.6], [-2.3, -14]]) cil('banco', .22, .45, cx, .22, cz);
  for (const [sx, sz] of [[2.55, -17.1], [.6, -17.4]]) {       // sillas de madera
    lote('caja', 'madera', sx, .46, sz, { esc: [.44, .06, .44] });
    lote('caja', 'madera', sx, .74, sz + .2, { esc: [.44, .5, .05] });
    // Un travesaño alto en el respaldo y otro entre las patas: sin ellos la silla era un
    // asiento flotando sobre cuatro cilindros.
    lote('caja', 'maderaClara', sx, .66, sz + .2, { esc: [.36, .04, .03], sombra: false });
    lote('caja', 'maderaClara', sx, .17, sz, { esc: [.4, .05, .05], sombra: false });
    for (const [lx, lz] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]])
      lote('cil', 'madera', sx + lx, .23, sz + lz, { esc: [.06, .46, .06] });
  }
  const silla = local(mesa.x + .82, mesa.z + .88, .75);       // junto a la mesa, mirando a ella
  const [asx, asz] = silla(0, 0), [rsx, rsz] = silla(0, .19);
  lote('caja', 'madera', asx, .46, asz, { ry: .75, esc: [.42, .06, .42] });
  lote('caja', 'madera', rsx, .78, rsz, { ry: .75, esc: [.42, .5, .05] });
  for (const [lx, lz] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) {
    const [px, pz] = silla(lx, lz);
    lote('cil', 'madera', px, .22, pz, { esc: [.06, .44, .06] });
  }
  kit.colisionCirculo(mesa.x + .82, mesa.z + .88, .25);
  kit.colisionCirculo(mesa.x, mesa.z, .9);

  // Mecedora del patio: piezas sueltas dentro de un grupo para poder mecerla entera.
  const mec = new THREE.Group();
  mec.position.set(2.4, 0, -13.2); mec.rotation.y = -.65; scene.add(mec);
  const pieza = (w, h, d, x, y, z, rx = 0) => {
    const mesh = new THREE.Mesh(kit.geo.caja, kit.m('maderaClara'));
    mesh.scale.set(w, h, d); mesh.position.set(x, y, z); mesh.rotation.x = rx;
    mesh.castShadow = true; mec.add(mesh); return mesh;
  };
  for (const sx of [-.19, .19]) pieza(.05, .06, .78, sx, .12, 0);
  for (const [px2, pz2] of [[-.19, -.26], [.19, -.26], [-.19, .26], [.19, .26]])
    pieza(.05, .3, .05, px2, .3, pz2);
  pieza(.48, .05, .42, 0, .47, .02);
  pieza(.48, .52, .05, 0, .73, -.2, .12);
  kit.colisionCirculo(2.4, -13.2, .42);
  animar(t => { mec.rotation.x = Math.sin(t * 1.15) * .045; });

  // ---------- Sábanas que flotan sobre el tendal ----------
  const sabanas = [];
  for (let i = 0; i < 3; i++) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: .9, side: THREE.DoubleSide, transparent: true, opacity: .92 }));
    sh.position.set(-2.4 + i * 2.3, 2.55, -17.8);
    scene.add(sh); sabanas.push(sh);
  }
  kit.colisionCaja(-3.3, -17.95, 3.3, -17.15);                // impide pegar la cámara a las sábanas
  const cordel = cil('madera', .02, 6.6, 0, 3.42, -17.4);
  cordel.rotation.z = Math.PI / 2;
  animar(t => {
    sabanas.forEach((sh, i) => {
      sh.rotation.x = Math.sin(t * .8 + i) * .12 - .1;
      sh.position.y = 2.4 + Math.sin(t * .6 + i * 1.3) * .08;
    });
  });

  // Jardineras bajo el tendal y una parra que se enreda en el cordel.
  for (const [bx, bw] of [[-2.1, 2], [2.1, 2]]) {
    caja('madera', bw, .5, .6, bx, .25, -17.75);
    // Matas de verdad dentro de la jardinera (antes cinco icosaedros sueltos): la mariposa
    // pasa por encima y cinco esferas de color se leían como piedras sobre el cajón.
    kit.macizoFloral(kit, bx, -17.75, {
      ancho: bw - .34, fondo: .42, y: .5, n: 6, alto: .36,
      colores: ['flor', 'florRoja', 'blanco'], centro: 'amarillo', semilla: bx < 0 ? 81 : 82,
    });
  }
  // Parra sobre el cordel: hojas reales y un par de zarcillos. El `petalo` crece hacia +z
  // y su cara mira a ±y, así que `rx` lo tumba para que la hoja cuelgue de la cuerda.
  const rv = secuencia(23);
  for (let i = 0; i < 20; i++) {
    const x = -3.2 + (i / 19) * 6.4;
    lote('petalo', i % 4 === 3 ? 'hoja' : 'hojaClara', x, 3.34 - rv() * .12, -17.4 + (rv() - .5) * .34, {
      rx: 1.15 + rv() * .5, ry: (rv() - .5) * 1.4,
      esc: [.26 + rv() * .16, 1, .3 + rv() * .16], sombra: false,
    });
  }
  for (let i = 0; i < 6; i++) {                                  // zarcillos enredados
    lote('brizna', 'hojaClara', -2.7 + i * 1.1, 3.4, -17.4 + (rv() - .5) * .3, {
      rz: (rv() - .5) * 1.5, rx: .8 + rv() * .6,
      esc: [.8, .5 + rv() * .4, .5 + rv() * .4], sombra: false,
    });
  }

  // Tinajas y brasero: el rincón de la cocina del patio.
  const tinajas = [[-2.9, -12.2, .42], [-2.5, -12.9, .34], [-3.05, -13.4, .28]];
  tinajas.forEach(([tx2, tz2, r], i) => {
    cil('coral', r, r * 2.1, tx2, r, tz2, { ry: .3 });
    // Labio oscuro en la boca: sin él la tinaja era un cilindro y la boca se perdía.
    lote('cil', 'coralHondo', tx2, r * 1.6, tz2, { esc: [r * 2.3, r * .16, r * 2.3] });
    cil('coralHondo', r * 1.02, r * .2, tx2, r * 2.06, tz2);
    kit.briznas(kit, tx2, tz2, { n: 3, alto: .3, radio: r * .7, y: r * 2.05, semilla: 61 + i });
  });
  cil('piedraHonda', .46, .34, 2.9, .17, -12.4);
  cil('tierraHonda', .3, .12, 2.9, .37, -12.4);
}

// Techo principal: dos faldones con la cumbrera sobre el eje este-oeste. La pendiente es
// generosa a propósito: con 1,7 m de alto el faldón se leía como una plancha naranja.
function techoPrincipal(kit, CH) {
  const { lote } = kit;
  kit.techo(0, CH + .5, -15, 0, { ancho: 7.2, fondo: 8.2, alto: 2.5, voladizo: .55, muro: 'coral' });
  lote('caja', 'teja', 0, CH + .4, -10.6, { esc: [8.3, .5, .3] });
}
