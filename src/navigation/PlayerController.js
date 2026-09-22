import * as THREE from 'three';

// Única autoridad sobre el jugador: una mariposa amarilla que vuela. Tercera
// persona con cámara perseguidora; altura automática sobre el terreno, sin
// caídas ni atascos. La colisión se conserva (la mariposa es pequeña y resbala),
// el límite del mundo también: el río sigue siendo la orilla del mapa.

export const SPEED = 3.2, RADIUS = 0.22, HOVER = 2.1;
export const EYE = HOVER; // referencia de altura del jugador (antes: altura de ojos)
// El vuelo no es plano: la mariposa sube y baja. La altura es un desplazamiento sobre
// el terreno —no una coordenada absoluta—, así que al cruzar la meseta del mirador o el
// muelle la mariposa sube con el suelo en vez de hundirse en él. El mando elige cuánto
// vuela por encima; el suelo sigue mandando.
export const RISE = 2.6, ALT_MIN = .9, ALT_MAX = 9;

const QUIETO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerpAng = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

export class PlayerController {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.yaw = 0;                    // rumbo de la mariposa
    this.orbitYaw = 0;               // órbita de la cámara (arrastrar para girar)
    this.orbitPitch = .34;
    this.alt = HOVER;                // altura sobre el terreno que pide el mando
    this.enabled = false;
    this.followCam = false;          // la cámara persigue el rumbo (tour/vuelo por punto)
    this.flyTarget = null;           // {x,z} destino por toque/clic
    this._pos = new THREE.Vector3();
    this._vel = new THREE.Vector3();
    this._bank = 0;
    this._fase = 0;
    this.avatar = null;
  }

  attachAvatar(avatar) { this.avatar = avatar; this._apply(0); }

  place(x, z, yaw = this.yaw) {
    this._pos.set(x, this.world.groundAt(x, z) + HOVER, z);
    this.yaw = yaw;
    this.orbitYaw = yaw;
    this.orbitPitch = .34;
    this.alt = HOVER;
    this.enabled = true;
    this._vel.set(0, 0, 0);
    this.flyTarget = null;
    this._apply(0);
  }

  get position() { return this._pos; }

  stop() { this.flyTarget = null; this.followCam = false; this._vel.set(0, 0, 0); }

  recenter() { this.orbitYaw = this.yaw; this.orbitPitch = .34; }

  // Altura de crucero del paseo. El recorrido guiado la recupera al empezar: el relato y
  // las lecturas están escritos para verse desde ahí, no desde el techo del pueblo.
  resetAltitude() { this.alt = HOVER; }

  // Movimiento manual relativo a la cámara: empujar hacia donde mira la cámara.
  // Si hay un destino por toque/clic y nadie empuja el mando, vuela hacia él.
  // input: { move:{fwd,right,up}, joy:{x,y} } ya muestreados. up: 1 sube, -1 baja.
  update(dt, { move = {}, joy = null } = {}) {
    if (!this.enabled) return;
    const fwd = (move.fwd || 0) - (joy ? joy.y : 0);
    const right = (move.right || 0) + (joy ? joy.x : 0);
    const up = Math.max(-1, Math.min(1, move.up || 0));
    const manual = Math.hypot(fwd, right) > .01 || up !== 0;
    if (manual) { this.flyTarget = null; this.followCam = false; } // el mando manda
    // La altura que pide el mando se conserva al soltar: subir no es un salto, es volar.
    if (up) this.alt = Math.max(ALT_MIN, Math.min(ALT_MAX, this.alt + up * RISE * dt));
    if (this.flyTarget) {
      this._flyToPoint(dt);
    } else {
      let dx = 0, dz = 0;
      if (manual) {
        const s = Math.sin(this.orbitYaw), c = Math.cos(this.orbitYaw);
        // adelante = donde mira la cámara; derecha = su derecha
        dx = (-s * fwd + c * right);
        dz = (-c * fwd - s * right);
        const m = Math.hypot(dx, dz), n = m > 1 ? 1 / m : 1;
        dx = dx * n * SPEED; dz = dz * n * SPEED;
      }
      this._steer(dt, dx, dz);
    }
    this._apply(dt);
  }

  // Vuelo dirigido (lo usa TourController): inercia y alabeo de mariposa,
  // con el rumbo dirigido por quien convoca.
  flyAlong(dt, dx, dz) { this._steer(dt, dx, dz); }

  // Vuela hacia un punto del suelo (toque/clic). Devuelve true si aceptó el destino.
  flyTo(x, z) {
    if (!this.enabled) return false;
    const L = this.world.limit - 1;
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > L || Math.abs(z) > L || this.world.blocks(x, z, RADIUS)) return false;
    this._stuck = 0;
    this.flyTarget = { x, z };
    this.followCam = true;
    return true;
  }

  // Vuelo por punto: rumbo suave al destino; se apaga al llegar.
  _flyToPoint(dt) {
    if (!this.flyTarget) return;
    const dx = this.flyTarget.x - this._pos.x, dz = this.flyTarget.z - this._pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < .35) { this.flyTarget = null; this._steer(dt, 0, 0); return; }
    const k = Math.min(1, 4 * dt);
    this.yaw = lerpAng(this.yaw, Math.atan2(-dx, -dz), k);
    this._steer(dt, dx / dist * Math.min(SPEED, dist * 3), dz / dist * Math.min(SPEED, dist * 3));
  }

  // Inercia de mariposa: la velocidad persigue la deseada; rumbo y alabeo siguen a la velocidad.
  _steer(dt, dx, dz) {
    const k = 1 - Math.exp(-(Math.hypot(dx, dz) < .01 ? 18 : 10) * dt);
    this._vel.x += (dx - this._vel.x) * k;
    this._vel.z += (dz - this._vel.z) * k;
    const beforeX = this._pos.x, beforeZ = this._pos.z;
    this.moveBy(this._vel.x * dt, this._vel.z * dt);
    if (this.flyTarget && Math.hypot(this._pos.x-beforeX, this._pos.z-beforeZ) < .001) {
      this._stuck = (this._stuck || 0) + dt;
      if (this._stuck > .5) this.stop();
    } else this._stuck = 0;
    const v = Math.hypot(this._vel.x, this._vel.z);
    if (v > .4 && !this.flyTarget) this.yaw = lerpAng(this.yaw, Math.atan2(-this._vel.x, -this._vel.z), Math.min(1, 7 * dt));
    const rumbo = Math.atan2(-this._vel.x, -this._vel.z);
    const giro = Math.sin(rumbo - this.yaw);
    this._bank += (Math.max(-1, Math.min(1, giro * 1.4)) - this._bank) * Math.min(1, 5 * dt);
    if (v > .4) this._fase = Math.min(1, this._fase + dt * 3); else this._fase = Math.max(0, this._fase - dt * 2);
  }

  // Movimiento con deslizamiento por ejes; también lo usa TourController.
  // Solo horizontal: la altura la pone el vuelo (_apply).
  moveBy(dx, dz) {
    const p = this._pos, r = RADIUS;
    // Subpasos espaciales: los fotogramas lentos no atraviesan muros estrechos.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx,dz)/.1));
    for (let i=0;i<steps;i++) {
      const nx = p.x + dx/steps;
      if (!this.world.blocks(nx,p.z,r)) p.x=nx;
      const nz = p.z + dz/steps;
      if (!this.world.blocks(p.x,nz,r)) p.z=nz;
    }
    const L = this.world.limit;
    p.x = Math.max(-L, Math.min(L, p.x));
    p.z = Math.max(-L, Math.min(L, p.z));
  }

  // Pose por frame: altura sobre el terreno, aleteo y cámara perseguidora.
  _apply(dt = 0) {
    const p = this._pos;
    const gy = this.world.groundAt(p.x, p.z);
    // La altura sigue al terreno suavemente: al despegar de una meseta la mariposa se
    // desliza, no cae. La cámara cuelga de p.y, así que subir no la descoloca.
    p.y += (gy + this.alt - p.y) * Math.min(1, 5 * dt);
    if (this.followCam) this.orbitYaw = lerpAng(this.orbitYaw, this.yaw, Math.min(1, 2.5 * dt));
    const v = this._vel.length(), s01 = Math.min(1, v / SPEED);
    if (this.avatar) {
      const t = performance.now() / 1000;
      const bob = QUIETO ? 0 : Math.sin(t * (10 + s01 * 8)) * (.04 + s01 * .03);
      this.avatar.group.position.set(p.x, p.y + bob, p.z);
      this.avatar.group.rotation.y = this.yaw;
      this.avatar.update(t, QUIETO ? s01 * .4 : s01, QUIETO ? 0 : this._bank);
    }
    // cámara: detrás y encima, orbitada por el jugador
    const R = 4.8, cp = Math.max(-.05, Math.min(1.05, this.orbitPitch));
    const sy = Math.sin(this.orbitYaw), cy = Math.cos(this.orbitYaw);
    this.camera.position.set(p.x + sy * R * Math.cos(cp), p.y + 1.1 + R * Math.sin(cp), p.z + cy * R * Math.cos(cp));
    this.camera.lookAt(p.x, p.y + .5, p.z);
  }
}
