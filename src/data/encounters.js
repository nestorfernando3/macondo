// Objetos narrativos: IDs persistentes, independientes de sus nombres visibles.
// y = altura del suelo; eyeY = altura del objeto respecto a ese suelo.
//
// Son el ANCLA de cada objeto: las piezas de src/world/places/* la leen (con `ancla(id)` de
// src/world/anclas.js) en vez de repetir coordenadas, y lo que cae encima —la taza del efecto
// de la silla, por ejemplo— usa `superficie` para posarse justo en el tablero.
export const ENCOUNTERS = [
 { id:'etiquetas', locationId:'plaza', contentId:null, label:'Los nombres de las cosas', x:6, z:1.8, y:0, eyeY:1.2, radius:2.3 },
 { id:'vecina', locationId:'plaza', contentId:null, label:'La voz de la vecina', x:6.1, z:4, y:0, eyeY:1.6, radius:2.3 },
 { id:'objeto-mesa', locationId:'patio', contentId:'memoria', label:'La mesa de la memoria', x:1.8, z:-16.2, y:0, eyeY:1.4, radius:2.3, superficie:1.03 },
 { id:'arbol-tiempo', locationId:'jardin', contentId:'tiempo', label:'El árbol del tiempo', x:25, z:-8.8, y:0, eyeY:2.2, radius:2.2 },
 { id:'carta', locationId:'puerto', contentId:'espera', label:'Una carta sin abrir', x:-33.5, z:7.6, y:0, eyeY:1.2, radius:1.8, superficie:.95 },
 { id:'pagina', locationId:'mirador', contentId:'voz', label:'Las historias', x:17, z:22, y:3, eyeY:1.6, radius:2.4, superficie:3.16 },
 { id:'objeto-reloj', locationId:'plaza', contentId:'llegada', label:'El reloj de la llegada', x:3.2, z:5.2, y:0, eyeY:2.2, radius:2.0 },
 { id:'objeto-espiral', locationId:'jardin', contentId:'mariposas', label:'La espiral de mariposas', x:22.4, z:-7.6, y:0, eyeY:1.8, radius:2.1, superficie:.63 },
 { id:'objeto-faro', locationId:'puerto', contentId:'tren', label:'El faro del muelle', x:-22.8, z:10.6, y:0, eyeY:2.6, radius:2.0 }
];
