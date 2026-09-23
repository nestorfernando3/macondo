// Ficha «En la novela», índice de capítulos y cuaderno de palabras del Caribe.
// DOM puro, sin Three.js. El sello de origen distingue lo que viene de la novela de lo que
// es de esta instalación: se lee claro y nunca acusa a quien lee. Nada de innerHTML.
import { fichaDe, INDICE_NOVELA, NOTA_ATRIBUCION } from '../data/novela.js';
import { PALABRAS, INTRO_PALABRAS } from '../data/palabras.js';

// Ayudante mínimo para construir DOM: createElement + textContent, jamás innerHTML con datos.
function nodo(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

// El sello dice de dónde viene lo que se lee. Informa, no reprocha.
// `origen` admite 'novela' (por defecto) o 'instalacion'.
export function crearSelloOrigen(origen = 'novela') {
  const esNovela = origen === 'novela' || origen === true;
  const sello = nodo(
    'span',
    'sello-origen ' + (esNovela ? 'sello-origen--novela' : 'sello-origen--instalacion'),
    esNovela ? 'De la novela' : 'De esta instalación'
  );
  sello.setAttribute('role', 'note');
  sello.setAttribute(
    'title',
    esNovela
      ? 'Lo que sigue viene de la novela; aquí se cuenta en palabras propias, sin citarla.'
      : 'Lo que sigue es de esta instalación, no de la novela.'
  );
  return sello;
}

// Ficha literaria de una estación. Devuelve null si no hay ficha para ese id.
export function crearFichaNovela(id) {
  const ficha = fichaDe(id);
  if (!ficha) return null;

  const art = nodo('article', 'ficha-novela');
  art.setAttribute('aria-label', 'La novela: ' + (ficha.titulo || ''));

  const cabecera = nodo('p', 'ficha-novela-cabecera');
  cabecera.append(crearSelloOrigen('novela'));
  if (ficha.capitulo) cabecera.append(nodo('span', 'ficha-novela-capitulo', 'Capítulo ' + ficha.capitulo));
  art.append(cabecera);

  art.append(nodo('h3', 'ficha-novela-titulo', ficha.titulo || ''));
  art.append(nodo('p', 'ficha-novela-texto', ficha.texto || ''));

  if (Array.isArray(ficha.datos) && ficha.datos.length) {
    const datos = nodo('ul', 'ficha-novela-datos');
    datos.setAttribute('aria-label', 'Datos verificables en la novela');
    for (const dato of ficha.datos) datos.append(nodo('li', 'ficha-novela-dato', dato));
    art.append(datos);
  }

  if (ficha.fuente) {
    const fuente = nodo('p', 'ficha-novela-fuente');
    fuente.append(nodo('cite', null, ficha.fuente));
    art.append(fuente);
  }

  return art;
}

// Índice de los capítulos, con los hechos y las estaciones de esta instalación que los rozan.
export function crearIndiceNovela() {
  const indice = nodo('nav', 'indice-novela');
  indice.setAttribute('aria-label', 'Índice de la novela');

  const entradas = Array.isArray(INDICE_NOVELA) ? [...INDICE_NOVELA].sort((a, b) => a.n - b.n) : [];
  const lista = nodo('ol', 'indice-novela-lista');
  for (const entrada of entradas) {
    const li = nodo('li', 'indice-novela-entrada');
    const titulo = nodo('h4', 'indice-novela-titulo');
    titulo.append(nodo('span', 'indice-novela-numero', String(entrada.n)));
    titulo.append(nodo('span', 'indice-novela-nombre', entrada.titulo || ''));
    li.append(titulo);
    if (entrada.hechos) li.append(nodo('p', 'indice-novela-hechos', entrada.hechos));
    if (Array.isArray(entrada.estaciones) && entrada.estaciones.length) {
      const chips = nodo('p', 'indice-novela-estaciones');
      chips.setAttribute('aria-label', 'Estaciones de esta instalación en este tramo');
      for (const idEstacion of entrada.estaciones) {
        chips.append(nodo('span', 'indice-novela-estacion', idEstacion));
      }
      li.append(chips);
    }
    lista.append(li);
  }
  indice.append(lista);

  if (NOTA_ATRIBUCION) indice.append(nodo('p', 'indice-novela-nota', NOTA_ATRIBUCION));
  return indice;
}

// Cuaderno de palabras del Caribe: agrupadas por categoría, con un buscador de pocas líneas.
export function crearCuadernoPalabras() {
  const cuaderno = nodo('section', 'cuaderno-palabras');
  cuaderno.setAttribute('role', 'region');
  cuaderno.setAttribute('aria-label', 'Cuaderno de palabras del Caribe');

  if (INTRO_PALABRAS) cuaderno.append(nodo('p', 'cuaderno-palabras-intro', INTRO_PALABRAS));

  const palabras = Array.isArray(PALABRAS) ? PALABRAS : [];

  const buscador = nodo('div', 'cuaderno-palabras-buscar');
  buscador.setAttribute('role', 'search');
  const etiqueta = nodo('label', 'cuaderno-palabras-buscar-etiqueta');
  etiqueta.append(nodo('span', 'cuaderno-palabras-buscar-texto', 'Buscar una palabra'));
  const campo = nodo('input', 'cuaderno-palabras-campo');
  campo.type = 'search';
  campo.setAttribute('placeholder', 'Escriba aquí, por ejemplo: totuma');
  campo.setAttribute('autocomplete', 'off');
  etiqueta.append(campo);
  buscador.append(etiqueta);
  cuaderno.append(buscador);

  // Agrupa por categoría conservando el orden en que aparecen.
  const grupos = new Map();
  for (const palabra of palabras) {
    if (!palabra) continue;
    const categoria = palabra.categoria || 'otras';
    if (!grupos.has(categoria)) grupos.set(categoria, []);
    grupos.get(categoria).push(palabra);
  }

  const secciones = [];
  for (const [categoria, entradas] of grupos) {
    const seccion = nodo('section', 'cuaderno-palabras-categoria');
    seccion.setAttribute('aria-label', 'Categoría: ' + categoria);
    seccion.append(nodo('h4', 'cuaderno-palabras-categoria-titulo', categoria));
    const lista = nodo('ul', 'cuaderno-palabras-lista');
    const items = [];
    for (const palabra of entradas) {
      const li = nodo('li', 'palabra');
      li.append(nodo('strong', 'palabra-nombre', palabra.palabra || ''));
      if (palabra.significado) li.append(nodo('span', 'palabra-significado', palabra.significado));
      if (palabra.enLaNovela) li.append(nodo('span', 'palabra-capitulo', 'En la novela: ' + palabra.enLaNovela));
      if (palabra.nota) li.append(nodo('span', 'palabra-nota', palabra.nota));
      items.push({
        el: li,
        texto: [palabra.palabra, palabra.significado, palabra.nota, palabra.enLaNovela]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      });
      lista.append(li);
    }
    seccion.append(lista);
    cuaderno.append(seccion);
    secciones.push({ el: seccion, items });
  }

  const estado = nodo('p', 'cuaderno-palabras-estado');
  estado.setAttribute('role', 'status');
  cuaderno.append(estado);

  // Filtro simple: oculta las palabras que no contienen el texto buscado y la categoría entera
  // cuando no queda ninguna visible.
  function filtrar() {
    const consulta = campo.value.trim().toLowerCase();
    let visibles = 0;
    for (const seccion of secciones) {
      let enGrupo = 0;
      for (const item of seccion.items) {
        const coincide = consulta === '' || item.texto.includes(consulta);
        item.el.hidden = !coincide;
        if (coincide) enGrupo++;
      }
      seccion.el.hidden = enGrupo === 0;
      visibles += enGrupo;
    }
    if (consulta === '') {
      estado.textContent = '';
    } else if (visibles === 0) {
      estado.textContent = 'Ninguna palabra coincide con «' + campo.value.trim() + '».';
    } else {
      estado.textContent = visibles + (visibles === 1 ? ' palabra para «' : ' palabras para «') + campo.value.trim() + '».';
    }
  }
  campo.addEventListener('input', filtrar);

  return cuaderno;
}
