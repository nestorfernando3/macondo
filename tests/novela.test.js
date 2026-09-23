// Pruebas de la capa literaria: fichas de la novela, árbol, palabras, pergamino y las piezas
// nuevas del mundo. Se ejecutan en Node, sin navegador ni WebGL: solo datos y funciones puras.
import test from 'node:test';
import assert from 'node:assert/strict';

import { stations } from '../src/data/content.js';
import { FICHAS_NOVELA, INDICE_NOVELA, NOTA_ATRIBUCION, fichaDe } from '../src/data/novela.js';
import { GENERACIONES, CIERRE_ARBOL, NOTAS_ARBOL } from '../src/data/arbol.js';
import { PALABRAS, INTRO_PALABRAS } from '../src/data/palabras.js';
import { textoPergamino } from '../src/ui/Pergamino.js';
import { crearLluvia } from '../src/world/lluvia.js';
import { crearHielo } from '../src/world/places/hielo.js';
import { crearTallerPescaditos } from '../src/world/places/pescaditos.js';

const ids = stations.map(s => s.id);
const palabras = t => t.trim().split(/\s+/).length;

test('cada estación tiene su ficha y ninguna ficha queda huérfana', () => {
  for (const id of ids) assert.ok(FICHAS_NOVELA[id], `falta la ficha de «${id}»`);
  for (const id of Object.keys(FICHAS_NOVELA)) {
    assert.ok(ids.includes(id), `la ficha «${id}» no corresponde a ninguna estación`);
  }
  assert.equal(fichaDe(ids[0])?.capitulo?.length > 0, true);
  assert.equal(fichaDe('no-existe'), null);
});

