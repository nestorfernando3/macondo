# Entrega vigente · La guía traza por donde se puede volar (23 septiembre 2026)

Pedido: «aquí tienes otra referencia, hecha por el mejor LLM del mundo, para seguir mejorando»
(`macondo-3d-web-experience (2).zip`). Es la misma estirpe que el zip anterior —la generación
React/TSX, aquí además con la interfaz partida en `src/ui/{Hud,Lectura,ModoSin3D}.js`— y otra vez
casi todo está superado por lo que hay: su `crearMapa` es un esquema de polilíneas, más pobre que
el mapa ilustrado que entró ayer; su `PlayerController` **no** tiene el brazo de cámara que
recorta contra la geometría (aquí sí, y `cdp_camara.mjs` lo prueba); su `anclas.js` es un registro
de geometría que este pueblo tiene repartido entre `kit.js` y `places/*` con más piezas. Lo que
**no** estaba superado, y es lo que se trajo, es lo suyo mejor: **un planificador de rutas que
mira las colisiones antes de trazar**, y el escalón de altura para salir de un corral.

## Qué se entregó

- **`src/navigation/RoutePlanner.js` (nuevo, 100 líneas): el plan de vuelo del recorrido.**
  Entra al grafo por un nodo al que se llega en línea recta despejada, recorre las aristas con
  Dijkstra (coste real en metros, cada arista comprobada una sola vez) y sale por el nodo del
  destino. Con `siemprePorGrafo` —lo que usa la guía— pasa por las calles aunque la recta esté
  limpia; sin él, el vuelo libre va recto.
- **`WalkableWorld.pathClear(a, b, altura)`**: la pregunta que faltaba —«¿se puede ir en recta de
  aquí a allí a esta altura?»—. Muestrea el segmento a 25 cm y va subiendo con el terreno, así que
  vale igual para la ladera del mirador y para la tabla del muelle. Más `world.radio` (0,22 m, el
  mismo del jugador).
- **El escalón de altura al salir.** Si a la altura de crucero no hay salida, el recorrido prueba
  a 3,6 m y vuela **sólo el primer tramo** a esa altura: el jugador puede haber entrado volando a
  un corral de tapias de 2,6 m —el patio de la casa, el del puerto— y desde dentro no hay calle a
  2,1 m. Se ve subir sobre la tapia y bajar a la calle.
- **Cuando ni así hay camino, se dice.** `startTour` avisaba con un `return` mudo: el botón no
  hacía nada. Ahora escribe en la franja de estado qué pasa, y en el caso de «Plaza» —la
  recuperación que el HUD promete— lleva al jugador a la plaza en vez de dejarlo encerrado.
- **`data/locations.js` vuelve a ser sólo datos.** Se retiraron `routePointsFrom`, `findRoute`,
  `nearestNode` y `nodeOf` (este último ya no lo usaba nadie): el trazado de rutas necesita el
  mundo delante y ahora vive en `navigation/`, que es donde está la física. Queda `vecinos(id)`
  como primitiva del grafo.
- **`tests/rutas.test.js` (nuevo, 5 pruebas)**: que un muro corta la recta y una reja baja no; que
  **ninguna** ruta del recorrido cruza un obstáculo desde una malla de 3 m por todo el pueblo; que
  desde la entrada y desde cada parada siempre hay ruta a las demás; que vuelo libre va recto y un
  destino dentro de un muro se rechaza; y que la ruta por el grafo pisa nodos del grafo.
- **`tests/architecture.test.js`**: la comprobación «cada destino tiene ruta» ya no se hace contra
  el BFS del papel sino contra el planificador y el mundo construido —es la misma promesa dicha
  con las colisiones delante—.

## Medición: lo que estaba roto y lo que queda

Malla de 2 m por todo el pueblo, sólo posiciones libres a la altura de crucero (660 puntos):

| Medida | Antes | Después |
| --- | --- | --- |
| Recta al nodo más cercano **tapada** (lo que trazaba la guía) | **139 de 660 · 21,1 %** | — |
| Tramo de ruta que cruza un obstáculo | — | **0 de 2 640** |
| Posiciones sin ruta a 2,1 m | — | 21 de 660 · 3,2 % |
| Posiciones sin ruta ni subiendo a 3,6 m | — | **5 de 660 · 0,8 %** |
| Desde la entrada y las 4 paradas del recorrido | — | 100 % de destinos alcanzables a 2,1 m |

Los cinco rincones que se quedan sin salida (0,8 %) están bajo el tejado del patio, a los que
sólo se entra volando por encima; allí el recorrido avisa y la mariposa sale volando a mano.

- `node --test tests/*.test.js`: **71/71** (66 + las 5 nuevas de `tests/rutas.test.js`).
- `npm run build`: OK (59 módulos).
- `node internal/verificacion/todos.mjs <OUT>` (los 17, con el circuito): **17/17 en verde**.
  `cdp_paquete1`, que en la entrega anterior falló por una sesión de Chrome caída, aquí pasó en
  la corrida del barrido —era carga, no producto—.
- `node internal/verificacion/cdp_circuito.mjs`: **OK** — el recorrido completo 4/4 con la ruta
  nueva (casa 22,6 s · jardín 16,4 · puerto 26,0 · mirador 25,7; llegadas a 2,1 / 2,1 / 2,4 /
  5,1 m y progreso 4/4).
- `cdp_cancelar.mjs` (detener, vuelo manual, «A la plaza», la puerta y el fallback sin 3D) y
  `cdp_mapa.mjs`: **OK**.

## Lo que se miró del zip y NO se trajo, con el motivo

- **La interfaz modular** (`ui/Hud.js`, `ui/Lectura.js`, `ui/ModoSin3D.js`): es otra
  implementación de la interfaz que ya existe, y la de aquí tiene más —la capa literaria, el
  árbol, el glosario, el pergamino, la lluvia, el minimapa— además de una revisión de diseño
  medida. Partir `main.js` en módulos es razonable, pero no es lo que el zip traía de más.
- **`crearMapa` de `ui/Hud.js`**: polilíneas y puntos, sin río dibujado, sin casas y sin lugares
  elegibles. Es un paso atrás del mapa ilustrado que entró ayer.
- **`anclas.js` (349 líneas)**: un registro único de la geometría del pueblo —casas con sus
  bloques, muros, vallas, barandas, `COLISION_PROPS`—, con el arte y la física leyendo de la misma
  tabla. Es una buena idea de diseño y aquí está repartida entre `kit.js` y `places/*`; unificarla
  es una obra de otro tamaño, no una extracción, y este pueblo tiene piezas que aquel no tiene.
- **`world/canvas.js`**: un lienzo de mentira para construir la escena sin DOM. Aquí no hace falta:
  `createVillage` ya se construye en Node en las pruebas y en `internal/scripts/pesar_escena.mjs`.
- **`data/audioDisponibles.js`**: la lista de MP3 que existen, para no pedir los que faltan. Aquí
  no sobra ninguno: los 21 clips de `NARRACION` tienen su MP3 en `public/audio/`.
- **El armazón React/TSX** (`App.tsx`, `bootstrap.tsx`, Tailwind, `vite-plugin-singlefile`): el
  proyecto es ESM sin framework a propósito, y su `dist/` ya sale autocontenido.

## Quirks que el siguiente no debe repetir

- **El patio tiene tejado con `base`.** A 2,1 y 3,2 m se pasa por debajo; a 4-5 m bloquea. Por eso
  los rincones bajo el tejado son los únicos sin salida ni subiendo: el planificador pregunta a
  cada altura y ahí las dos están tapadas. Si algún día se abre el tejado, esos cinco puntos
  desaparecen solos.
- **La altura del tramo la manda la ruta, no la mirada.** Durante el recorrido el mando no llega
  al jugador, así que `TourController.update` escribe `p.alt` con la altura del tramo. `main.js`
  llama a `player.resetAltitude()` justo después de `startTo`, y no pasa nada porque el primer
  fotograma del recorrido vuelve a fijarla: si algún día se mueve ese `resetAltitude`, mirar allí.
- **`routePointsFrom` ya no existe.** Si un guion viejo o una nota lo citan, el sustituto es
  `planearRuta(world, desde, hasta, { altura, siemprePorGrafo })`, que devuelve puntos `[x,z]` y
  necesita el mundo construido.
- **Las esperas del arnés siguen siendo cortas.** Con varios guiones seguidos en el mismo shell se
  ven fallos de «el clic no alcanzó …» que desaparecen al correrlos de uno en uno (ver el registro
  anterior). Ante un trío de fallos así, medir de uno en uno antes de tocar el producto.

# Registro anterior · El mapa del pueblo, dibujado (23 septiembre 2026)

Pedido: «extrae lo más valioso que pueda mejorar la experiencia del juego e intégralo en esta
versión», a partir de `macondo-3d-web-experience.zip`. El zip resultó ser **la generación
anterior de este mismo proyecto** —la que vivía dentro de la plantilla React/TSX, con
`src/App.tsx`, Tailwind y `vite-plugin-singlefile`— y casi todo lo suyo está superado por lo que
hay aquí: su `main.js` (185 líneas) frente al actual (827), su `kit.js` (446) frente al de 1 453,
su `interaction/` sin oclusión ni eventos. Lo que **no** estaba superado, y es lo que se trajo,
es una sola cosa, la mejor de aquella entrega: **el mapa del pueblo como ilustración**, con los
destinos puestos a su lado en vez de debajo.

## Qué se entregó

- **`src/ui/Mapa.js` (nuevo, 275 líneas).** Compone un SVG de capas nombradas —`papel`, `rio`,
  `vegas`, `caminos`, `plaza`, `muelle`, `casas`, `lugares`, `jugador`, `rotulos`— que dibuja el
  pueblo sobre papel: el río al oeste con su orilla ondulada y textura de aguas, el muelle real
  como pasarela sobre el agua, dieciséis casas como referencia, los caminos del grafo en dos
  pasadas (calzada clara y eje punteado), la plaza, las cinco paradas con su nombre y la flecha
  del jugador. Nada está escrito a mano: el encuadre se calcula de la caja de lugares y nodos, la
  orilla sale de la caja de agua de `places/puerto.js` y los caminos, de `EDGES`. Mover un lugar
  mueve el dibujo.
- **Cada lugar se elige en el propio dibujo.** Cada punto es un `role="button"` con `tabindex="0"`
  y nombre accesible («Ir hasta …»), con un área de toque invisible de 46 unidades y activación
  por clic, toque y Enter. La lista de destinos de abajo se conserva intacta: el mapa y la lista
  son la misma decisión por dos caminos, y `main.js` les pasa la misma función (`irA`).
- **Pendiente y visitado se distinguen por forma**, no sólo por color: dos anillos huecos frente
  a anillo con disco. Es exactamente lo que el informe de `/design checkup` pedía del minimapa
  (hallazgo 9, «disco lleno frente a anillo … o una leyenda de una línea»); aquí se cumple en el
  mapa y la leyenda va escrita junto a la ayuda del pie, con `aria-hidden` en los símbolos porque
  las palabras ya lo dicen.
- **El panel usa el ancho en vez del alto.** `#map-columnas` pone el dibujo a la izquierda y los
  destinos a la derecha; en el teléfono vuelven a apilarse. El panel pasó de **480 × 691 px**
  —clavado en el `85svh`, con la lista siempre por debajo del pliegue— a **760 × 522**, con todo
  a la vista.
- **`index.html`:** `#map-canvas` dejó de ser `role="img"` (un rol de imagen poda el subárbol y
  habría dejado los cinco puntos fuera del teclado y del lector); el SVG se anuncia como grupo.
  La ayuda del pie dice ahora cómo se elige un lugar y qué significa cada anillo.
- **`cdp_mapa.mjs` (nuevo) y ya en `todos.mjs`:** mide el panel en **tres tamaños** —escritorio
  1440 × 900, teléfono 390 × 844 y el borde del corte 700 × 800, que es donde el dibujo se
  apila— y afirma lo que hace utilizable un mapa: capas, cinco lugares elegibles y enfocables,
  área de toque, cuerpo de letra, contraste, elección con clic real y con Enter, cambio de estado
  al visitar un lugar y encaje sin desplazar. Abre el panel esperando a que el chip del HUD tenga
  caja: medido antes de que el HUD se monte, el clic cae en el vacío y el fallo parece del mapa.

## Verificación de esta entrega

Antes y después, el **mismo guion** contra las dos versiones del panel:

