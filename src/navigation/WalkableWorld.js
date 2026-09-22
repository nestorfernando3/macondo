import * as THREE from 'three';

// Límites, colisiones y consulta de altura. Geometría independiente del arte:
// los obstáculos se registran como cajas alineadas a ejes (x1,z1,x2,z2) o círculos.

export class WalkableWorld {
  constructor() {
    this.boxes = [];      // {x1,z1,x2,z2}
    this.circles = [];    // {x,z,r}
    this.ramps = [];      // {x1,z1,x2,z2, y(x,z)}
    this.plateaus = [];   // {x,z,r,h}
    this.sightBlocks = []; // {x1,z1,x2,z2} — lo que tapa la vista (muros altos)
    this.limit = 38;      // media-anchura del área caminable
  }

  addBox(x1, z1, x2, z2) { this.boxes.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2) }); }
  addCircle(x, z, r) { this.circles.push({ x, z, r }); }
  addRamp(x1, z1, x2, z2, fn) { this.ramps.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2), fn }); }
  // Meseta circular: altura constante dentro del radio.
  addPlateau(x, z, r, h) { this.plateaus.push({ x, z, r, h }); }
  // Lo que tapa la vista: sólo piezas altas (muros, no setos ni bancas). Un seto de 1,1 m
  // no oculta nada a la mariposa, que vuela a 2,1 m.
  addSight(x1, z1, x2, z2) { this.sightBlocks.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2) }); }

  // ¿Un círculo de radio r centrado en (x,z) choca con algo?
  blocks(x, z, r) {
    for (const b of this.boxes)
      if (x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) return true;
    for (const c of this.circles) {
      const dx = x - c.x, dz = z - c.z;
      if (dx*dx + dz*dz < (c.r + r) ** 2) return true;
    }
    return false;
  }

  groundAt(x, z) {
    for (const rp of this.ramps)
      if (x >= rp.x1 && x <= rp.x2 && z >= rp.z1 && z <= rp.z2) return rp.fn(x, z);
    for (const pl of this.plateaus) {
      const dx = x - pl.x, dz = z - pl.z;
      if (dx * dx + dz * dz <= pl.r * pl.r) return pl.h;
    }
    return 0;
  }

  // Línea de visión simple para interacción: el segmento no cruza muros altos.
  lineOfSight(ax, az, bx, bz) {
    const steps = Math.ceil(Math.hypot(bx-ax, bz-az) / .5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps, x = ax + (bx-ax)*t, z = az + (bz-az)*t;
      for (const b of this.sightBlocks)
        if (x > b.x1 && x < b.x2 && z > b.z1 && z < b.z2) return false;
    }
    return true;
  }
}
