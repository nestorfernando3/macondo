# Prompt para regenerar «Macondo · Un pueblo para recorrer»

> **Cómo usarlo:** copie desde `## Encargo` hasta el final y entréguelo como mensaje inicial a
> otro modelo, apuntando a una carpeta vacía con Node 20+. Si el modelo puede leer el EPUB de la
> edición ilustrada, déjelo en esa carpeta; si no, ver §3 (la cita se deja preparada y se pide).

---

## Encargo

Construye desde cero una experiencia web educativa en español llamada **Macondo · Un pueblo para
recorrer**: un Macondo imaginado en 3D que se recorre **volando como una mariposa amarilla**.
Objetivo pedagógico: explorar el realismo mágico, el tiempo circular, la espera y la voz narrativa
en Gabriel García Márquez (Nobel 1982), con uso escolar (secundaria) y lector general.

No es una maqueta que gira ni un cuestionario. Es un **paseo**: portada aérea → descenso a la calle
a altura humana → exploración libre o recorrido guiado con voz en español colombiano → lecturas
breves → cuaderno de tres frases. Dura 6–10 minutos con lectura. Nada bloquea el movimiento,
ninguna pregunta califica, no hay temporizador ni pantalla de fracaso.

**Criterio de cierre:** un paseo completo (plaza → casa → jardín → puerto → mirador y regreso),
hermoso a altura humana, verificablemente navegable, con build limpio y pruebas en verde.
Que compile no es terminar.

Trabaja por incrementos: primero un tramo completo plaza–patio a escala humana y comprobable, luego
el resto del pueblo con la misma calidad. Cada incremento deja `node --test` y `npm run build` en verde.

## 1 · Restricciones técnicas

- **Vite 6 + Three.js 0.180 + JavaScript modular (ESM). Sin framework, sin backend, sin
  TypeScript.** Three.js es la única dependencia de producción.
- Arte **procedural**: geometrías y materiales en código; las texturas (alas de mariposa, agua) se
  pintan en canvas. Sin GLB, sin imágenes externas, sin tipografías remotas.
- `npm run dev` en 127.0.0.1, `npm run build` → `dist/` estático y autocontenido, `npm run preview`.
  Nunca se abre `index.html` con `file://`. La carpeta `internal/` (herramientas, guiones, docs de
  trabajo) nunca se publica.
- Estructura de archivos esperada (los nombres importan):

```
index.html                  shell + HUD + diálogos
src/main.js                 composición y eventos (sin geometría ni física)
src/style.css
src/core/Experience.js      renderer, ciclo, resize, calidad, pausa, dispose
src/navigation/PlayerController.js   única autoridad de vuelo y cámara
src/navigation/InputController.js    teclado, ratón, multitáctil
src/navigation/WalkableWorld.js      colisiones y alturas (independiente del arte)
src/navigation/TourController.js     grafo, ruta, avance, pausa, cancelación
src/navigation/Locomocion.js
src/world/createVillage.js  orquestador de lugares
src/world/places/{plaza,casa,jardin,puerto,mirador,calles}.js
src/world/{kit,flora,ambient,water,butterflyAvatar,remedios,beacon,postal,discoveries,anclas,invariantes,storyEffects}.js
src/data/{locations,encounters,content,narracion,stories,secondStories,discoveries}.js
src/interaction/InteractionSystem.js
src/narrative/NarrativeDirector.js
src/state/{progress,historias}.js
src/ui/{Onboarding,StoryInteraction}.js
src/audio/{TourNarrator,AmbientBed}.js
tests/*.test.js
internal/                   scripts de generación y verificación (no se publica)
```

## 2 · Reglas de contenido (no negociables)

- Los textos pedagógicos son **originales**. La **única cita literal** de la novela es la ascensión
  de **Remedios, la bella** (capítulo 12): transcríbela íntegra y verbatim desde la edición
  —atribuida como «Gabriel García Márquez, Cien años de soledad, capítulo 12»— en un bloque propio
  (`blockquote` + `cite`, rótulo «Del libro», serif, separado de la glosa) y **fuera de la narración
  hablada** (el audio se distribuye como MP3: grabar el fragmento sería una reproducción más pesada
  que la cita impresa). **No la escribas de memoria**: si no tienes la edición, deja el campo `cita`
  preparado y pídela.
