# Macondo · Un pueblo para recorrer
Experiencia educativa en español: un Macondo imaginado en 3D que se recorre volando
como una mariposa amarilla, para explorar el realismo mágico y el universo de
Gabriel García Márquez.

## Ejecutar
Desde esta carpeta: `npm ci` y `npm run dev`. Abrir la dirección que muestra Vite.
Producción: `npm run build`; servir únicamente `dist/`. No abrir index.html con file://.

## Cómo se recorre
- **Usted es una mariposa amarilla.** Vuela con altura automática sobre el terreno
  (calle, muelle, ladera y meseta del mirador incluidos); no hay caídas ni atascos.
- **El ratón gira y WASD vuela.** Un clic sobre la escena vuela a ese punto y no se lleva el
  cursor; el chip **Vista libre** captura el puntero: desde ahí, mover el ratón gira la cámara
  —sin arrastrar— y WASD o las flechas vuelan hacia donde mira. Con el puntero capturado
  aparece una mira en el centro y un clic vuela a ese punto. **Esc** suelta el puntero (y
  detiene el vuelo) para pulsar los botones del HUD; R centra la cámara. Arrastrar sigue
  girando sin capturar, y en móvil mandan el joystick y el arrastre; tocar el suelo elige un
  destino.
- **La altura la elige la mirada:** mirar hacia arriba sube y hacia abajo baja; con la cámara
  al horizonte la altura se conserva. Siempre se mide desde el suelo, así que la mariposa sube
  con el terreno —ladera del mirador y muelle incluidos— en vez de hundirse en él, y nunca
  atraviesa el suelo ni el techo. Las lecturas y los hallazgos piden volar cerca: suba para ver
  el pueblo, baje para descubrirlo.
- **Pasar por encima:** la mariposa vuela, así que rejas, bancas, setos, piedras, macetas,
  norays y la baranda de la meseta sólo la detienen por debajo de su remate. Los muros, las
  casas, los troncos, el faro y el río no se pasan a ninguna altura. El mirador se alcanza
  volando desde cualquier lado (su ladera es suelo) o subiendo por la rampa.
- **Cámara en tercera persona:** vuela detrás de la mariposa y se arrima cuando un muro, una
  casa o un tronco se le cruzan —no los atraviesa, y pasa por encima de lo bajo igual que
  ella—; el giro del ratón suelta la perseguidora —el vuelo sigue su rumbo— y R la centra.
- **Mapa y guía:** «Guiarme» vuela la ruta (plaza → casa → jardín → puerto → mirador) con
  pausa en cada llegada; el vuelo manual o «Detener» cancelan. «Ir hasta allí» desde el mapa.
- **Lecturas:** acerque la mariposa a la mesa, el árbol, la carta, las páginas, el reloj,
  la espiral de mariposas, el faro o el tendal del jardín; ninguna pregunta bloquea el paso.
- **Escritura:** al cerrar la lectura del mirador puedes escribir tres frases, copiarlas o descargarlas.

## Recorrido narrado y recuerdos
- **Voz en español colombiano** (Deepgram Aura 2, `aura-2-gloria-es`): la guía marca el ritmo
  del paseo (velocidad 1,7 m/s) y «Continuar» aparece al terminar el relato de cada llegada.
  Subtítulos siempre visibles; el chip «Voz» apaga todo (preferencia persistente). El audio
  nace solo de un gesto y si falta un MP3 la experiencia sigue completa.
- **Pasajes sin quiz:** el reloj de la llegada, la espiral de mariposas, el faro del muelle y el
  tendal de bramante abren lecturas nuevas con línea «para conversar» y botón «▶ Escuchar».
  El tendal es además la única estación que trae **cita del libro**: la ascensión de Remedios,
  la bella, transcrita del capítulo 12 y atribuida en el mismo bloque.
- **Recuerdo:** el botón «Recuerdo» descarga una postal PNG del lugar (foto, título, línea y fecha).
- **Sonido del pueblo:** el chip «Sonido» enciende viento, río y aves (silencio inicial; se
  recuerda por dispositivo). El río se oye más cerca de la orilla y todo el ambiente baja
  mientras habla la guía. Sin sonido la experiencia está completa.
- **Audio:** los MP3 están pregenerados en `public/audio/`. Para regenerarlos tras editar
  textos: `node internal/scripts/generar_audio.mjs` (idempotente por hash; `--voz celeste`
  prueba la otra voz es-CO y `--forzar` regenera todo). La llave se lee de `$DEEPGRAM_KEY`
  o `internal/audio/deepgram.key` (gitignored); `internal/` nunca se publica.
  El ambiente (viento, río, aves) se **sintetiza** aquí mismo, sin servicios ni licencias de
  terceros: `node internal/scripts/generar_ambiente.mjs` (necesita `ffmpeg` para el MP3;
  `--wav` deja WAV sin comprimir). También es idempotente por hash.

