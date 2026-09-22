# Macondo · modelos y vida del pueblo

Especificación de lo entregado · 22 de septiembre de 2026

Pedido: «mejorar los modelos; el pueblo debe sentirse más vivo». La spec del recorrido
(`docs/SPEC-RECORRIDO-3D.md`, «Dirección artística») ya lo pedía y estaba sin hacer: los
edificios eran cajas con cono, la vegetación icosaedros y sólo cuatro cosas se movían. Esta
entrega rehace el vocabulario de piezas de los cinco lugares y añade una capa de vida, sin
tocar el grafo, las colisiones pactadas, las anclas de los encuentros ni la voz narrada.

**Segunda vuelta (misma fecha): la flora.** El vocabulario anterior dejaba las flores y los
pétalos como el eslabón flojo —una flor era un icosaedro de 20 cm, una hoja de palmera caída
un cono de seis caras y los pétalos que caen del árbol del tiempo, conos—. Se añadió
`src/world/flora.js` (pétalo acucharado, corola radial, domo del centro, brizna), se
rehicieron con él macetas, macizos, jardineras, prado, pétalos y arbustos, y de paso salieron
dos fallos que no se veían en una prueba: **las 96 gotas de la fuente nunca se dibujaron** y
las hojas del banano tampoco. Detalle en §5 y §7.

**Tercera vuelta (misma fecha): las palmeras.** Pedido: «mejora las palmeras». La hoja de
palmera seguía siendo el eslabón flojo del pueblo: una lámina de 26 cm de ancho sobre 2,4 m de
largo, que se ve de canto desde media docena de ángulos, y de **una sola cara** —la mariposa
vuela a ras y mira la corona desde abajo (y con la altura libre, también desde encima), así que
el pueblo tenía copas huecas: desde el suelo se veía el cielo por dentro de la palmera—. Ahora
la fronda es **pinnada** (`geoHojaPalma`: raquis acanalado y folíolos en aguja con hueco entre
uno y otro), el material de la palmera se pinta por las dos caras, la corona lleva dos anillos
—cogollos en pie y maduras escalonadas— y el tronco cambia los escalones por un tubo abierto de
ocho caras ahusadas en zigzag sobre una base floreada. Detalle en §4, la medición en §5 y las
tres trampas en §8.


## 1. Qué se movió y qué no

**No se toca** (lo vigilan las pruebas y los CDP): el grafo `NODES`/`EDGES`, las alturas
transitables (calle 0 m, tabla del muelle 0,35 m, meseta 3 m), las cajas de colisión del
agua y de las fachadas, los siete anclas de `ENCOUNTERS` con su `eyeY`, y las cotas de los
efectos de historia (la taza en (1,15 · 1,06 · −15,9) y la carta en (−27,5 · 0,9 · 8,8)).

**Cambios con consecuencia medida:**
- La casa oeste se corrió a (−7,6, −4,8): su esquina rozaba el camino `pW→n1` (0,37 m de
  holgura con un jugador de 0,32). Lo cazó la prueba nueva, no un ojo.
- La fachada de la casa de la memoria mira a +z; sus ventanas llevaban giro π y quedaban
  enterradas dentro del muro. Ahora giran 0 y el alféizar sobresale hacia la calle.

## 2. Vocabulario de piezas — `src/world/kit.js`

`crearKit(scene, world)` devuelve materiales, geometrías compartidas, el acumulador de
instancias y las piezas con nombre. Cada lugar (`src/world/places/*.js`) sólo describe qué
va dónde; el cómo vive aquí.

