// Calles del pueblo: pavimento de piedra con bordillo, andén de tierra y el mobiliario
// de la vía (faroles, macetas, tendederos, cartel de entrada). Sin colisiones nuevas en
// las rutas: la prueba de transitabilidad vigila cada pieza que se añade aquí.
export function buildCalles(ctx) {
  const { kit } = ctx;
  const { lote, local } = kit;

  // Pavimento: la misma plancha unidad escalada, así que las diez calles son una llamada.
  const calles = [
    [4.5, 34, 0, 13, 0],          // calle principal: llegada → plaza → casa
    [4.5, 8, 0, -7, 0],
    [13, 3.5, 6.5, 0, 0],         // calle este hacia el jardín
    [3.4, 12, 16.8, -5, .12],     // bajada a la portería
    [11, 3.5, -5.5, 1.5, 0],      // calles oeste al puerto
    [11, 3.4, -15.5, 4.5, .18],
    [6, 3.2, -23, 7.3, -.25],
    [4, 13, 2.6, 6.5, .28],       // camino sur al mirador
    [13.6, 3.2, 10.5, 13, -.11],
    [3.2, 2.5, 17, 12.6, 0],
  ];
  for (const [w, d, x, z, ry] of calles) {
    lote('plancha', 'tierraHonda', x, .012, z, { rx: -Math.PI / 2, rz: ry, esc: [w + 1.5, d + 1.4, 1] });
    lote('plancha', 'piedra', x, .03, z, { rx: -Math.PI / 2, rz: ry, esc: [w, d, 1] });
    // Bordillo a los dos lados del eje largo.
    for (const lado of [-1, 1]) {
      const [bx, bz] = local(x, z, ry)(0, lado * (d / 2 - .12));
      lote('caja', 'piedraHonda', bx, .07, bz, { ry, esc: [w, .14, .24] });
    }
  }

  // Faroles de la calle principal: el pueblo se ve habitado de noche y de día.
  for (const z of [24, 16, 8]) {
    const x = z > 20 ? 3.1 : 2.9;
    kit.farol(x, z, { alto: 3.6, ry: -Math.PI / 2 });
  }
  kit.farol(9.5, 1.5, { alto: 3.4, ry: -Math.PI / 2 });
  kit.farol(-9.5, 2.6, { alto: 3.4, ry: Math.PI / 2 });
  kit.farol(3.2, -8.6, { alto: 3.3, ry: -Math.PI / 2 });
  kit.farol(21.5, -9.4, { alto: 3.3, ry: Math.PI / 2 });
  kit.farol(-23.6, 4.6, { alto: 3.3, ry: Math.PI / 2 });

  // Cartel de entrada, a un costado de la calle principal.
  kit.cartel(4.2, 27.5, -Math.PI / 2.4);

  // Macetas en las puertas de las casas que dan a la calle (sin colisión: vuelan por encima).
  for (const [mx, mz, s] of [[5.3, -6.6, 11], [10.7, -7.7, 12], [6.1, 4.4, 13], [11, 8.6, 14], [-5.2, -1.7, 15], [-9.6, 7.4, 16]]) {
    kit.maceta(mx, mz, { r: .34, semilla: s });
    kit.arbusto(mx + .9, mz + .5, { r: .45, alto: .8, semilla: s + 3 });
  }

  // Tendedero entre dos casas de la calle este, lejos de la ruta del jardín.
  kit.tendedero(11.4, -7.9, 11.4, -4.2, { alto: 2.5, telas: 2, semilla: 21 });
  kit.colisionCaja(11.15, -8, 11.65, -4.1, 2.55);      // la cuerda del tendedero y sus telas
}