| Medida | Antes | Después |
| --- | --- | --- |
| Panel (escritorio) | 480 × 691 px (tope `85svh`) | 760 × 522 px |
| Lista de destinos a la vista | **no** (bajo el pliegue) | sí |
| El panel desborda | sí | no |
| Lienzo | 400 × 405 px, cuadrado | 394 × 279 px, apaisado |
| Relación del lienzo | 1,00 | 1,44 |
| Ocupación de la pantalla (lienzo) | 13,8 % | 9,4 % |
| Capas dibujadas | 0 | 10 |
| Elementos / trazos | 34 / 21 | 161 / 61 |
| Lugares elegibles en el dibujo | 0 | 5 (todos enfocables y con nombre) |
| Área de toque mínima | — | 32,2 px (25,4 en el teléfono) |
| Cuerpo de la etiqueta | — | 16,1 px (12,7 en el teléfono) |
| Contraste del nombre | — | 6,64:1 |
| Móvil 390 × 844: alto del panel | 717 px (desborda) | 703 px (entra) |
| Borde del corte 700 × 800: alto del panel | — | 668 px (entra) |

El último renglón es el que obligó a poner techo al dibujo: por debajo de 700 px el mapa se apila
sobre la lista, y sin techo el lienzo pasaba de 314 a **624 px** de ancho —433 px de alto— y se
comía todo lo que se acababa de ganar. La regla es `max-width:min(520px,48svh)`: el dibujo nunca
ocupa más de media ventana de alto cuando va apilado, y en el teléfono no cambia nada porque ahí
manda el ancho del panel.

- `node --test tests/*.test.js`: **66/66**.
- `npm run build`: OK (misma advertencia de tamaño de chunk ya existente; 58 módulos).
- `node internal/verificacion/cdp_mapa.mjs`: **OK**; `cdp_paneles.mjs`: **OK**.
- `node internal/verificacion/todos.mjs <OUT> --rapido`: **15/16**. El único fallo,
  `cdp_paquete1`, no es de esta entrega: la sesión de Chrome se le cayó a media corrida y dejó un
  `unsettled top-level await` en la línea 43; vuelto a correr solo pasa (**OK**), y el guion no
  toca el mapa —abre la silla, la carta y el cuaderno del mirador—. Queda anotado como
  inestabilidad del arnés bajo dieciséis Chrome seguidos, no como regresión.
- Capturas: `mapa_escritorio.png` y `mapa_movil.png` (el recorte a tamaño real deja ver las
  casas, el muelle y los anillos).

## Lo que se miró del zip y NO se trajo, con el motivo

- **La capa React/TSX** (`App.tsx`, `main.tsx`, `index.css`, `utils/cn.ts`, Tailwind,
  `vite-plugin-singlefile`): el proyecto actual es ESM sin framework y su README ya razona por
  qué. Traerla sería reescribir la interfaz entera para perder la mitad de las funciones que la
  capa literaria añadió después (índice, árbol, glosario, pergamino, lluvia).
- **El juego de 18 iconos SVG y la marca de mariposa** (`ButterflyMark`): bonitos y a mano, pero
  el HUD actual son fichas de texto que ya pasaron una revisión de maquetación —el informe del
  checkup midió colisiones y alto— y meter iconos en once botones habría movido esa maquetación
  sin un motivo que la justifique.
- **`internal/capture.mjs` (Playwright)**, **`internal/verify-world.mjs`**: el proyecto tiene
  `internal/verificacion/` con 19 guiones CDP, un arnés con puerto libre y perfil limpio, y
  `internal/scripts/pesar_escena.mjs`. Los del zip son el antecesor de eso.
- **`public/audio/manifest.json`**: quedó como `{"clips":{}}`; la versión actual no lee ningún
  manifiesto en tiempo de ejecución (`data/narracion.js` arma la URL del MP3 directamente).
- **`docs/avatar-y-vuelo.md` y `docs/direccion-artistica.md`**: su contenido está en
  `docs/SPEC-MARIPOSA-AVATAR.md`, `docs/SPEC-RECORRIDO-3D.md` y `docs/SPEC-PUEBLO-VIVO.md`, más
  al día.
- **`tests/arquitectura|controles|segundo-paquete.test.js`**: son los mismos que
  `tests/architecture|controls|second-package.test.js`, renombrados.

## Quirks que el siguiente no debe repetir

- **El `font-size` de un texto SVG no está en píxeles de pantalla.** Se declara en unidades de
  usuario: el guion leía «23 px» mientras en el teléfono se veían 12,5. El factor real sale de
  `getScreenCTM().a`. Cualquier afirmación sobre lo que se lee o lo que se toca tiene que pasar
  por ahí, no por `getComputedStyle().fontSize`.
- **Nada de comillas invertidas dentro de una plantilla que se manda a `Runtime.evaluate`.** El
  guion de `s.js` es una plantilla de JS: una comilla invertida en un comentario la cierra y el
  error que sale («missing ) after argument list») apunta al inicio del archivo, no al comentario.
- **El encuadre del lienzo se calibra por el ancho más estrecho, no por el de escritorio.** El
  cuerpo de letra y el área de toque están puestos para el teléfono de 390 (unos 314 px de
  lienzo); por eso en escritorio el mapa se ve con etiquetas grandes. Es deliberado: al revés, en
  el teléfono no se leía.
- **El mapa no marca el patio a propósito.** El patio no es destino de la lista —se entra por la
  casa— y el mapa marca los cinco lugares a los que se puede ir. No es un olvido.
- **`tests/controls.test.js`, la cámara y el muro, es inestable de nacimiento.**
  `PlayerController` lee `performance.now()` (línea 192), así que la prueba depende del reloj de
  pared: en una de seis corridas de esta sesión falló con `la cámara atravesó el muro: 4,52`, y
  las otras cinco dio 66/66. No es de esta entrega —no se tocó el controlador— y no se arregló
  aquí: queda anotado para quien quiera volverlo determinista.
- **El arnés tiene esperas fijas y se cae bajo carga.** Con tres guiones seguidos en el mismo
  shell —y con la otra sesión lanzando Chrome a la vez—, `cdp_mapa`, `cdp_paneles` y `cdp_novela`
  fallaron los tres con «el clic no alcanzó …» / «queda bajo el pliegue», y los tres pasaron al
  correrlos de uno en uno. No era el producto: es que `s.clic` reintenta cinco veces con 400 ms y
  bajo SwiftShader el primer fotograma puede tardar más. `abrirMapa()` en `cdp_mapa.mjs` ya espera
  a que el chip tenga caja con tope de 25 s y reintenta diez veces; los demás guiones siguen con
  la espera corta. Si vuelve a verse un trío de fallos así, medir de uno en uno antes de tocar
  nada.
- **Hay trabajo de otra sesión sin commitear en este mismo árbol, y se movió mientras se
  trabajaba.** Al empezar esta entrega venían modificados `src/world/places/hielo.js`, `README.md`
  e `internal/HANDOFF.md` (este archivo), y había un `_tmp_recorrido.mjs` suelto en la raíz —que
  esa sesión ya retiró por su cuenta—. A media sesión esa sesión movió además el botón
  «▶ Escuchar» dentro del panel de lectura en `index.html`, de modo que ese archivo lleva ahora
  **las dos cosas**: el mapa de aquí y el «Escuchar» de allí. No se pisó nada —cada escritura de
  aquí releyó el archivo antes de tocar— y el estado combinado está verificado (66/66, build y
  `cdp_mapa` en verde). `hielo.js` sigue con sus cambios sin commitear y sin revisar desde aquí.
  Quien cierre el árbol, que separe las tres cosas.

# Registro anterior · La capa literaria: el pueblo dice qué es del libro (23 septiembre 2026)

Pedido: «tienes el libro disponible en el entorno, léelo y dame ideas para mejorar los recursos»
y, en seguida, «hazlos con subagentes». Se leyó **Cien años de soledad completa** (20 capítulos
de la edición ilustrada del entorno) y se implementó el puente entre la novela y la experiencia,
repartido en siete subagentes en paralelo sobre archivos nuevos, con contrato e interfaz
congelados en `internal/PLAN-RECURSOS-NOVELA.md`. Diagnóstico, ideas y lo que queda:
`docs/IDEAS-RECURSOS.md`.

## Qué se entregó

- **La ficha «En la novela» de las ocho estaciones** (`src/data/novela.js`): 120-180 palabras en
  palabras propias, con capítulo, tres datos verificables y fuente. Se lee en el panel de lectura,
  después de la glosa y antes de «Continuar».
- **El sello de origen** (`crearSelloOrigen`, `src/ui/NovelaPanel.js`): «De esta instalación»
  junto a nuestra glosa y «De la novela» dentro de la ficha. Era el hueco más grave: hasta hoy
  un visitante no podía saber qué inventó el pueblo (el faro, el reloj, la espiral) y qué viene
  del libro. Ninguna cita literal nueva: la única transcripción sigue siendo la de Remedios.
- **Lo que cuenta la novela** (`INDICE_NOVELA`, panel `#indice`): los veinte capítulos con sus
  hechos y las estaciones que los rozan, más la nota de atribución. Se abre desde una lectura y
  desde la Ayuda.
- **El árbol de los Buendía** (`src/data/arbol.js`, `src/ui/ArbolPanel.js`): 20 personas, siete
  generaciones, los tocayos se resaltan al enfocar, y el cierre de la estirpe. Se abre desde el
  mapa. Trazado propio: las genealogías de la edición ilustrada tienen derechos.
- **Palabras del pueblo** (`src/data/palabras.js`, `crearCuadernoPalabras`): 23 voces del Caribe
  y del libro con significado, capítulo y buscador; se abre desde el cuaderno. Nueve de ellas no
  aparecen en la novela y lo dicen («uso general del Caribe colombiano») en vez de inventar capítulo.
- **El pergamino del paseo** (`src/ui/Pergamino.js`): el cuaderno del mirador se relee como el
  documento que ya estaba escrito; recoge los títulos de lo vivido, con fecha, sin volcar las
  frases crudas del visitante.
- **Lluvia del libro** (`src/world/lluvia.js` + botón en la Ayuda): el aguacero del capítulo 16,
  niveles 0/1/2, 1 260 triángulos y 2 llamadas en aguacero, estático con `prefers-reduced-motion`
  y apagado por defecto (0 triángulos).
- **Dos estaciones nuevas del libro**, con su ficha, su encuentro, su pieza y su audio:
  `hielo` (la carpa de la plaza, caps. 1 y 11) y `pescaditos` (el taller del patio, caps. 6, 9 y
  13 — dos pescaditos al día, veinticinco y a fundir: verificado en el libro). Piezas:
  `src/world/places/hielo.js` (1 474 triángulos) y `places/pescaditos.js` (1 827).
- **Material docente**: `docs/GUIA-DOCENTE.md`, `docs/FICHA-ESTUDIANTE.md`, `docs/RUBRICA.md` y
  los imprimibles `public/imprimibles/guia-docente.html` y `ficha-estudiante.html` (HTML
  autónomos, sin JS ni recursos externos), enlazados desde la Ayuda.

## Verificación de esta entrega

- `node --test tests/*.test.js`: **66/66** (7 nuevas en `tests/novela.test.js`: ficha por
  estación sin huérfanas, límites de la glosa, índice de veinte capítulos, árbol consistente,
  glosario, pergamino determinista y piezas nuevas exportadas).
- `npm run build`: OK, JS **216,73 kB gzip** (misma advertencia de tamaño de chunk ya existente).
- `node internal/verificacion/todos.mjs <OUT>`: **16/16** guiones en corridas separadas, incluido
  **`cdp_novela.mjs`, nuevo y ya en la lista**: las dos lecturas nuevas por el camino real
  (posarse, «Explorar», ficha con sellos, capítulo, datos y fuente), el índice con sus veinte
  entradas, el árbol con tocayos resaltados al enfocar, el cuaderno con su buscador, el
  pergamino, la lluvia encendida y apagada con el pueblo en vuelo, y la ficha en móvil 390×844.
  Aviso: en la corrida encadenada, con otro banco de pruebas corriendo en el mismo equipo, seis
  guiones fallaron por clics perdidos y por el suelo de FPS (`cdp_altura`, `cdp_camara`,
  `cdp_cancelar`, `cdp_narracion`, `cdp_novela`, `cdp_rendimiento`); repetidos de uno en uno,
  los seis pasan. `cdp_novela` tardó 38,7 s solo y 145,9 s con la máquina en disputa.