| Familia | Piezas |
|---|---|
| Fachada | `zocalo` (implícito en `casa`), `alero`, `techo` (dos aguas con caballete, frontones y colas de viga), `techoHip`, `ventana` (marco, vidrio, alféizar, contraventanas y luz cálida), `puerta` (dos hojas abiertas, dintel, jambas, escalón), `chimenea`, `bajante`, `portal` |
| Casa | `casa({plantas, portal, chimenea, cubierta, semilla})` — siluetas de 1 y 2 plantas (3 m y 5,6 m), zócalo coral, portal de madera con baranda y tejadillo |
| Vegetación | `palmera` (tronco de ocho caras anillado que se curva sobre una base floreada, cogollo verde, racimo de cocos, corona de frondas **pinnadas** en dos anillos —cogollos en pie y maduras escalonadas— y frondas secas colgando), `banano` (nervadura, racimo y bellota), `arbusto` de cinco lóbulos, `maceta` con flores, `junco` con espigas |
| Flora | `flor`, `mataFlor` (vara curva, hoja y corola), `macizoFloral` (arriate o jardinera) y `briznas` (penacho que se mece con el viento). El vocabulario vive en `src/world/flora.js` |
| Mobiliario | `farol` de calle con luminaria que respira y vidrio, `banca` de listones, `pozo` con tejadillo y cubo, `carreta` con ruedas de radios y yugo, `barril` de duelas, `tendedero` de telas con pinzas, `hamaca`, `nasas` con boyas, `cartel` rotulado, `cerca` |
| Reloj | `reloj(x, z, ry, {hora, vuelta})`: basamento de piedra, poste con capitel, caja turquesa con alféizar y cornisa, carátula redonda con aro, horas radiales y cuartos en romano por el mismo vocabulario de trazos del cartel, agujas animadas y tejadillo con pomo |

Geometrías de perfil propio, cacheadas por medidas: `geoTeja` (losa acanalada en dientes de
sierra: las canales corren por la pendiente), `geoTriangulo` (frontón sin `ExtrudeGeometry`),
`geoHoja` (lámina con caída y **pliegue en V** —sin el pliegue la hoja se ve de canto—, la del
banano) y `geoHojaPalma` (la **fronda pinnada**: raquis en tienda de campaña y quince pares de
folíolos en aguja, con hueco entre uno y otro para que pase la luz). El kit guarda además dos piezas planas —`circulo` (28 caras,
mira a +z) y `aro` (toro de 6 × 28)—: nacen ya en el plano x-y para que la carátula del reloj
se pida con sólo `ry`, porque el orden de Euler del kit aplica la x al final y tumbar un
cilindro con `rx` deja la pieza mirando al norte del mundo.

`src/world/flora.js` añade las suyas, también cacheadas por medidas: `geoPetalo` (garra en la
raíz, copa en los bordes y curva en la punta), `geoCorola` (pétalos en rueda, en cuenco),
`geoDomoFlor` (el ojo de la flor) y `geoBrizna` (hoja de hierba afilada y doblada). El pétalo
sale de dos caras —la cara de abajo existe, porque la mariposa vuela y mira desde arriba—
construida volteando la malla, no con un material `DoubleSide` por color.

**Dos corolas para dos presupuestos.** La que se mira a un metro (maceta, macizo, jardinera)
lleva cinco pétalos y 60 triángulos; la del prado, que se ve a diez metros y de a cientos,
lleva cuatro pétalos y 32. Con la barata el prado pasó de 150 a 320 matas por el mismo
presupuesto.


**Cómo se paga el detalle.** El detalle repetido entra por `lote(geo, mat, x, y, z, opciones)`
y sale horneado en un `InstancedMesh` por par (geometría, material): marcos, contraventanas,
tablones, pilotes, postes, cuerdas, hiladas, macetas y flores del pueblo entero cuestan unas
sesenta llamadas en total. La silueta (cuerpos, techos, frontones, copas, palmeras, mesas)
va suelta y con sombra; el detalle no proyecta sombra — el spec lo pide así («evitar sombras
en cada objeto») y es la diferencia entre 10 y 20 FPS en el banco de pruebas.

## 3. Capa de vida — `src/world/ambient.js`

`crearVida(ctx)` cuelga del mismo acumulador (`kit.movil`), así que cada familia es **una**
llamada de dibujo, y todo se congela con el chip «Pausar movimiento» y con
`prefers-reduced-motion` (en ese caso se construye en pose fija, sin efectos continuos).

