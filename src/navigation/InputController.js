// Normaliza teclado, ratón y multitáctil. Emite estado; no mueve la cámara.
// Limpia inputs en blur, pointercancel y contextmenu.

const KEY_MAP = {
  KeyW:'fwd', ArrowUp:'fwd', KeyS:'back', ArrowDown:'back',
  KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right',
  Space:'up', ShiftLeft:'down', ShiftRight:'down',  // el vuelo también sube y baja
};
export class InputController {
  constructor(dom) {
    this.move = { fwd:0, back:0, left:0, right:0 };
    this.look = { dx:0, dy:0 };      // delta consumible por frame
    this.interact = false;           // pulsación consumible
    this.enabled = true;

    this._keys = new Set();
    this._lift = 0;                  // botones Subir/Bajar del HUD: 0, 1 o -1
    this._joy = { active:false, id:null, ox:0, oy:0, x:0, y:0 };
    this._lookTouch = { id:null, lx:0, ly:0 };
    this._drag = null;
    this._downXY = null;             // para distinguir toque corto (volar) de arrastre
    this._onInteract = null;
    this.tap = null;                 // toque corto sobre la escena: {x,y} consumible

    this._bind(dom);
  }

  _bind(dom) {
    this._kd = e => {
      if (!this.enabled || e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('input,textarea,select,[contenteditable=true],dialog')) return; // no caminar ni interactuar al escribir
      if (e.code === 'KeyE' && !e.repeat) { this._pressInteract(e); return; }
      const m = KEY_MAP[e.code];
      if (!m) return;
      // El espacio sobre un botón con foco lo activa el navegador: no se lo robamos.
      if (e.code === 'Space' && e.target?.closest?.('button,a')) return;
      this._keys.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    };
    this._ku = e => { const m = KEY_MAP[e.code]; if (m) this._keys.delete(e.code); };
    addEventListener('keydown', this._kd);
    addEventListener('keyup', this._ku);

    addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
    dom.addEventListener('contextmenu', e => { e.preventDefault(); this.clear(); });
    dom.style.touchAction = 'none';

    // Ratón: arrastrar para mirar (sin pointer lock), clic corto = interactuar.
    this._pd = e => {
      if (!this.enabled || e.button !== 0 || this._drag) return;
      if (e.target.closest('button,a,input,textarea,select,dialog,#hud')) return;
      this._drag = { id:e.pointerId, x:e.clientX, y:e.clientY };
      this._downXY = { id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now() };
    };
    this._pm = e => {
      if (!this._drag || e.pointerId !== this._drag.id) return;
      if (this._downXY && Math.hypot(e.clientX-this._downXY.x, e.clientY-this._downXY.y) < 8) return;
      this.look.dx += e.clientX - this._drag.x;
      this.look.dy += e.clientY - this._drag.y;
      this._drag.x = e.clientX; this._drag.y = e.clientY;
      this._downXY = null; // se volvió arrastre
    };
    this._pu = e => {
      if (this._drag && e.pointerId === this._drag.id) this._drag = null;
      if (this._downXY && e.pointerId === this._downXY.id) {
        // Toque corto sobre la escena: vuelo por punto (main decide si es interacción).
        if (performance.now() - this._downXY.t < 600 &&
            !e.target.closest?.('button,a,input,textarea,select,dialog,#hud'))
          this.tap = { x: e.clientX, y: e.clientY };
        this._downXY = null;
      }
    };
    this._pc = () => { this._drag = null; this._downXY = null; this._joy.active = false; this._joy.x = this._joy.y = 0; this._lookTouch.id = null; };
    dom.addEventListener('pointerdown', this._pd);
    addEventListener('pointermove', this._pm, { passive:true });
    addEventListener('pointerup', this._pu);
    addEventListener('pointercancel', this._pc);
  }

  _pressInteract(e) {
    if (!this.enabled) return;
    if (e && e.target && e.target.closest?.('button,a,input,textarea,select,dialog,#hud')) return;
    this.interact = true;
  }

  // Botones Subir/Bajar del HUD: se mantienen mientras el puntero siga pulsado.
  liftPress(dir) { this._lift = dir < 0 ? -1 : 1; }
  liftRelease() { this._lift = 0; }

  // Joystick táctil: el DOM crea el elemento; aquí solo matemática.
  joyStart(id, ox, oy) { this._joy = { active:true, id, ox, oy, x:0, y:0 }; }
  joyMove(id, x, y) { if (this._joy.active && this._joy.id === id) { this._joy.x = x; this._joy.y = y; } }
  joyEnd(id) { if (this._joy.id === id) { this._joy.active = false; this._joy.x = this._joy.y = 0; } }
  get joy() { return this._joy.active ? { x:this._joy.x, y:this._joy.y } : null; }

  // Zona derecha de la pantalla: arrastrar para mirar en móvil.
  touchLookStart(id, x, y) { this._lookTouch = { id, lx:x, ly:y }; }
  touchLookMove(id, x, y) {
    if (this._lookTouch.id !== id) return;
    this.look.dx += x - this._lookTouch.lx;
    this.look.dy += y - this._lookTouch.ly;
    this._lookTouch.lx = x; this._lookTouch.ly = y;
  }
  touchLookEnd(id) { if (this._lookTouch.id === id) this._lookTouch.id = null; }

  clear() { this._drag = this._downXY = null; this._lookTouch.id = null; this._keys.clear(); this._lift = 0; this.look.dx = this.look.dy = 0; this._joy.active = false; this._joy.x = this._joy.y = 0; this.interact = false; this.tap = null; }

  // Consume el estado acumulado desde el último frame.
  sample() {
    const k = new Set([...this._keys].map(code => KEY_MAP[code]));
    let jx = 0, jy = 0;
    if (this.joy) { jx = this.joy.x; jy = this.joy.y; }
    const up = (k.has('up') ? 1 : 0) - (k.has('down') ? 1 : 0);
    const out = {
      move: {
        fwd:   (k.has('fwd')   ? 1 : 0) - (k.has('back') ? 1 : 0),
        right: (k.has('right') ? 1 : 0) - (k.has('left') ? 1 : 0),
        up: Math.max(-1, Math.min(1, up + this._lift)),  // teclado y botones a la vez
      },
      joy: { x: jx, y: jy },
      look: { x: this.look.dx, y: this.look.dy },
      interact: this.interact,
      tap: this.tap,
    };
    this.look.dx = 0; this.look.dy = 0; this.interact = false; this.tap = null;
    return out;
  }
}