- `cdp_metricas` / `cdp_rendimiento`: plaza **350 llamadas · 144 405 triángulos** (techo 150 000);
  peor encuadre del banco **5,9 FPS** (suelo 5, SwiftShader) en corrida a solas.
- Capturas: `novela_ficha.png`, `novela_indice.png`, `novela_arbol.png`, `novela_palabras.png`,
  `novela_lluvia.png`, `novela_movil.png`.

## Correcciones de fidelidad que encontró la lectura del libro

- La lectura del tren decía que llegó «un sábado de madrugada» y que de los vagones bajaron
  «buhoneros» con cacerolas: la novela lo trae **adornado de flores, con ocho meses de retraso y
  a Aureliano Triste saludando desde la locomotora** (cap. 11), y los muebles y utensilios llegan
  en **carretas de bueyes** con mercachifles (no existe «buhoneros» en el libro). La ficha lo
  cuenta como es; el cuerpo de la lectura sigue igual para no invalidar su MP3.
- La lectura de la plaza decía que nadie recordaba quién fundó Macondo. La fundación sí se cuenta:
  la travesía de veintiséis meses, la muerte de Prudencio Aguilar y el sueño de la ciudad de
  espejos (cap. 2). Lo dice la ficha; el cuerpo queda como estaba, por la misma razón.
- Las dos se corrigen de verdad cuando se toque el audio: editar `content.js` y volver a correr
  `node internal/scripts/generar_audio.mjs` (solo regenera `lectura-llegada` y `lectura-tren`).

## Quirks que el siguiente no debe repetir

- **Ninguna `PointLight` nueva.** El hielo traía una y el peor encuadre del banco cayó de 5,9 a
  **4,5 FPS** (por debajo del suelo de 5): una luz más obliga a recompilar los materiales del
  pueblo entero. Se cambió por emisión —el hielo más dos discos aditivos que laten— y volvió a
  **5,9**. El brillo frío no necesita una luz; medirlo antes de añadir otra.
- **Lo nuevo dentro de un diálogo se pone ANTES de lo largo.** Tres controles quedaron fuera del
  área visible al crecer sus paneles: «▶ Escuchar» en la lectura (lo cazó `cdp_narracion`), el
  botón del árbol al pie del mapa y «Reiniciar recorrido» en la ayuda. Un elemento con centro
  fuera del recorte del diálogo no recibe clic real: el guion lo dice como «el clic no alcanzó».
- **Un `id` repetido rompe el cableado en silencio**: `#toggle-lluvia` llegó a existir dos veces
  (cajón y ayuda) y el manejador se enlazaba solo al primero. Al mover un control, borrarlo del
  sitio viejo, no copiarlo.
- **El banco no se comparte.** Con otro Chrome corriendo a la vez (otra sesión del mismo repo),
  los clics reales se pierden y aparecen fallos falsos («el clic no alcanzó…», `JSON.parse` de
  `[object Object]`). Se corrió de uno en uno; con la máquina cargada hubo que repetir dos
  guiones. Los Chromes del arnés se limpian con `pkill -9 -f perfil-arnes`.
- La plaza está a **5 600 triángulos del techo** (144 405 de 150 000). Antes de añadir props a la
  vista de la plaza, medir con `cdp_metricas`; el detalle barato va instanciado o no entra.

## Próximo agente

- **B7 del plan**: llevar el tren amarillo al puerto (vía, estación mínima, una llegada por
  visita) y el «no hubo muertos» del capítulo 15 como lectura de profundización, con revisión
  editorial aparte. Es el material más potente y el más sensible.
- **B5**: la peste del olvido como mecánica (hoy solo existe el glosario y la historia de las
  etiquetas: borrar los nombres y volver a ponerlos).
- Completar el índice cuando entren estaciones nuevas: `tests/novela.test.js` exige ficha para
  cada estación, así que una estación sin ficha rompe la suite (a propósito).
- Pendientes heredados: oclusión real (`sightBlocks`), métricas en dispositivo real, conmutador
  manual de modo bajo.

---



Continúa la entrega del vuelo (el ratón gira, WASD vuela, ningún lugar queda cercado). El
pendiente que quedaba en el HANDOFF era este: la cámara en tercera persona no colisionaba con
nada y con más sitios a los que volar había más dónde meterse.

## Qué se entregó

- **La perseguidora se apoya en las mismas colisiones que el vuelo.** `_brazoLibre()` muestrea
  el brazo de la cámara (6 pasos, radio 0,26) y recorta la distancia al último punto libre; el
  arrimón entra rápido y sale despacio (`k = 18`/`4` en `_apply`), y `CAM_MIN = 0,4` porque
  contra un muro la cámara tiene que caber entre la mariposa y el muro. Pasa por encima de lo
  bajo igual que ella (usa los remates de la entrega anterior) y no toca el HUD ni la
  jugabilidad: es sólo la posición de la cámara.
- **Medido, no supuesto:** un barrido de 26 puntos (los seis lugares, los cinco nodos del
  recorrido, calles y esquinas) × 8 rumbos × 3 inclinaciones = **624 encuadres** pasa de
  **77 dentro de un obstáculo (12,3 %) a 1 (0,2 %)**. El que queda está declarado en el guion:
  de espaldas al farol de w1, el tubo (radio 0,3) no da para meter la cámara entre él y la
  mariposa; forzar más el arrimón metería la cámara dentro de ella.
- **El tejado del patio es un sólido.** La captura del patio salía en el color de la teja: la
  cámara salía por encima del tejado porque no había colisión y la mariposa también lo
  atravesaba al subir. `WalkableWorld` estrena **`base`** (bloquea de la base al remate, para lo
  que está en el aire) y la casa registra su tejado (`base = CH + .5` = 3,7, remate en la
  cumbrera). Los invariantes a ras de suelo no cambian (`y <= base` no bloquea).
- **`cdp_camara.mjs`, nuevo** (en `todos.mjs`): el barrido de arriba sobre la cámara que el
  juego coloca de verdad (`place()` + `orbitPitch` + `_apply(0)`), y 160 cuadros en vivo en el
  patio, la puerta y la meseta leyendo `camera.position` cuadro a cuadro (0 dentro, 80
  arrimones). Captura `camara_patio.png`.

## Verificación

- `node --test tests/*.test.js`: **66/66** (dos pruebas nuevas de cámara: se arrima ante un muro
  y pasa por encima de lo bajo).
- `cdp_camara` OK; `cdp_altura` reescrito al diseño vigente (el clic vuela sin capturar, el
  chip «Vista libre» captura y marca `aria-pressed`, la mira y el aviso aparecen, giro por
  `pointermove`, altura con la mirada, llegada al mirador, invariantes) OK.
- Batería completa (`todos.mjs`, 15 guiones con `cdp_altura` y `cdp_camara` ya dentro):
  **13/15**. Los dos que fallaron —`cdp_cancelar` y `cdp_narracion`— no fallan por aserción
  sino por el cuelgue intermitente de la página que ya está documentado en este archivo: el
  `esperar` queda colgado y `Runtime.evaluate` devuelve `undefined`. Sondas A/B: el recorrido
  con voz se hizo cuatro veces con el recorte de cámara activo sin morir, y muere igual con el
  recorte neutralizado desde la consola, así que no es de esta entrega. Ambos **pasan al
  repetirlos solos**.

## Quirks que el siguiente no debe repetir

- **Dos sesiones tocaron los mismos archivos a la vez** (el cajón «Más opciones» del HUD y el
  disparador de la captura del puntero). Antes de escribir hay que releer el archivo: lo que
  aterrizó manda, y lo que se reconcilia son los guiones, los textos y las pruebas —no al
  revés—. El chip «Vista libre» vive en `#hud-extra`, así que el arnés abre el cajón solo
  cuando el objetivo de un clic está dentro.
- El barrido de cámara **hay que hacerlo con la cámara del juego**, no recalculando el brazo a
  mano: la primera versión medía la geometría cruda y daba 77/624 con el arreglo ya puesto.
- Los `pointermove` inyectados por CDP no traen `movementX`: el giro se prueba con
  `new PointerEvent('pointermove', { movementX, movementY })`.

# Entrega vigente · Remedios, la bella sube al cielo (23 septiembre 2026)

Pedido: «quiero que agregues a remedios la bella volando en el cielo, y una actividad con el
pasaje exacto del libro».

## Qué se entregó

- **La ascensión (`src/world/remedios.js`, nuevo).** Remedios sube sola sobre el tendal de
  bramante del jardín, con las dos sábanas aleteando a su lado y el brazo en saludo, y se pierde
  en el aire alto. Ciclo de 62 s: sube de 2,6 a 32,8 m con exponente —se demora abajo, que es
  donde hay algo que ver, y se acelera justo cuando ya se está desvaneciendo— y se apaga por los
  dos extremos, así que el salto de `u = 1` a `u = 0` ocurre con la figura ya invisible. Las
  sábanas ondulan de verdad (30 vértices cada una sobre su malla de reposo): un plano rígido que
  sólo gira se lee como una tabla, y es la única silueta que esta escena no puede fingir. Seis
  mallas y 592 triángulos (0,41 % del presupuesto), sin proyectar sombra, y con cero llamadas de
  dibujo mientras está apagada (`raiz.visible = false`).
- **Arrancar a 2,6 m costó una pasada de ojos.** La primera versión salía a ras de suelo (1,1 m)
  y a la altura del tendal el vestido y la ropa tendida son el mismo color y la misma altura: a
  la distancia a la que se la mira —la cámara va 4,8 m detrás de la mariposa, así que se la ve
  desde unos 8 m— las dos piezas se fundían en una sola mancha clara. Lo mismo con las sábanas:
  de 1,5 m de ancho son paneles de dos metros y medio que se comen la figura. Ahora miden 0,8 m,
  giran poco (con medio radián se ponían de canto y se leían como paneles, no como tela) y ella
  pasa de 1,74 a 1,9 m. La comprobación no es mirar: `cdp_remedios` proyecta su posición con la
  cámara y exige que caiga dentro del encuadre.
- **El tendal, que es el ancla.** `sabanas-bramante` (25, −6) en `src/data/encounters.js`, la
  pieza en `places/jardin.js` —el claro del norte, el único tramo del jardín sin macetas,
  bancales ni el árbol del tiempo— y los dos postes con colisión a 2,4 m, por encima del vuelo
  de crucero. La figura lee la misma ancla: mover el tendal mueve la ascensión.
- **La actividad.** Estación `remedios` en `content.js`: lectura sin quiz con línea «para
  conversar», como los otros tres pasajes. Es la única estación con **cita literal del libro**, y
  por eso estrena campos propios: `cita` (el pasaje del capítulo 12), `citaFuente` (la
  atribución) y `source:null`.
- **La cita en el panel.** `#reading-cita` (`index.html`) es un `<blockquote>` con su `<cite>`,
  va ANTES de la glosa y se separa de ella por fondo de papel, tipografía serif, borde de madera
  y el rótulo «Del libro». Tres voces —libro, comentario y «Para conversar»— con tres colores
  distintos: nadie confunde lo que escribió García Márquez con lo que decimos nosotros.

## La política de citas cambió, y a propósito

El proyecto decía en tres sitios «no se reproducen fragmentos de las novelas». Ahora `content.js`,
`narracion.js` y el README dicen algo más preciso: los textos pedagógicos siguen siendo originales
y **la única cita literal es esta**, transcrita entera, atribuida a su capítulo y **fuera de la
narración hablada**. El motivo del último punto no es formal: los clips de audio se generan y se
distribuyen como MP3, así que grabar el fragmento sería una reproducción mucho más pesada que la
cita impresa. Lo que suena es la glosa, que es nuestra. El enlace `#source` de esa estación se
retira en vez de apuntar al Nobel, porque la fuente de una cita es el libro.

## Verificación de esta entrega

- **La cita es idéntica al libro**: 1545 caracteres contra el EPUB de la raíz (`012.xhtml`,
  capítulo 12), comparados carácter a carácter. No es una paráfrasis ni un resumen.
- `node --test tests/*.test.js`: **63/63** (incluye las pruebas de la capa de novela que otra
  sesión agregó en paralelo sobre este mismo árbol). `npm run build`: OK, JS 191,94 kB gzip.
- Ciclo de la ascensión medido en Node fotograma a fotograma: 28/32 visibles, 2,77 → 32,83 m, y
  el cierre del ciclo invisible en los dos extremos.
- Presupuesto de la escena: 143 388 triángulos y 293 mallas en total (incluye el vocabulario de
  árboles en curso, que no es de esta entrega); Remedios pone 6 mallas y 592 triángulos = 0,41 %.
