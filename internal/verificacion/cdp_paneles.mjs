// Paneles de la interfaz: que abran todos y que ninguno se salga de la familia de controles.
//
// Nació de un barrido real: tres controles (#restart-tutorial, #quality-mode y #discovery-write)
// se habían quedado sin regla y salían con el gris del sistema —fondo #efefef, borde negro,
// radio 0, la mitad de altos que sus vecinos—, lo que rompe el papel del resto de los paneles
// sin que ninguna prueba se enterara. El ojo lo pasa por alto porque el control «funciona»;
// el color no. Se busca la firma nativa en TODOS los controles del documento, abiertos o no:
// un diálogo cerrado igual resuelve sus colores.
import { abrir } from './arnes.mjs';

const s = await abrir({ autoplay: true });
await s.entrar({ omitirVuelo: true });

// 1. Todos los paneles abren.
const paneles = [
  ['#open-map', '#map'],
  ['#open-discoveries', '#discoveries'],
  ['#help-btn', '#help'],
];
for (const [boton, panel] of paneles) {
  await s.clic(boton);
  await s.esperar(`document.querySelector('${panel}').open`, { tope: 3000 });
  s.afirmar(await s.js(`document.querySelector('${panel}').open`), `${panel} no abrió con ${boton}`);
  await s.js(`document.querySelector('${panel}').close()`);
}
for (const [id, rotulo] of [['silla-quien-falta', 'historia'], ['cuaderno-mirador', 'cuaderno']]) {
  await s.js(`window.__macondo.director.open('${id}')`);
  await s.esperar(`document.querySelector('#story').open || document.querySelector('#writing').open`, { tope: 3000 });
  if (rotulo === 'cuaderno') {
    s.afirmar(await s.js(`document.querySelector('#writing').open`), 'el cuaderno no abrió');
    await s.captura('paneles_cuaderno');
    await s.js(`document.querySelector('#writing').close()`);
  } else {
    s.afirmar(await s.js(`document.querySelector('#story').open`), 'la historia no abrió');
    await s.js(`document.querySelector('#story').close()`);
  }
}

// 2. Ningún control se quedó con el aspecto del navegador.
const nativos = JSON.parse(await s.js(`(() => {
  const malos = [], vistos = new Set();
  for (const el of document.querySelectorAll('button, select, input, textarea')) {
    const c = getComputedStyle(el);
    const fondo = c.backgroundColor, borde = c.borderTopColor;
    const esNativo = fondo === 'rgb(239, 239, 239)' || (fondo === 'rgb(255, 255, 255)' && borde === 'rgb(118, 118, 118)');
    if (!esNativo) continue;
    const donde = el.id ? '#' + el.id : (el.closest('[id]')?.id ?? el.tagName.toLowerCase());
    if (vistos.has(donde)) continue;
    vistos.add(donde);
    malos.push(donde + ' «' + (el.textContent || el.type || '').trim().slice(0, 24) + '»');
  }
  return JSON.stringify(malos);
})()`));
s.afirmar(nativos.length === 0, `controles con aspecto del navegador: ${nativos.join(', ')}`);

await s.clic('#help-btn');
await s.esperar(`document.querySelector('#help').open`, { tope: 3000 });
await s.captura('paneles_ayuda');

// 3. Lo esencial de cada panel se ve al abrirlo, sin desplazar a ciegas. Dos paneles escondían
//    su pieza clave bajo el pliegue —la ayuda, «Reiniciar recorrido»; los hallazgos, el mensaje
//    de los seis—, y ninguno de los dos avisaba de que hubiera algo más abajo.
const visibleSinDesplazar = (panel, hijo) => s.js(`(() => {
  const c = document.querySelector('${panel}').getBoundingClientRect();
  const b = document.querySelector('${hijo}').getBoundingClientRect();
  return b.height > 0 && b.top >= c.top - 1 && b.bottom <= c.bottom + 1; })()`);
s.afirmar(await visibleSinDesplazar('#help', '#reset-progress'),
  'la ayuda esconde «Reiniciar recorrido» bajo el pliegue');
await s.js(`document.querySelector('#help').close()`);

for (const [x, z] of [[0, 24], [4.5, -.5], [0, -15.5], [22.5, -11.5], [-29.5, 8], [17, 22]]) {
  await s.js(`window.__macondo.player.place(${x}, ${z}, 0)`);
  await new Promise(r => setTimeout(r, 450));
}
await s.clic('#open-discoveries');
await s.esperar(`document.querySelector('#discoveries').open`, { tope: 3000 });
s.afirmar(await s.js(`document.querySelector('#open-discoveries').textContent.includes('6/6')`),
  'los seis hallazgos no se recogieron');
s.afirmar(await visibleSinDesplazar('#discoveries', '#discovery-complete'),
  'el mensaje de la recompensa queda bajo el pliegue');
await s.captura('paneles_recompensa');
await s.cerrar();
