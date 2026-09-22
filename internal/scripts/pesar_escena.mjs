// Reparto de triángulos del pueblo por malla (cuenta × caras), de mayor a menor.
// Es la herramienta para decidir dónde recortar: el presupuesto del paseo son las llamadas
// de dibujo y los triángulos por encuadre, y aquí se ve qué pieza se los come.
//
// Uso: node internal/scripts/pesar_escena.mjs
import * as THREE from 'three';
import { createVillage } from '../../src/world/createVillage.js';

const scene = new THREE.Scene();
createVillage({ scene, camera: new THREE.PerspectiveCamera() });
const filas = [];
scene.traverse(o => {
  if (!o.isMesh) return;
  const g = o.geometry;
  const caras = (g.index ? g.index.count : g.attributes.position.count) / 3;
  const n = o.isInstancedMesh ? o.count : 1;
  filas.push({ tipo: o.isInstancedMesh ? 'instancia' : 'suelta', n, caras: Math.round(caras), total: Math.round(caras * n), geo: g.type });
});
filas.sort((a, b) => b.total - a.total);
const suma = filas.reduce((s, f) => s + f.total, 0);
const sueltas = filas.filter(f => f.tipo === 'suelta').length;
console.log(`TOTAL triángulos: ${suma} | mallas: ${filas.length} (${sueltas} sueltas, ${filas.length - sueltas} instanciadas)`);
console.log(filas.slice(0, 18).map(f => `${String(f.total).padStart(7)} = ${String(f.n).padStart(4)} × ${String(f.caras).padStart(4)} ${f.tipo} ${f.geo}`).join('\n'));
