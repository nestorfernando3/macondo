# Macondo: un pueblo para recorrer

Especificación de desarrollo · 21 de septiembre de 2026

## Resultado esperado
Una experiencia educativa en español que permita entrar y caminar por un Macondo imaginado, descubrir escenas de realismo mágico y explorar a Gabriel García Márquez. El usuario solicita un recorrido bello y tridimensional. La navegación debe desplazar al visitante por el espacio: girar una maqueta o cambiar preguntas no satisface el encargo.

Esta especificación fija la solución propuesta para la siguiente implementación. La ambientación es una interpretación artística; no se presentará como reconstrucción fiel del pueblo de las novelas. Público inicial: lector general y uso escolar; textos breves, sin prerrequisitos.

## Experiencia y alcance
La portada presenta una vista aérea cinematográfica del pueblo. «Comenzar recorrido» desciende hasta una calle a altura de los ojos; ofrece omitir la transición. Desde ahí se puede caminar libremente o activar «Guiarme». El visitante debe reconocer inmediatamente el suelo, una dirección posible y un lugar al que llegar.

Un circuito peatonal conecta cinco espacios: plaza de llegada, casa de la memoria, jardín del tiempo, puerto de la espera y mirador de las historias. La casa incluye un patio transitable al que se entra por una puerta abierta; no basta una fachada. El puerto tiene muelle accesible y agua. El mirador se alcanza por una rampa. Calles secundarias cortas permiten explorar sin perder la orientación.

Duración orientativa del recorrido guiado: 6–10 minutos con lectura. Ninguna pregunta bloquea el movimiento o el acceso a un lugar. La experiencia finaliza con una invitación opcional a escribir tres frases; permite copiar o descargar el texto. No hay puntuación obligatoria, temporizador ni pantalla de fracaso.

## Navegación obligatoria

| Contexto | Comportamiento |
|---|---|
| Computador | WASD o flechas para caminar, arrastrar para mirar. Velocidad constante; diagonales normalizadas. E o clic para interactuar cerca de un objeto. |
| Móvil | Joystick visible abajo a la izquierda, arrastre en zona derecha para mirar y botón contextual para interactuar. Ambos dedos funcionan simultáneamente. |
| Acceso alternativo | Botones DOM para avanzar, retroceder y girar; lista de destinos y recorrido guiado operables con teclado. |
| Mapa | Botón siempre visible abre esquema con posición, orientación, lugares y estado de visita. Elegir destino ofrece «Ir hasta allí» siguiendo caminos. |
| Recorrido guiado | Trayecto plaza → casa → jardín → puerto → mirador. Pausa en cada llegada; «Continuar» inicia el siguiente tramo. |
| Cancelación | Cualquier movimiento manual o «Detener recorrido» cancela inmediatamente el trayecto automático. No quedan dos controladores activos. |
| Recuperación | «Volver a la plaza» disponible desde cualquier lugar; restablece una posición segura. |

Cámara a 1,65 m del suelo, FOV inicial 60°, velocidad 2,2 m/s, giro vertical limitado a ±65°. No balanceo de cabeza, saltos ni aceleración brusca. Estos valores son ajustes iniciales, no escalas del prototipo. Modelar unidades como metros: puertas de al menos 1,4 m y calles de al menos 3 m. La escena actual debe reconstruirse a esta escala.

El jugador ocupa un radio aproximado de 0,3 m. Colisiones impiden atravesar casas, troncos, bordes y agua. Resolver movimiento con deslizamiento en muros, pasos pequeños y límite de delta tras cambiar de pestaña. Las rampas ajustan la altura al suelo. No existen caídas al vacío ni rutas que atraviesen obstáculos.

El paseo automático sigue un grafo de caminos transitables y puntos de giro: no interpolar en línea recta entre edificios. Duración depende de distancia y velocidad; debe poder interrumpirse. Resize y cambio de orientación conservan la posición del visitante.

## Dirección artística y escenas memorables
Caribe cálido y vivido: estuco marfil y coral, carpintería turquesa, tejas terracota, vegetación verde profunda, flores rosa y mariposas amarillas. Suelo de tierra y piedra, sombras suaves, luz de tarde, neblina de profundidad discreta. Evitar saturación uniforme, bloom excesivo y formas que parezcan bloques de juguete vistos de cerca.