- `node internal/verificacion/cdp_remedios.mjs`: la cita viaja entera (1545 caracteres), con su
  atribución, sin quiz, con la línea «para conversar» alcanzable tras recorrer el panel, con el
  enlace de fuente retirado, y con el bloque de cita en otro fondo y otra tipografía que la glosa;
  la figura está en el encuadre y sube sola; en móvil (390 px) la cita no desborda.

## Un fallo ajeno que esta entrega encontró y arregló

`tests/expansion.test.js` estaba en rojo **antes** de tocar nada —comprobado desactivando
`crearRemedios` y repitiendo— y lo causaba el vocabulario de árboles en curso de `kit.js`.
`ejeEn()` devolvía `{ x, z, r }` y sus cuatro llamadores leen `nodo.y`: al ser `undefined`,
`Math.hypot(fuera, undefined)` daba NaN y `hacia()` construía un cuaternión NaN que se horneaba en
26 de 28 troncos y 18 de 118 manojos. Nadie lo veía porque una matriz NaN no lanza: la instancia
simplemente no se dibuja. Se añadió la `y` interpolada al nudo. Las dos pruebas que lo vigilan
—`ninguna familia instanciada deja matrices en NaN` y su variante con `prefers-reduced-motion`—
pasan desde entonces.

## Quirks que el siguiente no debe repetir

- **Con `prefers-reduced-motion` hay que darle una pose fija, y esto vale para cualquier figura
  futura que cuelgue de `kit.animar`.** `village.update` sólo corre con `ambientPaused` en falso,
  así que sin ese caso la figura se queda en su fotograma cero —que aquí es opacidad cero, o sea
  invisible— y no se nota hasta mirar el jardín en un equipo con la preferencia puesta.
- **El rumbo del modelo es −z** (la convención del avatar): `atan2(−dx, −dz)`. Con el signo
  cambiado mira de espaldas y desde el tendal no se le ve la cara. Lo pagó esta entrega en el
  primer intento.
- **Si añades una estación a `content.js`, `narracion.js` se entera solo** y la prueba exige que
  `lectura-<id>` empiece por el título y que el total no pase de 1200 caracteres. Por eso la cita
  no puede vivir en `body`: son 1545 caracteres ella sola.
- **La figura se llama `remedios` en la escena (`raiz.name`), y la verificación la busca por ahí.**
  Antes la buscaban por `emissiveIntensity === .24` y bastó subir el brillo del vestido para que
  los guiones dejaran de verla y culparan al producto. Cualquier figura futura que se verifique
  quiere nombre propio, no un número mágico.
- **Un guion CDP colgado deja su Chrome vivo, y el siguiente se cuelga también.** No es teoría:
  cuatro Chromes zombis de esta entrega bastaron para que las corridas empezaran a fallar con
  «unsettled top-level await» y evaluaciones que devolvían `undefined`. Antes de culpar al código,
  `ps -eo pid,command | grep '[G]oogle Chrome.app/Contents/MacOS' | grep -o -- '--user-data-dir=[^ ]*'`
  y matar los perfiles `perfil-arnes-*` sobrantes. Ojo: hay Chromes del usuario en `/tmp/macondo-*`
  que no son de los guiones.

---

# Registro anterior · el ratón manda y ningún lugar queda cercado (22 septiembre 2026)

Dos pedidos en un mensaje: «no me gustan los controles para subir y bajar; quiero algo más
tradicional, movimiento conjunto entre WASD y el puntero del mouse para tener más fluidez» y
«parece que no puedo acceder a esta zona por un bloque invisible» (captura del mirador).

## El bloqueo invisible: lo que era

Reproducido sin navegador: `player.place(2.6, 9)` → `flyTo(17, 22)` se detenía en **(7.84,
21.86)**, a 9,16 m del destino, contra la caja `(8.1, 13.6)–(8.7, 32.2)`. La meseta tenía
**dos anillos de cajas invisibles** (los «anillos de colisión del borde», conservados de la
versión peatonal) que cercaban el cerro a cualquier altura, y el vuelo sólo podía entrar por
el pasillo de 2 m de la rampa. Además las colisiones eran **2D**: bloqueaban igual a 2,1 m que
a 9 m, aunque delante hubiera una baranda de un metro o una banca.

## Qué se entregó

- **`src/navigation/WalkableWorld.js`:** los obstáculos llevan **altura** (`alto`, Y absoluta
  del remate; `Infinity` por omisión = muro). `blocks(x, z, r, y = 0)` compara contra ella —
  sin `y` la consulta es a ras de suelo, que es como la siguen leyendo los invariantes y el
  recorrido. Y `addFalda(x, z, rInt, rExt, h)`: la ladera del cerro es **suelo**, no un
  escalón (antes el cilindro del mirador sólo existía para el arte: la mariposa lo atravesaba).
- **Alturas pieza a pieza** (`kit.js` y `places/*.js`): bancas 1 m, setos 1,45, fuente 1,8,
  toldo del puesto 2,45, carreta 1,6, tejadillo del pozo 2,5, cabrestante 0,9, norays 0,8,
  tendedero 2,55, sábanas 3,6, reloj 5,4, farol = su poste, faro 6,3, casas y tejados hasta la
  cumbrera, troncos hasta su altura. El agua, los muros y lo que no se pasa quedan en
  `Infinity`. **El mirador** estrena colisiones que siguen al arte: los 21 postes de la baranda
  (remate a `MT + 0,98`, con el hueco de la rampa), las 24 piedras de la falda (a 1,6 m, se
  pasan por encima) y el barandal de la rampa **tramo a tramo, subiendo con ella** (un prisma
  único de 14 a 17,7 dejaba un muro de 4 m en el arranque). Los dos anillos rectangulares y sus
  esquinas se retiraron.
- **`src/world/invariantes.js`:** invariante nuevo **`vuelo`** — un relleno por inundación
  desde el arranque a 7,5 m (sobre la cumbrera de las casas) exige que los seis lugares se
  alcancen volando. Es la red que faltaba: este fallo lo habría cazado.
- **Controles (`InputController`, `PlayerController`, `main.js`):** fuera `Space`/`Shift` y los
  botones ▲▼ (con su `liftPress`, su CSS y su bloque de ayuda). El **clic corto** sobre la
  escena vuela al punto y **no se lleva el cursor**; la captura del puntero la pide el chip
  **«Vista libre»** (otra sesión movió el disparador del clic al chip y esta entrega se
  reconcilió con ese diseño: con la captura en el clic, el primer toque de cualquiera dejaba el
  HUD sin cursor). Desde ahí girar es mover el ratón
  (`movementX/Y`, `SENS_GIRO = 0,0026` rad/px) y un clic vuela al punto de la **mira** (el
  centro de la pantalla, que `main` convierte en un `tap` normal). Esc suelta el puntero y
  detiene el vuelo; `input.release()` lo suelta al abrir cualquier panel; el **arrastre** sigue
  girando sin capturar nada.
- **La altura la manda la mirada:** `empujeVertical(orbitPitch)` (constantes `PITCH_REPOSO`
  .34, `PITCH_MIN` −.35, `PITCH_MAX` 1.25, zona muerta de 6 centésimas) devuelve −1…1 y
  `update` lo integra a `RISE` m/s. El horizonte sostiene la altura; `recenter()` y
  `startTour` devuelven la mirada al horizonte (si no, el recorrido arrancaría subiendo).
- **El vuelo horizontal sigue cancelando el destino por toque; la mirada no**, y la altura
  responde también camino de un destino. La cámara perseguidora se suelta en cuanto el ratón
  gira (`followCam = false`): antes se peleaban y el giro se deshacía solo.
- **HUD/a11y:** `#crosshair` (aro de 16 px con `pointer-events:none`) y `#lock-hint` («El ratón
  gira la cámara · Esc suelta el puntero», siete segundos) — sin cursor, el HUD es
  inalcanzable, así que hay que decirlo. Ayuda, tutorial, pista de portada y README reescritos.
- **Pruebas:** `tests/controls.test.js` reescrito (captura, mira, mirada como mando, topes,
  falda, colisiones con altura, destino por encima de una banca, `recenter`). `node --test
  tests/*.test.js`: **56/56**. `npm run build`: OK, 47 módulos, JS 188,71 kB gzip.

## Verificación de esta entrega

- `cdp_altura.mjs` reescrito (adiós a Espacio/Shift y a los botones): puntero capturado con
  **clic real** (el navegador sólo lo concede con gesto de verdad), mira en el centro y aviso,
  giro por `pointermove`, altura con la mirada (sube 3,27 → 7,88, suelo en 0,9, techo en 9, el
  horizonte sostiene), **llegada volando al mirador a 0,25 m del destino y a 5,1 m sobre la
  meseta** (antes: 9,16 m y bloqueada), baranda que se cruza a crucero pero no a ras, muro que
  sigue bloqueando, falda registrada y en pendiente, invariantes limpios y móvil sin botones de
  altura. Capturas `vuelo_mirador.png` y `vuelo_movil.png`.
- Batería de navegador contra dev 5175, uno a uno: **`cdp_fisica`, `cdp_cancelar`,
  `cdp_paquete1`, `cdp_patio`, `cdp_ambiente`, `cdp_mariposa`, `cdp_metricas`, `cdp_modelos`,
  `cdp_circuito` (4/4, 194 s), `cdp_lectura`, `cdp_narracion`, `cdp_paneles` y
  `cdp_jugabilidad` en verde**. La primera pasada destapó que cuatro guiones pulsaban chips del
  cajón nuevo y fallaban con «el clic no alcanzó …»: se arregló en el arnés, no guion por guion
  (ver quirks).
- `cdp_rendimiento` sigue **por debajo de su umbral de 5 FPS** (3,5 el peor encuadre) con la
  máquina a *load average* 48 durante la corrida, pero **las llamadas y los triángulos del peor
  encuadre son los mismos de la entrega anterior** (246 y 136 932): es el banco (SwiftShader),
  no la escena. Comparar siempre llamadas y triángulos.
- El texto de la Ayuda se acortó dos veces por una razón medida, no estética: `cdp_paneles`
  exige que «Reiniciar recorrido» se vea sin desplazar dentro del diálogo (764 px de caja en
  esta pantalla) y el contenido nuevo lo empujaba fuera. Si se añade una viñeta, medir con
  `cdp_paneles`.

## Quirks que el siguiente no debe repetir

- **Los `pointermove` inyectados por CDP no traen `movementX/Y`**: para probar el giro hay que
  despachar el `PointerEvent` a mano (misma trampa que los botones sostenidos del HUD viejo).
  La captura, en cambio, **sí exige clic real**: un `PointerEvent` sintético la recibe
  rechazada y el guion cree que el producto falló.
- **Capturar el puntero en el `pointerdown` fue un error**: el arrastre del tutorial capturaba
  y `cdp_jugabilidad` se quedó sin HUD (todos los clics caían en el lienzo). La captura va en
  el `pointerup` del clic corto, y el arrastre no captura.
- **Con el puntero capturado no hay cursor**: el HUD entero depende de Esc (o de que `main`
  suelte al abrir un panel). El aviso bajo la mira existe por eso; no lo quites sin dar otra
  salida.
- **La altura se lee un frame tarde tras cambiar la inclinación** (en headless, ~0,3 m), así
  que los guiones comparan convergencia entre dos lecturas separadas, no valores exactos.
- El HUD se reacomodó en paralelo a esta entrega (cajón **«Más opciones»**, `#hud-top`): Ayuda,
  Voz, Sonido, Recuerdo y Portada ya no están a la vista, y **medían 0 × 0** para los guiones,
  que fallaban con «el clic no alcanzó …» (le pasaba a `cdp_lectura`, `cdp_narracion` y
  `cdp_jugabilidad`). El arnés lo resuelve solo: `clic()` abre el cajón cuando el objetivo vive
  dentro y hay un `abrirCajon()` idempotente para lo que se mide con `puedeClic`.
- La mirada sigue siendo el mando de altura durante el recorrido guiado (el tour mueve a la
  mariposa, no la mirada): si el usuario inclina la cámara mientras dura, al terminar el vuelo
  sube o baja. `resetAltitude()` + `recenter()` en `startTour` cubren el arranque, no el final.

---

# Registro anterior · el vuelo sube y baja (22 septiembre 2026)