- No inventes citas ni atribuyas frases al autor. No incorpores personajes, diálogos ni episodios
  de las novelas a las escenas interactivas: son escenas originales de esta instalación.
- La ambientación es una **interpretación artística**, no una reconstrucción geográfica. Dilo en el
  README y donde pueda confundirse.
- Datos biográficos o literarios siempre con fuente verificable; usa nobelprize.org (Nobel 1982:
  *facts*, *press release*, «La soledad de América Latina»).

## 3 · El mundo

Escala en metros. Puertas ≥1,4 m, calles ≥3 m, jugador r ≈0,22 m. Yaw 0 mira hacia −z.

| Lugar | (x, z) | Composición | Fenómeno | Interacción |
|---|---|---|---|---|
| **Plaza de llegada** | (0, 0) | Calle sombreada desemboca en plaza luminosa; fuente, reloj, bancas, cartel, semillas doradas | Una bandada amarilla cruza hacia la casa | Primer hallazgo; se aprende a volar |
| **Casa de la memoria** | (0, −11) | Fachada de estuco con portal, puertas abiertas, contraventanas, aleros, chimenea | Sábanas tendidas que flotan suaves | Mesa del patio → lectura «memoria» + historia «La silla de quien falta» |
| **Patio** | (0, −15.5) | Se entra por la puerta abierta; mesa puesta, taza, silla vacía, mecedora, jardineras | — | Escritura de carta / efectos visibles |
| **Jardín del tiempo** | (22.5, −11.5) | Sendero curvo, árbol del tiempo, macizos, banco con espiral de mariposas, tendal de bramante al norte | Pétalos que suben, se detienen y caen; mariposas en hélice; **ascensión de Remedios** | Árbol → «tiempo»; espiral → «mariposas»; tendal → «remedios» (la cita) |
| **Puerto de la espera** | (−29.5, 8) | Muelle con rampas, río, bote que flota, banco y atril con carta, faro, nasas, norays | Ondas y corriente en el agua; espuma en la orilla; reflejos del sol | Carta → «espera»; faro → «tren»; historia «El correo de lo pendiente» |
| **Mirador de las historias** | (17, 22) | Rampa con vegetación sube a una meseta a 3 m con baranda de postes y vista del pueblo | Páginas suspendidas | Página → «voz»; cuaderno final (tres frases) |

**Grafo de caminos** (nodos [x,z] y aristas; nunca se interpola en línea recta entre edificios):

```
spawn[0,30] s1[0,24] s2[0,12] plaza[0,5.5] pE[4.5,-.5] pW[-4.5,-.5]
e1[7,0] e2[14,0] jardinDoor[20.5,-11] jardin[22.5,-11.5]
w1[-10,2] w2[-20,6] muelle[-29.5,8]
n1[0,-5.5] puerta[0,-11] patio[0,-15.5]
se1[2.6,9] se2[7.5,12.2] rampaPie[17,13.2] rampaCima[17,18.5] cima[17,22]
```

Aristas: cadena sur spawn→plaza; plaza→pE→e1→e2→jardinDoor→jardin; plaza→pW→w1→w2→muelle;
pE→n1 y pW→n1 (la plaza rodea la fuente por los lados); n1→puerta→patio; plaza→se1→se2→rampaPie→
rampaCima→cima. Ruta por BFS. Orden del recorrido guiado: **casa → jardín → puerto → mirador**
(arrancando desde donde esté el jugador).

## 4 · Mecánicas núcleo (contratos duros)

### 4.1 La mariposa

- Avatar amarillo en tercera persona: cuatro alas con contorno propio, textura pintada en canvas,
  cuerpo en un solo *lathe*, aleteo con desfase entre ala anterior y posterior (≈11 mallas,
  ≈1024 triángulos). Bandada del pueblo vistiendo la misma geometría/textura, instanciada.
- **Contrato de rotaciones:** PlayerController escribe `position` y `rotation.y`; el avatar escribe
  `rotation.z`; nadie escribe `rotation.x`; orden Euler `'YXZ'`. El rumbo del modelo es −z:
  `atan2(−dx, −dz)`.
- Inercia de mariposa (`steer` con k = 1−e^(−6·dt)), rumbo que sigue a la velocidad, alabeo suave en giros.

