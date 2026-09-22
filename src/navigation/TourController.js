import { NODES, LOCATION_NODE, routePointsFrom } from '../data/locations.js';

// Recorrido automático sobre el grafo de caminos. Pausa en cada llegada;
// cualquier movimiento manual o «Detener» cancela de inmediato.
// Nunca hay dos controladores activos: main.js decide quién mueve.

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
    const pts = routePointsFrom(from.x, from.z, locationId);
    if (!pts) return false;
    this.points = pts.map(([x, z]) => ({ x, z }));
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

    const step = Math.min(dist, this.speed * dt);
    const ux = dx / dist, uz = dz / dist;
    // Avanzar directo (el grafo ya garantiza camino válido); colisión por seguridad.
    // Vuela con la inercia y el alabeo de la mariposa; el rumbo lo dirige el tour.
    p.flyAlong(dt, ux * this.speed, uz * this.speed);
    p._apply(dt);
    return true;
  }
}