| Familia | Qué es | Coste |
|---|---|---|
| Fauna | Las 45 mariposas del pueblo (26 sueltas, 9 de la espiral del jardín, 10 de la bandada) con las alas pintadas del avatar — fase 2 de §10 de `SPEC-MARIPOSA-AVATAR.md` — instanciadas por lado y por par de alas | 4 llamadas (antes ~90 mallas) |
| Fauna | 12 aves cruzando alto, con silueta de cuerpo, cola ahorquillada y alas en diedro (28 triángulos; antes eran conos), que se escoran al girar | 1 llamada |
| Fauna | 6 libélulas sobre el río, con cuerpo, cabeza y dos pares de alas que baten (antes eran una vara sin alas) | 2 llamadas |
| Ambiente | Humo de cuatro chimeneas (sube, se abre y se deshace), 44 motas de polvo a contraluz, brillos del sol en el río | 3 llamadas |
| Vegetación | Viento en las hojas de palmeras y bananos, en las briznas del prado y en las matas del mirador (registradas con `kit.mecer` y agrupadas por `kit.crearViento`) | 2 llamadas |
| Agua | Espuma en la orilla y ondas concéntricas en la taza de la fuente | 2 llamadas |
| Jardín | Pétalos de verdad —la lámina acucharada de `flora.js`— que caen de la copa del árbol del tiempo girando sobre los tres ejes, en tres colores, y se encogen suavemente al pasar por delante de la cámara | 3 llamadas |
| Luz | La luz cálida de las ventanas respira (un solo material para todas) | 0 |

Las chimeneas anotan su boca en `kit.chimeneas` al construirse, así que el humo no repite
coordenadas.

## 4. Sonido ambiente — `src/audio/AmbientBed.js`

Tres lazos (viento, río y aves) que **no suenan hasta que la visitante los pide** con el
chip «Sonido» del HUD (silencio inicial, spec §84); la preferencia se recuerda por
dispositivo en `macondo.ambiente.v1`. El río aparece con la distancia al agua (a 18 m ya no
se oye) y todo el lecho cede a un 32 % mientras habla la guía. `audioFactory` es inyectable:
la máquina se prueba en Node como la del narrador. La experiencia queda completa sin sonido.

Los MP3 se **sintetizan** con `internal/scripts/generar_ambiente.mjs` (ruido filtrado con
biquads escritos a mano para el río y el viento; cantos FM para las aves), con semilla fija:
son originales, no arrastran licencia de terceros y la segunda corrida no regenera nada
(manifiesto por hash en `internal/audio/manifest-ambiente.json`). El script informa RMS,
pico y salto de bucle de cada lazo, y cierra el bucle fundiendo la cola sobre la cabeza.
Necesita `ffmpeg` para el MP3; con `--wav` deja WAV sin comprimir. Si algún día la síntesis
no bastara, el respaldo pactado es material CC0 o de dominio público con autoría y licencia
registradas.

## 5. Presupuesto medido (Chrome headless, SwiftShader)

Las cifras de FPS del banco de pruebas son un **suelo**, no una medida de dispositivo: el
renderizador es por CPU. Sirven para comparar antes/después.

| Encuadre | Llamadas antes | Llamadas con flora | Llamadas con palmeras | Triángulos antes | Triángulos con flora | Triángulos con palmeras |
|---|---|---|---|---|---|---|
| Plaza de llegada | 223 | 218 | 223 | 74 976 | 127 766 | 134 936 |
| Casa de la memoria | 118 | 156 | 155 | 71 148 | 124 806 | 131 172 |
| Jardín del tiempo | 131 | 109 | 110 | 67 418 | 119 496 | 126 314 |
| Puerto de la espera | 93 | 117 | 117 | 60 158 | 113 252 | 120 190 |
| Mirador (peor caso) | 272 | 240 | 246 | 76 472 | 129 158 | 136 932 |