## El pueblo vivo
- **Modelos:** las casas dejaron de ser cajas con cono. Ahora tienen zócalo, alero con colas
  de viga, techo acanalado a dos aguas (o a cuatro), ventanas con marco, contraventanas y
  alféizar, puertas de dos hojas abiertas, chimenea, portal con baranda y bajantes. Hay
  palmeras de fronda pinnada —raquis con folíolos en aguja, dos anillos de hojas, cogollo verde
  y el racimo de cocos bajo la corona—, bananos con racimo, árboles de hoja ancha —tronco
  ahusado que se abre en horquilla, copa de hojas en tres pisos de verde y contrafuertes al
  pie: la pieza `kit.arbol` que visten el del tiempo, los de la calle, los de la plaza y los de
  la otra orilla—, matas, faroles, bancas, pozos con tejadillo, carretas con ruedas de radios,
  barriles de duelas, nasas, tendederos, hamacas, cercas y el cartel rotulado de la entrada. El
  reloj de la llegada —pieza del kit, no un cuadrado con rayas— tiene esfera redonda con aro de
  hierro, numerales romanos en los cuartos,
  barras radiales en las demás horas y dos agujas de verdad: la minutera da la vuelta cada 30 s
  y la horaria va doce veces más despacio. En reposo marca las cuatro.
- **Flores de verdad:** las flores dejaron de ser icosaedros y los pétalos que caen del árbol
  del tiempo dejaron de ser conos. `src/world/flora.js` tiene el vocabulario floral —pétalo
  acucharado, corola, ojo de la flor, brizna de hierba— y con él se armaron las macetas, los
  macizos del jardín, las jardineras del patio y un prado de 320 matas repartidas en manchas
  de color. Entra por los mismos acumuladores instanciados, así que el detalle no cuesta
  llamadas de dibujo. Capturas de acercamiento: `node internal/verificacion/cdp_modelos.mjs`.
- **Vida:** 45 mariposas con las alas pintadas del avatar (instanciadas), aves con silueta de
  alas cruzando alto, libélulas de dos pares de alas sobre el río, humo en las chimeneas,
  polvo dorado a contraluz, brillos del sol en el agua, vegetación y hierba que se mecen,
  espuma en la orilla, ondas en la fuente, gotas en la taza y pétalos cayendo del árbol del
  tiempo. El chip «Pausar movimiento» lo congela todo, y con `prefers-reduced-motion` el
  pueblo se construye en pose fija.
- **Orientación:** minimapa en el HUD, siempre a la vista, con los caminos del pueblo, los
  lugares (en verde los ya descubiertos) y la flecha del jugador. Si hay recorrido en marcha,
  el destino queda marcado con un anillo dorado. Y al quedarse quieto en un lugar nuevo, la
  voz lo cuenta sola: antes había que pedir «guiarme» para oír el pueblo, y quien entraba sin
  pulsar nada lo encontraba mudo.
- **Remedios, la bella:** sube sola sobre el tendal de bramante del jardín, con las sábanas
  aleteando a su lado, y se pierde en el aire alto. La tarde del capítulo 12 se repite en un
  ciclo de 62 s: sube de 2,6 a 32,8 m y se apaga por los dos extremos, así que el reinicio del
  ciclo no se ve nunca —cuando vuelve a empezar está por encima del cordel y transparente—.
  Arranca a 2,6 m y no a ras de suelo a propósito: a la altura del tendal, su vestido y la ropa
  tendida son el mismo color y la misma altura, y a la distancia a la que se la mira —la cámara
  va 4,8 m detrás de la mariposa— las dos piezas se fundían en una sola mancha clara. Cuelga de
  `kit.animar`, de modo que «Pausar movimiento» la congela donde esté y con
  `prefers-reduced-motion` queda en pose fija a media subida. Seis mallas, 592 triángulos
  (0,4 % del presupuesto), sin proyectar sombra y con cero llamadas de dibujo mientras está
  apagada. Vive en `src/world/remedios.js`.
- **Anatomía:** el vocabulario de piezas vive en `src/world/kit.js`, el floral en
  `src/world/flora.js` y cada lugar en `src/world/places/*.js`; la capa de vida en
  `src/world/ambient.js`. Detalle, presupuesto medido y trampas:
  `docs/SPEC-PUEBLO-VIVO.md`.


## Arquitectura
- `src/main.js` composición y eventos; `src/core/Experience.js` renderer/ciclo/resize.
- `src/navigation/`: PlayerController (única autoridad de vuelo y cámara: hover sobre el
  terreno, inercia, cámara perseguidora, destino por toque), InputController,
  WalkableWorld (colisiones/alturas), TourController (grafo y guía).
- `src/world/kit.js`: materiales, geometrías compartidas, acumulador de instancias y el
  vocabulario de piezas (casa, palmera, farol, portal…). `src/world/flora.js`: el vocabulario
  floral (pétalo, corola, brizna) y sus constructores. `src/world/places/*.js`: los cinco
  lugares más las calles. `src/world/ambient.js`: la capa de vida.
