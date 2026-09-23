import { StoryInteraction } from './ui/StoryInteraction.js';
import './style.css';
import { DISCOVERIES, DISCOVERIES_KEY, restoreDiscoveries } from './data/discoveries.js';
import { createDiscoveries } from './world/discoveries.js';
import { Onboarding } from './ui/Onboarding.js';
import * as THREE from 'three';
import { Experience } from './core/Experience.js';
import { createVillage } from './world/createVillage.js';
import { createButterfly } from './world/butterflyAvatar.js';
import { PlayerController, empujeVertical, PITCH_MIN, PITCH_MAX, PITCH_REPOSO } from './navigation/PlayerController.js';
import { InputController } from './navigation/InputController.js';
import { TourController } from './navigation/TourController.js';
import { Locomocion } from './navigation/Locomocion.js';
import { InteractionSystem } from './interaction/InteractionSystem.js';
import { stations, writing, PROGRESS_KEY } from './data/content.js';
import { restoreProgress, serializeProgress } from './state/progress.js';
import { LOCATIONS, SPAWN, TOUR_ORDER, NODES, EDGES } from './data/locations.js';
import { ENCOUNTERS } from './data/encounters.js';
import { STORIES, tracesFrom, HISTORIAS_KEY, MAX_WRITING } from './data/stories.js';
import { restoreHistorias, serializeHistorias } from './state/historias.js';
import { NarrativeDirector } from './narrative/NarrativeDirector.js';
import { createStoryEffects } from './world/storyEffects.js';
import { TourNarrator } from './audio/TourNarrator.js';
import { AmbientBed } from './audio/AmbientBed.js';
import { createBeacon } from './world/beacon.js';
import { capturarPostal } from './world/postal.js';
// Capa literaria: la ficha «En la novela», el índice de capítulos, el árbol de los Buendía, el
// cuaderno de palabras y el pergamino. Son módulos de DOM, sin Three.js, y no tocan el paseo.
import { crearFichaNovela, crearIndiceNovela, crearCuadernoPalabras, crearSelloOrigen } from './ui/NovelaPanel.js';
import { crearArbol } from './ui/ArbolPanel.js';
import { crearPergamino } from './ui/Pergamino.js';
import { crearMapa } from './ui/Mapa.js';
import { crearLluvia } from './world/lluvia.js';

const $ = s => document.querySelector(s);
const EYE = 1.65;
// Radianes de cámara por píxel de ratón, para girar y para inclinar. El mismo número sirve
// con el puntero capturado (movimiento continuo) y con el arrastre táctil.
const SENS_GIRO = .0026;
const raycaster = new THREE.Raycaster();
const sueloPlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Toque/clic sobre la escena → punto del suelo → la mariposa vuela hasta allí.
function flyToPoint(cx, cy){
  raycaster.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), experience.camera);
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(sueloPlano, p) && player.flyTo(p.x, p.z)) {
    $('#flight-status').textContent = 'Volando hacia tu destino · Escape para detenerte';
  } else {
    $('#flight-status').textContent = 'Elige un punto libre del suelo. Para ir a otro lugar, usa el Mapa.';
  }
}

// ---------- Estado del paseo: lo gobierna Locomocion, no este archivo ----------
// Aquí sólo queda el progreso (visitas y respuestas). El modo, quién conduce a la mariposa
// y el gate de la narración viven en src/navigation/Locomocion.js, que se prueba en Node.
const state = { discovered:new Set(), answered:new Set() };

// Persistencia tolerante a almacenamiento bloqueado.
function loadProgress(){ try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {} } catch { return {} } }
function saveProgress(){ try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(serializeProgress(state))) } catch {} }
const saved = loadProgress();
Object.assign(state, restoreProgress(saved, LOCATIONS, stations.map(s => s.id)));

// ---------- Historias: resultados narrativos (clave aparte del progreso) ----------
const historias = { results:{} };
function loadHistorias(){ try { return JSON.parse(localStorage.getItem(HISTORIAS_KEY)) || {} } catch { return {} } }
function saveHistorias(){ try { localStorage.setItem(HISTORIAS_KEY, JSON.stringify(serializeHistorias(historias))) } catch {} }
Object.assign(historias, restoreHistorias(loadHistorias(), STORIES));

// ---------- Voz narrada: subtítulos y ritmo del paseo ----------
let bienvenidaHecha = false;   // una sola vez por sesión
let lugarActual = 'plaza';
let ultimaPostal = 0;          // longitud del dataURL de la última postal (verificación)
let destinoTour = null;        // a dónde apunta el recorrido: el minimapa lo marca
let clipSuelto = null;         // clip que lanzó la quietud (no es el relato del recorrido)
const lugaresContados = new Set();   // lugares que ya tomaron la palabra esta sesión
let quietoAqui = 0;            // segundos seguidos sin moverse en el lugar actual
const esUltimaLlegada = () => locomocion.estado.ultimaLlegada === TOUR_ORDER.at(-1);
const narrator = new TourNarrator({
  onCaption: texto => {
    $('#caption').hidden = !texto;
    if (texto) $('#caption').textContent = texto;
    $('#tour-skip-audio').hidden = !texto;
    ambiente.setNarrando(!!texto);      // la voz manda: el pueblo baja el volumen
  },
  onEnded: id => {
    // La voz de la quietud no toca la máquina del recorrido: no es un relato de llegada.
    if (id === clipSuelto) { clipSuelto = null; return; }
    if (id === 'llegada-mirador') { narrator.play('fin-recorrido'); return; }
    // El relato de la llegada terminó: se abre «Continuar» (salvo en el mirador, que cierra).
    aplicar(locomocion.relato('termino', { esUltimo: esUltimaLlegada() }));
  },
});
$('#audio-voice').setAttribute('aria-pressed', String(narrator.enabled));

