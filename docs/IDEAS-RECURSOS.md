# Ideas para la capa literaria · leer la novela desde el pueblo

Propuesta · 23 de septiembre de 2026
Complementa `EXPANSION-NARRATIVA.md` (escenas originales) y `SPEC-RECORRIDO-3D.md` (paseo).
Este documento no implementa nada: ordena lo que la lectura de **Cien años de soledad**
sugiere para los recursos actuales.

## Lo que se revisó

- La novela completa, edición ilustrada disponible en el entorno (20 capítulos, ~811 000
  caracteres, apéndice con dos genealogías y once ilustraciones), leída en cuatro tramos.
- Los recursos vigentes: `src/data/content.js` (7 estaciones), `narracion.js` (18 clips),
  `encounters.js` (9 encuentros), `discoveries.js` (6 hallazgos), `stories.js` +
  `secondStories.js` (6 historias), `docs/` y la capa de mundo (`kit.js`, `places/*`,
  `ambient.js`).

## Diagnóstico · tres hallazgos

**1. La experiencia enseña el concepto y casi no cuenta la novela.** Una búsqueda por el
código (`grep -rli` sobre `src/`) da cero apariciones de: hielo, insomnio, olvido,
pescaditos, castaño, gallos, daguerrotipo, pianola, almendros, pergaminos, gitano,
alquimia, plaga, imán, cofre, baúl, Úrsula, Melquíades. Lo que sí existe es de la
instalación (faro, reloj, espiral, sillas) y dos motivos del libro usados como ambiente
(sábanas, mariposas). Hoy un visitante puede terminar el paseo sin conocer un solo hecho,
objeto o personaje de la novela: se llevó la teoría del realismo mágico y ninguna Macondo.
La estación `memoria` promete «Macondo, la familia Buendía y las vueltas de la memoria» y
no menciona ni a la familia ni a la memoria del libro.

**2. Dos textos de lectura afirman lo que la novela no dice.**

| Dónde | Dice hoy | La novela dice |
|---|---|---|
| `content.js:40` (tren) | «El tren llegó un sábado de madrugada con un silbato largo, y de los vagones bajaron buhoneros con cacerolas, mecedoras, sombreros de ala ancha…» | El tren llega **en la tarde, adornado de flores y con ocho meses de retraso**, con Aureliano Triste saludando desde la locomotora (cap. 11), y la palabra «buhoneros» no existe en la novela; los muebles y utensilios llegan en **carretas de bueyes** con «mercachifles de la realidad cotidiana» (cap. 11–12). |
| `content.js:30` (llegada) | «Los recién llegados preguntaban quién fundó el pueblo, y nadie respondía con certeza: parecía haberse inventado solo» | La fundación **sí se cuenta**: la travesía de veintiséis meses, la huida tras la muerte de Prudencio Aguilar y el sueño de la ciudad de espejos (cap. 2). El pueblo no «se inventó solo»; lo fundó una familia que huía. |

Los dos casos se arreglan con una capa de atribución (A1–A3), no con reescribir el paseo.

**3. El material más aprovechable del libro está intacto.** El hielo (cap. 1), la peste del
insomnio y sus etiquetas (cap. 3), los pescaditos de oro que se hacen y se funden (cap. 6,
9, 13), el cuarto de Melquíades y los pergaminos (cap. 4, 12, 16–20), el tren amarillo y la
fábrica de hielo (cap. 11), las sábanas de la ascensión (cap. 12), la masacre y el «no hubo
muertos» (cap. 15), la lluvia de cuatro años, once meses y dos días (cap. 16), el árbol de
los Buendía (toda la novela) y la voz del narrador que domestica el asombro con **cifras
exactas** (25 pescaditos, 72 ladrillos, 17 hijos, 200 vagones).

## Bloque A · Fidelidad y atribución (datos y DOM; no toca el 3D)

**A1 · Ficha «En la novela» en cada estación.** Segunda capa del panel de lectura: 120–180
palabras en palabras propias, con el capítulo de referencia. Es el hueco más grave del
proyecto y el arreglo más barato: solo datos + una pestaña en el panel.