Pedido: «quiero poder subir o bajar, no solamente moverme hacia los lados y adelante». El
vuelo era plano: `PlayerController._apply` reescribía `p.y` cada frame hacia `groundAt + HOVER`
y **no había ninguna otra escritura de `p.y` en todo el proyecto**, así que cualquier altura
manual se deshacía sola. Ahora la altura es un desplazamiento sobre el terreno que elige el
mando.

## Qué se entregó

- **`src/navigation/PlayerController.js`:** nuevo estado `alt` (arranca en `HOVER` 2,1) y
  constantes `RISE = 2.6`, `ALT_MIN = .9`, `ALT_MAX = 9`. `_apply` sigue igual de suave
  (`5·dt`) pero persigue `gy + this.alt` en vez de `gy + HOVER`; `update` acepta
  `move.up` (±1) y lo aplica a `RISE m/s`, con tope por abajo y por arriba. `resetAltitude()`
  devuelve a crucero. **La altura se conserva al soltar**: subir no es un salto, es volar.
- **Medida desde el terreno, nunca absoluta.** Al cruzar la meseta del mirador (3 m) o el
  muelle la mariposa sube con el suelo en vez de hundirse: la promesa «ni caídas ni atascos»
  sigue en pie. `ALT_MIN` 0,9 la deja pasar a ras sin tocar el suelo.
- **`src/navigation/InputController.js`:** `Space` → `up`, `ShiftLeft`/`ShiftRight` → `down`
  en `KEY_MAP`; `liftPress(dir)`/`liftRelease()` para los botones del HUD (se funden con el
  teclado en `sample().move.up`, y `clear()` los suelta). El espacio **no** se intercepta si el
  foco está en un `button`/`a`: ahí manda el navegador, que es quien activa el botón.
- **HUD:** `#altitude` con `#fly-up`/`#fly-down` en `index.html`; en `main.js`, `setupAltitude()`
  los mantiene pulsados con `pointerdown`/`pointerup` + `pointercancel`/`lostpointercapture`.
  `start()` va **antes** de `setPointerCapture` (y ésta en `try`): si la captura falla, volar
  no se pierde.
- **El recorrido guiado devuelve la altura de crucero** (`startTour` → `resetAltitude`). Sin
  eso, quien venía del techo volaba el relato entero a 9 m y ninguna llegada se veía desde
  donde fue escrita.
- Textos: Ayuda (viñeta «Altura»), pista de la portada, tutorial de tres pasos, `README.md`.

## Dónde vive cada cosa (para no volver a buscar)

- Altura deseada: `player.alt`. Altura real: `player.position.y`, que la persigue con retardo
  (~0,4 m a velocidad de subida). Los guiones CDP que afirmen un valor exacto deben dejar
  asentar un frame o mirar `alt`, no `y`.
- **Subir del techo de las interacciones es deliberado:** `InteractionSystem` descarta lo que
  esté a más de 2 m y `main.js` sólo da por visitado un lugar dentro de ±2 m de la altura de
  referencia. Con la mariposa arriba no se lee ni se descubre: hay que bajar. Es la regla, no
  un fallo (y es la razón de que `ALT_MAX` no sea más alto).

## Verificación de esta entrega

- `node --test tests/*.test.js`: **48/48** (6 nuevas en `controls.test.js`: teclado, botones,
  espacio sobre botón con foco, topes de suelo y techo, altura sobre la meseta, y el reset del
  recorrido).
- `npm run build`: OK, 47 módulos, JS 187,95 kB gzip (warning de chunk Three.js ya existente).
- CDP contra dev 5175, consola limpia: **`cdp_altura`** (nuevo: 2,1 → 4,4 con Espacio, suelo en
  0,9 sin hundirse, techo en 9, botones ▼ y ▲ por puntero real, `pointercancel` no deja el
  botón pegado, meseta del mirador a 3+2,1, el tour baja a 2,1, y los botones no pisan
  joystick/minimapa/banner en 390×844), y las regresiones **`cdp_fisica`**, **`cdp_jugabilidad`**,
  **`cdp_cancelar`** y **`cdp_circuito`** (4/4, llegadas a 2,1 / 2,4 / 5,1 — la altura de
  crucero por terreno intacta).
- Capturas: `altura_escritorio.png` y `altura_movil.png` en la carpeta temporal.

## Quirks que el siguiente no debe repetir

- **El rincón inferior derecho del móvil ya era del minimapa** y el inferior izquierdo del
  joystick y del banner del recorrido (`left:138px` en móvil: los botones de altura quedaban
  literalmente debajo del texto del banner). Los ▲▼ van **encima del minimapa**, a la derecha.
  Cualquier control nuevo en táctil debería medirse contra esas cuatro cajas —`cdp_altura` ya
  lo hace y falla si alguien los pisa.
- **El renderizado sin GPU va a media máquina:** sostener Espacio 6 s reales daban 8,96 m y no
  9. Los guiones no deben cronometrar la altura; comprobar el invariante (nunca por encima) y
  luego la convergencia.
- `cdp_altura` despacha `PointerEvent` sintéticos para poder **sostener** el botón: el `clic()`
  del arnés suelta en el acto y no probaría un control de mantener pulsado. Con la captura de
  puntero en `try`, el `pointerId` falso no rompe nada.

---

# Registro anterior · pueblo vivo: modelos y vida (22 septiembre 2026)

Pedido: «mejorar los modelos; el pueblo debe sentirse más vivo». La spec del recorrido ya lo
pedía («añadir marcos, aleros, bancos, macetas, faroles y textiles»; «evitar formas que
parezcan bloques de juguete vistos de cerca») y estaba sin hacer. Entrega completa:
vocabulario de piezas, los cinco lugares rehechos, capa de vida y sonido ambiente. Detalle
técnico, presupuesto y trampas: **`docs/SPEC-PUEBLO-VIVO.md`**.

## Último incremento · las palmeras (misma fecha)

Pedido: «mejora las palmeras». La corona era el eslabón flojo: una hoja plana de 26 cm de ancho
sobre 2,4 m de largo —de canto desde media docena de ángulos— y **de una sola cara**, así que
desde la calle se veía el cielo dentro de la copa. Lo que cambió, todo en `src/world/kit.js`:

- **`geoHojaPalma` (nueva):** fronda pinnada de 46 triángulos —raquis en tienda de campaña y 15
  pares de folíolos en aguja con hueco entre uno y otro—. Con los folíolos pegados (primera
  versión) la fronda se leía como una hoja de plátano de borde rizado.
- **Dos caras por material, no volteando la malla:** `mat.palma` y `mat.palmaSeca` con
  `DoubleSide`. Son dueñas únicas de su material, así que cuesta cero triángulos donde duplicar
  la malla costaba el doble. (En `flora.js` sigue volteándose: ahí el material es compartido.)
- **Corona en dos anillos y a varias alturas:** 4 cogollos en pie y 8 frondas maduras
  escalonadas; antes nueve hojas en un solo plano, que de lejos era un parasol.
- **Tronco:** tubo abierto de ocho caras (`tronco8`) con tramos de 30 cm ahusados y alternados
  (`rx: π` un tramo sí y otro no), de modo que las juntas casan radio con radio: el zigzag del
  cocotero, sin un solo escalón. Base floreada al pie y capitel de un tapón + banda verde donde
  arraigan las frondas. Dos intentos fallidos antes: el cilindro ancho con esfera encima se leía
  sombrero de copa, y el anillo alterno, bambú (o serrucho en el canto).

Medición (Chrome headless, SwiftShader): peor encuadre **136 932 triángulos y 246 llamadas**
(antes 129 158 / 240) — 9 % de margen sobre el techo de 150 000. Las catorce palmeras pasan de
unos 10 400 a unos 17 800 triángulos (fronda 168 × 46, frondas secas 49 × 46, tronco 293 × 16).
Verificación: `node --test tests/*.test.js` **48/48**, `cdp_rendimiento` OK, `cdp_circuito` 4/4,
`cdp_fisica` OK, `cdp_metricas` OK. Capturas de acercamiento (`cdp_modelos`) y del vuelo a ras
de una palmera.

## Qué se entregó

- **`src/world/kit.js` (nuevo):** materiales, geometrías de perfil propio (`geoTeja`
  acanalada, `geoTriangulo`, `geoHoja` con pliegue en V), acumulador de instancias
  (`lote`/`hornear`) y veinte piezas con nombre: casa de una y dos plantas, portal, ventana
  con contraventanas y luz, puerta de dos hojas, chimenea, techo a dos y a cuatro aguas,
  palmera, banano, arbusto, maceta, farol, banca, pozo, carreta, barril, tendedero, hamaca,
  nasas, junco, cartel y cerca. El **reloj de la llegada** se sumó después como pieza propia
  (esfera redonda con aro, cuartos en romano por el vocabulario de trazos del cartel, agujas
  cada una con su largo y su cola): antes vivía suelto en `places/plaza.js` y su poste
  atravesaba la carátula.
- **`src/world/places/*.js` (nuevos):** los cinco lugares y las calles, en la arquitectura
  que la spec proponía (`src/world/locations/*.js`). `createVillage.js` queda como
  orquestador de 164 líneas.
- **`src/world/ambient.js` (nuevo):** las 45 mariposas del pueblo con las alas pintadas del
  avatar (fase 2 de §10 de `SPEC-MARIPOSA-AVATAR.md`, ahora 4 llamadas en vez de ~90 mallas),
  12 aves, 6 libélulas, humo de cuatro chimeneas, 44 motas de polvo, brillos del sol en el
  río, viento en la vegetación, espuma en la orilla, ondas en la fuente y pétalos en el
  jardín. Todo cuelga de `kit.actualizar`, así que «Pausar movimiento» y
  `prefers-reduced-motion` lo congelan.
- **`src/audio/AmbientBed.js` + `internal/scripts/generar_ambiente.mjs` (nuevos):** viento,
  río y aves **sintetizados** en casa con semilla fija (originales, sin licencias de
  terceros; manifiesto por hash, idempotente). Apagados por defecto —silencio inicial— y el
  chip «Sonido» del HUD los enciende; el río sube al acercarse al agua y todo cede al 32 %
  mientras habla la guía. `audioFactory` inyectable, probado en Node.
- **`README.md`** (sección «El pueblo vivo», arquitectura y regeneración de audio) y
  **`docs/SPEC-PUEBLO-VIVO.md`** (spec de la entrega).

## Lo que se conserva intacto

Grafo `NODES`/`EDGES`, alturas transitables, cajas de agua y de fachadas, los siete anclas
de `ENCOUNTERS`, la voz narrada con su gate, postal, beacon, mapa, fallback y persistencia.
Se movió **una** casa (la oeste, a (−7,6, −4,8)) porque su esquina rozaba el camino `pW→n1`.

## Medición (Chrome headless, SwiftShader: es un suelo, no una medida de dispositivo)

| Encuadre | Llamadas antes | Llamadas ahora | Triángulos ahora |
|---|---|---|---|
| Plaza | 239 | 223 | 74 976 |
| Casa | 86 | 118 | 71 148 |
| Jardín | 81 | 131 | 67 418 |
| Puerto | 44 | 93 | 60 158 |
| Mirador | 288 | 272 | 76 472 |

Mallas 371 → 328 (65 instanciadas), geometrías 82 → 71, bundle 155,55 → **167,58 kB gzip**.
El jardín no es comparable 1:1: su cámara de captura se acercó para no meterse dentro de una
casa. FPS del banco de pruebas: 11–13 (plaza), 16–20 (puerto), 11–12 (mirador), por debajo
del umbral de 20 FPS con el que el reloj del paseo se mantiene en tiempo real — de ahí el
cambio de `cdp_circuito` (ver abajo). Instrumentos: `cdp_metricas.mjs`, `cdp_rendimiento.mjs`
y `internal/scripts/pesar_escena.mjs`.

## Errores que encontró la red de seguridad (no repetir)

1. **La casa oeste rozaba `pW→n1`** (0,37 m de holgura): la cazó la prueba nueva de
   transitabilidad, no un ojo.
2. **Se perdieron las dos rampas del muelle** al reescribir el puerto: el vuelo cruzaba el
   muelle a la altura de la arena (2,1 m en vez de 2,45 m). Lo cantó `cdp_circuito` y ahora
   lo vigila «las alturas del recorrido son las prometidas».
3. **Se perdieron las tres cajas de colisión del agua** en el mismo refactor: se podía
   cruzar el río. Lo cantó `cdp_fisica` y ahora lo vigila «el agua no se cruza y el muelle sí».
4. **Los vanos de la fachada de la casa** tenían giro π y quedaban enterrados en el muro
   (la casa mira a +z, no a −z como las casas del pueblo).