### 4.2 Vuelo

- **Altura por defecto:** vuelo automático a `HOVER` 2,1 m sobre `groundAt(x,z)` — la mariposa sube
  con el terreno (muelle 0,35 m, meseta del mirador 3 m), nunca se hunde ni cae.
- **La altura se mide desde el terreno, jamás absoluta.** Estado `alt` ∈ [`ALT_MIN` 0,9, `ALT_MAX` 9];
  `_apply` persigue `groundAt + alt` con suavizado (~5·dt). Subir del techo de las interacciones es
  deliberado: arriba no se lee ni se descubre; hay que bajar.
- **La altura la elige la mirada:** `empujeVertical(pitch)` con reposo 0,34, mín −0,35, máx 1,25 y
  zona muerta de 0,06 devuelve −1…1; se integra a `RISE` 2,6 m/s. Con la cámara al horizonte la
  altura se conserva. `recenter()` y el arranque del tour devuelven la mirada al horizonte.
- Velocidad de crucero 3,2 m/s; tour 2,8 m/s y 1,7 m/s en modo narrado. Sin aceleraciones bruscas,
  sin saltos, sin caídas al vacío, sin atascos. Movimiento con subpasos de colisión y techo de delta.

### 4.3 Controles

- **Escritorio:** WASD/flechas vuelan relativos a la cámara; arrastrar orbita; **clic corto** sobre la
  escena hace *raycast* al suelo → `flyTo(x,z)` y **captura el puntero** (en `pointerup`, nunca en
  `pointerdown`); con la captura, mover el ratón gira sin arrastrar (`movementX/Y`, sensibilidad
  ≈0,0026 rad/px) y aparece una **mira** en el centro: un clic vuela a ese punto. **Esc** suelta el
  puntero y detiene el vuelo; **R** recentra; **M** abre el mapa; **E** interactúa. El clic sobre un
  interactuable cercano abre su contenido en vez de volar. Sin cursor el HUD es inalcanzable: muestra
  un aviso breve («El ratón gira la cámara · Esc suelta el puntero»).
- **Móvil:** joystick abajo-izquierda + arrastre en la mitad derecha para mirar + botón contextual
  para interactuar; tocar el suelo elige destino; los toques toleran pequeños movimientos del dedo.
- Limpiar inputs en blur, `pointercancel` y cambio de pestaña; cambiar de ventana detiene el movimiento.

### 4.4 Colisiones con altura

- `blocks(x, z, r, y = 0)`: cada obstáculo lleva `alto` (Y absoluta del remate; `Infinity` por
  defecto = muro). Se pasa **por encima** de lo bajo: bancas 1 m, setos 1,45, fuente 1,8, toldo 2,45,
  carreta 1,6, tejadillo del pozo 2,5, cabrestante 0,9, norays 0,8, tendedero 2,55, reloj 5,4, faro 6,3.
  Muros, casas, troncos y agua (cajas que no se cruzan) quedan en `Infinity`.
- `addFalda(x, z, rInt, rExt, h)`: la ladera del cerro es **suelo** (pendiente), no un escalón; el
  mirador se alcanza volando desde cualquier lado. La baranda del mirador colisiona poste a poste
  (con el hueco de la rampa) y el barandal de la rampa tramo a tramo, subiendo con ella.
- **Invariante de vuelo:** relleno por inundación desde 7,5 m (sobre la cumbrera de las casas) que
  exige que los seis lugares se alcancen volando. Es la red que caza los cercados invisibles.

### 4.5 Recorrido guiado

- Sigue el grafo, pausa en cada llegada con «Continuar»; cualquier movimiento manual o «Detener» lo
  cancela de inmediato (nunca quedan dos controladores activos). Al arrancar, `resetAltitude()` y
  `recenter()`. Detector de atasco con **reset de la última distancia en cada waypoint** (si no,
  salta waypoints y la ruta atraviesa la fuente). «Volver a la plaza» disponible siempre.

### 4.6 Interacciones

- Proximidad ≤2 m **y altura compatible**: a más de 2 m sobre el objeto no se interactúa. La
  cercanía solo invita («Explorar <kbd>E</kbd>»); nunca abre sola. La oclusión real (`lineOfSight`)
  puede quedar preparada sin poblar, pero entonces no afirmes que los muros ocultan.
