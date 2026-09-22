// Textos originales para un paseo opcional: no son citas de las novelas.
export const DISCOVERIES = [
  { id:'umbral', node:'s1', title:'Una bienvenida amarilla', hint:'Sigue la calle desde la entrada.', text:'Una mariposa llegó antes que tú y dejó abierta la mañana.' },
  { id:'fuente', node:'pE', title:'El agua recuerda', hint:'Rodea la fuente por el este.', text:'La fuente repitió una palabra hasta convertirla en agua.' },
  { id:'casa', node:'patio', title:'La casa escucha', hint:'Cruza la puerta hacia el patio.', text:'En el patio, cada silla conservaba el calor de una conversación.' },
  { id:'jardin', node:'jardin', title:'Una flor fuera del tiempo', hint:'Busca entre las mariposas del jardín.', text:'Aquella flor decidió abrirse ayer. Nadie se lo discutió.' },
  { id:'rio', node:'muelle', title:'Lo que trae la corriente', hint:'Recorre el muelle hasta el río.', text:'El río trajo una noticia y se llevó la prisa de leerla.' },
  { id:'mirador', node:'cima', title:'Todo cabe en una mirada', hint:'Sube hasta el mirador.', text:'Desde arriba, el pueblo parecía una historia esperando su primera frase.' },
];
export const DISCOVERIES_KEY = 'macondo-hallazgos-v1';
export function restoreDiscoveries(raw) {
  const allowed = new Set(DISCOVERIES.map(d => d.id));
  return new Set((Array.isArray(raw) ? raw : []).filter(id => allowed.has(id)));
}
