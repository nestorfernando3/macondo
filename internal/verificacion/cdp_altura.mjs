// El vuelo: puntero capturado a voluntad, altura con la mirada y paso por encima de lo bajo.
//
// Sustituye al guion de Espacio/Shift y botones ▲▼ (que ya no existen). Comprueba:
//   1. no quedan botones de altura y la mira no se ve sin capturar;
//   2. el clic vuela al punto sin llevarse el cursor, y «Vista libre» es quien captura el
//      puntero (mira, aviso y aria-pressed incluidos);
//   3. girar con el puntero capturado mueve la cámara y el horizonte sostiene la altura;
//   4. la mirada sube y baja el vuelo, con topes de suelo y techo;
//   5. la meseta del mirador se alcanza volando (era el bloqueo invisible);
//   6. los invariantes del pueblo —incluido el vuelo libre— siguen en pie;
//   7. en móvil no hay controles de altura y el joystick y el minimapa quedan enteros.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

const altura = () => s.js(`(() => { const p = window.__macondo.player;
  return JSON.stringify({ alt:+p.alt.toFixed(2), y:+p.position.y.toFixed(2), pitch:+p.orbitPitch.toFixed(2), yaw:+p.orbitYaw.toFixed(3) }) })()`).then(JSON.parse);
// El mando de altura lo escribe main.js cada frame a partir de la inclinación de la cámara:
// para probarlo sin ratón se fija la inclinación y se deja correr la escena.
const inclinar = (pitch, ms = 1200) => s.js(`(async () => {
  window.__macondo.player.orbitPitch = ${pitch};
  await new Promise(r => setTimeout(r, ${ms}));
  return true;
})()`);

// 1. Ya no hay botones de subir y bajar, y sin captura no hay mira a la vista.
const hud = JSON.parse(await s.js(`(() => {
  const visible = sel => { const el = document.querySelector(sel);
    return !!el && !el.hidden && el.checkVisibility() };
  return JSON.stringify({ botones: document.querySelectorAll('#altitude,#fly-up,#fly-down').length,
    mira: visible('#crosshair'), aviso: visible('#lock-hint'),
    chip: !!document.querySelector('#free-look'),
    pulsado: document.querySelector('#free-look')?.getAttribute('aria-pressed') });
})()`));
console.log('HUD:', JSON.stringify(hud));
s.afirmar(hud.botones === 0, 'quedan botones de altura en el HUD');
s.afirmar(hud.chip, 'no existe el chip «Vista libre»');
s.afirmar(hud.pulsado === 'false', `«Vista libre» arranca pulsado: ${hud.pulsado}`);
s.afirmar(!hud.mira, 'la mira se ve sin el puntero capturado');

// 2. Volar y capturar son gestos distintos: el clic sobre la escena vuela al punto sin
//    llevarse el cursor (con la captura, el primer clic de cualquiera dejaba el HUD sin
//    cursor), y la captura la pide el chip «Vista libre». Se usan clics reales del arnés: el
//    navegador sólo concede la captura con un gesto de verdad.
await s.js(`window.__macondo.player.place(0, 12, 0)`);
await new Promise(r => setTimeout(r, 300));
s.afirmar(!(await s.js(`!!document.pointerLockElement`)), 'el puntero ya venía capturado');
await s.clic('#scene canvas');
await new Promise(r => setTimeout(r, 500));
const clic = JSON.parse(await s.js(`JSON.stringify({
  capturado: !!document.pointerLockElement,
  destino: !!window.__macondo.player.flyTarget,
  status: document.querySelector('#flight-status').textContent.slice(0, 24),
  mira: document.querySelector('#crosshair').checkVisibility(),
})`));
console.log('CLIC:', JSON.stringify(clic));
s.afirmar(!clic.capturado, 'el clic se llevó el cursor: el HUD quedaría sin poder pulsarse');
s.afirmar(clic.destino || clic.status.startsWith('Volando'), 'el clic dejó de volar al punto');
s.afirmar(!clic.mira, 'la mira aparece sin el puntero capturado');

