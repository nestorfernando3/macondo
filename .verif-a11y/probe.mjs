// Verificación de la pasada a11y: mide cada estado que se arregló y barre el resto del
// contrato (nombres, hitos, orden de tabulación, trampa y devolución de foco, zoom).
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_ = process.argv[2] || 'http://127.0.0.1:5180/';
const OUT = process.argv[3] || '/tmp/macondo-a11y';
const dormir = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const perfil = join(OUT, `perfil-${process.pid}`);
rmSync(perfil, { recursive: true, force: true });
const chrome = spawn(CHROME, ['--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${perfil}`,
  '--window-size=1440,900', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore', detached: true });
const matar = () => {
  try { process.kill(-chrome.pid, 'SIGKILL'); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { execFileSync('pkill', ['-9', '-f', perfil], { stdio: 'ignore' }); } catch {}
};
const ap = join(perfil, 'DevToolsActivePort');
let puerto = null;
for (let i = 0; i < 80 && !puerto; i++) { await dormir(250); if (existsSync(ap)) puerto = Number(readFileSync(ap, 'utf8').split('\n')[0]) || null; }
let target = null;
for (let i = 0; i < 60 && !target; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json(); target = l.find(t => t.type === 'page' && !t.url.startsWith('devtools://')); } catch {}
  if (!target) await dormir(250);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map(); const consola = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') consola.push('[EXC] ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
    consola.push(`[${m.params.type}] ` + m.params.args.map(a => a.value ?? a.description).join(' '));
};
const enviar = (method, params = {}) => new Promise(res => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const js = async e => (await enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const captura = async n => { const s = await enviar('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(s.result.data, 'base64')); };
async function esperar(expr, tope = 25000) { const t0 = Date.now(); for (;;) { if (await js(expr)) return Date.now() - t0; if (Date.now() - t0 > tope) return -1; await dormir(150); } }
async function tecla(key, code, vk, mods = 0) {
  const b = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods };
  await enviar('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...b });
  if (key === 'Enter' || key === ' ') await enviar('Input.dispatchKeyEvent', { type: 'char', ...b, text: key === 'Enter' ? '\r' : ' ' });
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', ...b });
  await dormir(140);
}
const tab = (shift = false) => tecla('Tab', 'Tab', 9, shift ? 8 : 0);
async function clic(sel) {
  const caja = JSON.parse(await js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if(!el) return 'null';
    const r = el.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2}) })()`) || 'null');
  if (!caja) return false;
  await enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: caja.x, y: caja.y, buttons: 0 });
  await enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: caja.x, y: caja.y, button: 'left', buttons: 1, clickCount: 1 });
  await enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: caja.x, y: caja.y, button: 'left', buttons: 0, clickCount: 1 });
  await dormir(320); return true;
}
const log = (k, v) => console.log('##' + k + '## ' + JSON.stringify(v));
const entrar = async () => {
  await js(`try{ localStorage.setItem('macondo.voz.v1','no'); localStorage.setItem('macondo-tutorial-v1','done') }catch{}`);
  await enviar('Page.reload', {}); await esperar(`!!document.querySelector('#enter')`); await dormir(1500);
  await clic('#enter');
  await esperar(`!document.querySelector('#skip-flight').hidden`, 4000);
  await clic('#skip-flight');
  await esperar(`!!window.__macondo`, 30000);
  await dormir(1200);
};

await enviar('Page.enable'); await enviar('Runtime.enable'); await enviar('Accessibility.enable'); await enviar('Page.bringToFront');
await enviar('Page.navigate', { url: URL_ });
await esperar(`!!document.querySelector('#enter')`);

// ---------- 1. Movimiento reducido: la portada debe retirarse -------------------
await enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await enviar('Page.reload', {});
await esperar(`!!document.querySelector('#enter')`);
await dormir(1500);
await clic('#enter');
await dormir(4500);
log('ARREGLO_1_movimiento_reducido', JSON.parse(await js(`(() => {
  const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)] };
  const cta = document.querySelector('#enter').getBoundingClientRect();
  const enc = document.elementFromPoint(cta.left + cta.width/2, cta.top + cta.height/2);
  const g = window.__macondo;
  return JSON.stringify({
    explora: document.body.classList.contains('exploring'),
    modo: g ? g.locomocion.estado.modo : null,
    introDisplay: getComputedStyle(document.querySelector('.intro')).display,
    mainDisplay: getComputedStyle(document.querySelector('main')).display,
    introCaja: q('.intro'), ctaVisible: cta.width > 0 && getComputedStyle(document.querySelector('#enter')).display !== 'none',
    elementoEnElCTA: enc ? (enc.id || enc.tagName) : null,
    vineta: getComputedStyle(document.querySelector('#vignette')).opacity,
    hudCaja: q('#hud'),
  });
})()`)));
await captura('A1-movimiento-reducido');
await enviar('Emulation.setEmulatedMedia', { features: [] });

// ---------- 2. Portada a 320x568 y 200 % de zoom --------------------------------
for (const [w, h, nombre, etiqueta] of [[320, 568, 'A2-portada-320', '320x568'], [720, 450, 'A3-portada-zoom200', 'zoom200']]) {
  await enviar('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
  await enviar('Page.navigate', { url: URL_ });
  await esperar(`!!document.querySelector('#enter')`);
  await dormir(2500);
  log('ARREGLO_2_' + etiqueta, JSON.parse(await js(`(() => {
    const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)] };
    const cta = document.querySelector('#enter').getBoundingClientRect();
    return JSON.stringify({ viewport: [innerWidth, innerHeight], scrollAlto: document.documentElement.scrollHeight,
      h1: q('h1'), lede: q('.lede'), cta: q('#enter'),
      ctaEnteroAVista: cta.top >= 0 && cta.bottom <= innerHeight,
      desbordaX: document.documentElement.scrollWidth > innerWidth });
  })()`)));
  await captura(nombre);
}
await enviar('Emulation.clearDeviceMetricsOverride');
await dormir(400);

// ---------- 3. Paseo: encabezado, hit areas, nombres ---------------------------
await enviar('Page.navigate', { url: URL_ });
await esperar(`!!document.querySelector('#enter')`);
await entrar();
await captura('A4-paseo-1440');

log('ARREGLO_3_contraste_encabezado', JSON.parse(await js(`(() => {
  const { renderer, scene, camera } = window.__macondo.experience;
  const src = renderer.domElement;
  const lienzo = document.createElement('canvas');
  lienzo.width = src.width; lienzo.height = src.height;
  const ctx = lienzo.getContext('2d');
  renderer.render(scene, camera); ctx.drawImage(src, 0, 0);
  const dpr = src.width / innerWidth;
  const px = (x, y) => { const d = ctx.getImageData(Math.round(x*dpr), Math.round(y*dpr), 1, 1).data; return [d[0],d[1],d[2]] };
  const par = c => { const m = c.match(/[0-9.]+/g).map(Number); return { r:m[0], g:m[1], b:m[2], a: m.length>3?m[3]:1 } };
  const out = {};
  for (const sel of ['header .brand','header > span','header button']) {
    const el = document.querySelector(sel); const r = el.getBoundingClientRect();
    const c = getComputedStyle(el); const f = par(c.backgroundColor);
    const d = px(r.left + r.width/2, r.top + r.height/2);
    out[sel] = { texto: c.color, escena: d,
      fondo: { r: f.a>=1?f.r:Math.round(f.r*f.a+d[0]*(1-f.a)), g: f.a>=1?f.g:Math.round(f.g*f.a+d[1]*(1-f.a)), b: f.a>=1?f.b:Math.round(f.b*f.a+d[2]*(1-f.a)) },
      px: +parseFloat(c.fontSize).toFixed(1) };
  }
  return JSON.stringify(out);
})()`)));

log('ARREGLO_4_hit_areas', JSON.parse(await js(`(() => {
  const malos = [];
  for (const el of document.querySelectorAll('#hud button, header button, #interact-btn, #tour-stop, #tour-continue')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 44 || r.height < 44) malos.push({ id: '#' + el.id, w: Math.round(r.width), h: Math.round(r.height) });
  }
  const caja = document.querySelector('#hud-actions');
  return JSON.stringify({ bajo44: malos, hudActions: [Math.round(caja.getBoundingClientRect().height), caja.scrollHeight] });
})()`)));

// ---------- 4. Nombres accesibles de TODO control ------------------------------
await js(`window.__macondo.director.open('cuaderno-mirador')`);
await esperar(`document.querySelector('#writing').open`, 4000);
let ax = (await enviar('Accessibility.getFullAXTree')).result.nodes;
log('ARREGLO_5_nombres_campos', ax.filter(n => ['textbox','combobox','searchbox'].includes(n.role?.value))
  .map(n => ({ rol: n.role?.value, nombre: n.nombre = n.name?.value, fuente: n.name?.source })));
await captura('A5-cuaderno');
await js(`document.querySelector('#writing').close()`); await dormir(400);

await js(`window.__macondo.director.open('correo-pendiente')`);
await esperar(`document.querySelector('#story').open`, 4000);
ax = (await enviar('Accessibility.getFullAXTree')).result.nodes;
log('ARREGLO_5b_nombres_historia', ax.filter(n => ['textbox','combobox','searchbox'].includes(n.role?.value))
  .map(n => ({ rol: n.role?.value, nombre: n.name?.value, fuente: n.name?.source })));
await captura('A6-historia');
await js(`document.querySelector('#story').close()`); await dormir(400);

// ---------- 5. Barrido del contrato -------------------------------------------
log('BARRIDO_estructura', JSON.parse(await js(`(() => {
  const h = [...document.querySelectorAll('h1,h2,h3,h4')].map(e => e.tagName + ' · ' + (e.textContent||'').trim().slice(0,34));
  const hitos = [...document.querySelectorAll('main,header,nav,aside,footer,[role=region],[role=main],[role=navigation]')]
    .map(e => (e.id ? '#' + e.id : e.tagName) + (e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label') + ']' : '') + (e.getAttribute('role') ? '{' + e.getAttribute('role') + '}' : ''));
  const navSinNombre = [...document.querySelectorAll('nav')].filter(n => !n.getAttribute('aria-label')).length;
  return JSON.stringify({ encabezados: h, hitos, navSinNombre });
})()`)));

log('BARRIDO_aria_hidden_enfocables', JSON.parse(await js(`(() => {
  const malos = [];
  for (const el of document.querySelectorAll('[aria-hidden="true"]')) {
    for (const f of el.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')) {
      if (f.offsetParent === null && f.getBoundingClientRect().width === 0) continue;
      malos.push('#' + (f.id || f.className || f.tagName));
    }
  }
  return JSON.stringify(malos);
})()`)));

log('BARRIDO_estados_solo_color', JSON.parse(await js(`(() => {
  const out = [];
  // Los chips con aria-pressed: ¿llevan algo más que color?
  for (const el of document.querySelectorAll('[aria-pressed]')) {
    out.push({ id: '#' + el.id, etiqueta: el.textContent.trim().slice(0,20), pressed: el.getAttribute('aria-pressed') });
  }
  const minimapa = document.querySelector('#minimap svg circle');
  return JSON.stringify({ conmutadores: out, minimapaFill: minimapa ? minimapa.getAttribute('fill') : null,
    minimapaOculto: document.querySelector('#minimap').getAttribute('aria-hidden') });
})()`)));

log('BARRIDO_zonas_vivas', JSON.parse(await js(`JSON.stringify(
  [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')]
    .map(e => (e.id ? '#' + e.id : e.tagName) + '[' + (e.getAttribute('role') || e.getAttribute('aria-live')) + ']'))`)));

// ---------- 6. Ruta de teclado completa + trampa y devolución de foco ----------
await js(`document.body.focus()`);
const paradas = [];
for (let i = 0; i < 16; i++) {
  await tab();
  paradas.push(JSON.parse(await js(`(() => {
    const a = document.activeElement; if (!a || a === document.body) return JSON.stringify({ id: 'BODY' });
    const c = getComputedStyle(a);
    return JSON.stringify({ id: a.id || a.tagName, txt: (a.textContent||'').trim().slice(0,18),
      anillo: c.outlineStyle + ' ' + c.outlineWidth, fv: a.matches(':focus-visible') });
  })()`)));
}
log('BARRIDO_tabulacion', paradas);

// Abrir con teclado, comprobar la trampa, cerrar con Escape y ver dónde queda el foco
await js(`document.querySelector('#open-map').focus()`);
await tecla('Enter', 'Enter', 13);
await dormir(500);
const abre = await js(`document.querySelector('#map').open`);
let dentro = true;
for (let i = 0; i < 14; i++) {
  await tab();
  if (!await js(`document.querySelector('#map').contains(document.activeElement)`)) { dentro = false; break; }
}
await tecla('Escape', 'Escape', 27);
await dormir(500);
log('BARRIDO_dialogo', JSON.parse(await js(`JSON.stringify({ abrioConEnter: ${abre}, focoQuedoDentro: ${dentro},
  cerroConEscape: !document.querySelector('#map').open,
  focoDevueltoA: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : null })`)));

// ---------- 7. Conmutador de movimiento: nombre y estado ------------------------
log('BARRIDO_conmutador_movimiento', JSON.parse(await js(`(() => {
  const m = document.querySelector('#motion');
  return JSON.stringify({ texto: m.textContent.trim(), ariaPressed: m.getAttribute('aria-pressed') });
})()`)));
await clic('#motion');
log('BARRIDO_conmutador_movimiento_pulsado', JSON.parse(await js(`(() => {
  const m = document.querySelector('#motion');
  return JSON.stringify({ texto: m.textContent.trim(), ariaPressed: m.getAttribute('aria-pressed') });
})()`)));

log('consola', consola);
console.log('OUT ' + OUT);
try { ws.close(); } catch {}
matar();
process.exit(0);
