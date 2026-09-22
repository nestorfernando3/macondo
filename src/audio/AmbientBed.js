// Lecho de sonido ambiente del pueblo: viento, río y aves. Tres lazos en bucle, apagados
// por defecto —silencio inicial, spec §84— y sólo suenan cuando la visitante lo pide con un
// gesto en el chip «Sonido». La experiencia completa funciona sin ellos.
//
// Sin DOM ni Three en el contrato: `audioFactory` es inyectable, igual que en TourNarrator,
// para poder probar la máquina en Node.
export const AMBIENTE_KEY = 'macondo.ambiente.v1';

// Ganancia base de cada lazo y su papel en la mezcla.
const LAZOS = {
  viento: { volumen: .38, ayuda: 'viento entre los árboles' },
  rio: { volumen: .0, ayuda: 'el río, más cerca cuanto más cerca esté' },
  aves: { volumen: .42, ayuda: 'monte y pájaros' },
};
const AGUA_X = -24.3;      // borde del agua: al oeste de esta línea está el río
const ALCANCE_AGUA = 18;   // metros a los que el río deja de oírse (en la plaza, silencio)

function restaurarPreferencia() {
  try { return localStorage.getItem(AMBIENTE_KEY) === 'si'; } catch { return false; }
}
function persistir(v) { try { localStorage.setItem(AMBIENTE_KEY, v ? 'si' : 'no'); } catch {} }

export function ambienteUrl(id) { return `./audio/ambiente/${id}.mp3`; }

export class AmbientBed {
  constructor({ audioFactory, storageKey = AMBIENTE_KEY, enabled } = {}) {
    this._make = audioFactory || (id => {
      const a = new Audio(ambienteUrl(id));
      a.loop = true; a.preload = 'none'; return a;
    });
    this.storageKey = storageKey;
    this._enabled = enabled ?? restaurarPreferencia();
    this._voces = {};        // id → { audio, volumen }
    this._narrando = false;
    this._agua = 0;          // 0 = lejos del río, 1 = a la orilla
    if (this._enabled) this._encender();   // arranque silencioso: play() lo pide un gesto
  }

  get enabled() { return this._enabled; }
  // Para la verificación: por lazo, volumen efectivo, si está sonando y si el archivo cargó
  // (readyState 2 = ya hay datos suficientes). Un 404 se ve aquí como listo:false.
  get estado() {
    return Object.fromEntries(Object.entries(this._voces).map(([id, v]) => [id, {
      volumen: +v.audio.volume.toFixed(3),
      pausado: !!v.audio.paused,
      listo: (v.audio.readyState ?? 0) >= 2,
      error: v.audio.error?.code ?? null,
    }]));
  }
  // Volumen de un lazo concreto (atajo legible para las pruebas y los guiones CDP).
  volumenDe(id) { return this._voces[id]?.audio.volume ?? null; }

  setEnabled(v) {
    const valor = !!v;
    if (valor === this._enabled) return;
    this._enabled = valor;
    persistir(valor);
    if (valor) this._encender(); else this._apagar();
  }

  // Mientras habla la guía, el ambiente cede el primer plano.
  setNarrando(v) {
    const valor = !!v;
    if (valor === this._narrando) return;
    this._narrando = valor;
    this._mezclar();
  }

  // Cuánto se oye el río según dónde esté la mariposa.
  update(x) {
    const d = Math.max(0, x - AGUA_X);
    const cerca = Math.max(0, Math.min(1, 1 - d / ALCANCE_AGUA));
    if (Math.abs(cerca - this._agua) < .01) return;
    this._agua = cerca;
    this._mezclar();
  }

  _encender() {
    for (const [id, cfg] of Object.entries(LAZOS)) {
      if (!this._voces[id]) this._voces[id] = { audio: this._make(id), volumen: cfg.volumen };
      const audio = this._voces[id].audio;
      audio.loop = true;
      const prom = audio.play();
      if (prom?.catch) prom.catch(() => {});   // sin gesto del navegador, se queda en silencio
    }
    this._mezclar();
  }

  // Si la preferencia quedó encendida de otra sesión, el navegador bloquea el arranque
  // hasta que haya un gesto: esto reintenta tras el clic de «Comenzar recorrido».
  reanudar() { if (this._enabled) this._encender(); }

  _apagar() {
    for (const { audio } of Object.values(this._voces)) {
      try { audio.pause(); } catch {}
    }
  }

  _mezclar() {
    const atenuar = this._narrando ? .32 : 1;
    for (const [id, voz] of Object.entries(this._voces)) {
      let v = voz.volumen;
      if (id === 'rio') v = .62 * this._agua;
      try { voz.audio.volume = Math.max(0, Math.min(1, v * atenuar)); } catch {}
    }
  }

  dispose() {
    for (const { audio } of Object.values(this._voces)) {
      try { audio.pause(); audio.src = ''; } catch {}
    }
    this._voces = {};
  }
}