| Estación | Qué cuenta la novela (en palabras propias) | Caps. |
|---|---|---|
| `llegada` · plaza | La fundación: la travesía de la sierra, la muerte de Prudencio Aguilar y el sueño de una ciudad de espejos. Y el primer prodigio: un bloque de hielo que se paga por tocar. | 1–2 |
| `memoria` · casa | La casa que se amplía sola para alojar a los muertos; el patio con el castaño; la peste del insomnio, las etiquetas con los nombres de las cosas y la máquina de la memoria; la lluvia de flores amarillas sobre el fundador. | 3, 4, 7 |
| `tiempo` · jardín | El fundador convencido de que el tiempo se detuvo en un lunes eterno; los gemelos que intercambian nombres y se confunden hasta la tumba; los animales que se multiplican sin control. | 4, 10, 16 |
| `espera` · puerto | El coronel que cambia pescaditos por monedas y monedas por pescaditos; la pensión que nunca llega; el armisticio firmado antes de un tiro. | 6–9 |
| `mariposas` · jardín | Las mariposas amarillas que preceden a un hombre y se meten en la casa por la puerta; el insecticida; la última mariposa en un ventilador de barco. | 14–15 |
| `tren` · puerto | El tren amarillo con flores, su retraso, la fábrica de hielo, la luz eléctrica, el cine, el gramófono y el banano; más tarde, la huelga, la estación y el «no hubo muertos». | 11–12, 15 |
| `voz` · mirador | Los pergaminos que contienen el siglo entero y la última página: leer lo que ya estaba escrito. Y el discurso del Nobel de 1982. | 20 + Nobel |

**A2 · Sello de origen.** Chip en el panel: «De la novela» o «De esta instalación». Hoy el
visitante no puede distinguir el faro inventado del tren amarillo real, y las dos cosas se
cuentan con la misma voz. Con el sello, la instalación gana honestidad y la lectura crítica
se vuelve posible.

**A3 · Pie de fuente por dato.** `content.js` pone una `source` igual (Nobel) para todas las
estaciones. Ampliar a una referencia por dato: capítulo de la novela (con edición) y fuente
verificada para lo biográfico. Sin esto, A1 queda cojo.

**A4 · Nota de voz.** El narrador del libro cuenta lo increíble sin asombrarse y con cifras
exactas. Los textos nuevos pueden aprender de ahí: números concretos y enumeración serena,
sin adjetivos que griten el asombro. Es la regla de estilo que mejor rinde por línea escrita.

## Bloque B · Recursos nuevos que la novela pide (por valor / coste)

**B1 · El hielo (barato).** Un cofre de pirata abierto sobre un banquete improvisado junto
a la plaza: un bloque de hielo, un gigante que cobra por tocarlo (una sola vez, simbólica:
la interacción no cobra nada real) y una pregunta de tacto y asombro que no necesita quiz.
En el mismo lugar, la segunda capa del capítulo 11: la fábrica de hielo del pueblo, el
prodigio convertido en negocio. Cierra el círculo de las dos visitas del asombro y es el
objeto más barato de añadir: una caja con material propio, un cartel y una estación.

**B2 · El árbol de los Buendía (barato, DOM).** Panel dentro del mapa (o junto a la Ayuda)
con el árbol de siete generaciones, la repetición de los nombres (José Arcadio, Aureliano,
Amaranta, Remedios, Aureliano Segundo, José Arcadio Segundo) y el final de la estirpe. Es
la llave de lectura que hoy no existe y el complemento natural del mapa. No reutilizar las
genealogías de la edición ilustrada (tienen derechos): trazar el árbol propio.

**B3 · El taller de los pescaditos de oro (medio).** Sobre la mesa del patio o en un cuarto
nuevo de la casa: hacer veinticinco pescaditos, contarlos en una bandeja y fundirlos para
volver a empezar. La mecánica es el tema: **hacer para deshacer**, el coronel que trabaja
cada vez más para el mismo círculo. Reutiliza `StoryInteraction` + el registro cerrado de
efectos + el contador como `effectId`. Es la estación que mejor enseña la repetición del
tiempo sin explicarla.

**B4 · El cuaderno se vuelve pergamino (medio).** Hoy el cuaderno del mirador reúne huellas
y tres frases. Propuesta: al abrirlo por segunda vez, el cuaderno se lee como **pergamino
escrito de antemano** —las huellas que el visitante dejó (la carta, las etiquetas, la
muesca, los hallazgos, la hora) ya estaban ahí— y el cierre es el descubrimiento de que
leyó su propio paseo. Es el final de la novela convertido en gesto de interfaz, sin citarlo.

