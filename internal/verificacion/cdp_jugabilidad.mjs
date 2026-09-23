import { abrir } from './arnes.mjs';
const s = await abrir({ out:'/tmp/macondo-jugabilidad' });
await s.entrar();
s.afirmar(await s.js(`!document.querySelector('#onboarding').hidden`),'tutorial visible al empezar');
await s.tecla('KeyW',{mantener:350});
s.afirmar(await s.js(`document.querySelector('#onboarding small').textContent.includes('2 / 3')`),'moverse avanza el tutorial');
await s.js(`(() => { const c=document.querySelector('canvas'); c.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,clientX:700,clientY:400,button:0,bubbles:true})); dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:750,clientY:410,bubbles:true})); dispatchEvent(new PointerEvent('pointerup',{pointerId:1,clientX:750,clientY:410,bubbles:true})); })()`);
await s.esperar(`document.querySelector('#onboarding small').textContent.includes('3 / 3')`);
s.afirmar(await s.js(`document.querySelector('#onboarding small').textContent.includes('3 / 3')`),'mirar avanza el tutorial');
await s.clic('#onboarding button');
s.afirmar(await s.js(`localStorage.getItem('macondo-tutorial-v1') === 'done'`),'omisión persistida');
// Ayuda vive en el cajón «Más opciones» desde el reacomodo del HUD: sin abrirlo mide 0 × 0.
await s.abrirCajon();
await s.clic('#help-btn'); await s.clic('#restart-tutorial');
s.afirmar(await s.js(`!document.querySelector('#onboarding').hidden`),'tutorial repetible');
await s.movil();
s.afirmar(await s.puedeClic('#onboarding button'),'tutorial accionable en móvil');
s.afirmar(await s.puedeClic('#hud-mas'),'el cajón de opciones es accionable en móvil');
await s.abrirCajon();                          // «Centrar cámara» también vive en el cajón
s.afirmar(await s.puedeClic('#recenter'),'centrar cámara accionable en móvil');
s.afirmar(await s.js(`document.documentElement.scrollWidth <= innerWidth`),'sin desborde horizontal');
await s.captura('tutorial-movil');
await s.escritorio(); await s.captura('tutorial-escritorio');
await s.cerrar();