- `src/world/remedios.js`: la ascensión de Remedios, la bella, sobre el tendal del jardín
  (figura, sábanas que aletean y ciclo de subida); su ancla es el encuentro `sabanas-bramante`.
- `src/world/butterflyAvatar.js`: la mariposa del jugador (contornos, textura pintada y
  aleteo con desfase, según `docs/SPEC-MARIPOSA-AVATAR.md`); sus alas y su textura visten
  también a las 45 mariposas del pueblo.
- `src/audio/TourNarrator.js`: máquina de voz inyectable (probada en Node); `src/audio/AmbientBed.js`:
  el lecho de viento, río y aves; `src/world/beacon.js` faro de destino y `src/world/postal.js`
  captura de postales.
- `src/data/`: registro único de lugares y caminos; textos literarios separados del motor.
- `src/interaction/` proximidad.
- Herramientas: `internal/scripts/pesar_escena.mjs` (reparto de triángulos sin navegador),
  `internal/verificacion/cdp_metricas.mjs` (llamadas y capturas por lugar),
  `internal/verificacion/cdp_rendimiento.mjs` (FPS y coste por encuadre),
  `internal/verificacion/cdp_circuito.mjs` (circuito guiado, ahora espera por condición).

## Fuentes
- https://www.nobelprize.org/prizes/literature/1982/marquez/facts/
- https://www.nobelprize.org/prizes/literature/1982/press-release/
- https://www.nobelprize.org/prizes/literature/1982/marquez/lecture/

Textos pedagógicos y ejemplos originales. La única cita literal de la novela es la ascensión de
Remedios, la bella (el tendal del jardín): se transcribe íntegra en el campo `cita` de esa
estación, con atribución a su capítulo, separada de la glosa en el panel —bloque propio y serif,
bajo el rótulo «Del libro»— y **fuera de la narración hablada**, porque el audio se genera y se
distribuye como MP3 y grabarlo sería una reproducción mucho más pesada que esta cita impresa.
El paisaje es una interpretación artística, no una reconstrucción geográfica.
Especificación: `docs/SPEC-RECORRIDO-3D.md`. Estado y pendientes: `internal/HANDOFF.md`.
Avatar de mariposa (implementado): `docs/SPEC-MARIPOSA-AVATAR.md`.

## Controles y primeros pasos
- Tutorial de tres pasos dentro del paseo: volar, mirar y explorar. Se puede omitir y repetir en Ayuda; la preferencia se guarda en el dispositivo.
- Los toques toleran pequeños movimientos del dedo. Arrastrar gira la cámara; tocar el suelo elige un destino sin abrir lecturas accidentalmente.
- R o «Centrar cámara» recupera la orientación, M abre el mapa y Escape suelta el puntero y detiene el vuelo. Cambiar de ventana detiene el movimiento.
- La captura del puntero es opt-in y efímera: entra con el chip «Vista libre», sale con Esc o
  al abrir cualquier panel, y el HUD lo recuerda con un aviso de siete segundos bajo la mira.
  Ni el clic ni el arrastre capturan nada.
- El recorrido guiado devuelve la altura y la mirada a crucero al arrancar, porque el relato y
  las llegadas están escritos para verse desde ahí.
- Frenado más inmediato, rechazo de destinos bloqueados y cancelación del vuelo cuando una pared impide avanzar. Usa el mapa para los trayectos entre lugares.
- El indicador muestra la siguiente parada pendiente y «Guiarme» comienza por ella.
- Verificación: `node --test tests/*.test.js`; con Vite en 5175, `node internal/verificacion/cdp_jugabilidad.mjs`, `node internal/verificacion/cdp_camara.mjs` (la perseguidora no se mete en el pueblo) y `node internal/verificacion/cdp_altura.mjs` (mira en el centro, «Vista libre» captura el puntero, altura con la mirada y sus topes, llegada volando a la meseta, paso por encima de lo bajo y choques de la interfaz en móvil).

## Seis pequeños asombros y agua en movimiento
Busca las semillas doradas de la entrada, la fuente, el patio, el jardín, el muelle y el mirador. Al acercarte, cada una revela una frase original que se conserva en **Hallazgos**. El álbum ofrece pistas y acceso al cuaderno; el recorrido guiado también permite recogerlas. **Recuerdo** descarga una postal del lugar actual.

El río combina ondas y corriente en un material animado; el bote flota con el mismo modelo de altura. La fuente tiene gotas en caída y ondas de impacto. Estos efectos son una representación visual ligera, no una simulación física de fluidos. Pausar movimiento congela el reloj del paisaje; al reanudar no salta de fase. La preferencia de movimiento reducido se respeta al entrar.

En **Ayuda → Calidad visual**, el modo **Ligera** limita la densidad de píxeles a 1 y apaga sombras. La elección se recuerda. El desplazamiento usa subpasos de colisión para mantener las barreras durante fotogramas lentos.

Pruebas adicionales: `node --test tests/expansion.test.js` y, con Vite en 5175, `node internal/verificacion/cdp_expansion.mjs`.