- Cerrar un panel devuelve el control sin cambiar de posición; el teclado en un campo de escritura
  no mueve al jugador.

## 5 · Contenido pedagógico

**Estaciones** (`content.js`, 8 en total): 4 con quiz opcional —`memoria` (realismo mágico),
`tiempo` (tiempo circular), `espera` (espera y dignidad, *El coronel*), `voz` (discurso del Nobel)—
y 4 pasajes sin quiz con línea «para conversar» —`llegada` (el pueblo que se inventa), `mariposas`
(señales y presagios), `tren` (la llegada del tren), `remedios` (la cita)—. Campos por estación:
`id, location, title, tag («01 / MEMORIA»), icon, color, body` (glosa original de ~600–800
caracteres), `work` (obra/contexto), `question/answers/correct/feedback` o `question:null` +
`conversa`, y `source` (nobelprize.org; `null` en la cita, porque su fuente es el libro).
Las preguntas nunca bloquean; el quiz es opcional y no califica.

**Hallazgos:** seis semillas doradas (entrada, fuente, patio, jardín, muelle, mirador) que al
acercarse revelan una frase original, con álbum de pistas y progreso «n/6».

**Historias** (`stories.js` + `secondStories.js`): escenas originales con un director de un solo
encuentro (`idle → invited → active → resolved`), cierre, **resolución idempotente**, reemplazo de
elección y un registro cerrado de efectos visibles que se restauran desde los resultados (taza
extra, carta plegada). Tipos: `choice`, `writing`, `observation`, `labels`, `versions`. Paquete 1:
«La silla de quien falta» (patio), «El correo de lo pendiente» (puerto), «El cuaderno del mirador».
Paquete 2: «Dos tardes bajo el árbol», «Los nombres de las cosas», «La voz de la vecina».

**Escritura final:** tres frases, máximo 1200 caracteres, guardar/copiar/descargar, nunca obligatoria.

**Persistencia:** claves versionadas y separadas (`macondo.progreso.v1`, `macondo.escritura.v1`,
`macondo.historias.v1`, `macondo-hallazgos-v1`, `macondo.voz.v1`, tutorial, sonido, calidad).
Restauración tolerante a datos corruptos y a almacenamiento bloqueado; visitas por ID de lugar con
migración de nombres históricos. «Reiniciar recorrido» borra solo lo de esta experiencia, con confirmación.

## 6 · Narración y sonido

- **Voz en español colombiano pregenerada.** Textos originales en `narracion.js`: `bienvenida`,
  `guia-inicio`, `camino-<dest>`, `llegada-<dest>`, `fin-recorrido`, más `lectura-<id>` derivados de
  cada estación (título + body, ≤**1200 caracteres** por clip). Generé los MP3 con Deepgram Aura 2
  (`aura-2-gloria-es`; alternativa `celeste`), con script idempotente por hash y llave por variable
  de entorno o archivo gitignored. Si no hay servicio o llave, la experiencia completa debe
  funcionar solo con subtítulos; el audio **nunca** bloquea.
- **Subtítulos siempre visibles**; el chip «Voz» apaga todo (preferencia persistente). El audio nace
  solo de un gesto y no se reanuda solo al cerrar un panel. El «Continuar» del tour aparece cuando
  termina el relato de la llegada; apagar la voz o interrumpir libera el gate. «Saltar audio» vive
  **fuera** del banner del tour (si el contenedor se oculta, sus hijos miden 0×0 y ningún clic los alcanza).
- **Ambiente sintetizado en casa** (viento, río, aves) con semilla fija, sin licencias de terceros;
  apagado por defecto (silencio inicial), el río crece cerca del agua y todo cede al ≈32 % mientras
  habla la guía. «Pausar movimiento» y `prefers-reduced-motion` lo congelan.

## 7 · Dirección artística y presupuesto

- Caribe cálido y vivido: estuco marfil y coral, carpintería turquesa, tejas terracota, vegetación
  verde profunda, flores rosa, mariposas amarillas. Luz de tarde, neblina discreta, **una sola sombra
  direccional**. Nada de saturación uniforme, bloom excesivo ni formas que parezcan bloques de
  juguete vistos de cerca. Cada encuadre con primer plano, lugar y fondo; siluetas y alturas variadas.