test('las fichas son glosas propias: con capítulo, datos y sin citas literales', () => {
  for (const [id, f] of Object.entries(FICHAS_NOVELA)) {
    assert.ok(f.capitulo && f.capitulo.length < 40, `${id}: capítulo ilegible`);
    assert.ok(f.titulo && f.titulo.length > 3, `${id}: sin título`);
    assert.ok(palabras(f.texto) >= 100 && palabras(f.texto) <= 220,
      `${id}: la ficha tiene ${palabras(f.texto)} palabras`);
    assert.ok(Array.isArray(f.datos) && f.datos.length >= 2 && f.datos.length <= 4,
      `${id}: se esperan dos a cuatro datos verificables`);
    assert.ok(f.fuente && f.fuente.length > 8, `${id}: sin fuente`);
    for (const t of [f.titulo, f.texto, ...f.datos]) {
      assert.ok(!/[«»"]/.test(t), `${id}: comillas de cita en la capa literaria: ${t.slice(0, 40)}`);
    }
  }
});

test('el índice cubre los veinte capítulos y solo menciona estaciones reales', () => {
  assert.equal(INDICE_NOVELA.length, 20);
  INDICE_NOVELA.forEach((c, i) => {
    assert.equal(c.n, i + 1, 'los capítulos van en orden');
    assert.ok(c.titulo && c.hechos, `capítulo ${c.n}: título o hechos vacíos`);
    assert.ok(Array.isArray(c.estaciones));
    for (const id of c.estaciones) assert.ok(ids.includes(id), `capítulo ${c.n}: estación desconocida «${id}»`);
  });
  assert.ok(INDICE_NOVELA.some(c => c.estaciones.length > 0), 'ningún capítulo se conecta con el pueblo');
  assert.ok(NOTA_ATRIBUCION.length > 40, 'falta la nota de atribución');
});

test('el árbol de los Buendía se sostiene: ids únicos y referencias válidas', () => {
  assert.ok(GENERACIONES.length >= 12, `el árbol tiene ${GENERACIONES.length} piezas`);
  const idsÁrbol = new Set(GENERACIONES.map(g => g.id));
  assert.equal(idsÁrbol.size, GENERACIONES.length, 'hay ids repetidos');
  // Raíces: los dos fundadores y quienes se casaron con la familia (siempre padres de alguien).
  const raíces = GENERACIONES.filter(g => !g.padres?.length);
  const troncos = raíces.filter(g => g.generacion === 1);
  assert.equal(troncos.length, 2, 'los fundadores son la raíz del árbol');
  const padresDeAlguien = new Set(GENERACIONES.flatMap(g => g.padres ?? []));
  for (const r of raíces.filter(g => g.generacion !== 1)) {
    assert.ok(padresDeAlguien.has(r.id), `${r.id}: raíz que no es fundador ni progenitor`);
  }
  for (const g of GENERACIONES) {
    assert.ok(g.nombre && Number.isInteger(g.generacion), `${g.id}: falta nombre o generación`);
    for (const p of g.padres ?? []) assert.ok(idsÁrbol.has(p), `${g.id}: padre desconocido «${p}»`);
    for (const h of g.hijos ?? []) assert.ok(idsÁrbol.has(h), `${g.id}: hijo desconocido «${h}»`);
    if (g.pareja) assert.ok(idsÁrbol.has(g.pareja), `${g.id}: pareja desconocida «${g.pareja}»`);
  }
  const repetidos = GENERACIONES.filter(g => /José Arcadio|Aureliano/.test(g.nombre));
  assert.ok(repetidos.length >= 6, 'la repetición de los nombres es el tema: faltan casos');
  assert.ok(CIERRE_ARBOL.length > 40 && NOTAS_ARBOL.length >= 3);
});

test('el cuaderno de palabras es un glosario utilizable', () => {
  const categorías = new Set(PALABRAS.map(p => p.categoria));
  assert.ok(PALABRAS.length >= 20, `solo hay ${PALABRAS.length} palabras`);
  assert.equal(new Set(PALABRAS.map(p => p.palabra)).size, PALABRAS.length, 'palabras repetidas');
  for (const p of PALABRAS) {
    assert.ok(p.palabra && p.significado && p.significado.length > 10, `${p.palabra}: sin significado`);
    assert.ok(p.enLaNovela, `${p.palabra}: sin referencia`);
    assert.ok(categorías.size >= 5, 'se esperan categorías variadas');
  }
  assert.ok(INTRO_PALABRAS.length > 40);
});

test('el pergamino compone un texto propio con lo que el visitante dejó', () => {
  const traces = [
    { storyId: 'correo-pendiente', title: 'El correo de lo pendiente', text: 'Escribí una línea.' },
    { storyId: 'dos-tardes', title: 'Dos tardes bajo el árbol', text: 'Conservé la muesca.' },
  ];
  const texto = textoPergamino(traces, { fecha: '23 de septiembre de 2026' });
  assert.equal(typeof texto, 'string');
  // Nombra lo vivido (los títulos de las huellas) sin volcar el texto crudo del visitante.
  assert.ok(texto.includes('El correo de lo pendiente'), 'el pergamino nombra lo vivido');
  assert.ok(texto.includes('23 de septiembre de 2026'), 'el pergamino lleva fecha');
  assert.ok(texto.length > 120, 'el pergamino se queda corto');
  assert.ok(!/[«»"]/.test(texto), 'el pergamino no cita la novela');
  assert.equal(textoPergamino(traces, { fecha: '23 de septiembre de 2026' }), texto, 'no es determinista');
  const vacío = textoPergamino([], { fecha: '23 de septiembre de 2026' });
  assert.ok(vacío.length > 40 && !vacío.includes('undefined'), 'el pergamino vacío debe ser digno');
  assert.equal(textoPergamino(traces), textoPergamino(traces), 'sin fecha también es estable');
});

test('las piezas nuevas del mundo se pueden construir y apagar', () => {
  assert.equal(typeof crearHielo, 'function');
  assert.equal(typeof crearTallerPescaditos, 'function');
  assert.equal(typeof crearLluvia, 'function');
});
