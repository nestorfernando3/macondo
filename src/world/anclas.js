// Anclas de los objetos interactivos: un solo sitio donde está escrito dónde vive cada uno.
//
// El encuentro (src/data/encounters.js) declara el ancla; la pieza que la habita —la mesa,
// el reloj, el atril, el faro— la lee en vez de repetir el literal, y lo que cae encima (la
// taza del efecto de la silla, la carta plegada del correo) también. Así, mover un objeto es
// cambiar un número: antes había que acordarse de tres archivos, y los desfases ya existían
// (la taza del efecto quedaba 4 cm hundida en la mesa y la carta flotaba 8,8 cm sobre la banca).
import { ENCOUNTERS } from '../data/encounters.js';

const POR_ID = new Map(ENCOUNTERS.map(e => [e.id, e]));

// Ancla de un objeto interactivo. Falla fuerte si el id no existe: un ancla inventada es un
// error de programación, no un caso a tolerar.
export function ancla(id) {
  const a = POR_ID.get(id);
  if (!a) throw new Error(`No existe el ancla «${id}». Las que hay: ${[...POR_ID.keys()].join(', ')}`);
  return a;
}

// Superficie donde se posa algo (el tablero de la mesa, la tabla de la banca). Si el ancla no
// la declara, se asume el suelo del lugar más `alto`.
export function superficieDe(id, alto = .1) {
  const a = ancla(id);
  return (a.superficie ?? a.y ?? 0) + alto;
}

export const idsDeAnclas = () => [...POR_ID.keys()];
