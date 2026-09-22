// Arnés de verificación en navegador: un solo module profundo para los dieciocho guiones.
//
// Detrás de esta interfaz pequeña vive todo lo que antes se copiaba en cada guion y había
// que arreglar dieciocho veces: lanzar Chrome con un puerto libre (se lee del archivo
// DevToolsActivePort, así que no hay colisiones ni zombis que roben la conexión), perfil
// limpio por corrida (localStorage determinista, sin herencia entre guiones), transporte
// CDP, clic real por la entrada del navegador (un `.click()` desde Runtime.evaluate no
// cuenta como gesto y el audio no arranca), espera por condición en vez de `sleep(4500)`,
// capturas y un protocolo de salida: el guion ACUMULA afirmaciones y el arnés decide el
// código de salida. Un guion que sólo imprime no es una verificación.
//
// Contrato:
//   const s = await abrir({ out, autoplay: true });
//   await s.entrar();                 // navega, entra al paseo y espera el gancho
//   s.afirmar(cond, 'mensaje');       // se puede llamar muchas veces
//   await s.captura('nombre');        // PNG en OUT
//   await s.cerrar();                 // imprime LOGS/FALLOS y sale 0 o 1
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_POR_DEFECTO = 'http://127.0.0.1:5175/';
const TMP = (process.env.TMPDIR || '/tmp').replace(/\/$/, '');
const dormir = ms => new Promise(r => setTimeout(r, ms));

// El servidor de desarrollo es una precondición del arnés: mejor decirlo claro que esperar
// treinta segundos a un target que nunca aparece.
async function comprobarServidor(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
  } catch (err) {
    throw new Error(`El servidor de desarrollo no responde en ${url} (${err.message}).\n`
      + `Levántalo con: npm run dev -- --port 5175 --strictPort`);
  }
}