5. **Los pétalos del jardín** se instanciaron con el cono unidad sin escala: salieron de 1 m.
6. **`lote()` devuelve un índice, no una malla**: la mecedora se animaba escribiendo sobre un
   número y reventaba en cada frame. Lo que se anima va suelto o por `movil`.
7. **Orden de Euler 'XYZ'**: las aves y libélulas apuntaban al norte del mundo hasta poner
   el tumbo en z y el giro en y.
8. **La capa de oleaje del río** (plana y transparente, `depthWrite` por defecto) tapaba el
   agua entera: se veía una mancha verde. El agua es opaca y las capas de encima llevan
   `depthWrite:false`.
9. **Sombra por objeto**: cada lote instanciado se dibujaba entero otra vez en el mapa de
   sombras. Con sombra sólo en la silueta (`CON_SOMBRA` en el kit) el banco de pruebas pasó
   de 10 a 20 FPS sin perder nada visible. El spec lo pedía.

## Verificación de esta entrega

- `node --test tests/architecture.test.js`: **18/18** (11 que había + 7 nuevas: tres de
  transitabilidad — el pueblo se construye sin navegador —, alturas prometidas, agua,
  aproximación a los encuentros y las dos del lecho sonoro).
- `npm run build`: OK, 35 módulos, JS **167,58 kB gzip** (warning de chunk Three.js ya
  existente). `node internal/scripts/generar_ambiente.mjs`: 3 generados y la segunda corrida
  0 (idempotente).
- CDP contra dev 5175, consola limpia en todos: **cdp_circuito** 4/4 y CIRCUITO OK,
  **cdp_fisica**, **cdp_cancelar**, **cdp_lectura**, **cdp_paquete1**, **cdp_narracion**,
  **cdp_mariposa** (avatar intacto: 11 mallas / 1024 triángulos / textura presente),
  **cdp_ambiente** (nuevo: silencio inicial, los tres MP3 cargan, el río sube en la orilla,
  la voz atenúa, apagar pausa), **cdp_metricas** y **cdp_rendimiento**.
- Capturas de los cinco lugares desde el paseo: `pueblo_metricas_final_*.png`.

## Quirks que el siguiente no debe repetir

- **`cdp_circuito` ya no espera por tiempo fijo**: espera a que el recorrido llegue de verdad
  (hasta 150 s) y falla con código 1 si no llega. Con SwiftShader por debajo de 20 FPS el
  reloj del paseo avanza a la mitad y las esperas fijas leían el estado a medio camino.
  Los demás guiones siguen con esperas fijas: **bajo carga de máquina sus lecturas pueden
  salir a medio vuelo** (pasó con `cdp_cancelar` A_PLAZA). Para leerlos en serio, correrlos
  de uno en uno y sin procesos en paralelo.
- **Los guiones comparten el puerto 9335 y perfil**; si uno queda colgado
  («unsettled top-level await» en `Page.enable`), el siguiente se cuelga igual:
  `pkill -9 -f chrome-cdp` y 3 s de espera antes de reintentar.
- **`localStorage` con perfil compartido**: `cdp_paquete1` imprimió `stored:null` con la
  característica funcionando (comprobado aparte con perfil limpio). No confundir el artefacto
  del banco con una regresión de persistencia.
- **`parse` de las capturas**: el guion coloca la cámara 4,52 m detrás del rumbo; en el
  jardín eso la metía dentro de una casa (la entrada del jardín en `cdp_metricas` se movió
  a (23,4, −11,5)). Desde el paseo real, la cámara de tercera persona tampoco colisiona con
  la geometría: limitación conocida, no resuelta aquí.
- Las mediciones de FPS del banco son de CPU (SwiftShader) y varían ±20 % con la carga de la
  máquina. Comparar siempre llamadas y triángulos, que son deterministas.

## Próximo agente

- **Calidad del sonido ambiente**: escuchar los tres MP3 (chips «Sonido» y «Voz»). Si la
  síntesis no basta, el respaldo pactado es material CC0 o de dominio público con autoría y
  licencia registradas; el guion está en `internal/scripts/generar_ambiente.mjs`.
- **Metas del spec sin medir**: FPS y táctil en dispositivo real (≥30 móvil, ≥50 escritorio),
  y el conmutador manual de modo bajo. El banco por CPU sólo da un suelo.
- **Cámara en tercera persona**: no colisiona con la geometría; con las casas de dos plantas
  y las palmeras nuevas hay más sitios donde puede meterse. Merece su propio incremento.
- Pendientes heredados: oclusión real (`sightBlocks` vacío), paquete 2 de historias
  (`Dos tardes bajo el árbol`, `Los nombres de las cosas`, `La voz de la vecina`).
- Si se toca el pueblo o la vida: `node --test tests/architecture.test.js` (la prueba de
  transitabilidad es la red) y después `cdp_circuito`, `cdp_fisica` y `cdp_metricas`.

---

# Registro anterior · el jugador es una mariposa amarilla (21 septiembre 2026)

Pedido: «rethink playability, it has to be easy to play; I want the player to be a yellow
butterfly». Se reemplazó la locomoción peatonal por vuelo de mariposa en tercera persona,
y quedó implementado además `docs/SPEC-MARIPOSA-AVATAR.md` (avatar con alas pintadas).
Nota de autoría: la capa de vuelo la escribió esta sesión; la versión final de
`butterflyAvatar.js` y su integración (main.js con `renderer`, pruebas de §8.1,
`cdp_mariposa.mjs`) llegó de un proceso en paralelo sobre los mismos contratos — el
resultado combinado quedó verificado en esta entrada.

## Cómo se juega ahora
- **Vuelo por punto (el gesto principal):** toque/clic corto en la escena → raycast al
  suelo → `player.flyTo(x,z)`. Si hay un interactuable cerca, el mismo toque abre su
  contenido; si no, vuela hasta el punto. WASD/flechas y joystick vuelan relativos a la
  cámara; arrastrar orbita la cámara (`orbitYaw/orbitPitch` del jugador). E sigue
  interactuando; mirar ya NO cancela el recorrido (solo el movimiento manual).
- **PlayerController reescrito:** hover automático a HOVER 2,1 m sobre `groundAt` (sube
  sola al muelle y al mirador), inercia de mariposa (`_steer`, k=1−e^(−6dt)), rumbo que
  sigue a la velocidad, alabeo `_bank`, radio 0,22. `flyAlong` es la entrada del
  TourController (mismas rutas del grafo, sin tocar NODES/EDGES). Velocidades: crucero
  3,2 m/s; tour 2,8 m/s y 1,7 m/s narrado.
- **Contrato del avatar (spec §2, se respeta):** PlayerController escribe `position` y
  `rotation.y`; el avatar escribe `rotation.z`; nadie escribe `rotation.x`; orden 'YXZ'.
- Se conservan intactos: encuentros/lecturas/historias, voz narrada y su gate de
  «Continuar», postal, beacon, mapa, fallback sin 3D, persistencia.

## Avatar (spec implementado)
- `butterflyAvatar.js` según spec §5 con ajustes a ojo ya aplicados (banda marginal
  proporcional en vez de 46 px fija, `emissiveMap` con la propia textura para que el ala
  que baja no quede marrón a contraluz, filete 2,5 px). Firma
  `createButterfly(scene,{renderer,quieto})` intacta; main.js pasa `experience.renderer`.
- Métricas CDP (`cdp_mariposa.mjs`): 11 mallas / 1024 triángulos del avatar, textura de
  ala presente, consola limpia. Revisión visual con poses congeladas (quieta, vuelo
  arriba/abajo, giro y encuadre real de juego): la banda oscura mantiene la silueta legible
  a 4,8 m.
- Costo medido del cambio: bundle de 145,83 a **155,55 kB gzip (+9,7 kB)**. No son las ∼320
  líneas del módulo: es la maquinaria de curvas de Three.js que el proyecto no usaba en
  ninguna parte (`Shape`/`Path`/earcut/`Lathe`/`Tube`). Comprobado: antes del cambio el bundle
  tenía **cero** ocurrencias de `triangulateShape`, `currentPoint` y `extractPoints`. Desglose
  y la alternativa más barata (antenas con cilindros, ≈2,5 kB) en §6 de la spec.
- `docs/SPEC-MARIPOSA-AVATAR.md` quedó sincronizada con el código entregado (estado
  «implementada»): §5 es el módulo tal como está, §6 las mediciones y §6.1 los tres ajustes
  que solo aparecieron al mirar la pantalla — banda marginal proporcional, emisión modulada
  por la textura y revisar siempre desde el ángulo del paseo (31° sobre el ala).

## Quirks que el siguiente no debe repetir
- Los CDP viejos que movían con `player.yaw = …` ya no aplican: el vuelo es relativo a
  `orbitYaw` (lo fija `place()`). `cdp_fisica` AGUA ya se corrigió (usa place(x,z,π/2)).
- `player.position.y` es ALTURA DE VUELO (~2,1 m): las interacciones se evalúan con esa
  altura directamente (`interactions.update(x, z, position.y)`, sin +EYE).
- Los scripts CDP comparten perfil y puerto 9335: si el shell mata el nodo con kill -9,
  queda un Chrome zombi que roba la conexión del siguiente script (le pasó a
  `cdp_paquete1`). Ante cuelgues sin salida: `pkill -9 -f chrome-cdp-macondo` y reintentar.
- TourNarrator sigue leyendo `macondo.voz.v1` al arrancar el módulo (recargar tras fijarlo).
- `cdp_lectura` es frágil en su **última** captura (la portada aérea): el renderer de
  SwiftShader se cae con el pueblo entero en pantalla. Todo lo funcional del guion —lectura,
  respuesta, escritura persistida y vista móvil— pasa antes de ese punto, y se comporta igual
  con el avatar viejo (comprobado A/B): es del banco de pruebas, no del avatar.
- Si un guion imprime `METRICAS: undefined`, lo más probable es que el servidor de 5175 haya
  muerto entre corridas: `curl http://127.0.0.1:5175/` antes de sospechar del código.

## Verificación de esta entrada (estado combinado)
- `node --test tests/architecture.test.js`: **11/11** (9 de narración/vuelo + 2 del
  avatar §8.1, incluida identidad de caché de geometrías).
- `npm run build`: OK (warning de chunk Three.js existente).
- CDP contra dev 5175, consola limpia: **cdp_narracion** (voz+gate+postal de 343 kB con
  la mariposa en cuadro), **cdp_circuito** 4/4 (hover por terreno: 2,1 m calle / 2,4 m
  muelle / 5,1 m mirador), **cdp_fisica** (muro y agua bloquean el vuelo),
  **cdp_lectura**, **cdp_cancelar**, **cdp_paquete1** (tras limpiar un Chrome zombi),
  **cdp_mariposa** (poses + métricas).

## Próximo agente
- Fase 2 opcional del spec §10: reutilizar `geometriaAla('anterior')` + textura en las 45
  mariposas del pueblo sin sumar draw calls (cuidar el origen de la geometría, ±0,02).
- Paquete 2 de historias (`Dos tardes bajo el árbol`, `Los nombres de las cosas`, `La voz de
  la vecina`) reutilizando NarrativeDirector, clave de historias y registro de efectos; la
  voz de la vecina puede reusar TourNarrator + generar_audio.mjs.
- Pendientes heredados: oclusión real (`sightBlocks` vacío), métricas táctiles/FPS en
  dispositivo real, conmutador manual de modo bajo. `guia-inicio` sigue grabado y sin cablear.
- Si tocas el vuelo o la cámara: repetir `cdp_circuito`, `cdp_fisica`, `cdp_lectura` y
  `cdp_mariposa.mjs` contra dev 5175 (puerto fijo en los scripts) y confirmar consola limpia.

---

# Registro anterior · experiencia narrada es-CO completa (21 septiembre 2026)

Continúa el pedido «navegación más atractiva + versión guiada con voz en español colombiano»
(plan aprobado: `~/.commandcode/plans/macondo-experiencia-narrada.md`). Los 10 pasos que
quedaban pendientes en el registro de abajo están implementados y verificados: tests 9/9,
build OK, CDP limpio. Encontró y corrigió además un bug latente de interacción (ver abajo).

## Qué existe ahora
- **Voz conectada en main.js** (TourNarrator): `bienvenida` una vez por sesión tras la
  transición; `camino-<dest>` al guiar (velocidad 1,7 m/s con voz); `llegada-<dest>` oculta
  «Continuar» hasta que termina el relato (flag `narrandoLlegada`; `releasePanel` y apagar
  la voz liberan el gate; «Saltar audio» dispara onEnded). Mirador final: `fin-recorrido`
  tras `llegada-mirador`. `blockPanel` pausa la voz; sin reanudación automática (el gesto
  manda, según espec). `stopTour`/Escape/movimiento manual/cerrar lectura → `interrupt()`.
