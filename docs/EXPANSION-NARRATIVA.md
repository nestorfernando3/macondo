# Poblar Macondo de experiencias

Plan de expansión propuesto · 21 septiembre 2026
Complementa SPEC-RECORRIDO-3D.md. El paseo existe; esta fase añade vida y relaciones entre lugares. Las escenas siguientes aún no están implementadas.

## Hilo conductor: un pueblo que recuerda contigo
El visitante reúne impresiones para escribir su propia crónica del pueblo. No representa a un personaje de las novelas. Las acciones dejan cambios pequeños: una mesa preparada, una carta escrita, una frase compartida. Se puede explorar en cualquier orden; la crónica reconoce lo vivido sin exigir completar todas las estaciones.

El tono debe ser cotidiano, cálido y ligeramente extraño. Primero sucede algo en el espacio; después aparece la oportunidad de interpretarlo. Evitar convertir cada esquina en un examen o usar lo mágico como decoración sin significado.

## Primera expansión: seis encuentros, tres mecánicas reutilizables

| Encuentro | Lo que se ve y se hace | Consecuencia y conexión | Mecánica |
|---|---|---|---|
| 1. La silla de quien falta · patio | Una taza espera junto a una silla vacía. El visitante puede poner otra taza o dejar el sitio intacto. | Cambia la mesa; se guarda una frase original sobre ausencia. El mirador recuerda la elección sin calificarla. | Elegir y transformar |
| 2. Los nombres de las cosas · calle | Tres objetos cotidianos tienen etiquetas desprendidas. Se acercan los nombres a los objetos mediante selección; no exigir arrastre. | Los objetos recuperan su nombre visible. Una nota breve invita a pensar qué conserva la memoria. | Observar y relacionar |
| 3. Dos tardes bajo el árbol · jardín | Un banco y un árbol aparecen en dos estados de luz y vegetación. El visitante alterna las tardes y encuentra algo que permanece. | Guarda una observación; pétalos y luz cambian, pero el camino permanece seguro. | Observar y relacionar |
| 4. El correo de lo pendiente · puerto | Una carta sin destinatario ofrece escribir una línea o dejarla en blanco. | La carta se pliega y queda sobre el banco. La línea se conserva localmente y puede integrarse en la crónica. Nunca se envía. | Escribir y devolver al mundo |
| 5. La voz de la vecina · plaza | Una figura sencilla en el umbral cuenta dos versiones breves de una anécdota original. Texto disponible siempre; voz opcional. | El visitante elige qué detalle conservar. Otra voz puede recordarlo al regresar. Ninguna versión se presenta como verdad histórica. | Elegir y transformar |
| 6. El cuaderno del mirador · mirador | Un cuaderno reúne las impresiones registradas en el paseo, también si solo hay una. | Editar tres frases, copiar o descargar. Volver a pasear sigue disponible. | Escribir y devolver al mundo |

Todas son escenas originales para esta instalación. Vincularlas a temas literarios mediante textos críticos breves y fuentes verificadas; no atribuir estas escenas a García Márquez. La actividad de las etiquetas necesita revisión editorial de su relación con memoria y olvido antes de publicarse. No incorporar nombres, diálogos o episodios de novelas como si fueran material libre de derechos.

## Ritmo y escritura
- Encuentro de 45–90 segundos; primer gesto significativo en menos de 10 segundos.
- Señal espacial visible, acción voluntaria, consecuencia perceptible, interpretación opcional.
- Introducción de 25–45 palabras, opciones de menos de 12 palabras, reflexión opcional de hasta 80 palabras. La voz conserva naturalidad: nada de explicar la arquitectura al visitante.
- Las decisiones expresivas no tienen respuesta correcta. Las preguntas de lectura existentes siguen accesibles como profundización opcional.
- Dos encuentros no deben reclamar atención a la vez. Prioridad al elegido; nada se abre por proximidad.
- Mantener calles despejadas. No cambiar colisiones durante una animación narrativa ni desplazar al jugador.
- Al regresar, mostrar la consecuencia guardada sin obligar a repetir el encuentro. Ofrecer «Volver a explorar esta escena».

