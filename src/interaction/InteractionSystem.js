// Proximidad, oclusión y selección. No abre contenido automáticamente:
// emite eventos semánticos que main.js traduce a UI.

export class InteractionSystem {
  constructor(player, world) {
    this.player = player;
    this.world = world;
    this.items = [];              // {id, x, z, radius, label, contentId, y}
    this.current = null;
  }

  setItems(items) { this.items = items; this.current = null; }

  // Llamar por frame con la posición del jugador. Devuelve el objeto cercano actual.
  update(x, z, y = 0) {
    let best = null, bestD = Infinity;
    for (const it of this.items) {
      const dy = Math.abs((it.y ?? 0) + (it.eyeY ?? 1.65) - y);
      const d = Math.hypot(it.x - x, it.z - z);
      if (d <= it.radius && d < bestD) {
        if (dy > 2) continue; // interactuable en otro nivel (p. ej. mirador)
        if (!this.world.lineOfSight(x, z, it.x, it.z)) continue;
        best = it; bestD = d;
      }
    }
    this.current = best;
    return best;
  }

  // Acción del jugador (E / clic / botón táctil) sobre el objeto actual.
  tryInteract(onOpen) {
    if (this.current && this.player) onOpen(this.current);
  }
}