await s.clic('#free-look');            // el arnés abre el cajón «Más opciones» si hace falta
await new Promise(r => setTimeout(r, 500));
const captura = JSON.parse(await s.js(`JSON.stringify({
  capturado: !!document.pointerLockElement,
  pulsado: document.querySelector('#free-look').getAttribute('aria-pressed'),
  mira: (() => { const el = document.querySelector('#crosshair'); const r = el.getBoundingClientRect();
    return { visible: el.checkVisibility(), x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2),
      aviso: document.querySelector('#lock-hint').checkVisibility(), cx: innerWidth/2, cy: innerHeight/2 }; })(),
})`));
console.log('VISTA-LIBRE:', JSON.stringify(captura));
s.afirmar(captura.capturado, 'el chip «Vista libre» no capturó el puntero');
s.afirmar(captura.pulsado === 'true', `el chip no se marcó como pulsado: ${captura.pulsado}`);
s.afirmar(captura.mira.visible, 'la mira no aparece con el puntero capturado');
s.afirmar(captura.mira.aviso, 'el aviso de cómo soltar el puntero no aparece');
s.afirmar(Math.abs(captura.mira.x - captura.mira.cx) < 3 && Math.abs(captura.mira.y - captura.mira.cy) < 3,
  `la mira no está en el centro: ${captura.mira.x},${captura.mira.y}`);

// 3. Con el puntero capturado, girar es mover el ratón (sin arrastrar): el rumbo cambia. Los
//    `pointermove` van a mano porque los del ratón inyectados por CDP no traen movementX.
const giro = JSON.parse(await s.js(`(async () => {
  const p = window.__macondo.player;
  const antes = { yaw: p.orbitYaw, pitch: p.orbitPitch };
  for (let i = 0; i < 12; i++) {
    dispatchEvent(new PointerEvent('pointermove', { movementX: 30, movementY: 4 }));
    await new Promise(r => setTimeout(r, 30));
  }
  return JSON.stringify({ antes, yaw: p.orbitYaw, pitch: p.orbitPitch });
})()`));
console.log('GIRO:', JSON.stringify(giro));
s.afirmar(Math.abs(giro.yaw - giro.antes.yaw) > .2, `el movimiento del ratón no giró la cámara: ${giro.yaw}`);
s.afirmar(giro.pitch > giro.antes.pitch, 'la inclinación no acompañó al movimiento vertical');

// 4. La altura la manda la mirada: arriba sube, el horizonte sostiene, abajo baja.
await inclinar(0, 600);
const quieto = await altura();
await inclinar(-.35, 2500);
const arriba = await altura();
console.log('MIRADA-ARRIBA:', JSON.stringify({ quieto, arriba }));
s.afirmar(arriba.alt > quieto.alt + 2, `mirar arriba no subió: ${quieto.alt} → ${arriba.alt}`);
s.afirmar(arriba.y > quieto.y + 2, `la mariposa no ganó altura real: ${quieto.y} → ${arriba.y}`);
// El horizonte sostiene: se deja asentar un frame (el salto de la última inclinación tarda uno
// en leerse) y se exige que entre dos lecturas separadas ya no suba.
await inclinar(.34, 700);
const sostenido = await altura();
await new Promise(r => setTimeout(r, 900));
const sostenido2 = await altura();
console.log('HORIZONTE:', JSON.stringify({ sostenido, sostenido2 }));
s.afirmar(Math.abs(sostenido2.alt - sostenido.alt) < .2,
  `el horizonte no sostuvo la altura: ${sostenido.alt} → ${sostenido2.alt} (pitch ${sostenido2.pitch})`);
await inclinar(1.25, 5000);
const abajo = await altura();
console.log('MIRADA-ABAJO:', JSON.stringify(abajo));
s.afirmar(abajo.alt === .9, `mirar abajo no llegó al suelo: alt=${abajo.alt}`);
s.afirmar(abajo.y > 0, `la mariposa quedó bajo el suelo: y=${abajo.y}`);
await inclinar(1.25, 3000);
const sueloFirme = await altura();
s.afirmar(sueloFirme.alt === .9, `el suelo no detuvo el descenso: alt=${sueloFirme.alt}`);
await inclinar(-.35, 9000);                      // el techo también detiene
const techo = await altura();
console.log('TECHO:', JSON.stringify(techo));
s.afirmar(techo.alt <= 9, `pasó del techo: alt=${techo.alt}`);
await inclinar(-.35, 4000);
const techoFirme = await altura();
s.afirmar(techoFirme.alt === 9, `el techo no detuvo la subida: alt=${techoFirme.alt}`);

