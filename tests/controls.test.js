import test from 'node:test';
import assert from 'node:assert/strict';
import { InputController } from '../src/navigation/InputController.js';
import {
  PlayerController, HOVER, ALT_MIN, ALT_MAX, CAM_R, CAM_MIN,
  empujeVertical, PITCH_REPOSO, PITCH_MIN, PITCH_MAX,
} from '../src/navigation/PlayerController.js';
import { WalkableWorld } from '../src/navigation/WalkableWorld.js';
import { PerspectiveCamera } from 'three';

globalThis.addEventListener = () => {};
globalThis.innerWidth = 1000; globalThis.innerHeight = 800;
globalThis.document = { addEventListener() {}, pointerLockElement: null, exitPointerLock() { this.salidas = (this.salidas || 0) + 1; } };
const target = { closest: () => null };
const dom = () => ({ style:{}, clientWidth:1000, clientHeight:800, addEventListener() {}, capturas:0, requestPointerLock() { this.capturas++; return Promise.resolve(); } });
function input() { const d = dom(); return { i: new InputController(d), d }; }
const event = (x,y) => ({ target, button:0, pointerId:1, clientX:x, clientY:y });
const key = code => ({ code, target, preventDefault() {} });
// Capturar el puntero es un estado del documento: el controlador lo lee al cambiar.
function capturar({ i, d }) { globalThis.document.pointerLockElement = d; i._plc(); }
test('un toque tolera temblor sin girar la cámara', () => {
  const { i } = input(); i._pd(event(100,100)); i._pm(event(103,102)); i._pu(event(103,102));
  const s = i.sample(); assert.ok(s.tap); assert.deepEqual(s.look,{x:0,y:0});
});
test('arrastrar gira una vez y no produce un destino', () => {
  const { i } = input(); i._pd(event(100,100)); i._pm(event(120,110)); i._pu(event(120,110));
  const s = i.sample(); assert.equal(s.tap,null); assert.deepEqual(s.look,{x:20,y:10});
});
test('el clic sobre la escena vuela al punto sin llevarse el cursor', () => {
  const { i, d } = input();
  i._pd(event(300,200)); i._pu(event(300,200));
  assert.deepEqual(i.sample().tap, { x:300, y:200 }, 'el clic dejó de volar al punto');
  // Volar es el gesto principal del paseo: si capturara el puntero, el primer toque de
  // cualquiera dejaría el HUD sin cursor y ningún chip recibiría un clic.
  assert.equal(d.capturas, 0, 'volar capturó el puntero');
});
test('la captura la pide «Vista libre», y desde ahí el movimiento gira', () => {
  const { i, d } = input();
  i.request();
  assert.equal(d.capturas, 1, 'el chip no pidió la captura del puntero');
  capturar({ i, d });
  assert.equal(i.locked, true);
  i._pm({ ...event(300,200), movementX: 40, movementY: -12 });
  assert.deepEqual(i.sample().look, { x:40, y:-12 }, 'con el puntero capturado el movimiento no gira');
});
test('con el puntero capturado el clic vuela al punto de la mira', () => {
  const { i, d } = input();
  capturar({ i, d });
  i._pd(event(10,10));
  assert.deepEqual(i.sample().tap, { x:500, y:400 }, 'el clic no apuntó al centro de la pantalla');
  assert.equal(d.capturas, 0, 'ya estaba capturado: no se vuelve a pedir');
});
test('el clic no captura el puntero sobre el HUD', () => {
  const { i, d } = input();
  const boton = { closest: () => ({}) };
  i._pd({ ...event(300,200), target: boton });
  assert.equal(d.capturas, 0);
  assert.equal(i.sample().tap, null);
});
test('soltar el puntero (Esc) deja de girar con el movimiento', () => {
  const { i, d } = input();
  capturar({ i, d });
  globalThis.document.pointerLockElement = null; i._plc();
  assert.equal(i.locked, false);
  i._pm({ ...event(300,200), movementX: 40, movementY: -12 });
  assert.deepEqual(i.sample().look, { x:0, y:0 });
});
test('el HUD suelta el puntero al abrir un panel', () => {
  const { i, d } = input();
  capturar({ i, d });
  i.release();
  assert.equal(globalThis.document.salidas, 1);
});
test('W y flecha arriba se liberan de forma independiente', () => {
  const { i } = input();
  i._kd(key('KeyW')); i._kd(key('ArrowUp')); i._ku(key('KeyW'));
  assert.equal(i.sample().move.fwd,1); i._ku(key('ArrowUp')); assert.equal(i.sample().move.fwd,0);
});
test('no hay teclas de subir ni de bajar: la altura la manda la mirada', () => {
  const { i } = input();
  for (const code of ['Space', 'ShiftLeft', 'ShiftRight']) {
    i._kd(key(code));
    assert.equal('up' in i.sample().move, false, `${code} sigue moviendo el vuelo en vertical`);
  }
});
test('perder foco cancela también el arrastre pendiente', () => {
  const { i } = input(); i._pd(event(100,100)); i.clear(); i._pm(event(150,100)); i._pu(event(150,100));
  assert.deepEqual(i.sample().look,{x:0,y:0}); assert.equal(i.sample().tap,null);
});
test('el vuelo rechaza obstáculos y frena sin deriva al detenerse', () => {
  const w = new WalkableWorld(); w.addBox(5,5,7,7);
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0);
  assert.equal(p.flyTo(6,6),false); assert.equal(p.flyTo(NaN,2),false);
  p.update(.05,{move:{fwd:1}}); p.stop(); const z=p.position.z;
  p.update(.05); assert.equal(p.position.z,z);
});
test('el vuelo a un punto termina aunque haya una pared intermedia', () => {
  const w = new WalkableWorld(); w.addBox(-5,-3,5,-2);
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0); p.flyTo(0,-5);
  for(let i=0;i<500;i++) p.update(.016);
  assert.equal(p.flyTarget,null); assert.ok(p.position.z > -2);
});
test('la mirada es el mando de altura: arriba sube, abajo baja, el horizonte sostiene', () => {
  assert.equal(empujeVertical(PITCH_REPOSO), 0, 'el horizonte no empuja');
  assert.ok(empujeVertical(PITCH_MIN) > .9, 'mirar arriba no sube con ganas');
  assert.ok(empujeVertical(PITCH_MAX) < -.9, 'mirar abajo no baja con ganas');
  assert.equal(empujeVertical(PITCH_MAX - .05), empujeVertical(PITCH_MAX), 'el empuje se satura');
  const w = new WalkableWorld();
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0);
  for (let i = 0; i < 60; i++) p.update(.05, { move: { up: empujeVertical(PITCH_MIN) } });
  assert.equal(p.alt, ALT_MAX, 'mirando arriba se llega al techo');
  assert.ok(p.position.y > HOVER + 3, 'subió de verdad');
  p.update(.05, { move: { up: empujeVertical(PITCH_REPOSO) } });
  assert.equal(p.alt, ALT_MAX, 'soltar la mirada conserva la altura: no es un salto');
  for (let i = 0; i < 300; i++) p.update(.05, { move: { up: empujeVertical(PITCH_MAX) } });
  assert.equal(p.alt, ALT_MIN, 'mirando abajo se llega al suelo');
  assert.ok(p.position.y > 0, 'nunca bajo del suelo');
});
test('la altura es sobre el terreno: al entrar en la meseta la mariposa sube con ella', () => {
  const w = new WalkableWorld(); w.addPlateau(0,0,5,3);
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,12);   // fuera de la meseta
  for(let i=0;i<10;i++) p.update(.05);
  assert.ok(Math.abs(p.position.y - HOVER) < .05,'a nivel del suelo vuela a la altura de crucero');
  p.moveBy(0,-12);                              // entra en la meseta
  for(let i=0;i<40;i++) p.update(.05);
  assert.ok(Math.abs(p.position.y - (3 + HOVER)) < .05,'la meseta la levantó 3 m');
});
test('la falda de un cerro es suelo: se sube por la ladera y no por un escalón', () => {
  const w = new WalkableWorld(); w.addPlateau(0,0,5,3); w.addFalda(0,0,5,8,3);
  assert.equal(w.groundAt(0,0), 3, 'la meseta sigue a 3 m');
  assert.ok(Math.abs(w.groundAt(0,6.5) - 1.5) < 1e-9, 'la ladera no baja en línea');
  assert.equal(w.groundAt(0,9), 0, 'al pie del cerro el suelo es el suelo');
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,14);
  p.moveBy(0,-8);                                 // trepa por la ladera hasta (0,6)
  for (let i = 0; i < 20; i++) p.update(.05);
  assert.ok(p.position.y > HOVER + 1.5, `la ladera no la levantó: y=${p.position.y.toFixed(2)}`);
  assert.ok(Math.abs(p.position.y - (2 + HOVER)) < .1, 'la altura no sigue al suelo de la ladera');
});
test('la altura del vuelo también decide la colisión: lo bajo se pasa por encima', () => {
  const w = new WalkableWorld();
  w.addCircle(0, 0, .5, 1);                 // una banca
  w.addBox(4, -4, 6, -2, 2.5);              // un seto
  w.addCircle(8, 0, .5);                    // un tronco: alto infinito
  assert.equal(w.blocks(0, 0, .22, 0), true, 'a ras de suelo la banca bloquea');
  assert.equal(w.blocks(0, 0, .22, 2.1), false, 'a 2,1 m la banca se pasa por encima');
  assert.equal(w.blocks(5, -3, .22, 2.1), true, 'el seto de 2,5 m todavía bloquea el vuelo de crucero');
  assert.equal(w.blocks(5, -3, .22, 3), false, 'por encima del seto se pasa');
  assert.equal(w.blocks(8, 0, .22, 8), true, 'el tronco no se pasa ni volando alto');
  assert.equal(w.blocks(0, 0, .22), true, 'sin altura la consulta es a ras de suelo');
});
test('el destino por toque se acepta si la llegada pasa por encima del obstáculo', () => {
  const w = new WalkableWorld(); w.addCircle(0, -5, .6, 1);       // una banca baja
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0);
  assert.equal(p.flyTo(0, -5), true, 'la llegada a 2,1 m pasa por encima de la banca');
  p.stop();
  p.alt = .5;                                                     // volando a ras, la banca está en medio
  assert.equal(p.flyTo(0, -5), false, 'a ras de suelo el mismo punto está ocupado');
});
test('la mirada no cancela el destino por toque; el vuelo horizontal sí', () => {
  const w = new WalkableWorld();
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0); p.flyTo(0,-10);
  p.update(.05,{move:{up:1}});
  assert.ok(p.flyTarget, 'la mirada no debe cancelar el destino');
  p.update(.05,{move:{fwd:1}});
  assert.equal(p.flyTarget,null,'el mando horizontal sí manda');
});
test('la cámara no se mete en el pueblo: se arrima cuando un muro la estorba', () => {
  const w = new WalkableWorld();
  const cam = new PerspectiveCamera();
  const p = new PlayerController(cam, w); p.place(0, 0);           // rumbo 0: la cámara va a +z
  const distancia = () => Math.hypot(cam.position.x - p.position.x, cam.position.z - p.position.z);
  for (let i = 0; i < 10; i++) p.update(.05);
  assert.ok(Math.abs(distancia() - CAM_R * Math.cos(PITCH_REPOSO)) < .1, 'sin obstáculos el brazo va entero');
  w.addBox(-4, 1.5, 4, 2.5, 6);                                    // un muro de casa, entre ella y la cámara
  for (let i = 0; i < 10; i++) p.update(.05);
  assert.ok(distancia() < 1.2, `la cámara atravesó el muro: ${distancia()}`);
  assert.ok(distancia() >= CAM_MIN * Math.cos(PITCH_REPOSO) - .01, 'el arrimón se pasó de cerca');
  w.boxes.length = 0;                                              // muro retirado: el brazo vuelve
  for (let i = 0; i < 60; i++) p.update(.05);
  assert.ok(distancia() > 4, `la cámara no volvió a su sitio: ${distancia()}`);
});
test('la cámara pasa por encima de lo bajo, como la mariposa', () => {
  const w = new WalkableWorld();
  const cam = new PerspectiveCamera();
  w.addBox(-4, 1.5, 4, 2.5, 1.2);                                  // una reja de 1,2 m
  const p = new PlayerController(cam, w); p.place(0, 0);
  for (let i = 0; i < 10; i++) p.update(.05);
  assert.ok(cam.position.y > 1.2, 'la cámara quedó por debajo del remate de la reja');
  assert.ok(Math.abs(Math.hypot(cam.position.x - p.position.x, cam.position.z - p.position.z) - CAM_R * Math.cos(PITCH_REPOSO)) < .1,
    'la caja baja recortó el brazo sin motivo');
});
test('el recorrido devuelve altura y mirada a crucero', () => {
  const w = new WalkableWorld();
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0);
  for(let i=0;i<60;i++) p.update(.05,{move:{up:1}});
  assert.equal(p.alt,ALT_MAX);
  p.orbitPitch = PITCH_MAX;
  p.resetAltitude(); p.recenter();
  assert.equal(p.alt,HOVER);
  assert.equal(p.orbitPitch,PITCH_REPOSO,'la mirada seguiría empujando el vuelo');
});