// ---------- Sonido ambiente: viento, río y aves (apagado por defecto, spec §84) ----------
const ambiente = new AmbientBed();
$('#audio-ambient').setAttribute('aria-pressed', String(ambiente.enabled));

// ---------- Locomoción: la máquina de estados y su adapter ----------
const locomocion = new Locomocion({ narrador: narrator });

// Aplica a la pantalla, la voz y el jugador lo que la máquina decidió. Es el único sitio
// que toca esos cuatro mundos, así que las reglas de arriba se pueden probar sin navegador.
function aplicar(e) {
  if (e.teclas) input?.clear();
  if (e.vuelo === 'soltar' && player) { player.stop(); }
  if (e.vuelo === 'seguir' && player) { player.flyTarget = null; player.followCam = true; }
  if (e.voz === 'pausar') narrator.pause();
  if (e.voz === 'cortar') narrator.interrupt();
  if (e.voz === 'tocar' && e.clip) narrator.play(e.clip);
  if (e.recorrido === 'pausar') tour?.pause();
  if (e.recorrido === 'detener') { tour?.stop(); beacon?.clear(); }
  if (e.banner !== undefined) {
    $('#tour-banner').hidden = !e.banner;
    $('#toggle-tour').setAttribute('aria-pressed', String(!!e.banner));
  }
  if (e.continuar !== undefined) $('#tour-continue').hidden = !e.continuar;
  if (e.aviso) $('#tour-msg').textContent = e.aviso;
}

// ---------- Paneles: un solo controlador (todo panel detiene la locomoción) ----------
// El qué lo decide Locomocion; aquí sólo se aplica y se lleva el foco del teclado, que es
// lo único que necesita mirar el DOM.
let panelOpener = null;
function blockPanel(){
  aplicar(locomocion.bloquear());
  input?.release();          // sin cursor, los botones del panel quedan fuera de alcance
  panelOpener = document.activeElement;
}
function releasePanel(){
  const otroPanelAbierto = !!document.querySelector('dialog[open]');   // otro panel sigue arriba
  const efectos = locomocion.liberar({ otroPanelAbierto });
  if (otroPanelAbierto) return;
  aplicar(efectos);
  panelOpener?.focus?.(); panelOpener = null;
}

// ---------- Experiencia 3D ----------
let experience, village, player, input, tour, interactions, effects, beacon, lluvia;
let lluviaNivel = 0;           // aguacero del capítulo 16: apagado hasta que lo pidan
let worldReady = false;
let discoveryWorld;
let worldTime = 0;
let discoveryTimer;
let lockHintTimer;
let found = new Set();
try { found = restoreDiscoveries(JSON.parse(localStorage.getItem(DISCOVERIES_KEY))); } catch {}
function renderDiscoveries() {
  $('#open-discoveries').textContent = `Hallazgos ${found.size}/${DISCOVERIES.length}`;
  $('#discovery-list').replaceChildren(...DISCOVERIES.map(d => {
    const li = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = found.has(d.id) ? '✦ ' + d.title : '◇ Por descubrir';
    const text = document.createElement('p'); text.textContent = found.has(d.id) ? d.text : d.hint;
    li.append(title,text); return li;
  }));
  $('#discovery-complete').hidden = found.size !== DISCOVERIES.length;
}
function onDiscovery(data) {
  try { localStorage.setItem(DISCOVERIES_KEY, JSON.stringify([...found])); } catch {}
  renderDiscoveries();
  $('#discovery-toast').textContent = `✦ ${data.title} · ${found.size}/${DISCOVERIES.length}`;
  clearTimeout(discoveryTimer);
  discoveryTimer = setTimeout(() => { $('#discovery-toast').textContent = ''; },4500);
}