Cada encuadre combina primer plano, lugar principal y fondo. Variar siluetas, alturas y fachadas; añadir marcos, aleros, bancos, macetas, faroles y textiles con intención. Los edificios deben leerse a altura humana. El límite del mundo se integra en vegetación y paisaje. La isla flotante puede conservarse en la portada como recurso artístico, siempre con bordes seguros en el paseo.

| Lugar | Composición y fenómeno | Interacción y aprendizaje |
|---|---|---|
| Plaza | Calle sombreada desemboca en plaza luminosa; una bandada amarilla cruza hacia la casa. | Aprender controles y elegir caminar o seguir guía. |
| Casa de la memoria | Fachada cálida, umbral y patio con mesa, tazas y sábanas que flotan suavemente. | Acercarse a un objeto descubre una lectura sobre lo extraordinario cotidiano; pregunta opcional. |
| Jardín del tiempo | Sendero curvo, árbol central y pétalos en un ciclo de ascenso y caída. | Activar dos momentos del jardín y comparar repetición y cambio. |
| Puerto de la espera | Perspectiva abierta del río, muelle, banco y carta; reflejo móvil contenido. | Abrir la carta ofrece una lectura sobre espera y dignidad, vinculada a El coronel no tiene quien le escriba. |
| Mirador de las historias | Rampa con vegetación conduce a una vista del pueblo; páginas suspendidas cerca del visitante. | Explorar voz, historia e imaginación; escribir tres frases propias al terminar. |

Los fenómenos anteriores son recursos originales de la instalación, no hechos atribuidos automáticamente a las novelas. Indicarlo cuando pueda confundirse. No añadir personajes o citas inventadas del autor.

## Contenido e interfaz
Conservar y mejorar los cuatro temas existentes de content.js. Las fuentes actuales sirven como introducción; verificar cada nuevo dato literario con una fuente específica antes de publicarlo. Citas textuales requieren referencia exacta y revisión de derechos. No reproducir obras completas.

HUD discreto: nombre del lugar, mapa, ayuda, sonido, opciones y progreso. Al acercarse, mostrar nombre del objeto y «Explorar»; no abrir contenido automáticamente. Interacción máxima a 2,5 m y con línea de visión. Ocultar etiquetas detrás de muros o fuera de alcance.

Lectura breve en panel lateral de escritorio y hoja inferior en móvil. Panel expandible para quien quiera leer más. Mientras está abierto, detener locomoción y navegación automática; mantener visible el lugar cuando el tamaño lo permita. Cerrar con botón visible o Escape; devolver foco y control sin cambiar de posición. Los campos de escritura no mueven al jugador al teclear WASD.

Estados separados: lugar descubierto al llegar; contenido leído al abrir; respuesta seleccionada opcional. Guardar visitas y escritura localmente con clave versionada y tolerancia a almacenamiento bloqueado. «Reiniciar recorrido» borra solo datos de esta experiencia, con confirmación.

## Arquitectura propuesta
Mantener Vite, Three.js y JavaScript modular. Sin migración de framework ni backend.

