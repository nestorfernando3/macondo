# Entrega vigente · Auditoría de regeneración: el paseo completo, verificado en verde (23 septiembre 2026)

Se recibió el prompt de regeneración (`docs/PROMPT-REGENERAR-MACONDO.md`) sobre el árbol ya
entregado. En vez de reconstruir y perder lo que este repo tiene de irreemplazable (los 21 MP3
pregenerados con Deepgram —la llave no está en este entorno—, el ajuste de colisiones de cámara
y la batería de 66 pruebas), se auditó la entrega vigente contra el prompt sección por sección
y se re-verificó todo lo verificable en este entorno.

## Qué se verificó (y quedó en verde)

- **§1 Estructura y técnica:** Vite 6.3.6 + Three.js 0.180.0, ESM, sin frameworks ni TS; todos
  los módulos esperados existen (incluidos `Locomocion`, `anclas`, `invariantes`,
  `storyEffects`, `postal`, `beacon`). Arte 100 % procedural; texturas pintadas en canvas.
- **§2 Contenido:** textos pedagógicos originales; la única transcripción literal es la
  ascensión de Remedios, la bella (capítulo 12), en `blockquote` + `cite` con el rótulo
  «Del libro», separada de la glosa y fuera de la narración hablada (`lectura-remedios` lleva
  solo título + glosa). La interpretación artística está declarada en el README.
- **§3–§4 Mundo y mecánicas:** cubiertos por la batería Node (grafo transitable, ninguna casa
  roza un camino, alturas 2,1 / 2,45 / 5,1 m, agua que no se cruza y muelle que sí, sin
  matrices NaN en las familias instanciadas con y sin `prefers-reduced-motion`).
- **§5 Contenido pedagógico:** 8 estaciones del encargo + 2 añadidas por la capa literaria
  (`hielo`, `pescaditos`); 6 hallazgos; paquetes 1 y 2 de historias; cuaderno de tres frases;
  claves de persistencia exactas (`macondo.progreso.v1`, `macondo.escritura.v1`,
  `macondo.historias.v1`, `macondo-hallazgos-v1`, `macondo.voz.v1`).
- **§6 Voz:** manifiesto de 21 clips, 21 MP3 presentes en `public/audio/`; ambiente
  (viento/río/aves) sintetizado por guion propio.
- **§10 Pruebas:** `node --test tests/*.test.js` → **66/66**. `npm run build` → limpio
  (JS 214,89 kB gzip; el aviso de chunk >500 kB es cosmético y está documentado).
- **Presupuesto medido hoy** (`node internal/scripts/pesar_escena.mjs`): **149 373 triángulos
  y 410 mallas** (272 sueltas, 138 instanciadas). Sigue dentro del tope de 150 000, pero el
  margen quedó en ~0,4 %: la próxima pieza que se añadre debe pagar su propio presupuesto o
  recortar otra.

## Qué se cambió

- `package.json`: se añadió el guion `"test": "node --test tests/*.test.js"` (el prompt exige
  esa puerta en cada incremento y no existía como guion).
- `vite.config.js` (nuevo): `preview.allowedHosts` (el preview respondía 403 tras un túnel) y
  `base: './'` para publicación bajo subcamino. Ningún otro comportamiento cambia: audios e
  imprimibles ya se referenciaban con `./` en el código.
- `.github/workflows/pages.yml` (nuevo): publica en GitHub Pages (npm ci + npm test + build +
  `actions/deploy-pages`), disparado por push a `main`/rama de trabajo o a mano.

## Publicación en GitHub Pages (hecha)

El paseo está en vivo en **https://nestorfernando3.github.io/macondo/** (despliegue del
entorno `github-pages` en estado *success*, verificado por API el 23 de septiembre de 2026).
El flujo corre pruebas + build en el runner y publica con `actions/deploy-pages` cada vez que
se empuja a `main` o a la rama de trabajo. Lo que hizo falta del dueño del repo (una sola vez):
habilitar Pages con fuente «GitHub Actions» y permitir la rama en Settings → Environments →
`github-pages` → Deployment branches (mi token no tiene administración: 403 en ambos pasos).
Alternativa here.now preparada en `internal/scripts/publicar_herenow.mjs` (desde este sandbox
here.now no es alcanzable; se corre en cualquier máquina con internet).

## Limitación de este entorno (no del producto)

Este espacio de trabajo no permite descargar binarios de navegador (sólo responde
`registry.npmjs.org`; `storage.googleapis.com`, `cdn.npmmirror.com` y `playwright.azureedge.net`
cortan la conexión), y `internal/verificacion/arnes.mjs` apunta al Chrome de macOS. La batería
CDP (recorrido 4/4, física, lecturas, gate de «Continuar», vista móvil 390×844…) queda por tanto
sin re-corregir aquí; las evidencias vigentes son las de las carpetas `internal/*-evidencia/`
y las pruebas Node de esta entrega. Quien tenga Chrome a mano:
`npm run dev -- --port 5175 --strictPort` y luego `node internal/verificacion/todos.mjs`.

## Quirks que hereda el siguiente

- El manojo creció a 214,89 kB gzip sobre la referencia de ~190: la diferencia es la capa
  literaria (novela/árbol/palabras/hielo/pescaditos). Si se pide volver a la referencia,
  recórtense esos módulos, no el pueblo.
- El presupuesto de triángulos está a 627 del tope (ver arriba).
- No regenerar los MP3 sin llave de Deepgram: `internal/audio/deepgram.key` está gitignored y
  el entorno actual no la tiene; la experiencia funciona completa con subtítulos.
# Entrega vigente · La cámara no atraviesa el pueblo y el patio tiene techo (23 septiembre 2026)

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
  `pointermove`, altura con la mirada, llegada al mirador, invariantes) OK; `cdp_fisica`,
  `cdp_lectura`, `cdp_paneles`, `cdp_jugabilidad` y el resto de la batería, verdes.

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