Mallas totales 328 → 264 (106 instanciadas), geometrías 71 → 78, bundle 167,58 → 185,40 kB
gzip. La segunda vuelta sube los triángulos un 70 % —flores de verdad en el prado, en las
macetas, en los macizos y en las copas— y aun así **baja las llamadas** en tres de los cinco
encuadres: la flora entra por los mismos acumuladores instanciados que el resto del detalle.

La tercera vuelta cuesta unos **+7 400 triángulos**, casi todos en las catorce palmeras: de unos
10 400 a unos 17 800, repartidos en la fronda de 46 triángulos × 168, las frondas secas
(49 × 46), el tronco anillado (293 × 16 triángulos: el tubo abierto paga los tramos de 30 cm) y
el cogollo. En el peor encuadre son unos +7 000 sobre los 129 158 de la vuelta de la flora (5 %),
y las llamadas apenas se mueven —cinco más—: la fronda, las frondas secas, el tronco, el cogollo
y los cocos entran por `lote`/`mecer` como todo lo demás. El precio se pagó en triángulos y a
conciencia: la corona es lo que se mira al volar.

El presupuesto lo vigila `internal/verificacion/cdp_rendimiento.mjs`, que afirma menos de 400
llamadas y menos de 150 000 triángulos por encuadre. El peor caso queda en 136 932 (9 % de
margen). El FPS del banco por CPU bajó de 11–13/16–20/11–12 a 10/13,6/9: es un suelo, no una
medida de dispositivo, y ya estaba por debajo del umbral de 20 FPS con el que el reloj del
paseo se mantiene en tiempo real.

Instrumentos: `internal/verificacion/cdp_metricas.mjs` (llamadas, triángulos y capturas de
los cinco lugares desde el paseo), `internal/verificacion/cdp_modelos.mjs` (acercamiento a un
metro de la pieza, para juzgar el modelo y no el encuadre) e `internal/scripts/pesar_escena.mjs`
(reparto de triángulos por malla, sin navegador).

## 6. Pruebas que protegen el paseo

En `tests/architecture.test.js`, además de las que ya había:

1. **«el pueblo sigue siendo transitable por el grafo del recorrido»** — construye el
   pueblo sin navegador y muestrea cada arista de `EDGES` cada 25 cm con radio 0,32. Es la
   prueba que hace seguro añadir piezas: si una palmera invade una ruta, canta aquí.
2. **«el suelo del recorrido no da saltos»** — ningún escalón de altura mayor de 0,6 m
   entre muestras.
3. **«las alturas del recorrido son las prometidas»** — los tres checkpoints del CDP: calle
   0, tabla del muelle 0,35, transición y meseta 3. Nació de perder las rampas del muelle en
   el refactor.
4. **«el agua no se cruza y el muelle sí»** — las cajas de agua del puerto. Nació de
   perderlas en el mismo refactor.
5. **«cada encuentro conserva un punto de aproximación libre»** — al menos 3 de 12 puntos
   del anillo de cada encuentro quedan libres para la mariposa.
6. **«el lecho ambiente calla hasta el gesto, sigue al río y cede ante la voz»** y
   **«los lechos de ambiente están medidos y cierran en bucle»**.

## 7. Trampas pagadas (no repetir)

- **`lote()` devuelve un índice, no una malla.** Lo que se vaya a animar por instancia
  (la mecedora, las telas) tiene que ser una malla propia o un `movil`; por lotes queda
  congelado y, si se escribe sobre el índice, revienta en cada frame.
- **Orden de Euler 'XYZ'.** La rotación z se aplica primero y la x al final: para tumbar un
  cono o un cilindro y después girarlo, el tumbo va en **z** y el giro en **y**. Con el tumbo
  en x, todas las aves apuntan al norte del mundo. (En las aves había además un `rumboX`
  espejado: `ry(ψ)` lleva +x a `(cos ψ, 0, −sen ψ)`, así que pide `atan2(−vz, vx)`.)
