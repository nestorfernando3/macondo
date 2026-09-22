import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVillage } from '../src/world/createVillage.js';
import { riverHeight, fountainDrop } from '../src/world/water.js';
import { DISCOVERIES, restoreDiscoveries } from '../src/data/discoveries.js';
import { NODES } from '../src/data/locations.js';
import { createDiscoveries } from '../src/world/discoveries.js';
import { PlayerController } from '../src/navigation/PlayerController.js';
import { WalkableWorld } from '../src/navigation/WalkableWorld.js';

test('agua acotada sobre el suelo y gotas dentro de la taza', () => {
  for (let t=0;t<10;t+=.07) {
    assert.ok(riverHeight(-31,8,t)>.04 && riverHeight(-31,8,t)<.13);
    for (let i=0;i<96;i++) {
      const p=fountainDrop(i,t);
      assert.ok(p.y>.65 && p.y<2);
      assert.ok(Math.hypot(p.x,p.z)<.95);
    }
  }
});
test('los seis hallazgos están en puntos libres y se recogen una sola vez', () => {
  const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera();
  const {world}=createVillage({scene,camera});
  const found=new Set(), notices=[];
  const d=createDiscoveries(scene,world,found,item=>notices.push(item.id));
  for (const item of DISCOVERIES) {
    const [x,z]=NODES[item.node];
    assert.equal(world.blocks(x,z,.22),false,item.id);
    const position={x,z,y:world.groundAt(x,z)+2.1};
    d.update(position,1); d.update(position,2);
  }
  assert.equal(found.size,6); assert.equal(notices.length,6);
  assert.deepEqual(restoreDiscoveries([...found,'invalido','rio']),found);
  assert.equal(restoreDiscoveries({}).size,0);
});
test('un desplazamiento grande no atraviesa una pared estrecha', () => {
  const w=new WalkableWorld(); w.addBox(-2,-2.1,2,-2);
  const p=new PlayerController(new THREE.PerspectiveCamera(),w); p.place(0,0);
  p.moveBy(0,-5); assert.ok(p.position.z>-2);
});

test('los efectos conservan su material personalizado', async () => {
  const { crearKit } = await import('../src/world/kit.js');
  const kit=crearKit(new THREE.Scene(),new WalkableWorld());
  const mat=new THREE.MeshStandardMaterial({color:0x9ce7e7});
  const mesh=kit.movil(new THREE.IcosahedronGeometry(1,0),mat,1,(o)=>o.scale.setScalar(.1));
  assert.equal(mesh.material,mat);
});

test('ninguna familia instanciada deja matrices en NaN', () => {
  // Una matriz NaN no lanza: la instancia simplemente no se dibuja. Así estuvo la fuente del
  // pueblo —96 gotas invisibles— porque `banano()` registraba sus hojas sin `rx` y el `tmp`
  // que el kit comparte entre familias quedaba envenenado; las gotas sólo escriben posición y
  // escala, así que heredaban el NaN. La prueba mira el pueblo entero en tres fotogramas: la
  // primera pasada siembra el `tmp` y las siguientes son las que delatan el contagio.
  const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera();
  const pueblo=createVillage({scene,camera});
  for (const t of [0,1.3,2.7]) pueblo.update(t);
  const sucias=new Set();
  scene.traverse(o => {
    if (!o.isInstancedMesh) return;
    const a=o.instanceMatrix.array;
    for (let i=0;i<a.length;i++)
      if (!Number.isFinite(a[i])) { sucias.add(`${o.geometry.type} n=${o.count} color=${o.material.color?.getHexString?.()}`); break; }
  });
  assert.deepEqual([...sucias], [], 'instancias con matriz NaN');
});

test('con prefers-reduced-motion el pueblo se construye igual y sin NaN', () => {
  // La rama `quieto` se lleva por delante aves, humo y polvo, y deja el vaivén del viento en un
  // vuelco fijo. Nadie la probaba, y las briznas del prado dependen de ella. La preferencia se
  // simula antes de construir, que es cuando `crearVida` la lee.
  const previo=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:true});
  try {
    const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera();
    const pueblo=createVillage({scene,camera});
    for (const t of [0,2.3]) pueblo.update(t);
    const sucias=new Set();
    let instancias=0;
    scene.traverse(o => {
      if (!o.isInstancedMesh) return;
      instancias+=o.count;
      const a=o.instanceMatrix.array;
      for (let i=0;i<a.length;i++)
        if (!Number.isFinite(a[i])) { sucias.add(`${o.geometry.type} n=${o.count}`); break; }
    });
    assert.deepEqual([...sucias], [], 'el pueblo quieto dejó instancias en NaN');
    assert.ok(instancias>1000, `el pueblo quieto quedó vacío: ${instancias} instancias`);
  } finally {
    if (previo) globalThis.matchMedia=previo; else delete globalThis.matchMedia;
  }
});