**B5 · La peste del olvido, integrada (medio).** La historia «Los nombres de las cosas» ya
etiqueta tres objetos. Ampliarla al pueblo: un botón «olvidar» (o el paso del tiempo entre
visitas) borra las letras de las etiquetas y hay que volver a nombrar; un **cuaderno de
palabras** recoge el léxico del Caribe que ya está en el mundo (cañabrava, nasa, totuma,
guineo, malanga, alcaraván, galeón, buhonero) con su significado y su capítulo. Dos frentes
de Lengua Castellana en una mecánica que ya existe.

**B6 · La lluvia de cuatro años, once meses y dos días (medio).** Estado del mundo, no
escena: tras el mirador (o por el chip de opciones), empieza a llover; el río sube, la luz
se apaga, el pueblo queda en silencio y el tendal se vacía. Reutiliza `AmbientBed`, `water.js`
y la mesa de sonido que ya atenúa la voz. Se puede salir cuando se quiera; con
`prefers-reduced-motion` entra como fundido. Enseña el capítulo 16 sin contarlo.

**B7 · El tren amarillo y la memoria negada (alto; spec aparte).** Llevar el tren al puerto
en serio (vía, estación mínima, silbato, llegada única por visita) y, en la segunda capa, la
compañía, la huelga y el «no hubo muertos». Es el material más potente y el más sensible:
merece su propio incremento y su revisión editorial antes de tocar el pueblo.

**B8 · Lo que no haría.** Dramatizar la ascensión de Remedios con su figura, o poner a
Úrsula y a Melquíades a hablar. La regla del proyecto (escenas originales, sin episodios ni
diálogos de la novela) es lo que mantiene el paquete publicable; conviene conservarla y
contar a los personajes en la ficha, no en la escena.

## Bloque C · Capa docente (lo que falta para usarlo en clase)

- **C1 · Guía docente de una página**: objetivos, correspondencias estación↔capítulo, cuatro
  preguntas antes y después del paseo, tiempos de clase y la advertencia de que la
  instalación es una interpretación.
- **C2 · Ficha imprimible del estudiante**: una hoja que acompaña el paseo (nombrar lo que
  se ve, marcar hallazgos, escribir tres frases).
- **C3 · Exportar la crónica**: el cuaderno ya copia y descarga; añadir PNG/PDF con
  hallazgos, respuestas y las tres frases, como evidencia para el profesor.
- **C4 · Índice crítico de la novela**: veinte capítulos, una línea cada uno, marcando dónde
  vive cada estación. Brújula para quien ya leyó, invitación para quien no.
- **C5 · Rúbrica breve** de tres niveles para la escritura y la conversación.
- **C6 · Modo clase**: ocultar la respuesta correcta hasta responder y un reinicio limpio
  para el siguiente estudiante en el mismo equipo.

## Lo que no tocaría

El vuelo, la altura y las colisiones (recién verificados y frágiles); el grafo del tour y
las llegadas; el avatar de la mariposa; los MP3 pregenerados (reutilizar el guion, no
regenerar por gusto); la arquitectura de datos con efectos cerrados; y tres promesas del
spec: ninguna pregunta bloquea el paso, el audio nace de un gesto y la experiencia está
completa sin sonido. La regla de no reproducir fragmentos no se negocia: todo lo anterior se
escribe en palabras propias y con el capítulo citado.

## Orden recomendado

1. **Incremento 1 · puente literario (datos y DOM).** A1, A2, A3, A4 y B2. No toca el mundo,
   no suma triángulos y responde al hueco más grave.
2. **Incremento 2 · objetos del libro.** B1, B3 y B5, con su audio y sus pruebas.
3. **Incremento 3 · experiencia completa.** B4, B6 y C1–C5, y dejar B7 como spec aparte.

## Verificación y derechos

Cada incremento cierra con `node --test tests/*.test.js`, `npm run build` y los guiones CDP
correspondientes (consola limpia), como el resto del proyecto. Añadir una prueba de datos
nueva: toda estación declara `novela.capitulo`, `novela.texto` y `novela.fuente`, y ningún
texto de `content.js`/`narracion.js` contiene comillas de la novela ni frases que se le
atribuyan sin fuente.