// 5. El bloqueo invisible del mirador: se vuela desde la calle y se llega a la meseta. Antes
//    el vuelo se detenía a nueve metros, contra un anillo de colisión que bloqueaba a
//    cualquier altura.
await s.js(`document.exitPointerLock && document.exitPointerLock()`);
const mirador = JSON.parse(await s.js(`(async () => {
  const m = window.__macondo;
  m.player.place(2.6, 9, 0);
  m.player.orbitPitch = .34;
  await new Promise(r => setTimeout(r, 300));
  const acepto = m.player.flyTo(17, 22);
  for (let i = 0; i < 1200 && m.player.flyTarget; i++) await new Promise(r => requestAnimationFrame(r));
  const p = m.player.position;
  return JSON.stringify({ acepto, x:+p.x.toFixed(2), z:+p.z.toFixed(2), y:+p.y.toFixed(2),
    suelo: m.village.world.groundAt(p.x, p.z),
    dist:+Math.hypot(17 - p.x, 22 - p.z).toFixed(2) });
})()`));
console.log('MIRADOR:', JSON.stringify(mirador));
s.afirmar(mirador.acepto, 'el destino del mirador se rechazó');
s.afirmar(mirador.dist < 1.5, `el vuelo no llegó al mirador: se quedó a ${mirador.dist} m`);
s.afirmar(mirador.suelo > 2.9, `no quedó sobre la meseta: suelo=${mirador.suelo}`);
s.afirmar(Math.abs(mirador.y - (mirador.suelo + 2.1)) < .4, `no vuela a crucero sobre la meseta: y=${mirador.y}`);

// 6. Pasar por encima de lo bajo: la baranda del mirador (un metro sobre la meseta) y las
//    piedras de la falda se cruzan volando; un muro sigue bloqueando.
const alturas = JSON.parse(await s.js(`(() => {
  const w = window.__macondo.village.world;
  const m = window.__macondo;
  return JSON.stringify({
    barandaCruce: w.blocks(14.2, 16.5, .22, 3 + 2.1),
    barandaBaja: w.blocks(14.2, 16.5, .22, 3 + .5),
    muroCruce: w.blocks(2.5, -11, .22, 2.1),        // dentro de la fachada este de la casa
    faldas: w.faldas.length,
    ladera: +w.groundAt(17, 15.5).toFixed(2),
  });
})()`));
console.log('ALTURAS:', JSON.stringify(alturas));
s.afirmar(!alturas.barandaCruce, 'la baranda bloquea el vuelo de crucero');
s.afirmar(alturas.barandaBaja, 'la baranda dejó de bloquear a ras de la meseta');
s.afirmar(alturas.muroCruce, 'la casa dejó de bloquear el vuelo');
s.afirmar(alturas.faldas === 1, 'la falda del cerro no está registrada');
s.afirmar(alturas.ladera > .5 && alturas.ladera < 3, `la ladera no baja en pendiente: ${alturas.ladera}`);

// 7. Los invariantes del pueblo, con el vuelo libre entre ellos.
const inv = JSON.parse(await s.js(`JSON.stringify(window.__macondo.village.invariantes)`));
console.log('INVARIANTES:', JSON.stringify(inv.revisados));
s.afirmar(inv.problemas.length === 0, `el pueblo no cumple sus invariantes: ${JSON.stringify(inv.problemas)}`);
s.afirmar(inv.revisados.lugaresVolables === 6, 'el vuelo libre no revisó los seis lugares');

// 8. Móvil: sin botones de altura; joystick y minimapa, enteros y sin pisarse.
await s.movil();
await s.js(`document.body.classList.add('touch')`);
await new Promise(r => setTimeout(r, 300));
const movil = JSON.parse(await s.js(`(() => {
  const caja = sel => { const el = document.querySelector(sel);
    if (!el || el.hidden || !el.checkVisibility()) return null;
    const r = el.getBoundingClientRect();
    return { l:Math.round(r.left), t:Math.round(r.top), r:Math.round(r.right), b:Math.round(r.bottom) }; };
  return JSON.stringify({ botones: document.querySelectorAll('#altitude,#fly-up,#fly-down').length,
    joy: caja('#joystick'), mini: caja('#minimap'), banner: caja('#tour-banner'), aviso: caja('#flight-status') });
})()`));
console.log('MOVIL:', JSON.stringify(movil));
s.afirmar(movil.botones === 0, 'en móvil quedan botones de altura');
s.afirmar(!!movil.joy && !!movil.mini, 'el joystick o el minimapa desaparecieron en móvil');
for (const otro of ['banner', 'aviso']) {
  const b = movil[otro];
  if (!b) continue;
  s.afirmar(!(movil.mini.l < b.r && b.l < movil.mini.r && movil.mini.t < b.b && b.t < movil.mini.b),
    `el minimapa pisa ${otro}: mini=${JSON.stringify(movil.mini)} ${otro}=${JSON.stringify(b)}`);
}
await s.captura('vuelo_movil');
await s.escritorio();
await s.js(`document.body.classList.remove('touch')`);

await s.js(`window.__macondo.player.place(17, 24, 0)`);
await s.esperar(`Math.abs(window.__macondo.player.position.z - 24) < .5`, { tope: 4000 });
await s.captura('vuelo_mirador');
await s.cerrar();
