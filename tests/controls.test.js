import test from 'node:test';
import assert from 'node:assert/strict';
import { InputController } from '../src/navigation/InputController.js';
import { PlayerController, HOVER, ALT_MIN, ALT_MAX } from '../src/navigation/PlayerController.js';
import { WalkableWorld } from '../src/navigation/WalkableWorld.js';
import { PerspectiveCamera } from 'three';

globalThis.addEventListener = () => {};
globalThis.document = { addEventListener() {} };
const target = { closest: () => null };
function input() { return new InputController({ style:{}, addEventListener() {} }); }
const event = (x,y) => ({ target, button:0, pointerId:1, clientX:x, clientY:y });
test('un toque tolera temblor sin girar la cámara', () => {
  const i = input(); i._pd(event(100,100)); i._pm(event(103,102)); i._pu(event(103,102));
  const s = i.sample(); assert.ok(s.tap); assert.deepEqual(s.look,{x:0,y:0});
});
test('arrastrar gira una vez y no produce un destino', () => {
  const i = input(); i._pd(event(100,100)); i._pm(event(120,110)); i._pu(event(120,110));
  const s = i.sample(); assert.equal(s.tap,null); assert.deepEqual(s.look,{x:20,y:10});
});
test('W y flecha arriba se liberan de forma independiente', () => {
  const i = input(); const key = code => ({ code,target,preventDefault() {} });
  i._kd(key('KeyW')); i._kd(key('ArrowUp')); i._ku(key('KeyW'));
  assert.equal(i.sample().move.fwd,1); i._ku(key('ArrowUp')); assert.equal(i.sample().move.fwd,0);
});
test('perder foco cancela también el arrastre pendiente', () => {
  const i = input(); i._pd(event(100,100)); i.clear(); i._pm(event(150,100)); i._pu(event(150,100));
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
test('Espacio sube, Shift baja y el vuelo responde a la vez', () => {
  const i = input(); const key = code => ({ code,target,preventDefault() {} });
  i._kd(key('Space')); assert.equal(i.sample().move.up,1);
  i._ku(key('Space')); i._kd(key('ShiftLeft')); assert.equal(i.sample().move.up,-1);
  i._ku(key('ShiftLeft')); assert.equal(i.sample().move.up,0);
  i._kd(key('KeyW')); i._kd(key('Space'));
  const s = i.sample(); assert.equal(s.move.fwd,1); assert.equal(s.move.up,1);
});
test('el espacio no le roba el clic a un botón con foco', () => {
  const i = input(); const boton = { closest: sel => sel === 'button,a' ? {} : null };
  i._kd({ code:'Space', target:boton, preventDefault() { throw new Error('no debía interceptarlo'); } });
  assert.equal(i.sample().move.up,0);
});
test('los botones del HUD suben y bajan y se sueltan al perder foco', () => {
  const i = input();
  i.liftPress(1); assert.equal(i.sample().move.up,1);
  i.liftPress(-1); assert.equal(i.sample().move.up,-1);
  i.liftRelease(); assert.equal(i.sample().move.up,0);
  i.liftPress(1); i.clear(); assert.equal(i.sample().move.up,0);
});
test('la mariposa sube, se queda arriba y no atraviesa suelo ni techo', () => {
  const w = new WalkableWorld();
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0);
  assert.equal(p.alt,HOVER);
  for(let i=0;i<60;i++) p.update(.05,{move:{up:1}});
  assert.equal(p.alt,ALT_MAX);                  // el techo la detiene
  assert.ok(p.position.y > HOVER + 3,'subió de verdad');
  p.update(.05); assert.equal(p.alt,ALT_MAX);   // soltar conserva la altura: no es un salto
  p.update(.05,{move:{up:1}}); assert.equal(p.alt,ALT_MAX);   // ni se pasa del techo
  for(let i=0;i<300;i++) p.update(.05,{move:{up:-1}});
  assert.equal(p.alt,ALT_MIN);                  // y el suelo también
  assert.ok(p.position.y > 0,'nunca bajo del suelo');
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
test('subir cancela el destino por toque y el recorrido recupera la altura de crucero', () => {
  const w = new WalkableWorld();
  const p = new PlayerController(new PerspectiveCamera(),w); p.place(0,0); p.flyTo(0,-10);
  p.update(.05,{move:{up:1}});
  assert.equal(p.flyTarget,null,'el mando vertical también manda');
  for(let i=0;i<60;i++) p.update(.05,{move:{up:1}});
  assert.equal(p.alt,ALT_MAX);
  p.resetAltitude(); assert.equal(p.alt,HOVER);
});