- **Kit de piezas** (`kit.js`): casa de una y dos plantas, portal, ventana con contraventanas,
  puerta de dos hojas, chimenea, techos a dos y cuatro aguas con teja acanalada, palmera (fronda
  pinnada: raquis + 15 pares de folíolos, dos anillos de hojas, tronco ahusado alternado), banano,
  arbusto, maceta, farol, banca, pozo con tejadillo, carreta con ruedas de radios, barril, tendedero,
  hamaca, nasas, junco, cartel rotulado, cerca y reloj (esfera redonda, romanos en los cuartos,
  minutera que da la vuelta cada 30 s). Acumulador de instancias (`lote`/`hornear`); **`lote()`
  devuelve un índice, no una malla**: lo que se anima va suelto o por `movil`.
- **Flora** (`flora.js`): pétalo acucharado, corola, ojo de flor, brizna; prado de ~320 matas en
  manchas de color, instanciado.
- **Vida** (`ambient.js`): ~45 mariposas con las alas pintadas del avatar, aves, libélulas, humo en
  chimeneas, polvo dorado, brillos en el río, espuma, ondas en la fuente y pétalos cayendo. Todo
  cuelga del mismo reloj de animación para que «Pausar movimiento» lo congele.
- **Remedios sube al cielo**: sobre el tendal de bramante del jardín, con las dos sábanas aleteando
  (30 vértices cada una, malla de reposo), brazo en saludo. Ciclo de 62 s: de 1,1 a 32,6 m con
  exponente y fundido por los dos extremos (el reinicio ocurre ya invisible). 6 mallas / 592
  triángulos (≈0,4 %), sin proyectar sombra y con cero llamadas de dibujo apagada. Su ancla es el
  encuentro `sabanas-bramante`: mover el tendal mueve la ascensión.
- **Presupuesto:** peor encuadre ≤150 000 triángulos (referencia lograda: 136 932 y 246 llamadas,
  293 mallas). Sombra **solo en la silueta** de lo instanciado (si cada lote se redibuja entero en el
  mapa de sombras, el banco pierde la mitad del rendimiento). DPR máx 1,5 móvil / 2 escritorio; modo
  «Ligera» = DPR 1 y sin sombras. Bundle de referencia: ≈190 kB gzip (48 módulos) con Three.js.
  Compara siempre llamadas y triángulos (deterministas), no FPS de banco (varía ±20 %).

## 8 · Arquitectura y estado

- Módulos según §1; `main.js` solo compone y conecta eventos. Un **registro único** alimenta escena,
  mapa y contenido (`locations.js` para lugares y caminos; `encounters.js` para objetos interactivos,
  con `x, z, y, eyeY, radius, contentId, label` y `superficie` cuando algo se posa encima); las piezas
  de `places/*` leen esas anclas en vez de repetir coordenadas. Textos separados del motor.
- Estados: portada → transición (omitible, y salto directo con `prefers-reduced-motion`) →
  exploración → guiado → lectura → escritura. **Un solo dueño de cámara por estado.**
- Eventos conceptuales: `navigateTo(locationId)`, `cancelNavigation()`, `resetToPlaza()`,
  `openContent(contentId)`, `closeContent()`, y señales `arrived`, `interactionAvailable`,
  `contentOpened`, `contentClosed`.

## 9 · Accesibilidad y recuperación

- Texto DOM con contraste legible; controles táctiles ≥44 px. Ayuda visible y teclado completo.
- `prefers-reduced-motion`: sin vuelo inicial (cambio directo con fundido breve), sin efectos
  ambientales continuos y **pose fija** para toda figura animada (si solo se apaga el reloj de
  animación, la figura se queda en su fotograma cero —puede ser opacidad cero— y nadie lo nota).
- Alternativa «Explorar sin 3D» con todo el contenido y navegación por lugares; error de WebGL sin
  pantalla vacía; «Volver a la plaza» como recuperación.
- Regla CSS global `[hidden] { display: none !important }` (sin ella, los paneles con `display:flex`
  ignoran `hidden` y tapan la escena).

## 10 · Pruebas y verificación (lo que separa una entrega de una demo)