## Contrato técnico de expansión
Base implementada: src/data/encounters.js registra los cuatro objetos actuales con id, locationId, contentId, label, x, z, y, eyeY y radius. InteractionSystem consume ese registro a través de createVillage. src/state/progress.js valida/migra visitas y respuestas; mapa y guía comparten NODES/EDGES.

Siguiente paso propuesto: añadir src/narrative/NarrativeDirector.js y src/data/stories.js únicamente al implementar el primer encuentro. No instalar un motor de misiones ni un sistema de diálogo externo.

Cada historia declara:
- id estable, encounterId, locationId y kind (choice, observation, writing);
- señal de entrada y texto de invitación;
- acciones con id, etiqueta y outcomeId;
- outcomes con texto breve y effectId permitido;
- reflexión, fuentes y estado editorial;
- representación alternativa sin 3D.

NarrativeDirector controla un único encuentro activo: idle → invited → active → resolved. Cerrar desde cualquier estado devuelve el control; resolver es idempotente. Acercarse solo invita. Una elección distinta reemplaza el resultado de esa historia, no acumula recompensas duplicadas. Los efectos se resuelven en un registro cerrado de funciones; nunca ejecutar código o HTML procedente del contenido.

Separar cuatro responsabilidades:
1. Datos: textos, opciones y referencias, sin importar Three.js ni acceder al DOM.
2. Director: estado y resultados; emite start/resolve/close mediante callbacks simples.
3. Adaptadores visuales: el mundo traduce effectId a una taza, luz, carta o figura; dispose libera recursos al salir.
4. Presentación: panel accesible y controles; el mismo contenido funciona en la alternativa sin 3D.

Crear una clave nueva macondo.historias.v1 con results por storyId. No sobrecargar discovered/answered con decisiones narrativas. Guardar solo IDs y texto propio necesario, sin analítica ni envío. Validar datos al cargar; un fallo de almacenamiento conserva la sesión y ofrece descargar. «Reiniciar» incluye esta clave. Limitar escritura a 1200 caracteres por encuentro y explicar el límite en pantalla.

Distinguir descubierto, leído y resuelto. Las dependencias afectan únicamente a menciones opcionales: ninguna impide acceder a una calle o experiencia. El cuaderno compone frases desde resultados disponibles y permite editar; no necesita IA ni red.

## Orden económico de producción
1. Implementar La silla de quien falta de punta a punta: datos, director pequeño, consecuencia visible, guardado, cierre y versión sin 3D. Reutilizar mesa/tazas actuales.
2. Añadir El correo de lo pendiente reutilizando el formulario de escritura existente y el mismo director. Integrar ambas huellas en el cuaderno.
3. Añadir Dos tardes con materiales/luz locales y animación reducida; evitar dos copias completas del mundo.
4. Incorporar etiquetas y vecina. La figura puede ser estática con una animación discreta; no requiere rig facial, doblaje ni personajes generados por IA.
5. Revisar recorrido completo, tono, accesibilidad y costo gráfico antes de sumar calles o historias nuevas.

Primer paquete entregable: silla + carta + cuaderno, con consecuencias persistentes y escenas accesibles. Segundo paquete: jardín + etiquetas + vecina. Cada paquete debe dejar el paseo funcional; no poblar veinte objetos antes de probar la primera interacción completa.

## Arte y sonido
Reutilizar arquitectura, vegetación y props. Añadir solo silla/taza alternativa, etiquetas, carta plegada, cuaderno y figura de vecina. Una mariposa puede señalar un objeto sin actuar como flecha constante. Sonidos breves opcionales, silencio inicial y subtítulos. Respetar reducción de movimiento: sustituir vuelos por cambios de estado o fundidos discretos.

## Criterios de terminado para cada paquete
- Se entiende dónde actuar sin explicación del desarrollador; señal y consecuencia visibles desde altura humana.
- Se puede omitir, cerrar, repetir, guardar y recargar sin perder control o duplicar efectos.
- Texto y controles equivalentes con teclado, móvil y sin WebGL.
- Recorrido guiado y colisiones anteriores siguen funcionando; abrir cualquier panel detiene locomoción.
- Pruebas de restauración, resultado idempotente, cierre y referencia válida story→encounter→location; build y recorrido de navegador.
- Captura antes/después y evidencia breve de interacción real. Registrar fuentes/licencias y pendientes; no llamar implementada una escena solo escrita en este plan.
