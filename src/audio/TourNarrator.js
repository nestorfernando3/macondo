// Narrador del recorrido: reproduce un clip a la vez, muestra subtítulos y
// marca el ritmo del paseo (la llegada espera a que termine el relato).
// Igual que NarrativeDirector: sin DOM ni Three; callbacks inyectados.
// audioFactory es inyectable para probar la máquina en Node.
import { NARRACION, audioUrl } from '../data/narracion.js';

export const VOZ_KEY = 'macondo.voz.v1';

function restoreVoz() {
  try { return localStorage.getItem(VOZ_KEY) !== 'no'; } catch { return true; }
}
function persistVoz(v) { try { localStorage.setItem(VOZ_KEY, v ? 'si' : 'no'); } catch {} }

export class TourNarrator {
  constructor({ onCaption, onEnded, audioFactory } = {}) {
    this.onCaption = onCaption || (() => {});
    this.onEnded = onEnded || (() => {});
    this._make = audioFactory || (id => { const a = new Audio(audioUrl(id)); a.preload = 'auto'; return a; });
    this._enabled = restoreVoz();
    this.current = null;   // { id, audio } — visible para verificación
    this.paused = false;
  }

  get enabled() { return this._enabled; }
  setEnabled(v) {
    this._enabled = !!v; persistVoz(this._enabled);
    if (!this._enabled) this.interrupt();
  }

  has(id) { return Object.prototype.hasOwnProperty.call(NARRACION, id); }

  // Reproduce un clip (reemplaza al actual). force=true ignora el interruptor
  // (gesto explícito, p. ej. «Escuchar» en una lectura). Devuelve el clip o null.
  play(id, { force = false } = {}) {
    if (!this.has(id)) return null;
    if (!this._enabled && !force) return null;
    this._stop(false);
    const audio = this._make(id);
    this.current = { id, audio };
    this.paused = false;
    this.onCaption(NARRACION[id]);
    audio.onended = () => { if (this.current?.audio === audio) { this.current = null; this.onCaption(null); this.onEnded(id); } };
    audio.onerror = () => { if (this.current?.audio === audio) { this.current = null; this.onCaption(null); this.onEnded(id); } };
    const prom = audio.play();
    if (prom?.catch) prom.catch(() => {}); // el subtítulo queda; sin gesto no hay sonido
    return this.current;
  }

  // Detiene el clip en curso. avisar=true dispara onEnded (p. ej. «Saltar audio»).
  _stop(avisar) {
    const c = this.current;
    this.current = null; this.paused = false;
    if (!c) { if (!avisar) this.onCaption(null); return; }
    c.audio.onended = c.audio.onerror = null;
    try { c.audio.pause(); } catch {}
    this.onCaption(null);
    if (avisar) this.onEnded(c.id);
  }

  interrupt() { this._stop(false); }   // cancelación: el flujo no continúa
  skip() { this._stop(true); }         // salto explícito: el flujo continúa

  pause() {
    if (!this.current || this.paused) return;
    try { this.current.audio.pause(); } catch {}
    this.paused = true;
  }
  resume() {
    if (!this.current || !this.paused) return;
    const prom = this.current.audio.play();
    if (prom?.catch) prom.catch(() => {});
    this.paused = false;
  }
}
