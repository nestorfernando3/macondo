import * as THREE from 'three';
import { LOCATIONS } from '../data/locations.js';

// Faro de destino del recorrido guiado: esfera emisiva + columna translúcida
// que pulsa sobre el lugar al que se camina. Referencia visual, no física:
// no participa en colisiones ni en la interacción.
const QUIETO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createBeacon(scene, world) {
  const group = new THREE.Group();
  group.visible = false;
  const esfera = new THREE.Mesh(
    new THREE.SphereGeometry(.34, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd272, emissive: 0xffb84d, emissiveIntensity: 1.1, roughness: .4 })
  );
  const columna = new THREE.Mesh(
    new THREE.CylinderGeometry(.2, .32, 6.5, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd272, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide })
  );
  columna.position.y = 3.25;
  group.add(esfera, columna);
  scene.add(group);

  return {
    get visible() { return group.visible; },   // para verificación CDP
    set(locationId) {
      const l = LOCATIONS[locationId];
      if (!l) return;
      group.position.set(l.x, world.groundAt(l.x, l.z) + .55, l.z);
      group.visible = true;
    },
    clear() { group.visible = false; },
    update(t) {
      if (!group.visible || QUIETO) return;
      const latido = Math.sin(t * 3);
      esfera.scale.setScalar(1 + latido * .12);
      esfera.material.emissiveIntensity = 1.1 + latido * .35;
      columna.material.opacity = .13 + latido * .05;
    },
  };
}
