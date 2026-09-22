// Sonda temporal: por qué el clic no alcanza #tour-skip-audio.
import { abrir } from './arnes.mjs';
const s = await abrir({ autoplay: true });
await s.entrar({ voz: 'si' });
console.log(await s.js(`(() => { const b = document.querySelector('#tour-skip-audio');
  const r = b.getBoundingClientRect();
  const enc = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
  const cs = getComputedStyle(b);
  const padre = getComputedStyle(b.parentElement);
  return JSON.stringify({
    rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    oculto: b.hidden, visibilidad: cs.visibility, display: cs.display, punteros: cs.pointerEvents,
    padre: b.parentElement.id, punterosPadre: padre.pointerEvents, overflowPadre: padre.overflow,
    encima: enc ? (enc.id || enc.tagName) : 'nada',
    ventana: { w: innerWidth, h: innerHeight },
  }); })()`));
await s.cerrar();