function initWorld(){
  experience = new Experience($('#scene'));
  village = createVillage(experience);
  $('#quality-mode').value = experience.quality;
  discoveryWorld = createDiscoveries(experience.scene,village.world,found,onDiscovery);
  player = new PlayerController(experience.camera, village.world);
  player.attachAvatar(createButterfly(experience.scene, { renderer: experience.renderer }));
  input = new InputController(experience.renderer.domElement);
  tour = new TourController(player, { onArrive:onTourArrive, onLeg:onTourLeg });
  interactions = new InteractionSystem(player, village.world);
  interactions.setItems(village.interactables);
  effects = createStoryEffects(experience.scene);
  beacon = createBeacon(experience.scene, village.world);
  lluvia = crearLluvia(experience.scene, { radio: 11, cantidad: 620 });
  lluvia.set(lluviaNivel);                       // recuerda lo que se pidió antes de entrar
  for (const r of Object.values(historias.results)) {
    const st = STORIES.find(s => s.id === r.storyId);
    const out = st?.outcomes.find(o => o.id === r.outcomeId);
    effects.set(r.storyId, out?.effectId ?? null); // restaura consecuencias visibles
  }
  experience.onTick((dt, t) => {
    if (!ambientPaused) { worldTime += dt; village.update(worldTime); beacon.update(worldTime); }
    // La cortina de lluvia sigue a la mariposa aunque el pueblo esté en pausa: es un estado del
    // clima, no un movimiento del paisaje; con la pausa no avanza, pero no se queda atrás.
    if (lluviaNivel) lluvia?.update(ambientPaused ? 0 : dt, player.position);
    ambiente.update(player.position.x);          // el río suena más cerca de la orilla
    const viaje = locomocion.estado;
    if (viaje.modo !== 'paseo') { input.clear(); return; }
    window.__macondo = { player, experience, village, tour, interactions, director, effects, historias, narrator, beacon, ambiente, locomocion, lluvia,
      get ultimaPostal() { return ultimaPostal; } }; // gancho de verificación
    discoveryWorld.update(player.position, worldTime, !ambientPaused);
    const s = input.sample();
    if (s.look.x || s.look.y) {                       // el ratón orbita la cámara alrededor de la mariposa
      player.orbitYaw -= s.look.x * SENS_GIRO;
      player.orbitPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, player.orbitPitch + s.look.y * SENS_GIRO));
      // Quien mira manda: mientras la cámara persigue el rumbo (vuelo por punto, recorrido)
      // el giro del ratón se desharía solo. Un giro con el ratón suelta la perseguidora y el
      // vuelo sigue su rumbo; R la vuelve a centrar.
      if (s.look.x) player.followCam = false;
    }
    // La altura la manda la mirada (subir/bajar con Espacio y Shift ya no existe): inclinar
    // la cámara empuja el vuelo arriba o abajo y el horizonte lo sostiene.
    s.move.up = empujeVertical(player.orbitPitch);
    const manual = s.move.fwd || s.move.right || s.joy.x || s.joy.y;
    if (viaje.recorrido && !viaje.pausado) {
      if (manual) { stopTour(); player.update(dt, s); }            // solo el movimiento manual cancela; mirar no
      else tour.update(dt);
    }
    if (!viaje.recorrido || viaje.pausado) player.update(dt, s);
    for (const [id, location] of Object.entries(LOCATIONS)) {
      if (Math.hypot(player.position.x-location.x, player.position.z-location.z) <= 3 &&
          Math.abs(player.position.y-(village.world.groundAt(location.x,location.z)+EYE)) < 2) updatePlace(id);
    }
    const near = interactions.update(player.position.x, player.position.z, player.position.y); // altura de la mariposa
    if (near) {
      const nearStory = director.storyFor(near.id);
      if (nearStory) director.invite(nearStory.id); // acercarse solo invita; nada se abre
    }
    showTip(near);
    if (s.interact) interactWithCurrent();
    if (s.tap) { if (locomocion.estado.recorrido) stopTour(); flyToPoint(s.tap.x, s.tap.y); }
    if (!player.flyTarget && $('#flight-status').textContent.startsWith('Volando')) $('#flight-status').textContent = 'Vuelo terminado. Puedes elegir otro punto o usar el Mapa.';
    onboarding.observe({ moved: manual || !!s.tap, looked: !!(s.look.x || s.look.y) });
    updateMinimap();
    narrarSiSeDetiene(dt, manual, s);
  });
  village.update(0);
  experience.start();
  setupLookTouch();
  // La mira sólo existe con el puntero capturado: es el punto al que vuela el clic. El aviso
  // que la acompaña dice cómo recuperar el cursor, y se apaga solo: no es un cartel fijo.
  document.addEventListener('pointerlockchange', () => {
    const capturado = !!input?.locked;
    document.body.classList.toggle('pointer-locked', capturado);
    // El chip es un conmutador de verdad: rótulo fijo y estado en aria-pressed, igual que
    // Voz, Sonido y Guiarme. Esc lo apaga solo porque pasa por aquí.
    $('#free-look').setAttribute('aria-pressed', String(capturado));
    clearTimeout(lockHintTimer);
    $('#lock-hint').hidden = !capturado;
    if (capturado) lockHintTimer = setTimeout(() => { $('#lock-hint').hidden = true; }, 7000);
  });
}

// ---------- Portada y transición de descenso ----------
function showCover(){
  aplicar(locomocion.ir('portada'));
  input?.release();
  document.body.classList.remove('exploring', 'pointer-locked');
  $('#hud').hidden = true;
  $('#caption').hidden = true;
  if (experience) {
    experience.camera.position.set(0, 26, 44);
    experience.camera.rotation.set(-.5, 0, 0);
  }
}
let flying = false;
let ambientPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function enterWalk(skip){
  if (!worldReady) {
    try { initWorld(); worldReady = true; }
    catch (err) { console.error(err); showFallback(err); return; }
  }
  player.place(SPAWN.x, SPAWN.z, SPAWN.yaw);
  // «exploring» se pone ANTES de bifurcar: es lo que retira la portada (`.exploring main`),
  // y las dos entradas —vuelo animado y movimiento reducido— tienen que retirarla igual.
  // Cuando vivía sólo en la rama animada, quien pedía movimiento reducido entraba al paseo
  // con el h1 y el botón «Comenzar recorrido» todavía encima, y el botón recibía clics.
  document.body.classList.add('exploring');
  if (skip || matchMedia('(prefers-reduced-motion: reduce)').matches) { endTransition(); return; }
  aplicar(locomocion.ir('transicion'));
  $('#skip-flight').hidden = false;
  $('#transition').hidden = false;
  flying = true;
  const cam = experience.camera;
  const start = { x:0, y:26, z:44 }, t0 = performance.now();
  const fly = ms => {
    if (!flying) return;
    const k = Math.min(1, (ms - t0) / 2600);
    const e = k < .5 ? 2*k*k : 1 - (-2*k + 2) ** 2 / 2; // easeInOut
    cam.position.set(start.x, start.y + (0 - start.y) * e, start.z + (SPAWN.z - start.z) * e);
    cam.lookAt(0, EYE, 4);
    if (k < 1) requestAnimationFrame(fly);
    else endTransition();
  };
  requestAnimationFrame(fly);
}
function endTransition(){
  flying = false;
  aplicar(locomocion.ir('paseo'));
  $('#transition').hidden = true;
  $('#skip-flight').hidden = true;
  $('#hud').hidden = false;
  player.place(SPAWN.x, SPAWN.z, SPAWN.yaw);
  updatePlace('plaza');
  updateProgress();
  onboarding.start();
  ambiente.reanudar();                       // si el sonido venía encendido, el clic lo libera
  if (!bienvenidaHecha) { bienvenidaHecha = true; narrator.play('bienvenida'); } // el clic en #enter es el gesto
}

