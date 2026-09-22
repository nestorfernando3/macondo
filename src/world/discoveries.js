import * as THREE from 'three';
import { DISCOVERIES } from '../data/discoveries.js';
import { NODES } from '../data/locations.js';

// Seis semillas doradas: se recogen al pasar, nunca bloquean el recorrido.
export function createDiscoveries(scene, world, found, onDiscover) {
  const geometry = new THREE.OctahedronGeometry(.19);
  const material = new THREE.MeshStandardMaterial({ color:0xffd16a, emissive:0xba751e, emissiveIntensity:.5, roughness:.3 });
  const items = DISCOVERIES.map(data => {
    const [x,z] = NODES[data.node];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,world.groundAt(x,z)+2.1,z);
    mesh.visible = !found.has(data.id); scene.add(mesh);
    return { data, mesh, y:mesh.position.y };
  });
  return {
    update(position,t,animate=true) {
      for (let i=0;i<items.length;i++) {
        const {data,mesh,y} = items[i];
        mesh.visible = !found.has(data.id);
        if (!mesh.visible) continue;
        if (animate) { mesh.rotation.y=t*.8+i; mesh.position.y=y+Math.sin(t*1.8+i)*.16; }
        if (Math.hypot(position.x-mesh.position.x,position.z-mesh.position.z)<1.7 && Math.abs(position.y-y)<1.5) {
          found.add(data.id); mesh.visible=false; onDiscover(data);
        }
      }
    },
    reset() { for (const item of items) item.mesh.visible=true; },
  };
}