export async function abrir(opciones = {}) {
  const {
    ancho = 1440, alto = 900, out = TMP, url = URL_POR_DEFECTO,
    autoplay = false, perfil: nombrePerfil = `arnes-${process.pid}`,
  } = opciones;
  const outDir = out;
  const perfil = join(outDir, `perfil-${nombrePerfil}`);
  mkdirSync(outDir, { recursive: true });
  // Perfil limpio siempre: la herencia de localStorage entre corridas producía lecturas
  // que parecían fallos del producto.
  try { execFileSync('pkill', ['-9', '-f', perfil], { stdio: 'ignore' }); } catch {}
  rmSync(perfil, { recursive: true, force: true });

  await comprobarServidor(url);

  const banderas = [
    '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run',
    '--remote-debugging-port=0', `--user-data-dir=${perfil}`,
    `--window-size=${ancho},${alto}`, '--hide-scrollbars', 'about:blank',
  ];
  if (autoplay) banderas.push('--autoplay-policy=no-user-gesture-required');
  // `detached` da a Chrome su propio grupo de procesos: matar sólo al padre deja vivos a
  // los renderizadores, que se acumulan entre corridas y se comen la máquina (catorce
  // Chromes zombis explicaban un banco de pruebas que iba cuesta abajo).
  const chrome = spawn(CHROME, banderas, { stdio: 'ignore', detached: true });
  const matarChrome = () => {
    try { process.kill(-chrome.pid, 'SIGKILL'); } catch {}
    try { chrome.kill('SIGKILL'); } catch {}
    try { execFileSync('pkill', ['-9', '-f', perfil], { stdio: 'ignore' }); } catch {}
  };

  // Chrome escribe el puerto elegido en <perfil>/DevToolsActivePort.
  const archivoPuerto = join(perfil, 'DevToolsActivePort');
  let puerto = null;
  for (let i = 0; i < 60 && !puerto; i++) {
    await dormir(250);
    if (existsSync(archivoPuerto)) puerto = Number(readFileSync(archivoPuerto, 'utf8').split('\n')[0]) || null;
  }
  if (!puerto) { matarChrome(); throw new Error('Chrome no publicó su puerto de depuración'); }

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json();
      target = lista.find(t => t.type === 'page' && !t.url.startsWith('devtools://'));
    } catch {}
    if (!target) await dormir(250);
  }
  if (!target) { matarChrome(); throw new Error('No hay pestaña que depurar'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pendientes = new Map(); const registro = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown')
      registro.push(`[EXCEPTION] ${m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text}`);
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
      registro.push(`[${m.params.type}] ${m.params.args.map(a => a.value ?? a.description).join(' ')}`);
  };
  const enviar = (method, params = {}) => new Promise(res => {
    const n = ++id; pendientes.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
  });
  const js = async expr => (await enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
    .result?.result?.value;

  const fallos = [];
  const permitidos = [];
  const sesion = {
    out, url, puerto,
    js,
    logs: () => registro,
    afirmar(cond, mensaje) { if (!cond) fallos.push(mensaje); return !!cond; },
    afirmarIgual(obtenido, esperado, mensaje) {
      if (obtenido !== esperado) fallos.push(`${mensaje}: esperado ${JSON.stringify(esperado)}, obtenido ${JSON.stringify(obtenido)}`);
      return obtenido === esperado;
    },
    fallos: () => [...fallos],
    // Avisos de consola que el guion provoca a propósito (p. ej. el fallback sin 3D, que
    // registra el error a mano). Todo lo demás mancha la consola.
    permitir(patron) { permitidos.push(patron); },

    // Espera por condición: sin `sleep` largo, y con tope explícito.
    async esperar(expr, { tope = 20000, cada = 250 } = {}) {
      const t0 = Date.now();
      for (;;) {
        if (await js(expr)) return Date.now() - t0;
        if (Date.now() - t0 > tope) return -1;
        await dormir(cada);
      }
    },

    // Clic de verdad por la entrada del navegador: cuenta como gesto del usuario (el audio
    // no arranca con un `.click()` sintético). Dos cuidados que costaron una tarde:
    // `buttons` es obligatorio —sin él Chrome entrega el evento pero no sintetiza el clic— y
    // la portada se reacomoda mientras cargan las tipografías, así que el botón se mueve
    // entre medir y disparar. Por eso se mide justo antes y se CONFIRMA que el clic cayó
    // dentro del elemento, reintentando si no.
    async clic(selector, { intentos = 5 } = {}) {
      const sel = JSON.stringify(selector);
      for (let intento = 0; intento < intentos; intento++) {
        const caja = JSON.parse(await js(`(() => { const el = document.querySelector(${sel});
          if (!el) return 'null'; const r = el.getBoundingClientRect();
          return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) })()`) || 'null');
        if (!caja) { fallos.push(`no existe el selector ${selector}`); return false; }
        await js(`window.__clicOk = false;
          document.addEventListener('click', e => { if (e.target.closest(${sel})) window.__clicOk = true; }, { capture: true, once: true });`);
        await enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: caja.x, y: caja.y, buttons: 0 });
        await enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: caja.x, y: caja.y, button: 'left', buttons: 1, clickCount: 1 });
        await enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: caja.x, y: caja.y, button: 'left', buttons: 0, clickCount: 1 });
        await dormir(250);
        if (await js(`window.__clicOk === true`)) return true;
        await dormir(400);   // el layout sigue asentándose: se vuelve a medir
      }
      fallos.push(`el clic no alcanzó ${selector} en ${intentos} intentos`);
      return false;
    },

    // ¿Se puede clicar de verdad? Existe, se ve y está arriba en su punto central. Sirve
    // para los pasos opcionales: un botón oculto responde a `.click()` sintético pero no a
    // un clic real, y confundir eso con un fallo cuesta una tarde.
    async puedeClic(selector) {
      return !!(await js(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
        if (!el || el.hidden) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!encima && el.contains(encima) })()`));
    },

    async tecla(code, { mantener = 120 } = {}) {
      await enviar('Input.dispatchKeyEvent', { type: 'keyDown', code, windowsVirtualKeyCode: 0 });
      await dormir(mantener);
      await enviar('Input.dispatchKeyEvent', { type: 'keyUp', code, windowsVirtualKeyCode: 0 });
    },

    async captura(nombre) {
      const s = await enviar('Page.captureScreenshot', { format: 'png' });
      const ruta = join(out, `${nombre}.png`);
      writeFileSync(ruta, Buffer.from(s.result.data, 'base64'));
      return ruta;
    },

    async movil(w = 390, h = 844) {
      await enviar('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await dormir(400);
    },
    async escritorio() { await enviar('Emulation.clearDeviceMetricsOverride'); await dormir(400); },

    // Navegar y esperar a que la portada esté montada. Los guiones que fijan una
    // preferencia en localStorage necesitan recargar después (los módulos la leen al cargar).
    async navegar(destino = url, { tope = 25000 } = {}) {
      await enviar('Page.navigate', { url: destino });
      const t = await sesion.esperar(`!!document.querySelector('#enter')`, { tope });
      if (t < 0) fallos.push(`no cargó la portada de ${destino}`);
      return t;
    },
    async recargar(opciones = {}) {
      await enviar('Page.reload', {});
      const t = await sesion.esperar(`!!document.querySelector('#enter')`, { tope: opciones.tope ?? 25000 });
      if (t < 0) fallos.push('no volvió la portada tras recargar');
      return t;
    },

    // Secuencia común: cargar, fijar preferencias, entrar al paseo y esperar el gancho de
    // verificación. Las preferencias se escriben antes de recargar porque los módulos
    // (narrador, lecho ambiente) las leen al arrancar. El botón de omitir sólo se pulsa si
    // de verdad se puede: la portada se oculta al entrar y entonces deja de ser clicable.
    async entrar({ voz = 'no', preferencias = {}, omitirVuelo = true, esperarGancho = true } = {}) {
      await sesion.navegar(url);
      const items = { 'macondo.voz.v1': voz, ...preferencias };
      const guion = Object.entries(items)
        .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(String(v))})`).join('; ');
      await js(`try{ ${guion} }catch{}`);
      await sesion.recargar();
      await sesion.clic('#enter');
      if (omitirVuelo) {
        await sesion.esperar(`!document.querySelector('#skip-flight').hidden`, { tope: 3000 });
        if (await sesion.puedeClic('#skip-flight')) await sesion.clic('#skip-flight');
      }
      if (esperarGancho) {
        const t = await sesion.esperar(`!!window.__macondo`, { tope: 25000 });
        if (t < 0) fallos.push('el paseo no arrancó (sin gancho __macondo)');
      }
      return js(`typeof window.__macondo`);
    },

    async cerrar() {
      const sucios = registro.filter(l => l.startsWith('[') && !permitidos.some(p => p.test(l)));
      if (sucios.length) {
        fallos.push(`consola sucia: ${sucios.length} aviso(s)`);
        for (const l of sucios) console.log(' ', l);
      }
      if (fallos.length) {
        console.log('FALLOS:', JSON.stringify(fallos, null, 1));
        try { ws.close(); } catch {}
        matarChrome();
        process.exit(1);
      }
      console.log('OK');
      try { ws.close(); } catch {}
      matarChrome();
      process.exit(0);
    },
  };

  await enviar('Page.enable'); await enviar('Runtime.enable');
  // Sin traer la pestaña al frente, headless entrega los eventos de entrada a nadie.
  await enviar('Page.bringToFront');
  return sesion;
}