// ---------- HUD ----------
function updatePlace(id, silent){
  lugarActual = id;
  const el = $('#place-name');
  if (el.textContent !== LOCATIONS[id].name) {
    el.textContent = LOCATIONS[id].name;
    el.classList.remove('reveal');
    void el.offsetWidth;               // reinicia la animación de reaparición
    el.classList.add('reveal');
  }
  if (!silent && !state.discovered.has(id)) { state.discovered.add(id); saveProgress(); updateProgress(); }
}
function updateProgress(){
  const n = TOUR_ORDER.filter(id => state.discovered.has(id)).length;
  $('#progress').textContent = `${n} / 4 lugares explorados`;
  const next = TOUR_ORDER.find(id => !state.discovered.has(id));
  $('#journey-status').textContent = next ? `${n}/4 · Próxima parada: ${LOCATIONS[next].name}` : '4/4 · Llegaste a todos los lugares. Escribe tu recuerdo en el Cuaderno.';
  buildMinimap();                      // los puntos cambian de color al descubrir: se repintan aquí
}

// ---------- Minimapa ----------
// El mismo grafo y la misma proyección que el mapa grande: los caminos se escriben una vez y se
// leen en los dos sitios. Por fotograma sólo se mueve la flecha —rehacer el SVG en cada tick
// cuesta más que dibujar el pueblo— y se marca el destino del recorrido, que es lo que responde
// a «¿por dónde se sube?» cuando la rampa no se ve desde el suelo.
const mapX = v => 40 + v, mapZ = v => 40 + v;
let flechaMapa = null, marcaDestino = null;
function buildMinimap(){
  const svg = document.querySelector('#minimap svg');
  if (!svg) return;
  const ns = svg.namespaceURI;
  const crear = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  svg.replaceChildren();
  for (const [from, to] of EDGES) {
    const a = NODES[from], b = NODES[to];
    svg.append(crear('line', { x1: mapX(a[0]), y1: mapZ(a[1]), x2: mapX(b[0]), y2: mapZ(b[1]),
      stroke: '#a08a6a', 'stroke-width': '1.3' }));
  }
  for (const id in LOCATIONS) {
    const { x, z } = LOCATIONS[id];
    svg.append(crear('circle', { cx: mapX(x), cy: mapZ(z), r: '2.4',
      fill: state.discovered.has(id) ? '#4f8567' : '#c99a4a' }));
  }
  marcaDestino = crear('circle', { r: '4.2', fill: 'none', stroke: '#ffcd70', 'stroke-width': '1.4', opacity: '0' });
  flechaMapa = crear('polygon', { fill: '#d8452f', stroke: '#fff6df', 'stroke-width': '.5' });
  svg.append(marcaDestino, flechaMapa);
}
function updateMinimap(){
  if (!flechaMapa || !player) return;
  const x = mapX(player.position.x), y = mapZ(player.position.z), a = -player.yaw;
  flechaMapa.setAttribute('points', [[0, -3], [2, 2], [-2, 2]].map(([dx, dy]) =>
    `${x + dx * Math.cos(a) - dy * Math.sin(a)},${y + dx * Math.sin(a) + dy * Math.cos(a)}`).join(' '));
  const destino = destinoTour && LOCATIONS[destinoTour];
  marcaDestino.setAttribute('opacity', destino ? '1' : '0');
  if (destino) {
    marcaDestino.setAttribute('cx', mapX(destino.x));
    marcaDestino.setAttribute('cy', mapZ(destino.z));
  }
}

// ---------- El pueblo toma la palabra ----------
// Al quedarse quieto en un lugar nuevo, la voz cuenta ese lugar sola. Antes había que pedir
// «guiarme» para oír algo: quien entraba sin pulsar nada encontraba un pueblo mudo. Suena una
// vez por lugar y sesión, nunca durante el recorrido —que trae su propia narración—, nunca
// encima de otro clip, nunca con un panel abierto y nunca en pleno vuelo.
function narrarSiSeDetiene(dt, manual, s){
  const ocupado = manual || s.tap || player?.flyTarget || locomocion.estado.recorrido ||
    !narrator.enabled || narrator.current || document.querySelector('dialog[open]');
  const id = lugarActual;
  if (ocupado || !id || lugaresContados.has(id) || !narrator.has('llegada-' + id)) { quietoAqui = 0; return; }
  quietoAqui += dt;
  if (quietoAqui < 2.2) return;
  lugaresContados.add(id);
  clipSuelto = 'llegada-' + id;
  narrator.play(clipSuelto);
}
function showTip(item){
  if (!item || locomocion.estado.modo !== 'paseo') { $('#interact-tip').hidden = true; return; }
  if ($('#interact-label').textContent !== item.label) $('#interact-label').textContent = item.label;
  $('#interact-tip').hidden = false;
}

