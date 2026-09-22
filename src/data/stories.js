import { SECOND_STORIES } from './secondStories.js';
// Historias de la primera expansión. Datos puros: sin Three.js ni DOM.
// Cada escena es original para esta instalación; no atribuirla a García Márquez
// ni incorporar nombres, diálogos o episodios de las novelas.
// Fuentes verificadas disponibles en este repo: nobelprize.org (Nobel 1982).

// Límite de escritura por encuentro; se explica en pantalla.
export const MAX_WRITING = 1200;

// Clave versionada para resultados narrativos, aparte del progreso de visitas.
export const HISTORIAS_KEY = 'macondo.historias.v1';

export const STORIES = [
 {
  id:'silla-quien-falta', encounterId:'objeto-mesa', locationId:'patio', kind:'choice',
  title:'La silla de quien falta',
  invite:'Una taza espera junto a una silla vacía.',
  intro:'Alguien dejó la mesa del patio preparada: silla puesta, taza servida, para quien no ha llegado. Puedes servir otra taza y ocupar el sitio, o dejarlo como está. El pueblo recuerda lo que hagas aquí.',
  actions:[
   { id:'servir-taza', label:'Servir una taza', outcomeId:'taza-servida' },
   { id:'dejar-sitio', label:'Dejar el sitio intacto', outcomeId:'sitio-intacto' },
  ],
  outcomes:[
   { id:'taza-servida', text:'Sirves una taza junto a la silla vacía. La mesa queda preparada para dos, y por un momento la ausencia se siente menos.', effectId:'silla.taza-extra',
     trace:'Una taza más en la mesa: la ausencia también se comparte.' },
   { id:'sitio-intacto', text:'Dejas el sitio como está. La silla sigue puesta, esperando sin prisa.', effectId:null,
     trace:'La silla vacía seguía puesta, y eso ya era una manera de memoria.' },
  ],
  reflection:'Recordar a alguien no siempre es nombrarlo; a veces es poner una taza de más en la mesa. Los objetos cotidianos guardan la ausencia sin dramatismo: una silla abierta, un café que nadie se tomará. Qué hace cada casa con lo que falta es parte de lo que un pueblo recuerda.',
  sources:['https://www.nobelprize.org/prizes/literature/1982/press-release/'],
  editorial:'original · pendiente de revisión tono',
 },
 {
  id:'correo-pendiente', encounterId:'carta', locationId:'puerto', kind:'writing',
  title:'El correo de lo pendiente',
  invite:'Una carta sin destinatario espera en el atril.',
  intro:'En el muelle hay una carta abierta y sin nombre de destino. Puedes escribir una línea de algo que quedó pendiente y dejarla guardada, o plegarla en blanco. La carta no se envía: se queda en el pueblo.',
  actions:[
   { id:'escribir-linea', label:'Escribir una línea', outcomeId:'escrita', requiresText:true },
   { id:'en-blanco', label:'Dejarla en blanco', outcomeId:'en-blanco' },
  ],
  outcomes:[
   { id:'escrita', text:'La carta se dobló con tu línea adentro y quedó sobre la banca del muelle.', effectId:'correo.carta-plegada' },
   { id:'en-blanco', text:'La carta quedó plegada en blanco, sobre la banca del muelle.', effectId:'correo.carta-plegada',
     trace:'En blanco: también esperar es una manera de escribir.' },
  ],
  reflection:'Escribir a nadie es distinto de escribir a alguien: ordena lo pendiente en una línea. Hay esperas que no dependen del correo, y aun así nombrarlas las vuelve más llevaderas. Lo que queda en blanco no se pierde; queda disponible para otra tarde.',
  sources:['https://www.nobelprize.org/prizes/literature/1982/press-release/'],
  editorial:'original · pendiente de revisión tono',
 },
 {
  id:'cuaderno-mirador', encounterId:'pagina', locationId:'mirador', kind:'writing',
  title:'El cuaderno del mirador',
  invite:'Un cuaderno abierto recoge lo que el pueblo guardó de tu paso.',
  intro:'Este cuaderno reúne las impresiones que dejaste en el paseo, aunque solo sea una. Puedes escribir tus tres frases, añadirlas, copiarlas o descargarlas. Nada sale de este dispositivo.',
  actions:[
   { id:'guardar', label:'Guardar en el cuaderno', outcomeId:'guardado' },
  ],
  outcomes:[
   { id:'guardado', text:'El cuaderno quedó guardado en este dispositivo.', effectId:null },
  ],
  reflection:'Una crónica no necesita todas las estaciones: basta lo vivido. Releer lo propio, copiarlo o llevárselo es una manera de devolver al pueblo sus propias palabras.',
  sources:['https://www.nobelprize.org/prizes/literature/1982/marquez/lecture/'],
  editorial:'original · pendiente de revisión tono',
 },
 ...SECOND_STORIES,
].map(s => ({ ...s, source:s.sources[0] }));

// Impresiones disponibles para la crónica según lo resuelto.
// Devuelve solo IDs, títulos y texto propio guardado; nada de código.
export function tracesFrom(results) {
 const out = [];
 for (const s of STORIES) {
  if (s.id === 'cuaderno-mirador') continue;   // su contenido es la escritura misma
  const r = results?.[s.id]; if (!r) continue;
  const outcome = s.outcomes.find(o => o.id === r.outcomeId); if (!outcome) continue;
  const text = s.kind === 'writing' ? (r.text || outcome.trace || '') : (outcome.trace || '');
  if (text) out.push({ storyId:s.id, title:s.title, text });
 }
 return out;
}
