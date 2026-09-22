// Voz narrada es-CO: bienvenida, subtítulos, gate de «Continuar» en la llegada, faro,
// postal, lectura sin quiz con «Escuchar» y conmutador de voz.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar({ voz: 'si' });

// 1. Bienvenida: subtítulo, clip en curso y enlace «Saltar audio».
const bienvenida = JSON.parse(await s.js(`JSON.stringify({
  chip: document.querySelector('#audio-voice').getAttribute('aria-pressed'),
  subtitulo: !document.querySelector('#caption').hidden,
  texto: (document.querySelector('#caption').textContent || '').slice(0, 24),
  clip: window.__macondo?.narrator?.current?.id || null,
  saltar: !document.querySelector('#tour-skip-audio').hidden })`));
console.log('BIENVENIDA:', JSON.stringify(bienvenida));
s.afirmar(bienvenida.chip === 'true', 'la voz no arrancó encendida');
s.afirmar(bienvenida.subtitulo && !!bienvenida.texto, 'la bienvenida no dejó subtítulo');
s.afirmar(bienvenida.clip === 'bienvenida', `clip inesperado: ${bienvenida.clip}`);

// 2. «Saltar audio» quita el subtítulo. La captura deja constancia de que el botón y el
// subtítulo comparten barra: el HUD entero está oculto en la bienvenida, así que si el botón
// vuelve a mudarse dentro de él, deja de tener caja y este paso falla.
await s.captura('narracion_bienvenida');
await s.clic('#tour-skip-audio');
await s.esperar(`document.querySelector('#caption').hidden`, { tope: 3000 });
s.afirmar(await s.js(`document.querySelector('#caption').hidden`), 'el subtítulo siguió tras saltar');

// 3. Recorrido narrado: velocidad 1,7 m/s, faro encendido y clip de camino.
await s.clic('#open-map');
await s.js(`[...document.querySelectorAll('#map-destinations button')].find(x => x.textContent.includes('Casa')).click()`);
await s.js(`document.querySelector('#map').close()`);
await s.esperar(`window.__macondo.tour.active`, { tope: 8000 });
const camino = JSON.parse(await s.js(`JSON.stringify({
  velocidad: window.__macondo.tour.speed,
  msg: document.querySelector('#tour-msg').textContent,
  faro: window.__macondo.beacon?.visible,
  clip: window.__macondo.narrator.current?.id })`));
console.log('CAMINO:', JSON.stringify(camino));
s.afirmar(Math.abs(camino.velocidad - 1.7) < .01, `velocidad narrada ${camino.velocidad} ≠ 1,7`);
s.afirmar(camino.faro === true, 'el faro de destino no está visible');
s.afirmar(camino.clip === 'camino-casa', `clip de camino: ${camino.clip}`);
await s.captura('narracion_camino');

// 4. Llegada: «Continuar» espera a que termine el relato.
const llego = await s.esperar(`(document.querySelector('#tour-msg').textContent || '').startsWith('Llegaste')`, { tope: 150000 });
s.afirmar(llego >= 0, 'no llegó a la casa narrando');
const gate = JSON.parse(await s.js(`JSON.stringify({
  continuarOculto: document.querySelector('#tour-continue').hidden,
  clip: window.__macondo.narrator.current?.id })`));
console.log('GATE:', JSON.stringify(gate));
s.afirmar(gate.continuarOculto, '«Continuar» se abrió antes de terminar el relato');
s.afirmar(gate.clip === 'llegada-casa', `clip de llegada: ${gate.clip}`);

// 5. Fin del audio (headless no siempre reproduce) → se libera el flujo.
await s.js(`window.__macondo.narrator.current.audio.onended()`);
await s.esperar(`!document.querySelector('#tour-continue').hidden`, { tope: 4000 });
const liberado = JSON.parse(await s.js(`JSON.stringify({
  continuarVisible: !document.querySelector('#tour-continue').hidden,
  subtituloOculto: document.querySelector('#caption').hidden })`));
console.log('GATE-RELEASE:', JSON.stringify(liberado));
s.afirmar(liberado.continuarVisible && liberado.subtituloOculto, 'el gate no se liberó al terminar');

// 6. Postal descargable del lugar.
await s.clic('#take-postcard');
const postal = await s.esperar(`window.__macondo.ultimaPostal > 1000`, { tope: 8000 });
const bytes = await s.js(`window.__macondo.ultimaPostal`);
console.log('POSTAL:', bytes, 'bytes');
s.afirmar(postal >= 0, 'la postal no se generó');
s.afirmar(bytes > 40000, `la postal pesa poco: ${bytes} bytes`);

// 7. Lectura sin quiz junto al reloj: con línea para conversar y botón Escuchar.
await s.js(`window.__macondo.player.place(1.9,5.2,2.4)`);
await s.js(`dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
  dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE',bubbles:true}))`);
await s.esperar(`document.querySelector('#reading').open`, { tope: 4000 });
const sinQuiz = JSON.parse(await s.js(`JSON.stringify({
  titulo: document.querySelector('#reading-title').textContent,
  quizOculto: document.querySelector('#reading-quiz').hidden,
  conversa: (document.querySelector('#reading-conversa').textContent || '').slice(0, 26),
  escucharVisible: !document.querySelector('#reading-listen').hidden })`));
console.log('LECTURA-SIN-QUIZ:', JSON.stringify(sinQuiz));
s.afirmar(sinQuiz.quizOculto, 'la lectura sin quiz mostró pregunta');
s.afirmar(!!sinQuiz.conversa && sinQuiz.escucharVisible, 'faltó la línea para conversar o el botón Escuchar');

// 8. «Escuchar» reproduce con subtítulo; cerrar interrumpe.
await s.clic('#reading-listen');
const escuchar = JSON.parse(await s.js(`JSON.stringify({
  clip: window.__macondo.narrator.current?.id,
  subtitulo: !document.querySelector('#caption').hidden })`));
console.log('ESCUCHAR:', JSON.stringify(escuchar));
s.afirmar(escuchar.clip === 'lectura-llegada' && escuchar.subtitulo, '«Escuchar» no reprodujo con subtítulo');
await s.captura('narracion_lectura');
await s.js(`document.querySelector('#reading .close').click()`);
await s.esperar(`window.__macondo.narrator.current === null`, { tope: 3000 });
const cierre = JSON.parse(await s.js(`JSON.stringify({
  subtituloOculto: document.querySelector('#caption').hidden,
  clip: window.__macondo.narrator.current?.id || null })`));
console.log('CIERRE:', JSON.stringify(cierre));
s.afirmar(cierre.subtituloOculto && cierre.clip === null, 'cerrar la lectura no cortó la voz');

// 9. Apagar la voz persiste la preferencia.
await s.clic('#audio-voice');
const voz = JSON.parse(await s.js(`JSON.stringify({
  pulsado: document.querySelector('#audio-voice').getAttribute('aria-pressed'),
  storage: localStorage.getItem('macondo.voz.v1') })`));
console.log('VOZ:', JSON.stringify(voz));
s.afirmar(voz.pulsado === 'false' && voz.storage === 'no', 'la voz no se apagó ni persistió');
await s.cerrar();