// ---------- Lectura (nunca bloquea el paso) ----------
function openReading(contentId){
  const st = stations.find(s => s.id === contentId); if (!st) return;
  blockPanel();
  $('#reading-tag').textContent = st.tag;
  $('#reading-title').textContent = st.title;
  // La cita textual va antes de la glosa y con su atribución pegada. Sólo la trae la estación
  // de Remedios: es la única transcripción literal de la novela en toda la experiencia.
  $('#reading-cita').hidden = !st.cita;
  $('#reading-cita-texto').textContent = st.cita ?? '';
  $('#reading-cita-fuente').textContent = st.citaFuente ?? '';
  $('#reading-body').textContent = st.body;
  $('#reading-work').textContent = st.work;
  // Capa literaria: el sello dice de dónde viene cada cosa y la ficha glosa el tema de la
  // estación con su capítulo y sus datos verificables. Sin ficha, la sección no se muestra.
  const capa = $('#reading-novela');
  const ficha = crearFichaNovela(st.id);
  capa.hidden = !ficha;
  capa.replaceChildren(...(ficha ? [crearSelloOrigen('instalacion'), ficha] : []));
  $('#reading-quiz').hidden = !st.question;          // pasajes nuevos: lectura sin quiz
  $('#reading-conversa').hidden = !st.conversa;
  if (st.conversa) $('#reading-conversa').textContent = st.conversa;
  $('#feedback').textContent = '';
  if (st.question) {
    $('#reading-question').textContent = st.question;
    $('#answers').replaceChildren(...st.answers.map((answer, i) => {
      const b = document.createElement('button');
      b.textContent = answer; b.setAttribute('aria-pressed','false');
      b.onclick = () => {
        $('#answers').querySelectorAll('button').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
        $('#feedback').textContent = (i === st.correct ? 'Así es. ' : 'Vuelve a pensarlo. ') + st.feedback;
        state.answered.add(st.id); saveProgress();
      };
      return b;
    }));
  }
  $('#reading-listen').hidden = !narrator.has('lectura-' + st.id);
  $('#reading-listen').onclick = () => narrator.play('lectura-' + st.id, { force:true });
  // La fuente de una cita es el libro, no la página del Nobel que citan las demás estaciones:
  // con `source:null` el enlace se retira en vez de apuntar a un sitio que no es su origen.
  $('#source').hidden = !st.source;
  if (st.source) $('#source').href = st.source;
  $('#reading').showModal();
}
function closeReading(){ if ($('#reading').open) $('#reading').close(); }
$('#reading').addEventListener('close', () => { narrator.interrupt(); releasePanel(); });

// ---------- Historias: director, presentación y consecuencias ----------
const storyInteraction = new StoryInteraction($('#story-interaction'), { preview: (id, effect) => effects?.set(id, effect) });
const director = new NarrativeDirector(STORIES, {
  onOpen: presentStory,
  onResolve: (story, result) => {
    applyStoryResult(story, result);
    const outcome = story.outcomes.find(o => o.id === result.outcomeId);
    if (story.id !== 'cuaderno-mirador') {
      $('#story-outcome').textContent = outcome?.text || '';
      $('#story-outcome').hidden = false;
      $('#story-note').textContent = 'Guardado en el cuaderno del mirador.';
      $('#story-think-text').textContent = story.reflection;
      $('#story-think').hidden = false;
    }
  },
});
director.restore(historias.results);

function applyStoryResult(story, result){
  historias.results[result.storyId] = result;
  saveHistorias();
  const outcome = story.outcomes.find(o => o.id === result.outcomeId);
  effects?.set(result.storyId, outcome?.effectId ?? null);
  refreshTraces();
}

function interactWithCurrent(){
  const item = interactions?.current; if (!item) return;
  onboarding.observe({ explored:true });
  const story = director.storyFor(item.id);
  if (story) director.open(story.id); else openReading(item.contentId);
}

function presentStory(story, { resolved }){
  blockPanel();
  narrator.interrupt();
  storyInteraction.render(story, resolved);
  if (story.id === 'cuaderno-mirador') { refreshTraces(); $('#writing').showModal(); return; }
  $('#story-tag').textContent = LOCATIONS[story.locationId].name.toUpperCase();
  $('#story-title').textContent = story.title;
  $('#story-intro').textContent = story.intro;
  $('#story-source').href = story.source;
  $('#story-note').textContent = '';
  $('#story-outcome').hidden = true;
  $('#story-think').hidden = true;
  const contentId = ENCOUNTERS.find(e => e.id === story.encounterId)?.contentId;
  $('#story-read').hidden = !stations.some(s => s.id === contentId);
  $('#story-read').onclick = () => { $('#story').close(); openReading(contentId); };
  const writingKind = story.kind === 'writing';
  $('#story-write').hidden = !writingKind;
  if (writingKind) { $('#story-text').value = resolved?.text || ''; updateCount($('#story-text'), $('#story-count')); }
  renderStoryActions(story, resolved);
  $('#story').showModal();
}

function renderStoryActions(story, resolved){
  const box = $('#story-actions'); box.replaceChildren();
  const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; return b; };
  if (resolved) {
    const outcome = story.outcomes.find(o => o.id === resolved.outcomeId);
    $('#story-outcome').textContent = outcome?.text || '';
    $('#story-outcome').hidden = false;
    box.append(mk('Volver a explorar esta escena', () => {
      $('#story-outcome').hidden = true;
      $('#story-note').textContent = 'Tu elección anterior se puede cambiar.';
      storyInteraction.render(story, null);
      renderStoryActions(story, null);
      ($('#story-interaction button, #story-interaction select') || box.firstElementChild)?.focus();
    }));
    return;
  }
  for (const a of story.actions) {
    box.append(mk(a.label, () => {
      const pending = storyInteraction.ready();
      if (pending) { $('#story-note').textContent = pending; return; }
      let result;
      if (story.kind === 'writing') {
        const text = $('#story-text').value.trim();
        if (a.requiresText && !text) { $('#story-note').textContent = 'Escribe algo primero o elige dejarla en blanco.'; return; }
        result = director.resolve(a.outcomeId, text);
      } else result = director.choose(a.id);
      if (result) {
        storyInteraction.render(story, result);
        renderStoryActions(story, result);
        $('#story-think-text').textContent = story.reflection;
        $('#story-think').hidden = false;
        box.firstElementChild?.focus();
      }
    }));
  }
}
$('#story').addEventListener('close', () => {
  const story = director.active;
  if (story) {
    const result = director.resultOf(story.id);
    effects?.set(story.id, story.outcomes.find(o => o.id === result?.outcomeId)?.effectId ?? null);
  }
  storyInteraction.clear(); director.close(); releasePanel();
});
$('#story-text').addEventListener('input', () => updateCount($('#story-text'), $('#story-count')));
function updateCount(field, out){
  out.textContent = `${field.value.length} / ${MAX_WRITING} caracteres. Se guarda en este dispositivo; no se envía.`;
}

