# Entrega vigente · el vuelo sube y baja (22 septiembre 2026)

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
