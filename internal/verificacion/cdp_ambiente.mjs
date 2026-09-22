// Sonido ambiente: comprueba lo que no se oye desde aquí — que los tres lazos se carguen,
// que arranquen sólo con el gesto del chip, que la preferencia se recuerde, que el río suba
// al acercarse al agua, que la voz mande sobre el ambiente y que apagar deje todo en pausa.
// La calidad del sonido se juzga con el oído, no con este guion.
import { abrir } from './arnes.mjs';

// El audio sólo arranca con un gesto real; el arnés manda clics de verdad.
const s = await abrir({ autoplay: true });
await s.entrar({ voz: 'no' });

const leer = async () => JSON.parse(await s.js(`JSON.stringify({
  chip: document.querySelector('#audio-ambient').getAttribute('aria-pressed'),
  estado: window.__macondo.ambiente.estado,
  guardado: localStorage.getItem('macondo.ambiente.v1') })`));

// 1. Silencio inicial: chip apagado y ninguna voz creada.
const inicio = await leer();
console.log('SILENCIO INICIAL:', JSON.stringify(inicio));
s.afirmar(inicio.chip === 'false', 'el chip arranca encendido');
s.afirmar(Object.keys(inicio.estado).length === 0, 'había lazos creados antes del gesto');

// 2. El gesto enciende los tres, los archivos cargan y la preferencia se guarda.
await s.clic('#audio-ambient');
// El MP3 tarda en decodificar: se espera a que los tres estén listos (readyState ≥ 2).
const listos = await s.esperar(`(() => { const e = window.__macondo.ambiente.estado;
  return ['viento','rio','aves'].every(id => e[id] && e[id].listo); })()`, { tope: 15000 });
s.afirmar(listos >= 0, 'los tres MP3 no terminaron de cargar en 15 s');
const enc = await leer();
console.log('ENCENDIDO:', JSON.stringify(enc.estado));
s.afirmar(enc.chip === 'true' && Object.keys(enc.estado).length === 3, 'no arrancaron los tres lazos');
s.afirmar(enc.guardado === 'si', 'no se recordó la preferencia');
for (const id of ['viento', 'rio', 'aves']) {
  s.afirmar(enc.estado[id].listo, `${id}: el archivo no cargó`);
  s.afirmar(enc.estado[id].error === null, `${id}: error de audio ${enc.estado[id].error}`);
  s.afirmar(!enc.estado[id].pausado, `${id}: quedó en pausa tras el gesto`);
}
s.afirmar(enc.estado.viento.volumen > .2 && enc.estado.aves.volumen > .2, 'viento o aves en silencio');
s.afirmar(enc.estado.rio.volumen < .05, 'el río debería callar en la plaza');

// 3. En el muelle el río sube.
await s.js(`window.__macondo.player.place(-29.5, 8, Math.PI/2)`);
await s.esperar(`window.__macondo.ambiente.volumenDe('rio') > .5`, { tope: 4000 });
const muelle = await leer();
console.log('EN EL MUELLE:', JSON.stringify(muelle.estado.rio));
s.afirmar(muelle.estado.rio.volumen > .5, `el río no sube en la orilla (${muelle.estado.rio.volumen})`);

// 4. La voz manda: mientras hay subtítulo, el ambiente baja y sigue sonando.
await s.js(`window.__macondo.narrator.play('camino-casa', { force: true })`);
await s.esperar(`window.__macondo.narrator.current !== null`, { tope: 4000 });
await s.esperar(`window.__macondo.ambiente.volumenDe('viento') < .2`, { tope: 4000 });
const conVoz = JSON.parse(await s.js(`JSON.stringify({ narrando: !!window.__macondo.narrator.current,
  viento: window.__macondo.ambiente.estado.viento })`));
console.log('CON VOZ:', JSON.stringify(conVoz));
s.afirmar(conVoz.narrando, 'la voz no arrancó');
s.afirmar(conVoz.viento.volumen < .2 && !conVoz.viento.pausado, 'el ambiente no cedió ante la voz');

// 5. Apagar deja todo en pausa.
await s.js(`window.__macondo.narrator.interrupt()`);
await s.clic('#audio-ambient');
const off = await leer();
console.log('APAGADO:', JSON.stringify(off.estado));
s.afirmar(off.chip === 'false' && off.guardado === 'no', 'no se apagó ni se guardó la preferencia');
for (const id of ['viento', 'rio', 'aves']) s.afirmar(off.estado[id].pausado, `${id}: sigue sonando tras apagar`);
await s.cerrar();