// ---------- Recorrido guiado ----------
function progresoTour(){ return ' · ' + TOUR_ORDER.filter(i => state.discovered.has(i)).length + '/' + TOUR_ORDER.length; }
function startTour(destId){
  if (!tour.startTo(destId, player.position)) {
    // El planificador no encontró salida: pasa dentro de un corral de tapias —el patio, el del
    // puerto— cuando ni subiendo hay una recta limpia a una calle. La plaza es la recuperación
    // que el HUD promete, así que ahí se lleva al jugador; para los demás destinos se dice qué
    // pasa en la franja de estado, que es mejor que un botón mudo.
    stopTour();
    if (destId === 'plaza') {
      player.place(NODES.plaza[0], NODES.plaza[1], 0);
      updatePlace('plaza');
      $('#flight-status').textContent = 'Sin camino despejado: le dejamos en la plaza.';
    } else {
      $('#flight-status').textContent = 'No hay un camino despejado hasta ' + LOCATIONS[destId].name +
        '. Suba para buscar la calle, o pulse «Plaza».';
    }
    return;
  }
  // El relato y las llegadas están escritos para la altura de crucero, y la mirada es ahora
  // el mando de altura: sin devolverla al horizonte, el recorrido arrancaría subiendo.
  player.resetAltitude();
  player.recenter();
  const narrado = narrator.enabled && narrator.has('camino-' + destId);
  tour.speed = narrado ? 1.7 : 2.8;                  // narrado: paso más despacio
  aplicar(locomocion.recorrido('iniciar'));
  destinoTour = destId;
  $('#tour-msg').textContent = 'Recorrido hacia ' + LOCATIONS[destId].name + progresoTour();
  beacon.set(destId);
  if (narrado) narrator.play('camino-' + destId);
}
function stopTour(){
  destinoTour = null;
  aplicar(locomocion.recorrido('detener'));
}
function onTourLeg({ destination }){
  destinoTour = destination;
  $('#tour-msg').textContent = 'Recorrido hacia ' + LOCATIONS[destination].name + progresoTour();
}
function onTourArrive(destId){
  const esUltimo = destId === TOUR_ORDER.at(-1);
  aplicar(locomocion.recorrido('llegar', { destino: destId, esUltimo }));
  if (destId === 'mirador') player.yaw = 0;   // llegada mirando al pueblo
  updatePlace(destId);
  $('#tour-msg').textContent = 'Llegaste a ' + LOCATIONS[destId].name + '.';
}
$('#tour-continue').onclick = () => {
  player.enabled = true;
  const next = TOUR_ORDER.find(id => !state.discovered.has(id)) || TOUR_ORDER[0];
  startTour(next);
};
$('#tour-skip-audio').onclick = () => narrator.skip(); // dispara onEnded: el flujo continúa
$('#audio-voice').onclick = () => {
  narrator.setEnabled(!narrator.enabled);
  $('#audio-voice').setAttribute('aria-pressed', String(narrator.enabled));
  if (!narrator.enabled && locomocion.estado.relato) {   // apagar la voz libera la llegada
    aplicar(locomocion.relato('termino', { esUltimo: esUltimaLlegada() }));
  }
};
// El sonido del pueblo nace de este gesto (silencio inicial) y se recuerda por dispositivo.
$('#audio-ambient').onclick = () => {
  ambiente.setEnabled(!ambiente.enabled);
  $('#audio-ambient').setAttribute('aria-pressed', String(ambiente.enabled));
};
// El aguacero del capítulo 16: un estado del pueblo, no un adorno. Vive en el cajón con «Voz» y
// «Sonido» —es un conmutador más—, así que el rótulo no cambia y el estado va en aria-pressed.
$('#toggle-lluvia').onclick = () => {
  lluviaNivel = lluviaNivel ? 0 : 2;
  lluvia?.set(lluviaNivel);
  if (lluvia && player) lluvia.update(0, player.position);
  $('#toggle-lluvia').setAttribute('aria-pressed', String(!!lluviaNivel));
};
// Vista libre: el único sitio desde el que se captura el puntero. Antes lo hacía el propio
// toque de volar y el primer clic de cualquiera dejaba el HUD sin cursor y sin poder pulsarse.
// Aquí es una elección, con su chip, su mira y su aviso de cómo salir (Esc).
$('#free-look').onclick = () => {
  if (input?.locked) input.release(); else input?.request();
};
$('#take-postcard').onclick = async () => {
  if (!experience) return;
  try {
    const lugar = lugarActual;
    const st = stations.find(s => s.location === lugar);
    const dataUrl = await capturarPostal(experience, {
      titulo: LOCATIONS[lugar].name,
      linea: st?.conversa || 'Un pueblo para recorrer.',
    });
    ultimaPostal = dataUrl.length;
    const blob = await (await fetch(dataUrl)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'macondo-recuerdo-' + lugar + '.png';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) { console.error(err); }
};

// ---------- Mapa ----------
// El dibujo lo compone `ui/Mapa.js` —el grafo del pueblo sobre papel, con el río, el muelle y
// las casas— y aquí sólo se le dice qué lugares ya visitó y qué hacer cuando se elige uno. La
// lista de destinos se conserva tal cual: el dibujo se puede tocar, pero la lista es la ruta de
// texto y la que funciona sin puntero fino.
function irA(id){
  $('#map').close();
  startTour(id);
}
function drawMap(){
  $('#map-canvas').replaceChildren(crearMapa({
    descubiertos: state.discovered,
    jugador: player ? { x: player.position.x, z: player.position.z, yaw: player.yaw } : null,
    alElegir: irA,
  }));
  $('#map-destinations').replaceChildren(...Object.entries(LOCATIONS).filter(([id]) => id !== 'patio').map(([id, l]) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = (state.discovered.has(id) ? '✓ ' : '') + l.name;
    b.onclick = () => irA(id);
    li.append(b); return li;
  }));
}
$('#open-map').onclick = () => { blockPanel(); drawMap(); $('#map').showModal(); };