- **18 clips** en `public/audio` (3 nuevos: `lectura-llegada`, `lectura-mariposas`,
  `lectura-tren`; generados, segunda corrida idempotente).
- **3 estaciones sin quiz** (`question:null` + `conversa`) en content.js: `llegada`/plaza,
  `mariposas`/jardín, `tren`/puerto. Encuentros nuevos: `objeto-reloj`, `objeto-espiral`,
  `objeto-faro` (coordenadas del plan). Lectura sin quiz: `#reading-quiz` oculto, visible
  `#reading-conversa` y `#reading-listen` (→ `play('lectura-<id>',{force:true})`).
- **beacon.js**: faro de destino (esfera emisiva + columna pulsante; estático con
  prefers-reduced-motion; getter `.visible` para CDP).
- **createVillage.js**: reloj con manecilla animada, mecedora que se mece, espiral de
  mariposas sobre el banco, faro con parpadeo, bandera de viento con onda; todos con
  colisión, sin tocar NODES/EDGES.
- **postal.js**: `capturarPostal(experience,{titulo,linea})` render+toDataURL en la misma
  tarea, compone 1200×1500 (foto cover, banda crema, MACONDO, título, línea con ajuste
  manual, fecha es-CO). `#take-postcard` descarga con patrón Blob y expone
  `__macondo.ultimaPostal` (longitud; getter en el gancho para no pisarlo el tick).
- **Navegación más atractiva**: vaivén `walkPulse` (amplitud 0,032 que decae ~240 ms,
  micro-roll 0,004, off con prefers-reduced-motion, solo visual), `TourController` con
  opción `speed`, reaparición animada de `#place-name` (clase `.reveal` relanzada al
  cambiar el nombre), viñeta `#vignette`, progreso «n/4» en el banner. index.html
  reformateado (mismos ids) + `#caption` (fuera del HUD), `#audio-voice`, `#take-postcard`,
  `#tour-skip-audio`.

## Corrección encontrada por la nueva prueba (bug heredado, no de esta sesión)
- main.js pasaba `player.position.y` (SUELO) a InteractionSystem, cuyo contrato es altura
  de ojos: el gate de altura excluía todo encuentro con eyeY > 2 — `arbol-tiempo`
  (eyeY 2,2) llevaba tiempo sin ser interactuable y el reloj nuevo tampoco habría
  funcionado. Ahora se pasa `position.y + EYE`. CDP de paquete 1 repite verde tras el cambio.
- **«Saltar audio» no se podía pulsar** (heredado, destapado por `cdp_narracion`). El botón
  vivía dentro de `#tour-banner`, que está oculto fuera del recorrido: durante la bienvenida
  medía 0 × 0 y la narración de entrada no se podía interrumpir. Ahora vive en `#caption-bar`,
  junto al subtítulo y fuera del HUD —igual que `#caption`, que ya se había mudado por la
  misma razón— y `onCaption` lo gobierna solo (`hidden = !texto`), que era la intención
  original. Lleva `pointer-events:auto` porque la barra nace con `pointer-events:none`. Si
  vuelve al banner, el paso 2 de `cdp_narracion` falla otra vez (y ahora deja la captura
  `narracion_bienvenida.png` como constancia).

## Quirks que el siguiente no debe repetir
- TourNarrator lee `macondo.voz.v1` AL ARRANCAR el módulo: en scripts CDP, fijar la
  preferencia exige RECARGAR la página después (`cdp_narracion` y `cdp_circuito` ya lo hacen).
- El perfil CDP comparte localStorage entre corridas: no dar por buena la primera corrida.
- `cdp_cancelar` (COLISION) coloca al jugador en x=0, que es el hueco de la puerta:
  atravesarla es correcto; el bloqueo real lo prueba MURO en `cdp_fisica`.
- `guia-inicio` está grabado pero sin cablear (startTours reproduce `camino-<dest>`).
- Un `[hidden]` en un contenedor deja sin caja a TODOS sus hijos: un control que deba seguir
  siendo pulsable cuando ese contenedor se oculta no puede vivir dentro. El síntoma es
  traicionero —el elemento conserva su `display` calculado y su `hidden` en falso, pero su
  rect mide 0 × 0 y ningún clic lo alcanza—. Antes de mover un control del HUD, decidir en
  qué estados debe verse y colgarlo del contenedor que sobreviva a todos.

## Verificación de esta entrega
- `node --test tests/architecture.test.js`: **9/9** (inventario de NARRACION ≤1200,
  narrador con audioFactory falso: reemplazo/interrupt/skip/apagado; MP3 ausente libera).
- `node internal/scripts/generar_audio.mjs`: «3 generados, 15 sin cambios».
- `npm run build`: OK, 25 módulos, JS 143,95 KB gzip (warning de chunk Three.js existente).
- CDP contra dev 5175: **cdp_narracion** (bienvenida+skip, camino 1,7+beacon, gate de
  Continuar y liberación simulada, postal ~275 kB, lectura sin quiz, Escuchar, cierre,
  voz persistida; consola limpia), **cdp_circuito** 4/4, **cdp_fisica**, **cdp_lectura**,
  **cdp_cancelar**, **cdp_paquete1** — todos verdes, consola limpia. Capturas
  `narracion_camino.png` y `narracion_lectura.png` en la carpeta temporal.

## Próximo agente
- Trabajo diferido, especificado y **sin implementar**: avatar de mariposa amarilla
  (`docs/SPEC-MARIPOSA-AVATAR.md`) — cuatro alas con contorno propio, textura pintada en el
  cliente, cuerpo en un solo lathe y aleteo con desfase entre ala anterior y posterior.
  Geometría, signos de bisagra y costo ya medidos con Three.js 0.180 en Node. No bloquea
  nada: el avatar vigente funciona.
- Paquete 2 de historias (`Dos tardes bajo el árbol`, `Los nombres de las cosas`, `La voz de
  la vecina`) reutilizando NarrativeDirector, clave de historias y registro de efectos; la
  voz de la vecina puede reusar TourNarrator + generar_audio.mjs.
- Pendientes heredados: oclusión real (`sightBlocks` vacío), métricas táctiles/FPS en
  dispositivo real, conmutador manual de modo bajo.
- Si tocas la navegación, repetir `cdp_circuito` y `cdp_fisica` contra un `npm run dev`
  (usar puerto 5175: los scripts lo tienen fijo) y confirmar consola limpia.

---

# Entrega parcial · experiencia narrada es-CO (completada — ver «Entrega vigente» arriba)

Pedido: navegación más atractiva + versión guiada con voz en español colombiano que lleve el ritmo
+ elementos, imágenes descargables y pasajes. Plan aprobado completo (fuera del repo):
`~/.commandcode/plans/macondo-experiencia-narrada.md`. Estado actual: **base verde** (tests 6/6,
build OK). Nada del código existente fue modificado; todo lo entregado hasta aquí es aditivo.

## Hecho y verificado
- `src/data/narracion.js` (nuevo): textos originales es-CO (usted). 11 clips de guía +
  `lectura-<stationId>` derivados de content.js → 15 ids hoy (18 al añadir los pasajes nuevos).
  Exporta `NARRACION`, `audioUrl(id)` (→ `./audio/<id>.mp3`), `VOZ_ESCO='gloria'`.
- `internal/scripts/generar_audio.mjs` (nuevo): Deepgram Aura 2 REST. Manifiesto con sha256 en
  `internal/audio/manifest.json` → idempotente (2.ª corrida: «0 generados, 15 sin cambios»).
  Llave: `$DEEPGRAM_KEY` o `internal/audio/deepgram.key` (añadido a .gitignore; ya guardada).
  Flags `--voz celeste` y `--forzar`.
- `public/audio/*.mp3` (nuevo): 15 clips reales, voz `aura-2-gloria-es` (es-CO), 1,6 MB total,
  MP3 24 kHz/48 kbps. `bienvenida` dura ~21 s. Quirks de la API (no repetir mi ensayo/error):
  `container=mp3` es inválido (solo wav/ogg/none; el default YA es MP3) y `bit_rate` para mp3
  admite máx 48000.
- `src/audio/TourNarrator.js` (nuevo, sin probar ni conectar): `play(id,{force})`,
  `interrupt()` (cancela sin avisar) vs `skip()` (dispara onEnded para el flujo), `pause/resume`,
  `has(id)`, `current` (para CDP), `enabled` persistido en `macondo.voz.v1` (default ON),
  `onCaption/onEnded` inyectados; si el MP3 falta, `onerror` → `onEnded` (el flujo no se cuelga).
  `audioFactory` inyectable para tests en Node.

## Pendiente (orden sugerido)
1. `PlayerController`: vaivén — `walkPulse(dt)` público que avanza fase y marca `_lastWalk`,
   `_apply()` aplica `sin(fase)*0.032` (amplitud que decae ~240 ms sin pasos) y micro-roll 0,004;
   off con `prefers-reduced-motion`. `TourController`: option `speed` (default 2.2) para el
   literal `2.2*dt` de `update()`; main usará 1,7 en modo narrado. `update()` manual también debe
   llamar `walkPulse` cuando hay movimiento.
2. `content.js`: 3 estaciones nuevas con `question:null` + campo `conversa` (ver plan para textos
   borrador): `llegada`/plaza «El pueblo que se inventa», `mariposas`/jardin «Las mariposas que
   anuncian», `tren`/puerto «El tren de los buhoneros». `encounters.js`: `objeto-reloj` (3.2,5.2,
   r 2.0, eyeY 2.2), `objeto-espiral` (22.4,-7.6, r 2.1), `objeto-faro` (-22.8,10.6, r 2.0,
   eyeY 2.6). Después: `node internal/scripts/generar_audio.mjs` (generará los 3 `lectura-*` nuevos).
3. `src/world/beacon.js` (nuevo): esfera emisiva + columna translúcida; `set(locationId)` usa
   LOCATIONS+groundAt, `clear()`, `update(t)` (estático si reduced-motion).
4. `createVillage.js` — 5 elementos, patrones box/cyl + colisión, sin tocar NODES/EDGES:
   reloj de la llegada (3.2,0,5.2 + manecilla animada), mecedora (grupo casa, local (2.4,0,1.8)),
   espiral de mariposas sobre el banco del jardín (grupo jardin, local (-2.6,·,3.4)),
   faro del muelle (-22.8,0,10.6 con luz que parpadea), bandera de viento en el mirador
   (14.8,3,24.5, plano con geometry.translate(.55,0,0) y vaivén).
5. `src/world/postal.js` (nuevo): `capturarPostal(experience,{titulo,linea})` — llamar
   `renderer.render()` y `toDataURL()` en la misma tarea (evita preserveDrawingBuffer); canvas
   1200×1500: foto cover arriba (banda de 60 px), banda crema abajo con «MACONDO», título,
   línea (con ajuste manual de línea) y fecha `toLocaleDateString('es-CO')`.
6. `index.html` (MINIFICADO — el contenido completo quedó extraído en la sesión anterior;
   reformatar sin cambiar ids existentes): añadir `#caption` FUERA de `#hud` (fixed, z 6),
   `#audio-voice` en hud-actions, `#take-postcard` (hidden), `#tour-skip-audio` en el banner,
   `fieldset id="reading-quiz"` + `#reading-conversa` + `#reading-listen` en el diálogo reading,
   `#vignette` (visible solo con .exploring). `style.css`: subtítulo, chip `[aria-pressed=true]`
   dorado, `@keyframes reveal` para `#place-name`, viñeta, `#reading-conversa`.