- **Un solo `tmp` compartido y el NaN que se contagia.** Todo el kit reutiliza el mismo
  `Object3D` para hornear matrices. Una familia que no escriba las tres rotaciones deja el
  objeto en NaN y **arrastra a las demás**: `banano()` registraba sus hojas sin `rx`, el
  `tmp` quedaba en NaN y las 96 gotas de la fuente —que sólo escriben posición y escala—
  dejaron de dibujarse durante dos entregas sin que ninguna prueba lo notara (una matriz NaN
  se descarta en silencio; no lanza). Se arregló en los tres sitios: `rx` en `banano()`,
  `item.rx ?? 0` en el callback del viento y `kit.colocar()`, que pone el `tmp` en cero antes
  de cada `porItem`. Vale la pena un chequeo de NaN en la verificación: no lo hay.
- **`esc` multiplica metros, no centímetros.** Las geometrías unidad miden 1 m, así que una
  hoja se pide `.13`, no `13`. Pedirla en centímetros puso hojas de doce metros sobre el
  pueblo —y se vio en la captura, no en la prueba—.
- **Una bandera ignorada cuesta el doble.** `geoPetalo` aceptaba `doble` y no lo miraba: la
  corola salía de 120 triángulos creyendo medir 60, y el prado entero pagaba el doble por
  cada flor. El pétalo suelto sí necesita las dos caras (cae girando); dentro de una corola
  no, porque el conjunto se voltea una sola vez al final. Comparar el triángulo contado con
  el documentado es la forma barata de cazarlo.
- **Geometría unidad y escala.** El cono unidad mide 1 m de alto: los pétalos salieron
  gigantes hasta que se les puso su escala de 20 cm.
- **Una flor pequeña y repartida no se ve.** 150 matas uniformes sobre 68 × 68 m dan una flor
  cada 32 m²: desde el aire el prado se veía vacío aunque cada mata estuviera bien hecha. En
  manchas de 3 a 5 y de un solo color por mancha, el mismo presupuesto se lee como prado.
- **Capas transparentes de extremo a extremo.** Un segundo plano de agua con `depthWrite`
  por defecto tapa el río entero y se ve una mancha verde. El agua del río es opaca: además
  de leerse igual, se dibuja sin mezcla.
- **`innerWidth` en el módulo del pueblo.** Se lee por `tamanoSombra()`, con valor de
  escritorio cuando no existe (Node): sin eso, ninguna prueba puede construir el pueblo.
- **Framing de las capturas.** El script coloca la cámara 4,52 m detrás del rumbo; en el
  jardín eso la metía dentro de una casa. Desde el paseo real la cámara tampoco colisiona
  con la geometría: es una limitación conocida del modo tercera persona. Y para juzgar un
  modelo hay que acercarse: `cdp_metricas.mjs` mide el encuadre del paseo, `cdp_modelos.mjs`
  pone la cámara a un metro.
- **Chrome zombi.** Los scripts comparten el puerto 9335: si uno muere mal, el siguiente se
  conecta al viejo y las capturas salen con el tamaño de viewport del anterior
  (`pkill -9 -f chrome-cdp`).

## 8. Estilo: cuerpos continuos, detalle como modulación

La regla con la que se construye una pieza, y que conviene no volver a romper:

- **Un cuerpo, una pieza continua.** Un tronco, una regala o un anillo se barren de una vez con
  una silueta alineada; el detalle se añade como modulación suave de esa forma (±5 % de radio,
  una muesca fina), nunca como piezas sueltas desalineadas. Cuatro casos pagados de una vez:
  - El tronco de palmera llevaba **ruido aleatorio por tramo** en el desplazamiento lateral, así
    que las secciones no caían en la misma curva —parecía un tótem de tuberías—, y el radio
    alternaba un **30 %** entre tramos contiguos, que se lee como tubos apilados. Ahora la curva
    es del tronco entero y el anillo respira un ±5 %. La tercera vuelta volvió sobre él **dos
    veces más**, y las dos veces por lo mismo: cualquier escalón en el radio se ve. Con tramos de
    70 cm el anillo caía uno por tramo (bambú); con tramos de 30 cm y un ±2,5 % simétrico quedaba
    un **serrucho** en el canto, que a un metro de cámara se lee como un filo mal cortado. Lo que
    funciona no es modular el radio, es **no tener escalón**: cada tramo es un tubo abierto de
    ocho caras ahusado un ±4 %, y uno de cada dos va **girado media vuelta** (`rx: π`), así que la
    boca de arriba de un tramo mide lo mismo que la de abajo del siguiente y la silueta es una
    sola línea continua que se estrecha y se ensancha: el zigzag del tronco de cocotero. El tubo
    abierto —sin las tapas que quedan dentro del tramo siguiente— paga los tramos de 30 cm.
  - El collar del cogollo fue dos veces el mismo error: un cilindro más ancho que el tronco con
    una esfera encima se lee **sombrero de copa** —dos cuerpos con el canto a la vista donde la
    palmera tiene uno—, y verde y ancho, un **embudo**. Ahora el tronco sube hasta la corona y
    el capitel es un tapón del color del tronco con una banda verde fina donde arraigan las
    frondas: si el detalle se ve como pieza, no es modulación, es una pieza de más.
  - Las regalas del bote eran cajas por tramo: en las curvas cortaban la esquina. Ahora son una
    **cinta barrida**, con el mismo criterio que el casco.
  - El anillo de piedra del cerro iba **de canto** (0,7 m en tangente para un paso de 2,08): se
    leía como una fila de monolitos sueltos. Con `ry: -a` el eje z local es la tangente, así que
    basta darle el largo en z para que las piedras cierren el anillo.
- **Si una cara puede salir al revés, decide el sentido por la normal, no a ojo.** El material
  es de una sola cara y una cara invertida no se ve: desaparece sin error. En `geoRegala` el
  sentido de cada triángulo se elige comparando su normal con el vector que va del eje del tubo
  al centro de la cara.
- **Una lámina de una cara solo existe para medio pueblo.** La corona de la palmera era una
  hoja plana de una cara: la mariposa vuela a ras y mira hacia arriba, así que desde la calle
  se veía el cielo **dentro** de la copa —sin error, sin aviso: la cara de abajo simplemente no
  se dibuja—. Las dos soluciones del proyecto: **voltear la malla** cuando el material es
  compartido (los pétalos de `flora.js`, que el prado repite por cientos, con un `DoubleSide`
  por color pagarían de más) y **`DoubleSide` en el material propio** cuando la pieza es su
  única dueña —la fronda de palmera—, que cuesta cero triángulos donde duplicar la malla
  costaba el doble. La pregunta previa, siempre: ¿desde dónde se mira esta pieza?
- **Un plumero se lee por el hueco, no por el borde.** La primera fronda pinnada salió con los
  folíolos pegados al raquis —anchos, contiguos, con punta cuadrada— y se leía como una hoja de
  plátano con el borde rizado. Lo que dice «palmera» es el aire entre folíolo y folíolo: quince
  pares de agujas por fronda (base estrecha, punta de un vértice, `holgura` de un 30 % del hueco
  entre inserciones), con el material de dos caras para que la silueta no dependa de la altura
  desde la que se mire. Coste: 46 triángulos por fronda, 168 frondas vivas y 49 secas en las
  catorce palmeras.
- **Lo que flota tiene que quedarse seco por dentro.** El bote llevaba `y0 = −0,13` con 3,5 cm
  de la animación por encima del agua: la flotación caía en −0,035 y el suelo **interior** en
  −0,051, así que el plano opaco del río tapaba la sentina y se veía agua dentro del bote. Al
  ajustar un casco el margen es estrecho: interior por encima de la flotación, exterior por
  debajo.
- **La geometría se mide, no se supone.** Antes de rehacer el bote se compararon las cajas
  envolventes de casco, herraje y remos: dijeron que la regala estaba donde debía —7 cm fuera
  del casco, que es su propio ancho— cuando la captura parecía decir lo contrario. La captura
  manda para juzgar; la medida, para localizar.