- `node --test tests/*.test.js`, **sin navegador**, con cuatro archivos (arquitectura, controles,
  expansión, segundo paquete). Entre las pruebas que más valor tienen:
  - El pueblo se construye sin navegador y es **transitable**: cada camino del grafo se recorre a
    salvo, y ninguna casa roza un camino.
  - Las alturas prometidas del recorrido (2,1 m calle / 2,4 m muelle / 5,1 m mirador) se cumplen.
  - El agua no se cruza y el muelle sí.
  - **Ninguna familia instanciada deja matrices en NaN** (una matriz NaN no lanza: la instancia
    simplemente no se dibuja) — en las dos variantes, con y sin `prefers-reduced-motion`.
  - Cada lectura narrada empieza por su título y no pasa de 1200 caracteres.
  - El director narrativo es idempotente y la restauración tolera datos corruptos.
- `npm run build` limpio, sin errores de consola en el paseo.
- Verificación en navegador (esperada, aunque puede hacerse con scripts headless): recorrido
  guiado completo 4/4, física (muro y agua bloquean), lectura/respuesta/escritura persistida,
  narración con gate de «Continuar», vuelo con su altura y sus topes, y vista móvil 390×844 sin
  controles fuera de pantalla ni cajas de interfaz pisadas.

## 11 · Trampas conocidas (págalas una sola vez)

1. **Captura de puntero en `pointerup` del clic corto, no en `pointerdown`**: si capturas al bajar,
   el arrastre del tutorial captura y el HUD deja de recibir clics.
2. Un `PointerEvent` sintético **no** obtiene captura; y los `pointermove` inyectados por CDP no
   traen `movementX/Y`: para probar el giro hay que despachar el evento a mano.
3. Con el puntero capturado **no hay cursor**: el aviso bajo la mira es la única salida visible
   además de Esc. `input.release()` al abrir cualquier panel.
4. `prefers-reduced-motion` ⇒ pose fija para toda figura animada (ver §9).
5. El rumbo del modelo es −z (`atan2(−dx, −dz)`); con el signo cambiado, la figura mira de espaldas.
6. `[hidden]` en un contenedor deja sin caja a **todos** sus hijos (rect 0×0, ningún clic alcanza).
7. `InputController` necesita su parámetro `dom`; olvidarlo produce una pantalla negra «misteriosa».
8. Detector de atasco del tour: **resetear la última distancia en cada waypoint**.
9. La altura real sigue a la deseada con retardo (≈0,4 m subiendo, y un frame tras cambiar la
   inclinación): los guiones comparan convergencia entre dos lecturas, no valores exactos.
10. `lote()` devuelve un índice: animar ese número revienta cada frame.
11. Aves y libélulas: orden Euler `'XYZ'` con el tumbo en z y el giro en y (antes apuntaban al norte del mundo).
12. Las capas transparentes sobre el agua llevan `depthWrite:false` (si no, el río se ve como una mancha).
13. Sombra solo en la silueta de lo instanciado (`CON_SOMBRA`).
14. Deepgram: `container=mp3` es inválido (el *default* ya es MP3) y `bit_rate` para MP3 tiene tope 48 000.
15. `TourNarrator` lee la preferencia de voz al arrancar el módulo: tras fijarla, recarga la página.
16. La cámara en tercera persona no colisiona con la geometría: limita su distancia o acéptalo como
    limitación conocida y documentada, sin creer que es un error del mundo.

## 12 · Entrega esperada

- `README.md`: cómo ejecutar, cómo se recorre, recorrido narrado, arquitectura, fuentes y cómo
  regenerar el audio. `internal/HANDOFF.md`: entrega vigente, verificación con números y quirks,
  en ese orden, con fecha.
- Specs de las entregas grandes en `docs/` (dirección artística, avatar, etc.).
- Capturas de los cinco lugares desde el paseo real (no solo vista aérea) y de la vista móvil.

## 13 · Fuera de alcance

Multijugador, VR, cuentas o backend, narrador generativo en vivo, migración de framework, mundo
abierto infinito y recreación de las novelas. El criterio de cierre es un paseo completo, hermoso y
verificablemente navegable.

---

## Fuentes de referencia

- https://www.nobelprize.org/prizes/literature/1982/marquez/facts/
- https://www.nobelprize.org/prizes/literature/1982/press-release/
- https://www.nobelprize.org/prizes/literature/1982/marquez/lecture/
