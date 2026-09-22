// Postal descargable: captura del canvas 3D + composición 2D (1200×1500).
// Se llama renderer.render() y toDataURL() en la misma tarea para no
// depender de preserveDrawingBuffer.
const ANCHO = 1200, ALTO = 1500, BANDA = 60;
const FOTO_ALTO = 940, FOTO_Y = BANDA;
const CREMA = '#f6ecd9', TINTA = '#293b43', DORADO = '#b98c42';

export async function capturarPostal(experience, { titulo, linea = '' }) {
  const { renderer, scene, camera } = experience;
  renderer.render(scene, camera);
  const foto = renderer.domElement.toDataURL('image/png');

  const imagen = new Image();
  await new Promise((res, rej) => { imagen.onload = res; imagen.onerror = rej; imagen.src = foto; });

  const c = document.createElement('canvas');
  c.width = ANCHO; c.height = ALTO;
  const ctx = c.getContext('2d');
  ctx.fillStyle = CREMA; ctx.fillRect(0, 0, ANCHO, ALTO);

  // Foto en modo cover, con banda de crema alrededor (arriba y lados).
  const altoFoto = ALTO - FOTO_Y - 420;
  const escala = Math.max((ANCHO - BANDA * 2) / imagen.width, altoFoto / imagen.height);
  const wFoto = imagen.width * escala, hFoto = imagen.height * escala;
  ctx.drawImage(imagen, (ANCHO - wFoto) / 2, FOTO_Y + (altoFoto - hFoto) / 2, wFoto, hFoto);

  // Banda inferior: MACONDO, título, línea del pasaje y fecha es-CO.
  const yBanda = ALTO - 420;
  ctx.fillStyle = TINTA;
  ctx.font = '600 34px "DM Sans", sans-serif';
  ctx.fillText('MACONDO', BANDA + 10, yBanda + 78);
  ctx.fillStyle = DORADO;
  ctx.fillRect(BANDA + 10, yBanda + 96, 84, 4);
  ctx.fillStyle = TINTA;
  ctx.font = '500 46px "Playfair Display", Georgia, serif';
  ctx.fillText(titulo, BANDA + 10, yBanda + 168, ANCHO - (BANDA + 10) * 2);

  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#416b55';
  let y = yBanda + 232;
  for (const l of partirLinea(ctx, linea, ANCHO - (BANDA + 10) * 2, 3)) {
    ctx.fillText(l, BANDA + 10, y);
    y += 38;
  }

  ctx.font = '24px "DM Sans", sans-serif';
  ctx.fillStyle = '#5c6b66';
  ctx.fillText(new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    BANDA + 10, ALTO - BANDA - 6);

  return c.toDataURL('image/png');
}

// Ajuste manual de línea por palabras, con tope de líneas.
function partirLinea(ctx, texto, ancho, maxLineas) {
  const lineas = [];
  let actual = '';
  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    const prueba = actual ? actual + ' ' + palabra : palabra;
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
      if (lineas.length === maxLineas) break;
    } else actual = prueba;
  }
  if (lineas.length < maxLineas && actual) lineas.push(actual);
  return lineas;
}