| Módulo | Responsabilidad |
|---|---|
| src/main.js | Composición y conexión de eventos; sin geometría ni física. |
| src/core/Experience.js | Renderer, ciclo, resize, calidad, pausa y dispose. |
| src/navigation/PlayerController.js | Posición, orientación y movimiento por delta; única autoridad sobre cámara peatonal. |
| src/navigation/InputController.js | Normaliza teclado, ratón y multitáctil; limpia inputs en blur y pointercancel. |
| src/navigation/WalkableWorld.js | Límites, colisiones y consulta de altura; geometría independiente del arte. |
| src/navigation/TourController.js | Grafo, cálculo de ruta, avance, pausa y cancelación. |
| src/world/createVillage.js | Composición de lugares y recursos visuales. |
| src/world/locations/*.js | Geometría, detalles y fenómenos de cada lugar. |
| src/interaction/InteractionSystem.js | Proximidad, oclusión, selección y eventos semánticos. |
| src/ui/ | HUD, mapa, ayuda, panel de lectura y escritura accesibles. |
| src/data/locations.js | IDs, puntos de llegada, spawn, caminos, interacciones y referencias al contenido. |
| src/data/content.js | Textos y actividades, separados del motor. |

Estado explícito: portada, transición, exploración, guiado y lectura. Un único dueño de cámara por estado; OrbitControls solo puede usarse en portada/mapa, desactivado al caminar. Abrir lectura pausa guía; cerrar devuelve a exploración o a guía pausada, nunca reanuda sin gesto.

Contrato conceptual: navigateTo(locationId), cancelNavigation(), resetToPlaza(), openContent(contentId), closeContent(). Eventos: arrived, interactionAvailable, contentOpened, contentClosed. Un registro único de lugares alimenta escena, mapa y contenido; no duplicar coordenadas en DOM y motor.

## Recursos y rendimiento
Crear primero un tramo completo plaza–patio, comprobable a escala humana, y después completar el pueblo con la misma calidad. Recursos requeridos: fachadas modulares, patio, puertas y ventanas, vegetación variada, suelo, muelle, río, objetos de interacción y mariposas. Pueden ser procedurales o GLB optimizados; documentar autoría/licencia de recursos externos.

Texturas locales WebP/KTX2 según soporte, máximo habitual 1024²; fuentes WOFF2 locales con licencia. Ambiente opcional de río, viento y aves, activado por gesto, con silencio inicial. La experiencia debe funcionar completa sin sonido y con recursos decorativos fallidos.

Instancing para vegetación repetida y partículas; compartir geometrías/materiales. Una sola sombra principal, resolución ajustable; evitar sombras en cada objeto. Modo bajo elimina postprocesado y reduce partículas/sombras. DPR máximo 1,5 móvil y 2 escritorio. Objetivos: carga inicial comprimida ≤8 MB, escena visible ≤5 s en prueba de 10 Mbps, ≥30 FPS móvil y ≥50 FPS escritorio durante paseo de 60 s. Registrar dispositivo, navegador y medición; son metas por comprobar.

## Accesibilidad y recuperación
Texto DOM con contraste legible y controles táctiles ≥44 px. Ayuda visible; teclado completo para guía, lugares y lectura. Respetar movimiento reducido: sin vuelo inicial ni efectos ambientales continuos; desplazamientos guiados sustituidos por cambio directo de posición con fundido breve. Alternativa «Explorar sin 3D» con todo el contenido y navegación por lugares. Error WebGL no deja pantalla vacía. Pérdida de contexto ofrece recuperación y alternativa accesible.

## Entrega y aceptación
1. Entrar llega a una calle a altura humana. Caminar hacia una puerta reduce la distancia y permite cruzarla hasta el patio.
2. Los cinco lugares se alcanzan caminando, sin abrir preguntas y sin atravesar paredes, río o bordes.
3. Mapa y guía llevan a los mismos destinos por caminos válidos; cancelar devuelve el control inmediatamente.
4. Teclado y multitáctil permiten moverse y mirar; soltar, cambiar pestaña o abrir contenido detiene el movimiento.
5. Cada lugar presenta su escena diferenciada y un fenómeno visible. Capturas desde el paseo muestran detalles y profundidad, no solo vista aérea.
6. Abrir, contestar, omitir y cerrar las cuatro lecturas funciona; nunca reinicia posición ni bloquea acceso a otros lugares.
7. Vista 1440×900 y 390×844 sin controles fuera de pantalla. Validar además en dispositivo táctil real; emulación no sustituye gestos/rendimiento reales.
8. Probar colisiones, rutas y transiciones de estado; recorrido integrado de entrada a los cuatro lugares y regreso. Build correcto, sin errores de consola y con informe de rendimiento.
9. Entregar capturas de los cinco lugares, video corto de navegación real y reporte de validación. Registrar pendientes con precisión; no declarar terminado solo por compilar.

Fuera de esta versión: multijugador, avatar animado, mundo abierto infinito, VR, cuentas, narrador generativo y recreación completa de novelas. El criterio de cierre es un paseo completo, hermoso y verificablemente navegable.
