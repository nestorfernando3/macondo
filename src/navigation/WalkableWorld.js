import * as THREE from 'three';

// Límites, colisiones y consulta de altura. Geometría independiente del arte:
// los obstáculos se registran como cajas alineadas a ejes (x1,z1,x2,z2) o círculos.
//
// Los obstáculos tienen ALTURA. La mariposa vuela, así que una reja de un metro, una banca o
// una piedra de la falda sólo la detienen si va por debajo de su remate; los muros, las casas,
// los troncos y el agua no se pasan nunca (alto = Infinity, el valor por omisión). Sin esto, la
// meseta del mirador quedaba cercada por dos anillos invisibles que bloqueaban a cualquier
// altura y el vuelo la rodeaba sin poder entrar.
//
// `alto` es una Y ABSOLUTA del mundo (el remate de la pieza tal como se dibuja), no una altura
// sobre el suelo: el mismo valor sirve para una banca en la plaza y para la baranda del mirador,
// que está tres metros más arriba.

export class WalkableWorld {
  constructor() {
    this.boxes = [];      // {x1,z1,x2,z2,alto}
    this.circles = [];    // {x,z,r,alto}
    this.ramps = [];      // {x1,z1,x2,z2, y(x,z)}
    this.faldas = [];     // {x,z,rInt,rExt,h} — falda cónica de un cerro
    this.plateaus = [];   // {x,z,r,h}
    this.sightBlocks = []; // {x1,z1,x2,z2} — lo que tapa la vista (muros altos)
    this.limit = 38;      // media-anchura del área caminable
  }

  // `base` es el suelo del obstáculo: sirve para lo que está en el aire —el tejado de un patio,
  // un alero—, que bloquea por encima de su base y no por debajo. Por omisión -Infinity: todo
  // obstáculo normal llega hasta el suelo.
  addBox(x1, z1, x2, z2, alto = Infinity, base = -Infinity) { this.boxes.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2), alto, base }); }
  addCircle(x, z, r, alto = Infinity, base = -Infinity) { this.circles.push({ x, z, r, alto, base }); }
  addRamp(x1, z1, x2, z2, fn) { this.ramps.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2), fn }); }
  // Falda de un cerro: `h` dentro del radio interior y bajada lineal hasta el suelo en el
  // exterior. Es lo que hace que la mariposa suba con la ladera del mirador en vez de
  // atravesarla: sin falda, el cerro era un escalón invisible de tres metros.
  addFalda(x, z, rInt, rExt, h) { this.faldas.push({ x, z, rInt, rExt, h }); }
  // Meseta circular: altura constante dentro del radio.
  addPlateau(x, z, r, h) { this.plateaus.push({ x, z, r, h }); }
  // Lo que tapa la vista: sólo piezas altas (muros, no setos ni bancas). Un seto de 1,1 m
  // no oculta nada a la mariposa, que vuela a 2,1 m.
  addSight(x1, z1, x2, z2) { this.sightBlocks.push({ x1:Math.min(x1,x2), z1:Math.min(z1,z2), x2:Math.max(x1,x2), z2:Math.max(z1,z2) }); }

  // ¿Un círculo de radio r centrado en (x,z) a la altura y choca con algo? Sin `y` la
  // consulta es a ras de suelo, que es como la leen los invariantes y el recorrido guiado:
  // ahí todo obstáculo bloquea, tenga la altura que tenga.
  blocks(x, z, r, y = 0) {
    for (const b of this.boxes)
      if (y < b.alto && y > b.base && x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) return true;
    for (const c of this.circles) {
      if (y >= c.alto || y <= c.base) continue;
      const dx = x - c.x, dz = z - c.z;
      if (dx*dx + dz*dz < (c.r + r) ** 2) return true;
    }
    return false;
  }

  groundAt(x, z) {
    for (const rp of this.ramps)
      if (x >= rp.x1 && x <= rp.x2 && z >= rp.z1 && z <= rp.z2) return rp.fn(x, z);
    for (const f of this.faldas) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d <= f.rInt) return f.h;
      if (d < f.rExt) return f.h * (f.rExt - d) / (f.rExt - f.rInt);
    }
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
