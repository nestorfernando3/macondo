// El cuaderno que se lee como pergamino escrito de antemano (ver docs/IDEAS-RECURSOS.md, B4).
// DOM puro, sin Three.js: la idea es que lo que el visitante hizo ya estaba escrito, y el
// cierre es descubrir que leyó su propio paseo. Sin citar la novela y sin tono acusatorio.

// Frase digna cuando aún no hay nada escrito.
export const PERGAMINO_EN_BLANCO =
  'El pergamino está en blanco: usted todavía no ha dejado nada escrito.';

// Sólo cuentan las huellas con texto propio; lo demás es ruido.
function huellasDe(traces) {
  return (Array.isArray(traces) ? traces : []).filter(
    t => t && typeof t.text === 'string' && t.text.trim() !== ''
  );
}

// Acepta una fecha ya formateada o un objeto Date; si no hay, no se inventa ninguna.
function textoDeFecha(fecha) {
  if (fecha === undefined || fecha === null || fecha === '') return '';
  if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return String(fecha).trim();
}

// Lista de títulos sin repetir, abreviada cuando son muchos.
function listaDeTitulos(huellas) {
  const titulos = [];
  for (const huella of huellas) {
    const titulo = (huella.title || '').trim() || 'una escena sin nombre';
    if (!titulos.includes(titulo)) titulos.push(titulo);
  }
  if (titulos.length === 1) return titulos[0];
  if (titulos.length > 4) return titulos.slice(0, 3).join(', ') + ' y ' + (titulos.length - 3) + ' más';
  return titulos.slice(0, -1).join(', ') + ' y ' + titulos[titulos.length - 1];
}

// Función pura, probada en Node: compone en 3-5 frases la idea de que lo vivido ya estaba
// escrito. `traces` es `tracesFrom(results)`: [{ storyId, title, text }].
export function textoPergamino(traces, { fecha } = {}) {
  const huellas = huellasDe(traces);
  if (huellas.length === 0) return PERGAMINO_EN_BLANCO;

  const cuando = textoDeFecha(fecha);
  const frases = [];

  frases.push(
    cuando
      ? 'Este pergamino lleva la fecha del ' + cuando + ', y ya estaba escrito cuando usted llegó.'
      : 'Este pergamino no marca fecha, y sin embargo ya estaba escrito cuando usted llegó.'
  );

  frases.push(
    huellas.length === 1
      ? 'Quedó en él una impresión de su paso: ' + listaDeTitulos(huellas) + '.'
      : 'Quedaron en él ' + huellas.length + ' impresiones de su paso: ' + listaDeTitulos(huellas) + '.'
  );

  frases.push('Cada gesto suyo tenía su renglón desde antes, y usted lo fue llenando sin advertirlo.');
  frases.push(
    'Al leerlo verá que no escribió de más ni de menos: escribió lo que ya estaba escrito, y eso también es una manera de recordar.'
  );

  return frases.join(' ');
}

function nodo(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

// Pieza visible: compone el texto y, si hay huellas, las lista debajo para releerlas.
export function crearPergamino(traces, { fecha, titulo = 'El pergamino' } = {}) {
  const huellas = huellasDe(traces);
  const seccion = nodo('section', 'pergamino');
  seccion.setAttribute('role', 'region');
  seccion.setAttribute('aria-label', titulo);
  seccion.append(nodo('h3', 'pergamino-titulo', titulo));
  seccion.append(nodo('p', 'pergamino-texto', textoPergamino(huellas, { fecha })));
  if (huellas.length) {
    const lista = nodo('ul', 'pergamino-huellas');
    lista.setAttribute('aria-label', 'Lo que usted dejó escrito');
    for (const huella of huellas) {
      const li = nodo('li', 'pergamino-huella');
      if (huella.title) li.append(nodo('strong', 'pergamino-huella-titulo', huella.title));
      li.append(nodo('span', 'pergamino-huella-texto', huella.text));
      lista.append(li);
    }
    seccion.append(lista);
  }
  return seccion;
}
