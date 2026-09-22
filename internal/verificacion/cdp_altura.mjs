// Subir y bajar: teclado (Espacio/Shift), botones del HUD y la altura medida desde el
// terreno. El vuelo deja de ser plano sin perder «ni caídas ni atascos».
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar();

const altura = () => s.js(`(() => { const p = window.__macondo.player;
  return JSON.stringify({ alt:+p.alt.toFixed(2), y:+p.position.y.toFixed(2) }) })()`).then(JSON.parse);

// 1. Espacio sube y la altura se conserva al soltar.
const antes = await altura();
await s.tecla('Space', { mantener: 1500 });
const alto = await altura();
console.log('ESPACIO:', JSON.stringify({ antes, alto }));
s.afirmar(alto.alt > antes.alt + 2, `Espacio no subió: ${antes.alt} → ${alto.alt}`);
s.afirmar(alto.y > antes.y + 2, `la mariposa no ganó altura real: ${antes.y} → ${alto.y}`);
await new Promise(r => setTimeout(r, 600));
const sostenido = await altura();
s.afirmar(Math.abs(sostenido.alt - alto.alt) < .05, `la altura se cayó sola: ${alto.alt} → ${sostenido.alt}`);

// 2. Shift baja hasta el suelo y no lo atraviesa.
await s.tecla('ShiftLeft', { mantener: 4000 });
const bajo = await altura();
console.log('SHIFT:', JSON.stringify(bajo));
s.afirmar(bajo.alt === .9, `el suelo no detuvo el descenso: alt=${bajo.alt}`);
s.afirmar(bajo.y > 0, `la mariposa quedó bajo el suelo: y=${bajo.y}`);

// 3. El techo también detiene. El renderizado sin GPU va a media máquina, así que se
//    comprueba el invariante (nunca por encima) y luego la convergencia, no un cronómetro.
await s.tecla('Space', { mantener: 8000 });
const techo = await altura();
console.log('TECHO:', JSON.stringify(techo));
s.afirmar(techo.alt <= 9, `pasó del techo: alt=${techo.alt}`);
await s.tecla('Space', { mantener: 4000 });
const techoFirme = await altura();
console.log('TECHO-FIRME:', JSON.stringify(techoFirme));
s.afirmar(techoFirme.alt === 9, `el techo no detuvo la subida: alt=${techoFirme.alt}`);

// 4. Los botones del HUD vuelan mientras se mantienen pulsados. Se despacha el puntero a
//    mano para poder sostenerlo: el clic del arnés suelta en el acto.
const pulsar = (sel, mantener) => s.js(`(async () => {
  const b = document.querySelector(${JSON.stringify(sel)});
  const r = b.getBoundingClientRect();
  const opciones = { bubbles:true, pointerId:7, pointerType:'touch', clientX:r.left+r.width/2, clientY:r.top+r.height/2 };
  b.dispatchEvent(new PointerEvent('pointerdown', opciones));
  await new Promise(r => setTimeout(r, ${mantener}));
  b.dispatchEvent(new PointerEvent('pointerup', opciones));
  return true;
})()`);
s.afirmar(await s.puedeClic('#fly-up'), 'el botón Subir no está clicable');
s.afirmar(await s.puedeClic('#fly-down'), 'el botón Bajar no está clicable');
await pulsar('#fly-down', 2500);
const conBoton = await altura();
console.log('BOTON-BAJAR:', JSON.stringify(conBoton));
s.afirmar(conBoton.alt < techoFirme.alt - 2, `el botón ▼ no bajó: ${techoFirme.alt} → ${conBoton.alt}`);
await pulsar('#fly-up', 1200);
const conBotonSube = await altura();
console.log('BOTON-SUBIR:', JSON.stringify(conBotonSube));
s.afirmar(conBotonSube.alt > conBoton.alt + 1, `el botón ▲ no subió: ${conBoton.alt} → ${conBotonSube.alt}`);