7. `main.js` wiring: narrator global (onCaption→#caption); `startTour`: `tour.speed` 1,7 si
   narrado, `beacon.set(dest)`, `narrator.play('camino-'+dest)` si `has()`; `onTourArrive`: si
   `narrator.enabled && has('llegada-'+dest)` → ocultar `#tour-continue` hasta `onEnded` (flag
   `narrandoLlegada`; `releasePanel` debe reabrir Continuar si un panel interrumpió el audio),
   sino comportamiento actual; mirador final → `fin-recorrido` tras `llegada-mirador`.
   `stopTour`/Escape/movimiento manual → `interrupt()`; `blockPanel()` → `narrator.pause()`;
   close de `#reading` → `interrupt()`; `#audio-voice` toggle+persist; `endTransition()` →
   `play('bienvenida')` una sola vez por sesión; `#tour-skip-audio` → `skip()`; `#take-postcard`
   → `capturarPostal` + descarga (patrón Blob de main.js:379) + `__macondo.ultimaPostal` = longitud;
   exponer `narrator` y `beacon` en `window.__macondo`; ocultar `#take-postcard` en portada/fallback.
   Abrir lectura sin quiz: `$('#reading-quiz').hidden = !st.question` + mostrar `#reading-conversa`
   y `#reading-listen` (→ `narrator.play('lectura-'+id,{force:true})`).
8. `tests/architecture.test.js`: ids de NARRACION completos (11 + todas las estaciones) y textos
   ≤1200; TourNarrator con audioFactory falso (reemplazo, interrupt sin aviso, skip con aviso,
   disabled→null). Correr suite.
9. CDP: nuevo `internal/verificacion/cdp_narracion.mjs` (plantilla `cdp_circuito.mjs`, URL_ 5175;
   simular fin de audio con `__macondo.narrator.current.onended()`; verificar subtítulo, gate de
   Continuar en llegada-casa, postal, `#reading-listen` con estación sin quiz, consola limpia).
   Regresiones: `cdp_circuito` (si la voz alarga tiempos, desactivar voz al inicio del script),
   `cdp_fisica`, `cdp_lectura`, `cdp_cancelar`; `npm run build`.
10. Cierre: README (sección «Recorrido narrado» y regeneración de audio) y esta HANDOFF como
    entrega vigente.

## Riesgos / notas
- Spec: silencio inicial, audio opcional y subtítulos — todo audio nace de gesto; no reanudar
  solo al cerrar paneles (Continuar/Escuchar son el gesto).
- En Chrome headless no esperar audio real: simular `ended`.
- Si Deepgram falla mañana, la app sigue completa (subtítulos siempre; `onerror` libera el flujo).

## Cómo verificar lo ya entregado
`node internal/scripts/generar_audio.mjs` (debe decir 0 generados / 15 sin cambios),
`node --test tests/architecture.test.js` (6/6), `npm run build` OK.

---

# Actualización vigente · paquete narrativo 1 terminado

Leer primero `docs/EXPANSION-NARRATIVA.md`. El paseo base no se reconstruyó.

## Entrega vigente · 21 septiembre 2026
- Paquete 1 implementado: `La silla de quien falta` (patio), `El correo de lo pendiente` (puerto) y `El cuaderno del mirador` (mirador).
- `src/data/stories.js`: datos originales, referencias, acciones/outcomes, reflexiones, límite de 1200 caracteres y clave `macondo.historias.v1`.
- `src/narrative/NarrativeDirector.js`: director pequeño de un único encuentro (`idle → invited → active → resolved`), cierre, reemplazo de elección y resolución idempotente.
- `src/state/historias.js`: restauración/validación tolerante y serialización separada del progreso de visitas/respuestas.
- `src/world/storyEffects.js`: registro cerrado de efectos visibles; taza extra y carta plegada se restauran desde resultados.
- `createVillage.js`: silla del patio y cuaderno del mirador como props anclados al mundo.
- `main.js`/`index.html`/`style.css`: panel accesible de historia, escritura de carta, cuaderno con huellas, copiar/descargar, alternativa sin 3D y bloqueo de locomoción al abrir cualquier panel.
- Lectura crítica original sigue disponible mediante `Profundizar`; acercarse solo invita, no abre por proximidad.
- `tests/architecture.test.js`: 6 pruebas pasan (referencias, director, idempotencia/reemplazo, restauración y límite).

## Verificación de esta entrega
- `node --test tests/architecture.test.js`: 6/6 pasan.
- `npm run build`: correcto; 21 módulos, JS 137.90 KB gzip (warning de chunk Three.js existente).
- `internal/verificacion/cdp_paquete1.mjs`: silla, carta y cuaderno resueltos; resultados persistidos; 2 huellas visibles; consola limpia.
- `cdp_circuito.mjs`: circuito completo, 4/4 lugares, consola limpia.
- `cdp_fisica.mjs`: muro/agua bloquean y alternativa sin 3D lista con 7 botones, consola limpia.
- `cdp_lectura.mjs`: lectura crítica, respuesta, escritura y vista móvil verificadas; consola limpia.
- Capturas previas: `cdp_before_paquete1.mjs` en la carpeta temporal aprobada. Las capturas posteriores se generan con los scripts de verificación.

## Próximo agente
- Paquete 2: `Dos tardes bajo el árbol`, `Los nombres de las cosas` y `La voz de la vecina`.
- Antes de agregar escenas, revisar tono/editorial y repetir circuito/física de navegador.
- Pendientes heredados: oclusión real (`sightBlocks` vacío), métricas táctiles/FPS en dispositivo real, audio opcional y conmutador manual de modo bajo.

---

# Registro anterior · arquitectura y expansión narrativa

Leer primero `docs/EXPANSION-NARRATIVA.md`. El paseo ya existe; no reconstruirlo. El pedido actual fue revisar, mejorar arquitectura con poco costo y preparar la expansión para otro agente. Las seis historias del plan son propuestas, no funcionalidades implementadas.

## Cambios de esta entrega
- `src/data/encounters.js`: registro único de los cuatro objetos interactivos, separado de la construcción de geometría. Nuevas experiencias parten de aquí.
- `src/state/progress.js`: restaura/valida datos y migra nombres históricos a IDs de lugar; serializa versión 2 manteniendo la clave anterior para conservar visitas.
- `main.js`: mapa consume NODES/EDGES reales; descubrimiento por proximidad también al caminar libremente; visitas por ID; escritura del mirador depende de contentId, no del título visible.
- `InteractionSystem`: altura se verifica también en suelo cero y se evita NaN por campos ausentes.
- `tests/architecture.test.js`: referencias/rutas, restauración/migración/corrupción y filtros de altura/oclusión.

## Verificación de esta entrega
Tres pruebas Node pasan; build Vite correcto (~134 KB gzip JS). No se repitió QA visual/CDP en este refactor; las verificaciones descritas más abajo pertenecen al agente anterior. Cambios gráficos y navegación física fuera del alcance actual.
Ejecutar `node --test tests/architecture.test.js` y `npm run build` desde Macondo. Después de integrar historias, repetir circuito y física en navegador disponible.

## Próximo agente: paquete 2
El paquete 1 está implementado arriba. Continuar con jardín, etiquetas y vecina, reutilizando `NarrativeDirector`, la clave de historias y el registro cerrado de efectos.

## Riesgos comprobados por lectura, pendientes de abordar
- main.js sigue concentrando UI, guía y estados. Extraer paneles al añadir el director; evitar una reescritura total.
- Hay un segundo requestAnimationFrame para el vuelo inicial; llevarlo al ciclo Experience antes de añadir transiciones narrativas.
- La detección de oclusión tiene método pero sightBlocks sigue vacío. No afirmar que paredes ocultan interacciones.
- Revisar bloqueo de locomoción al abrir mapa/ayuda/escritura y fallback: no todos esos paneles actualizan mode. Unificar con un controlador de overlays al integrar narración.
- Posiciones físicas de props siguen escritas en createVillage; encuentros definen activación, no generan automáticamente esos props. Al mover un objeto, sincronizar ancla o hacer que su constructor reciba el encuentro.
- Tour usa proximidad al nodo para iniciar ruta y detector de atasco; no ampliar el grafo sin regresiones de colisiones.
- Métricas GPU y tacto real continúan pendientes. No se instalaron dependencias nuevas.

Registro: 20260921-125645-cc2ba0, proyecto examenes-planeacion. Entrega documental y refactor acotado; las historias serán otra tarea.

---

# Handoff vigente · recorrido peatonal 3D

## Historial recibido: implementación del recorrido (21 de septiembre de 2026)

`docs/SPEC-RECORRIDO-3D.md` fue implementado en esta sesión. El recorrido peatonal existe,
se caminó de punta a punta por CDP y el build está limpio. Detalle de avance por hito:
`internal/PLAN-RECORRIDO-3D.md`. La fase de definición sigue cerrada; esta entrada cierra
también la fase de implementación inicial.

## Qué existe ahora
- Navegación peatonal real: primera persona a 1,65 m, 2,2 m/s, FOV 60, colisión círculo
  r 0,3 con deslizamiento, límites y alturas (rampa + meseta del mirador, muelle a 0,35 m).
- Cinco lugares conectados por grafo: plaza, casa de la memoria (+ patio por la puerta),
  jardín del tiempo, puerto de la espera, mirador de las historias.
- Controles: WASD/flechas + arrastrar para mirar (escritorio); joystick + mirar en la mitad
  derecha + botón Explorar (móvil); E o clic para interactuar; mapa con «Ir hasta allí».
- Recorrido guiado sobre el grafo con pausa en llegada, «Continuar» y cancelación inmediata
  (botón Detener o cualquier movimiento manual). Detector de atasco con salto de punto.
- Interacción por proximidad (≤2,5 m) con las 4 lecturas originales + escritura de tres
  frases con copia/descarga. Persistencia versionada y tolerante; «Reiniciar recorrido».
- Estados: portada (vista aérea) → transición omitible (salta con prefers-reduced-motion)
  → paseo → lectura. Fallback «Explorar sin 3D» y pantalla de error WebGL con lecturas.
- Acabado Caribe según paleta del spec; fenómenos por lugar (bandada, sábanas, pétalos,
  carta, páginas). Instancing y una sombra direccional. Bundle 134 KB gzip.

## Verificación hecha (CDP headless; scripts en internal/verificacion/)
- `cdp_circuito.mjs`: circuito guiado completo, llegada a los 4 lugares, progreso 4/4, consola limpia.
- `cdp_fisica.mjs`: muro bloquea, agua bloquea, puerta transitable, fallback con 4 lecturas.
- `cdp_cancelar.mjs`: Detener + movimiento manual tras cancelar + Volver a la plaza.
- `cdp_lectura.mjs`: lectura con E, respuesta/feedback, escritura persistida, móvil 390×844.
- `cdp_walk.mjs` / `cdp_probe.mjs` / `cdp_patio.mjs`: caminata libre y sondas de posición.
- Capturas: portada, calle, patio, jardín, puerto, mirador, lectura, móvil (carpeta temporal del sistema).

## Pendientes reales (ninguno bloquea el paseo; documenting per spec §8–9)
- [ ] Validación en dispositivo táctil REAL (gestos, rendimiento ≥30 FPS móvil / ≥50 FPS escritorio).
- [ ] Registro de métricas de carga y FPS por dispositivo/navegador (metas del spec sin medir).
- [ ] Oclusión de etiquetas tras muros: `WalkableWorld.lineOfSight` existe pero `sightBlocks`
      no se puebla (hoy la interacción es solo por distancia).
- [ ] Audio ambiental opcional por gesto (sin él la experiencia está completa, permitido por spec).
- [ ] Conmutador manual de «modo bajo» (hoy solo DPR y resolución de sombra adaptativos).

## Errores corregidos que el siguiente agente no debe repetir
- `InputController._bind` necesita el parámetro `dom` (fue causa de pantalla negra inicial).
- CSS: regla global `[hidden]{display:none!important}` — sin ella los paneles con `display:flex`
  ignoran el atributo hidden y tapan la escena.
- Detector de atasco del tour: al llegar a un punto de giro hay que resetear `_lastDist`;
  si no, el detector salta waypoints y la ruta atraviesa la fuente.
- Objetos cercanos al camino: faroles, bancas y jardineras necesitan colisión o hay que
  apartarlos (la cámara llena de geometría al pegarse a un plano, p. ej. las sábanas).
- La llegada del mirador debe mirar al pueblo (`player.yaw = 0` en onTourArrive).

## Cómo ejecutar
Desde esta carpeta: `npm ci`, `npm run dev` (puerto que imprime Vite), `npm run build`.
Servir solo `dist/`. internal/ no se publica.

## Prompt breve para el agente siguiente
El recorrido peatonal está implementado y verificado por CDP; no repitas la construcción.
Parte de `internal/PLAN-RECORRIDO-3D.md` (pendientes reales): validación en dispositivo
táctil real con métricas, oclusión de etiquetas, audio opcional y modo bajo. Si tocas la
navegación, corre `internal/verificacion/cdp_circuito.mjs` y `cdp_fisica.mjs` contra un
`npm run dev` y confirma que la consola queda limpia. No rehacer la fase de definición.
