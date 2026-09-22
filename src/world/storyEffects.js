// Adaptadores visuales de las historias: traducen effectId a objetos del mundo.
// Registro cerrado: el contenido (IDs y textos) nunca produce código ni HTML;
// solo activa los efectos declarados aquí. set() es idempotente por storyId.
//
// Ninguna coordenada se repite: lo que se posa encima de una pieza lee la misma ancla que
// la pieza (src/world/anclas.js), así que mover la mesa o la banca mueve también su objeto.
import * as THREE from 'three';
import { ancla, superficieDe } from './anclas.js';
import { geoPetalo, geoBrizna, fusionarGeometrias } from './flora.js';
import { BANCA_DEL_CORREO } from './places/puerto.js';

const blanco = new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: .85 });

function garden(scene, rainy) {
  const group = new THREE.Group(), tree = ancla('arbol-tiempo');
  const material = new THREE.MeshStandardMaterial({color:rainy ? 0x829db0 : 0xffd18c, roughness:1});
  // Pétalos de verdad —la lámina acucharada de flora.js— en vez de icosaedros: el efecto se
  // mira de cerca, a la altura de la copa, y una piedra de color no dice «pétalo». Los 18
  // van fundidos en una sola malla (el grupo se retira entero y se libera de una vez) y cada
  // uno se acuesta o se yergue según el tiempo: en el suelo, o flotando entre las ramas.
  const trozos = [];
  for (let i=0;i<18;i++) {
    const angle=i*2.4, r=.8+(i%4)*.45;
    trozos.push(geoPetalo({ largo: .3, ancho: .19, segLargo: 2, centrado: true }).clone()
      .rotateX(rainy ? (i%3-1)*.22 : -Math.PI/2 + (i%3-1)*.45)
      .rotateY(angle*1.7)
      .translate(tree.x+Math.cos(angle)*r, rainy?.09:4.7+(i%3)*.25, tree.z+Math.sin(angle)*r));
  }
  // El penacho de hierba al pie, que antes era un cono suelto.
  for (let i=0;i<5;i++) {
    trozos.push(geoBrizna({ ancho: .09, curva: .3, segLargo: 2 }).clone()
      .scale(1, rainy?.6:.18, rainy?.6:.18)
      .rotateZ((i%3-1)*.3).rotateY(i*1.3)
      .translate(tree.x+1.4+(i%2)*.12, .01, tree.z+(i>2?.1:-.08)));
  }
  const follaje = new THREE.Mesh(fusionarGeometrias(trozos), material);
  group.add(follaje);
  const light=new THREE.PointLight(rainy?0xa4cfff:0xffcf80,8,8,2);
  light.position.set(tree.x,3,tree.z); group.add(light);
  scene.add(group); return group;
}
function labels(scene) {
  const group=new THREE.Group(), anchor=ancla('etiquetas');
  for (const [i,text] of ['llave','jarra','carrete'].entries()) {
    const material=new THREE.MeshBasicMaterial({color:0xfff4d4,side:THREE.DoubleSide});
    if (typeof document !== 'undefined') {
      const canvas=document.createElement('canvas'); canvas.width=256; canvas.height=96;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff4d4'; ctx.fillRect(0,0,256,96);
      ctx.fillStyle='#252118'; ctx.font='bold 46px sans-serif'; ctx.textAlign='center'; ctx.fillText(text,128,63);
      material.map=new THREE.CanvasTexture(canvas);
    }
    const label=new THREE.Mesh(new THREE.PlaneGeometry(.52,.2),material);
    label.position.set(anchor.x+(i-1)*.55, .88, anchor.z+.31); group.add(label);
  }
  scene.add(group); return group;
}
export const EFFECTS = {
  'jardin.clara': {build:scene=>garden(scene,false)},
  'jardin.lluvia': {build:scene=>garden(scene,true)},
  'etiquetas.nombradas': {build:labels},
  // La mesa del patio queda preparada para dos: taza extra junto a las existentes.
  'silla.taza-extra': {
    build(scene) {
      const mesa = ancla('objeto-mesa');
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(.09, .075, .14, 10), blanco);
      cup.position.set(mesa.x - .65, superficieDe('objeto-mesa', 0) + .07, mesa.z + .3);
      cup.castShadow = true;
      scene.add(cup);
      return cup;
    },
  },
  // La carta se pliega y queda sobre la banca del muelle.
  'correo.carta-plegada': {
    build(scene) {
      const letter = new THREE.Mesh(new THREE.BoxGeometry(.22, .015, .16), blanco);
      letter.position.set(BANCA_DEL_CORREO.x, BANCA_DEL_CORREO.superficie + .008, BANCA_DEL_CORREO.z);
      letter.rotation.y = .4;
      letter.castShadow = true;
      scene.add(letter);
      return letter;
    },
  },
};

export function createStoryEffects(scene) {
  const active = new Map(); // storyId → { effectId, object }
  function drop(storyId) {
    const cur = active.get(storyId);
    if (!cur) return;
    scene.remove(cur.object);
    cur.object.traverse(object => {
      object.geometry?.dispose?.();
      if (object.material && object.material !== blanco) {
        object.material.map?.dispose?.(); object.material.dispose();
      }
    });
    active.delete(storyId);
  }
  return {
    has(storyId) { return active.has(storyId); },
    // Aplica o retira la consecuencia visible de un resultado (idempotente).
    set(storyId, effectId) {
      const cur = active.get(storyId);
      if (cur?.effectId === effectId) return;
      drop(storyId);
      if (!effectId || !EFFECTS[effectId]) return;
      active.set(storyId, { effectId, object: EFFECTS[effectId].build(scene) });
    },
    dispose() { for (const id of [...active.keys()]) drop(id); },
  };
}
