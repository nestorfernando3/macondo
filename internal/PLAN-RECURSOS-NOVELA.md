# Puente con la novela · contrato de la entrega (23 septiembre 2026)

Complementa `docs/IDEAS-RECURSOS.md` (propuesta) y `docs/EXPANSION-NARRATIVA.md` (escenas).
Esta entrega añade **la capa literaria**: lo que la novela cuenta, frente a lo que esta
instalación inventa.

## Reglas de la casa (no negociables)

- Textos **originales**, en español colombiano y trato de usted. **Ninguna cita literal** de
  la novela en los archivos de esta entrega: la única transcripción literal del proyecto es
  el campo `cita` de la estación `remedios` en `src/data/content.js`, y no se toca.
- Nada de datos inventados: cada afirmación sobre el libro debe poder verificarse en el
  texto (capítulo citado). Los resúmenes, en palabras propias.
- Sin dependencias nuevas. Sin framework. Sin HTML inyectado con `innerHTML` desde datos:
  construir DOM con `createElement`/`textContent`.
- Accesibilidad: foco visible, `aria-label` donde haga falta, respeta
  `prefers-reduced-motion`, y nada de arrastrar.

## Estado que NO se toca (otra sesión lo tiene abierto)

`src/data/content.js`, `src/data/narracion.js`, `src/data/encounters.js`, `index.html`,
`src/main.js`, `src/style.css`, `src/world/createVillage.js`, `src/world/places/jardin.js`,
`src/world/remedios.js`, `public/audio/**`, `internal/audio/manifest.json`.
Solo el integrador los modifica, al final y de una vez.

## Archivos nuevos y su interfaz (congelada)

### 1. `src/data/novela.js` — la ficha literaria

```js
export const FICHAS_NOVELA = {
  // una por estación de content.js: memoria, tiempo, espera, voz, llegada, mariposas, tren, remedios
  memoria: {
    capitulo: '3 y 4',                 // referencia corta, legible
    titulo: 'La casa que recuerda por todos',
    texto: '120-180 palabras en palabras propias',
    datos: ['dato verificable 1', 'dato verificable 2', 'dato verificable 3'],
    fuente: 'Gabriel García Márquez, Cien años de soledad, caps. 3-4',
  },
  // ...
};
export const INDICE_NOVELA = [
  { n: 1, titulo: 'La fundación y el hielo', hechos: 'una línea', estaciones: ['llegada'] },
  // 20 entradas
];
export const NOTA_ATRIBUCION = 'una o dos frases sobre qué es de la novela y qué es de esta instalación';
export function fichaDe(id) { return FICHAS_NOVELA[id] ?? null; }
```

### 2. `src/data/arbol.js` — el árbol de los Buendía

```js
export const GENERACIONES = [
  { id:'jose-arcadio-buendia', nombre:'José Arcadio Buendía', generacion:1,
    pareja:'ursula', padres:[], hijos:['jose-arcadio','aureliano-coronel'],
    final:'cómo termina, en una línea', nota:'por qué importa, opcional' },
  // siete generaciones; ids estables en kebab-case
];
export const CIERRE_ARBOL = 'qué pasa con el último de la estirpe';
export const NOTAS_ARBOL = ['la repetición de los nombres', 'los gemelos', 'el final de la línea'];
```

### 3. `src/data/palabras.js` — el cuaderno de palabras del Caribe

```js
export const PALABRAS = [
  { palabra:'cañabrava', categoria:'construcción',
    significado:'frase breve y clara', enLaNovela:'cap. 1', nota:'lo que aporta al leer' },
  // 20-24 entradas; solo palabras que el visitante puede ver en el pueblo o leer aquí
];
export const INTRO_PALABRAS = 'por qué importa el léxico en esta novela';
```

### 4. `src/ui/NovelaPanel.js` — la ficha y el índice, en DOM

```js
export function crearFichaNovela(id)   // → HTMLElement (.ficha-novela) o null si no hay ficha
export function crearIndiceNovela()    // → HTMLElement con las 20 entradas
export function crearSelloOrigen()     // → HTMLElement con «De la novela» / «De esta instalación»
```

### 5. `src/ui/ArbolPanel.js`

```js
export function crearArbol()           // → HTMLElement con el árbol navegable (foco y aria)
```

### 6. `src/ui/Pergamino.js`

```js
export function textoPergamino(traces, { fecha })  // → string (función pura, probada en Node)
export function crearPergamino(traces, opts)       // → HTMLElement
```
`traces` es `tracesFrom(results)` de `src/data/stories.js`: `[{storyId,title,text}]`.

### 7. `src/world/places/hielo.js` y `src/world/places/pescaditos.js`

```js
export function crearHielo(ctx)        // → { grupo, colisiones:[], actualizar?(t) }
export function crearPescaditos(ctx)   // → { grupo, colisiones:[], actualizar?(t) }
```
`ctx` es el contexto que usan las demás piezas de `src/world/places/*` (leer una para copiar
la firma). Se permite leer `src/world/kit.js` para reutilizar materiales y geometrías;
**no se modifica `kit.js`**.

### 8. `src/world/lluvia.js`

```js
export function crearLluvia(scene, { radio, cantidad })  // → { set(nivel), update(dt), dispose(), visible }
```
Instanciado, sin sombras, apagado por defecto y estático con `prefers-reduced-motion`.

### 9. Material docente

- `docs/GUIA-DOCENTE.md`, `docs/FICHA-ESTUDIANTE.md`, `docs/RUBRICA.md`
- `public/imprimibles/guia-docente.html` y `public/imprimibles/ficha-estudiante.html`
  (HTML autónomo, sin JS, listo para imprimir; enlazado desde la Ayuda al integrar).

## Integración (solo el integrador)

1. `index.html` + `main.js`: ficha dentro de `#reading`, sello de origen, botón del árbol en
   el mapa, acceso al índice desde la ficha, cuaderno de palabras, chip de lluvia en Ayuda.
2. `content.js` + `encounters.js`: dos estaciones nuevas (`hielo`, `pescaditos`) con su ficha,
   sus encuentros y sus props. Audio de las lecturas nuevas con
   `node internal/scripts/generar_audio.mjs` (idempotente).
3. Pruebas nuevas en `tests/novela.test.js` y `node --test tests/*.test.js`; `npm run build`;
   CDP (`cdp_lectura`, `cdp_paneles`, `cdp_metricas`, `cdp_circuito`) con consola limpia.
4. README + HANDOFF: entrada nueva con lo entregado, mediciones y quirks.

## Fuentes de trabajo para los textos

- La novela completa en texto, por capítulos, en la carpeta temporal de la sesión
  (`$COMMANDCODE_SCRATCHPAD/libro_wrap/001.txt` … `020.txt`): usarla para verificar hechos.
- Resúmenes detallados por tramo: `$COMMANDCODE_SCRATCHPAD/libro/digest_01-05.md`,
  `digest_06-10.md`, `digest_11-15.md`, `digest_16-20.md`.