// ---------- Escritura (mirador, opcional) ----------
$('#writing-prompt').textContent = writing.prompt;
function loadWriting(){ try { return localStorage.getItem(writing.storageKey) || '' } catch { return '' } }
function saveWriting(v){ try { localStorage.setItem(writing.storageKey, v.slice(0, MAX_WRITING)); return true } catch { return false } }
$('#writing-field').value = loadWriting();
$('#writing-field').addEventListener('input', () => updateCount($('#writing-field'), $('#writing-count')));
function refreshTraces(){
  const traces = tracesFrom(historias.results);
  const list = $('#writing-trace-list');
  list.replaceChildren(...traces.map(trace => {
    const li = document.createElement('li');
    const text = document.createElement('span'); text.textContent = trace.text;
    const b = document.createElement('button'); b.textContent = 'Añadir';
    b.onclick = () => {
      const field = $('#writing-field');
      const next = field.value ? `${field.value}\n${trace.text}` : trace.text;
      field.value = next.slice(0, MAX_WRITING); updateCount(field, $('#writing-count'));
    };
    li.append(text, b); return li;
  }));
  $('#writing-traces').hidden = traces.length === 0;
  // El cuaderno, leído al final, se vuelve el pergamino que ya estaba escrito: recoge lo que el
  // visitante dejó, sin volcar sus frases crudas y sin citar la novela.
  $('#writing-pergamino').replaceChildren(crearPergamino(traces, {
    fecha: new Date(), titulo: 'El pergamino del paseo',
  }));
}
$('#writing-save').onclick = () => {
  const value = $('#writing-field').value.slice(0, MAX_WRITING);
  const saved = saveWriting(value);
  if (saved && director.active?.id === 'cuaderno-mirador') director.resolve('guardado', value);
  $('#writing-status').textContent = saved ? 'Guardado.' : 'No se pudo guardar en este dispositivo.';
  updateCount($('#writing-field'), $('#writing-count'));
};
$('#writing-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#writing-field').value); $('#writing-status').textContent = 'Copiado.'; }
  catch { $('#writing-status').textContent = 'No se pudo copiar.'; }
};
$('#writing-download').onclick = () => {
  const blob = new Blob([$('#writing-field').value], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'macondo-tres-frases.txt'; a.click();
  URL.revokeObjectURL(a.href);
};
$('#open-cuaderno').onclick = () => director.open('cuaderno-mirador');
$('#writing').addEventListener('close', () => { if (director.active?.id === 'cuaderno-mirador') director.close(); releasePanel(); });

// ---------- Táctil: joystick (lo dibuja el CSS) y mirar a la derecha ----------
function setupLookTouch(){
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  // joystick: punteros sobre su base
  const j = $('#joystick'), knob = $('#joy-knob');
  let joyId = null;
  j.addEventListener('pointerdown', e => {
    if (joyId !== null) return;
    joyId = e.pointerId; j.setPointerCapture(joyId); input.joyStart(joyId);
  });
  j.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    const r = j.getBoundingClientRect();
    const dx = Math.max(-40, Math.min(40, e.clientX - (r.left + r.width/2)));
    const dy = Math.max(-40, Math.min(40, e.clientY - (r.top + r.height/2)));
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    input.joyMove(joyId, dx / 40, dy / 40);
  });
  const joyEnd = e => { if (e.pointerId === joyId) { joyId = null; knob.style.transform = ''; input.joyEnd(e.pointerId); } };
  j.addEventListener('pointerup', joyEnd); j.addEventListener('pointercancel', joyEnd); j.addEventListener('lostpointercapture', joyEnd);
  addEventListener('blur', () => { joyId = null; knob.style.transform = ''; });
}

