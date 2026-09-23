// El árbol de los Buendía: siete generaciones en DOM puro, sin Three.js.
// Una columna por generación (se lee bien a 390 px de ancho), con nombre, pareja, padres e
// hijos, marcas para los nombres repetidos —que se resaltan al enfocar— y el cierre al pie.
// Navegable con teclado: cada nombre entra en el orden de tabulación. Sin arrastrar.
import { GENERACIONES, CIERRE_ARBOL, NOTAS_ARBOL } from '../data/arbol.js';

function nodo(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

// Cuando un id no está en el árbol, se muestra legible en vez de crudo.
function nombreLegible(id) {
  if (!id) return '';
  return String(id).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Enumera con «y» antes del último: «A, B y C».
function enumerar(nombres) {
  if (nombres.length === 1) return nombres[0];
  return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
}

function crearPersona(persona, { repeticiones, nombreDe, indiceNombres }) {
  const li = nodo('li', 'arbol-persona');
  const repetido = (repeticiones.get(persona.nombre) || 0) > 1;

  const cabecera = nodo('div', 'arbol-persona-cabecera');
  const nombre = nodo('span', 'arbol-nombre', persona.nombre || '');
  nombre.setAttribute('tabindex', '0');
  nombre.setAttribute('data-nombre', persona.nombre || '');
  nombre.setAttribute(
    'aria-label',
    repetido
      ? persona.nombre + ', nombre que se repite en la familia, generación ' + persona.generacion
      : (persona.nombre || '') + ', generación ' + persona.generacion
  );
  if (repetido) {
    nombre.classList.add('arbol-nombre--repetido');
    nombre.setAttribute(
      'title',
      'Este nombre se repite en la familia; al enfocarlo se resaltan todos los que lo comparten.'
    );
  }
  cabecera.append(nombre);
  if (repetido) {
    const marca = nodo('span', 'arbol-marca', '✳');
    marca.setAttribute('aria-hidden', 'true');
    cabecera.append(marca);
  }
  li.append(cabecera);

  if (!indiceNombres.has(persona.nombre)) indiceNombres.set(persona.nombre, []);
  indiceNombres.get(persona.nombre).push(nombre);

  if (persona.pareja) li.append(nodo('p', 'arbol-pareja', 'En pareja con ' + nombreDe(persona.pareja) + '.'));
  const padres = (persona.padres || []).map(nombreDe).filter(Boolean);
  if (padres.length) li.append(nodo('p', 'arbol-padres', 'Desciende de ' + enumerar(padres) + '.'));
  const hijos = (persona.hijos || []).map(nombreDe).filter(Boolean);
  if (hijos.length) li.append(nodo('p', 'arbol-hijos', 'Descendencia: ' + enumerar(hijos) + '.'));
  if (persona.final) li.append(nodo('p', 'arbol-final', persona.final));
  if (persona.nota) li.append(nodo('p', 'arbol-nota', persona.nota));

  return li;
}

export function crearArbol() {
  const personas = Array.isArray(GENERACIONES) ? GENERACIONES : [];
  const porId = new Map(personas.map(p => [p.id, p]));
  const nombreDe = id => (porId.has(id) ? porId.get(id).nombre : nombreLegible(id));

  // Cuántas veces se repite cada nombre exacto: los repetidos se marcan con ✳.
  const repeticiones = new Map();
  for (const persona of personas) {
    repeticiones.set(persona.nombre, (repeticiones.get(persona.nombre) || 0) + 1);
  }
  const hayRepetidos = [...repeticiones.values()].some(n => n > 1);

  const raiz = nodo('section', 'arbol-buendia');
  raiz.setAttribute('role', 'region');
  raiz.setAttribute('aria-label', 'Árbol de la familia Buendía');
  raiz.append(nodo('h3', 'arbol-titulo', 'El árbol de los Buendía'));

  if (hayRepetidos) {
    raiz.append(
      nodo(
        'p',
        'arbol-leyenda',
        'Los nombres que se repiten en la familia llevan ✳. Recorra los nombres con la tecla Tab: ' +
          'al detenerse en uno, se resaltan todos los que lo comparten.'
      )
    );
  }

  // Agrupa por generación y las ordena de la primera a la última.
  const porGeneracion = new Map();
  for (const persona of personas) {
    const generacion = persona.generacion ?? 0;
    if (!porGeneracion.has(generacion)) porGeneracion.set(generacion, []);
    porGeneracion.get(generacion).push(persona);
  }

  const indiceNombres = new Map(); // nombre → elementos con ese nombre, para el resaltado
  for (const generacion of [...porGeneracion.keys()].sort((a, b) => a - b)) {
    const bloque = nodo('section', 'arbol-generacion');
    bloque.setAttribute('aria-label', 'Generación ' + generacion);
    bloque.append(nodo('h4', 'arbol-generacion-titulo', 'Generación ' + generacion));
    const lista = nodo('ul', 'arbol-generacion-lista');
    for (const persona of porGeneracion.get(generacion)) {
      lista.append(crearPersona(persona, { repeticiones, nombreDe, indiceNombres }));
    }
    bloque.append(lista);
    raiz.append(bloque);
  }

  // Al enfocar un nombre se resaltan sus tocayos; al salir, se apaga el resaltado. Un solo
  // par de escuchas delegadas en la raíz sirve para todos.
  const resaltar = activo => evento => {
    const nombre = evento.target && evento.target.dataset ? evento.target.dataset.nombre : null;
    if (!nombre) return;
    for (const el of indiceNombres.get(nombre) || []) {
      el.classList.toggle('arbol-nombre--resaltado', activo);
    }
  };
  raiz.addEventListener('focusin', resaltar(true));
  raiz.addEventListener('focusout', resaltar(false));

  if (CIERRE_ARBOL) raiz.append(nodo('p', 'arbol-cierre', CIERRE_ARBOL));

  if (Array.isArray(NOTAS_ARBOL) && NOTAS_ARBOL.length) {
    const notas = nodo('ul', 'arbol-notas');
    notas.setAttribute('aria-label', 'Notas sobre el árbol');
    for (const nota of NOTAS_ARBOL) notas.append(nodo('li', 'arbol-nota-general', nota));
    raiz.append(notas);
  }

  return raiz;
}
