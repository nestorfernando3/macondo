// Normaliza teclado, ratón y multitáctil. Emite estado; no mueve la cámara.
// Limpia inputs en blur, pointercancel y contextmenu.
//
// El clic sobre la escena vuela al punto y el arrastre gira la cámara; ninguno de los dos se
// lleva el puntero, así que el HUD siempre se puede pulsar. La captura del puntero es una
// elección aparte —el chip «Vista libre»—: con ella puesta no hay cursor, girar es mover el
// ratón sin pulsar nada, un clic vuela al punto de la mira (el centro de la pantalla) y Esc
// la suelta para volver a los botones. No hay teclas de subir ni de bajar: la altura la elige
// la mirada (ver `PlayerController.empujeVertical`).

const KEY_MAP = {
  KeyW:'fwd', ArrowUp:'fwd', KeyS:'back', ArrowDown:'back',
  KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right',
};
export class InputController {
  constructor(dom) {
    this.move = { fwd:0, back:0, left:0, right:0 };
    this.look = { dx:0, dy:0 };      // delta consumible por frame
    this.interact = false;           // pulsación consumible
    this.enabled = true;

    this.dom = dom;
    this._keys = new Set();
    this._locked = false;            // puntero capturado: girar es mover el ratón
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
      this._keys.add(e.code);
      if (e.code.startsWith('Arrow')) e.preventDefault();
    };
    this._ku = e => { const m = KEY_MAP[e.code]; if (m) this._keys.delete(e.code); };
    addEventListener('keydown', this._kd);
    addEventListener('keyup', this._ku);

    addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
    dom.addEventListener('contextmenu', e => { e.preventDefault(); this.clear(); });
    dom.style.touchAction = 'none';
    // La captura del puntero puede fallar (Chrome la veta justo después de un Esc): se
    // pide sin romper nada y el vuelo por punto sigue funcionando con el cursor a la vista.
    this._plc = () => { this._locked = document.pointerLockElement === dom; };
    document.addEventListener('pointerlockchange', this._plc);

    // Ratón: el clic —corto, sin arrastre— vuela al punto y captura el puntero; el arrastre
    // sigue girando la cámara sin capturarla, así que el HUD no se queda sin cursor por
    // arrastrar. Con el puntero capturado no hay cursor: el movimiento gira la cámara y el
    // clic vuela al punto de la mira.
    this._pd = e => {
      if (!this.enabled || e.button !== 0) return;
      if (e.target.closest('button,a,input,textarea,select,dialog,#hud')) return;
      if (this._locked) {                     // sin cursor, la mira es el centro de la pantalla
        this.tap = { x: (globalThis.innerWidth ?? 0) / 2, y: (globalThis.innerHeight ?? 0) / 2 };
        return;
      }
      if (this._drag) return;
      this._drag = { id:e.pointerId, x:e.clientX, y:e.clientY };
      this._downXY = { id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now() };
    };
    this._pm = e => {
      if (!this.enabled) return;
      if (this._locked) {                     // girar sin arrastrar ni pulsar
        this.look.dx += e.movementX || 0;
        this.look.dy += e.movementY || 0;
        return;
      }
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
        // Toque corto sobre la escena: sólo vuela. Antes pedía también la captura del puntero,
        // y como volar es el gesto principal del paseo, el primer toque de cualquiera se
        // llevaba el cursor y desde ahí ningún chip del HUD recibía un clic. La captura ahora
        // la pide el chip «Vista libre»: es una elección, no un efecto de volar.
        if (performance.now() - this._downXY.t < 600 &&
            !e.target.closest?.('button,a,input,textarea,select,dialog,#hud')) {
          this.tap = { x: e.clientX, y: e.clientY };
        }
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

  // ¿El puntero está capturado? El HUD lo usa para enseñar la mira.
  get locked() { return this._locked; }
  // Pide la captura del puntero. La dispara el chip «Vista libre», así que va dentro de un
  // gesto de verdad. Chrome puede vetarla (justo después de un Esc) y devuelve una promesa
  // rechazada: se traga y el paseo sigue con el cursor a la vista.
  request() {
    const pedido = this.dom.requestPointerLock?.();
    pedido?.catch?.(() => {});
  }
  // Suelta el puntero. Lo llama main al abrir un panel: con el puntero capturado no hay
  // cursor y los botones del diálogo quedarían fuera de alcance.
  release() { if (this._locked) document.exitPointerLock?.(); }

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

  clear() { this._drag = this._downXY = null; this._lookTouch.id = null; this._keys.clear(); this.look.dx = this.look.dy = 0; this._joy.active = false; this._joy.x = this._joy.y = 0; this.interact = false; this.tap = null; }

  // Consume el estado acumulado desde el último frame.
  sample() {
    const k = new Set([...this._keys].map(code => KEY_MAP[code]));
    let jx = 0, jy = 0;
    if (this.joy) { jx = this.joy.x; jy = this.joy.y; }
    const out = {
      move: {
        fwd:   (k.has('fwd')   ? 1 : 0) - (k.has('back') ? 1 : 0),
        right: (k.has('right') ? 1 : 0) - (k.has('left') ? 1 : 0),
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