addEventListener('blur', () => { if (locomocion.estado.modo === 'paseo') { stopTour(); player?.stop(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && locomocion.estado.modo === 'paseo') { stopTour(); player?.stop(); } });
const onboarding = new Onboarding(document.querySelector('#onboarding'));
$('#restart-tutorial').onclick = () => { $('#help').close(); onboarding.start(true); };
$('#quality-mode').onchange = e => experience?.setQuality(e.target.value);
$('#open-discoveries').onclick = () => { blockPanel(); renderDiscoveries(); $('#discoveries').showModal(); };
$('#discovery-write').onclick = () => { $('#discoveries').close(); director.open('cuaderno-mirador'); };
$('#recenter').onclick = () => player?.recenter();
addEventListener('keydown', e => {
  if (locomocion.estado.modo !== 'paseo' || e.repeat || e.target?.closest?.('input,textarea,select,[contenteditable=true]')) return;
  if (e.code === 'KeyR') player?.recenter();
  if (e.code === 'KeyM') $('#open-map').click();
  if (e.code === 'Escape') { stopTour(); player?.stop(); input?.clear(); }
});

// ---------- Eventos de UI ----------
$('#enter').onclick = () => enterWalk(false);
$('#skip-flight').onclick = () => { flying = false; endTransition(); };
$('#exit-walk').onclick = () => { stopTour(); if ($('#reading').open) closeReading(); showCover(); $('#enter').focus(); };
$('#to-plaza').onclick = () => { stopTour(); player.enabled = true; startTour('plaza'); };
$('#toggle-tour').onclick = () => { locomocion.estado.recorrido ? stopTour() : (player.enabled = true, startTour(TOUR_ORDER.find(id => !state.discovered.has(id)) || TOUR_ORDER[0])); };
$('#tour-stop').onclick = () => { stopTour(); player.enabled = true; };
$('#interact-btn').onclick = () => interactWithCurrent();
// El cajón de lo ocasional. El rótulo dice lo que hace —abrir o cerrar— y el estado va en
// aria-expanded, así que nombre y estado nunca se contradicen.
$('#hud-mas').onclick = () => {
  const abrir = $('#hud-extra').hidden;
  $('#hud-extra').hidden = !abrir;
  $('#hud-mas').setAttribute('aria-expanded', String(abrir));
  $('#hud-mas').textContent = abrir ? 'Menos opciones' : 'Más opciones';
};
$('#help-btn').onclick = () => { blockPanel(); $('#help').showModal(); };
$('#no3d').onclick = () => { $('#help').close(); showFallback(new Error('modo sin 3D solicitado')); };
$('#reset-progress').onclick = () => {
  if (!confirm('¿Borrar tus visitas, respuestas y escritura de este recorrido?')) return;
  try { localStorage.removeItem(PROGRESS_KEY); localStorage.removeItem(writing.storageKey); localStorage.removeItem(HISTORIAS_KEY); localStorage.removeItem(DISCOVERIES_KEY); } catch {}
  state.discovered.clear(); state.answered.clear();
  found.clear(); discoveryWorld?.reset(); renderDiscoveries(); updateProgress();
  historias.results = {}; director.restore({}); effects?.dispose();
  $('#writing-field').value = '';
  $('#progress').textContent = '0 / 4 lugares explorados';
  $('#help').close();
};
// El rótulo dice la acción, así que el botón es de acción y no de conmutador: llevaba
// aria-pressed junto al texto, y como el texto se invierte al pulsarlo, el lector anunciaba
// «Activar movimiento, pulsado» justo cuando el pueblo estaba congelado. Sin el atributo el
// nombre queda solo y no miente. Los chips Voz/Sonido/Guiarme sí son conmutadores: su rótulo
// no cambia y el estado va en aria-pressed.
$('#motion').onclick = () => {
  ambientPaused = !ambientPaused;
  $('#motion').textContent = ambientPaused ? 'Activar movimiento' : 'Pausar movimiento';
};
document.querySelectorAll('dialog .close').forEach(b => b.onclick = e => {
  const d = e.target.closest('dialog');
  if (d.id === 'reading') closeReading(); else d.close();
});
for (const id of ['map','help','discoveries','indice','arbol','palabras']) $(`#${id}`).addEventListener('close', releasePanel);
addEventListener('keydown', e => {
  if (e.key === 'Escape' && locomocion.estado.modo === 'paseo' && locomocion.estado.recorrido) stopTour();
});

// ---------- Capa literaria: índice, árbol y palabras ----------
// Se construyen la primera vez que se abren y se cierran como cualquier panel. Ninguno bloquea
// la lectura ni el paseo: son consulta.
function abrirPanel(id, construir){
  blockPanel();
  const cuerpo = $(`#${id}-cuerpo`);
  if (!cuerpo.childElementCount) cuerpo.append(construir());
  $(`#${id}`).showModal();
}
$('#open-indice').onclick = () => abrirPanel('indice', crearIndiceNovela);
$('#open-indice-ayuda').onclick = () => abrirPanel('indice', crearIndiceNovela);
$('#fallback-indice').onclick = () => abrirPanel('indice', crearIndiceNovela);
$('#open-arbol').onclick = () => abrirPanel('arbol', crearArbol);
$('#fallback-arbol').onclick = () => abrirPanel('arbol', crearArbol);
$('#open-palabras').onclick = () => abrirPanel('palabras', crearCuadernoPalabras);
$('#fallback-palabras').onclick = () => abrirPanel('palabras', crearCuadernoPalabras);

// ---------- Alternativa sin 3D ----------
function showFallback(err){
  console.error(err);
  // El fallback también fija su modo: antes se quedaba sin él y la locomoción quedaba a
  // medias (era una de las fugas que señalaba la revisión de arquitectura).
  aplicar(locomocion.ir('portada'));
  narrator.interrupt();
  $('#caption').hidden = true;
  $('#fallback').hidden = false;
  $('#hud').hidden = true;
  document.body.classList.add('exploring');
  $('#fallback-places').replaceChildren(...stations.map(st => {
    const b = document.createElement('button');
    b.textContent = st.title;
    b.onclick = () => openReading(st.id);
    return b;
  }));
  $('#fallback-historias').replaceChildren(...STORIES.map(st => {
    const b = document.createElement('button');
    b.textContent = st.title;
    b.onclick = () => director.open(st.id);
    return b;
  }));
}

renderDiscoveries();
$('#motion').textContent = ambientPaused ? 'Activar movimiento' : 'Pausar movimiento';
showCover(); updateProgress(); refreshTraces(); updateCount($('#writing-field'), $('#writing-count'));