// 5. Soltar el botón al salirse del dedo no deja el vuelo pegado: sin pointerup, el
//    `pointercancel` (o el blur) suelta igual.
await s.js(`(() => { const b = document.querySelector('#fly-up');
  const r = b.getBoundingClientRect();
  b.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerId:9, clientX:r.left+4, clientY:r.top+4 }));
  b.dispatchEvent(new PointerEvent('pointercancel', { bubbles:true, pointerId:9 }));
})()`);
await new Promise(r => setTimeout(r, 700));
const suelto = await altura();
await new Promise(r => setTimeout(r, 700));
const quieto = await altura();
console.log('SUELTO:', JSON.stringify({ suelto, quieto }));
s.afirmar(Math.abs(quieto.alt - suelto.alt) < .05, `el botón quedó pegado: ${suelto.alt} → ${quieto.alt}`);

// 6. La altura se mide desde el terreno: sobre la meseta del mirador sube con el suelo.
const meseta = JSON.parse(await s.js(`(async () => {
  const p = window.__macondo.player;
  p.place(17, 20, 0);                         // meseta del mirador (centro 17,23 · radio 7,5 · alto 3)
  p.resetAltitude();
  await new Promise(r => setTimeout(r, 900));
  const suelo = window.__macondo.village.world.groundAt(17, 20);
  return JSON.stringify({ suelo:+suelo.toFixed(2), y:+p.position.y.toFixed(2) });
})()`));
console.log('MESETA:', JSON.stringify(meseta));
s.afirmar(meseta.suelo > 2, `la meseta no está donde se esperaba: ${meseta.suelo}`);
s.afirmar(Math.abs(meseta.y - (meseta.suelo + 2.1)) < .3, `no voló sobre la meseta: y=${meseta.y}`);

// 7. El recorrido guiado devuelve la mariposa a la altura de crucero.
const tour = JSON.parse(await s.js(`(async () => {
  const p = window.__macondo.player;
  p.place(0, -8, 0);
  await new Promise(r => setTimeout(r, 200));
  dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));
  await new Promise(r => setTimeout(r, 1500));
  dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));
  const antes = p.alt;
  document.querySelector('#to-plaza').click();
  await new Promise(r => setTimeout(r, 400));
  return JSON.stringify({ antes:+antes.toFixed(2), despues:+p.alt.toFixed(2) });
})()`));
console.log('TOUR:', JSON.stringify(tour));
s.afirmar(tour.antes > 3, `no llegó a subir antes del recorrido: ${tour.antes}`);
s.afirmar(tour.despues === 2.1, `el recorrido no bajó a crucero: ${tour.despues}`);

// 8. En móvil los botones quedan junto al joystick, sin pisarlo ni pisar el minimapa.
await s.movil();
await s.js(`document.body.classList.add('touch')`);
await new Promise(r => setTimeout(r, 300));
const movil = JSON.parse(await s.js(`(() => {
  const caja = sel => { const el = document.querySelector(sel);
    if (!el || el.hidden || !el.checkVisibility()) return null;
    const r = el.getBoundingClientRect();
    return { l:Math.round(r.left), t:Math.round(r.top), r:Math.round(r.right), b:Math.round(r.bottom) }; };
  return JSON.stringify({ alt: caja('#altitude'), joy: caja('#joystick'), mini: caja('#minimap'),
    banner: caja('#tour-banner'), aviso: caja('#flight-status') });
})()`));
console.log('MOVIL:', JSON.stringify(movil));
s.afirmar(!!movil.alt, 'los botones de altura no se ven en móvil');
// Cualquier choque de verdad: el banner del recorrido empezaba en x=138 y quedaba debajo del ▼.
for (const otro of ['joy','mini','banner','aviso']) {
  const b = movil[otro];
  if (!b) continue;
  s.afirmar(!(movil.alt.l < b.r && b.l < movil.alt.r && movil.alt.t < b.b && b.t < movil.alt.b),
    `los botones de altura pisan ${otro}: alt=${JSON.stringify(movil.alt)} ${otro}=${JSON.stringify(b)}`);
}
await s.captura('altura_movil');
await s.escritorio();
await s.js(`document.body.classList.remove('touch')`);

await s.captura('altura_escritorio');
await s.cerrar();
