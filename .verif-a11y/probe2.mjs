// Verificación fina: la trampa de foco del diálogo (medida paso a paso), los hitos nuevos,
// el conmutador de movimiento y una captura del paseo con el encabezado ya velado.
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_ = process.argv[2] || 'http://127.0.0.1:5180/';
const OUT = process.argv[3] || '/tmp/macondo-a11y2';
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
  if (m.method === 'Runtime.exceptionThrown') consola.push('[EXC] ' + (m.params.exceptionDetails?.text || ''));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
    consola.push(`[${m.params.type}] ` + m.params.args.map(a => a.value ?? a.description).join(' '));
};
const enviar = (method, params = {}) => new Promise(res => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const js = async e => (await enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const captura = async n => { const s = await enviar('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(s.result.data, 'base64')); };
async function esperar(expr, tope = 25000) { const t0 = Date.now(); for (;;) { if (await js(expr)) return Date.now() - t0; if (Date.now() - t0 > tope) return -1; await dormir(150); } }
async function tecla(key, code, vk) {
  const b = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  await enviar('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...b });
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', ...b });
  await dormir(160);
}
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

await enviar('Page.enable'); await enviar('Runtime.enable'); await enviar('Page.bringToFront');
await enviar('Page.navigate', { url: URL_ });
await esperar(`!!document.querySelector('#enter')`);
await js(`try{ localStorage.setItem('macondo.voz.v1','no'); localStorage.setItem('macondo-tutorial-v1','done') }catch{}`);
await enviar('Page.reload', {});
await esperar(`!!document.querySelector('#enter')`);
await dormir(1500);
await clic('#enter');
await esperar(`!document.querySelector('#skip-flight').hidden`, 4000);
await clic('#skip-flight');
await esperar(`!!window.__macondo`, 30000);
await dormir(1200);

// ---------- Trampa de foco, paso a paso ----------
await js(`document.querySelector('#open-map').focus()`);
await tecla('Enter', 'Enter', 13);
await dormir(500);
log('trampa_abre', JSON.parse(await js(`JSON.stringify({ open: document.querySelector('#map').open,
  focoInicial: document.activeElement.id || document.activeElement.className || document.activeElement.tagName,
  dentro: document.querySelector('#map').contains(document.activeElement) })`)));
const recorrido = [];
for (let i = 0; i < 12; i++) {
  await tecla('Tab', 'Tab', 9);
  recorrido.push(await js(`(() => { const a = document.activeElement;
    return (a.id || a.className || a.tagName) + (document.querySelector('#map').contains(a) ? ' [dentro]' : ' [FUERA]') })()`));
}
log('trampa_paso_a_paso', recorrido);
// Shift+Tab hacia atrás
const atras = [];
for (let i = 0; i < 4; i++) {
  await enviar('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await dormir(160);
  atras.push(await js(`(() => { const a = document.activeElement;
    return (a.id || a.className || a.tagName) + (document.querySelector('#map').contains(a) ? ' [dentro]' : ' [FUERA]') })()`));
}
log('trampa_shift_tab', atras);

// ¿Qué hay enfocable dentro del mapa?
log('enfocables_del_mapa', JSON.parse(await js(`JSON.stringify(
  [...document.querySelectorAll('#map a[href],#map button,#map input,#map select,#map textarea,[tabindex]')]
    .filter(e => e.tabIndex >= 0).map(e => e.id || e.className || e.tagName))`)));

await tecla('Escape', 'Escape', 27);
await dormir(500);
log('trampa_cierra', JSON.parse(await js(`JSON.stringify({ open: document.querySelector('#map').open,
  focoDevueltoA: document.activeElement.id || document.activeElement.tagName })`)));

// ---------- Hitos, navs y conmutador ----------
log('hitos', JSON.parse(await js(`JSON.stringify(
  [...document.querySelectorAll('main,header,nav,aside,footer,[role=region],[role=group],[role=img]')]
    .map(e => (e.id ? '#' + e.id : e.tagName) + (e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label') + ']' : '') + (e.getAttribute('role') ? '{' + e.getAttribute('role') + '}' : '')))`)));
log('navs_sin_nombre', await js(`[...document.querySelectorAll('nav')].filter(n => !n.getAttribute('aria-label')).length`));
log('conmutador_movimiento', JSON.parse(await js(`(() => { const m = document.querySelector('#motion');
  return JSON.stringify({ texto: m.textContent.trim(), ariaPressed: m.getAttribute('aria-pressed'),
    etiquetaAccesible: m.getAttribute('aria-label') }) })()`)));
await clic('#motion');
log('conmutador_movimiento_tras_pulsar', JSON.parse(await js(`(() => { const m = document.querySelector('#motion');
  return JSON.stringify({ texto: m.textContent.trim(), ariaPressed: m.getAttribute('aria-pressed') }) })()`)));
await clic('#motion');

// ---------- Captura del paseo con el encabezado velado ----------
await js(`window.__macondo.player.place(0, 24, 0)`);
await dormir(1500);
await captura('B1-paseo-encabezado');

// ---------- El encabezado ya no es solo texto suelto ----------
log('encabezado', JSON.parse(await js(`(() => {
  const f = s => { const el = document.querySelector(s); const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { fondo: c.backgroundColor, radio: c.borderRadius, caja: [Math.round(r.width), Math.round(r.height)], minAlto: c.minHeight } };
  return JSON.stringify({ marca: f('header .brand'), rotulo: f('header > span'), chip: f('header button') });
})()`)));

// ---------- Hit areas del paseo, otra vez ----------
log('hit_areas', JSON.parse(await js(`(() => {
  const bajo = [];
  for (const el of document.querySelectorAll('#hud button, header button')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.width < 44 || r.height < 44) bajo.push([el.id, Math.round(r.width), Math.round(r.height)]);
  }
  return JSON.stringify(bajo);
})()`)));
log('consola', consola);
console.log('OUT ' + OUT);
try { ws.close(); } catch {}
matar();
process.exit(0);
