import { NODES, LOCATION_NODE } from '../data/locations.js';
import { planearRuta } from './RoutePlanner.js';
import { HOVER } from './PlayerController.js';

// Recorrido automático sobre el grafo de caminos. Pausa en cada llegada;
// cualquier movimiento manual o «Detener» cancela de inmediato.
// Nunca hay dos controladores activos: main.js decide quién mueve.
//
// La ruta la traza RoutePlanner: entra y sale del grafo por un nodo al que de verdad se llega en
// línea recta y sólo usa aristas despejadas a la altura de vuelo. Antes el primer tramo se trazaba
// al nodo más cercano sin mirar qué había en medio —una de cada cinco posiciones del pueblo tiene
// esa recta tapada— y el vuelo se estrellaba contra lo que hubiera.
//
// Si a la altura de crucero no hay salida, se prueba un poco más arriba: el jugador puede haber
// entrado volando a un corral de tapias de 2,6 m (el patio de la casa, el del puerto) y desde
// dentro no hay calle a la que salir a 2,1 m. El tramo de salida se vuela a esa altura y el resto
// vuelve al crucero, así que se ve subir sobre la tapia y bajar a la calle, que es lo que haría
// cualquiera.
export const ALTURAS_SALIDA = [HOVER, 3.6];

export class TourController {
  constructor(player, { onArrive, onLeg, speed = 2.2 } = {}) {
    this.player = player;
    this.onArrive = onArrive;   // (locationId) => void
    this.onLeg = onLeg;         // ({destination, legIndex, legCount}) => void
    this.speed = speed;         // m/s (1,7 en modo narrado)
    this.active = false;
    this.paused = false;
  }

  // Inicia ruta hacia un lugar. from: posición actual del jugador.
  startTo(locationId, from) {
    const meta = NODES[LOCATION_NODE[locationId] ?? locationId];
    if (!meta) return false;
    let pts = null;
    let salida = HOVER;
    for (const altura of ALTURAS_SALIDA) {
      pts = planearRuta(this.player.world, [from.x, from.z], meta, { altura, siemprePorGrafo: true });
      if (pts) { salida = altura; break; }
    }
    if (!pts) return false;
    // Sólo el primer tramo —el que sale del cerco— va alto; en la calle se vuelve al crucero.
    this.points = pts.map(([x, z], i) => ({ x, z, alt: i === 0 ? salida : HOVER }));
    this.dest = locationId;
    this.i = 0;
    this.active = true;
    this.paused = false;
    this.onLeg?.({ destination:locationId, legIndex:0, legCount:this.points.length - 1 });
    return true;
  }

  stop() { this.active = false; this.paused = false; }

  pause() { if (this.active) this.paused = true; }
  resume() { this.paused = false; }

  // Devuelve true si consumió el frame (el jugador no debe moverse manualmente).
  update(dt) {
    if (!this.active || this.paused) return this.active && this.paused;
    const p = this.player;
    const target = this.points[this.i];
    const dx = target.x - p.position.x, dz = target.z - p.position.z;
    const dist = Math.hypot(dx, dz);

    // Detector de atasco: sin progreso real durante 1,2 s → saltar el punto de giro.
    if (this._lastDist !== undefined && dist > this._lastDist - .02) {
      this._stall = (this._stall || 0) + dt;
      if (this._stall > 1.2) {
        this._stall = 0; this._lastDist = undefined;
        this.i = Math.min(this.i + 1, this.points.length - 1);
        return true;
      }
    } else { this._stall = 0; this._lastDist = dist; }

    if (dist < 0.25) {
      this.i++;
      this._stall = 0; this._lastDist = undefined; // nuevo tramo: reiniciar detector
      if (this.i >= this.points.length) {
        this.active = false;
        this.onArrive?.(this.dest);
        return true;
      }
      this.onLeg?.({ destination:this.dest, legIndex:this.i, legCount:this.points.length - 1 });
      return true;
    }

    // Orientar suavemente hacia el objetivo y avanzar a velocidad del spec.
    const desired = Math.atan2(-dx, -dz); // yaw tal que adelante apunte a target
    let diff = desired - p.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.yaw += Math.max(-3.5*dt, Math.min(3.5*dt, diff));

    const ux = dx / dist, uz = dz / dist;
    // La altura del tramo la manda la ruta, no la mirada: durante el recorrido el mando no llega
    // al jugador, así que fijarla aquí es lo que hace que el tramo de salida suba sobre la tapia.
    if (target.alt) p.alt = target.alt;
    // Avanzar directo (el grafo ya garantiza camino válido); colisión por seguridad.
    // Vuela con la inercia y el alabeo de la mariposa; el rumbo lo dirige el tour.
    p.flyAlong(dt, ux * this.speed, uz * this.speed);
    p._apply(dt);
    return true;
  }
}
