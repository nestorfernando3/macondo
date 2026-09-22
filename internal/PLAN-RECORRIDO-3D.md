# Plan de implementación · recorrido peatonal 3D de Macondo

Fuente de verdad: `docs/SPEC-RECORRIDO-3D.md`. Contexto: `internal/HANDOFF.md`.

## Hito 1 · Caminar de verdad (corte vertical plaza → calle → puerta → patio) ✓
- [x] `src/core/Experience.js`: renderer único, ciclo de animación, resize, dispose.
- [x] `src/navigation/PlayerController.js`: cámara peatonal (única autoridad) 1,65 m, FOV 60, 2,2 m/s, pitch ±65°.
- [x] `src/navigation/InputController.js`: WASD/flechas con strafe, arrastre para mirar (sin pointer lock), clic corto = interactuar; limpia en blur/pointercancel; ignora teclas al escribir.
- [x] `src/navigation/WalkableWorld.js`: colisión círculo (r 0,3) con deslizamiento por ejes, límites, rampas y meseta; altura de suelo consultada por el jugador.
- [x] `src/data/locations.js`: registro único de lugares + grafo de caminos + BFS de rutas.
- [x] Mundo a escala real: casas 3–3,2 m, puerta de 1,6 m, calles 3,2–4,5 m; patio transitable por puerta abierta.
- [x] Verificado con CDP: se camina, se cruza la puerta, el muro bloquea, el agua bloquea. Build sin errores.

## Hito 2 · Los cinco lugares conectados ✓
- [x] Plaza (con fuente y farol), casa de la memoria con patio (mesa, tazas, sábanas), jardín del tiempo (setos, árbol, pétalos), puerto de la espera (muelle transitable, carta, bote), mirador de las historias (meseta a 3 m con rampa y baranda).
- [x] `src/navigation/TourController.js`: recorrido sobre grafo, pausa en llegada con «Continuar», cancelación con «Detener» o movimiento manual, detector de atasco.
- [x] Mapa con esquema SVG, posición/orientación del visitante, estado de visita y «Ir hasta allí».
- [x] «Volver a la plaza» desde cualquier lugar (verificado: llega a 0,2 m del nodo).

## Hito 3 · Interacción, contenido y estados ✓
- [x] `src/interaction/InteractionSystem.js`: proximidad ≤2,5 m, etiqueta + «Explorar» (E, clic o botón táctil).
- [x] 4 lecturas de `src/data/content.js` en panel de lectura (lateral escritorio / hoja inferior móvil); abrir pausa la guía; cierra con × o Escape; nunca bloquea el paso.
- [x] Escritura de tres frases (se abre desde la lectura del mirador); guardar/copiar/descargar; persistencia `macondo.escritura.v1`.
- [x] Persistencia de visitas y respuestas `macondo.progreso.v1` tolerante a almacenamiento bloqueado; «Reiniciar recorrido» con confirmación.
- [x] Estados: portada → transición (descenso omitible) → paseo → lectura; OrbitControls eliminado; una sola autoridad de cámara.
- [x] Fallback: «Explorar sin 3D» + pantalla de error WebGL con lista de lugares y lecturas operativas.

## Hito 4 · Acabado Caribe y rendimiento ✓ (parcial)
- [x] Paleta del spec: estuco marfil/coral, carpintería turquesa, tejas terracota, vegetación profunda, flores rosa, mariposas amarillas.
- [x] Composición por lugar: calle sombreada → plaza luminosa; bandada que cruza hacia la casa; sábanas flotando; pétalos ascendiendo/cayendo; carta en el muelle; páginas suspendidas en el mirador; bote; orilla lejana con árboles.
- [x] Instancing de vegetación y flores; una sola sombra direccional (2048 escritorio / 1024 móvil); DPR 2 escritorio / 1,5 móvil.
- [x] Capturas CDP desde altura humana de los cinco lugares (`internal/verificacion/`, salida en `/private/var/folders/.../T/opencode/*.png`).
- [ ] Pendiente: conmutador manual de «modo bajo» (sombras/postprocesado off), medición de FPS en dispositivos reales.

## Verificación realizada (CDP headless, 1440×900 y 390×844)
- Circuito guiado completo casa → jardín → puerto → mirador: llegada a los cuatro, progreso 4/4, consola sin errores.
- Colisiones: muro de fachada bloquea (z −10,47 frente a fachada en −11,2); agua bloquea (x −24 en orilla −24,3); puerta de 1,6 m transitable caminando.
- Cancelación: «Detener» detiene el tour; movimiento manual (W, 3,4 m) funciona inmediatamente después.
- Lecturas: E abre el panel; responder marca feedback; cerrar devuelve el control; desde el mirador ofrece escritura.
- Escritura: guardar persiste en localStorage; copiar/descargar presentes.
- Persistencia: visitas/respuestas/escritura sobreviven en localStorage; «Reiniciar recorrido» borra solo estas claves.
- Móvil 390×844: HUD sin controles fuera de pantalla; joystick visible con detección táctil (`body.touch`); mapa operable.
- Bundle: 516 KB JS (134 KB gzip) + 9 KB CSS — muy por debajo del objetivo de 8 MB.

## Pendientes reales (no verificado / no implementado)
- [ ] Prueba en dispositivo táctil REAL (gestos, multitáctil simultáneo, rendimiento). La emulación CDP no la sustituye.
- [ ] Métricas de rendimiento reales (≥30 FPS móvil, ≥50 FPS escritorio, carga ≤5 s a 10 Mbps) con registro de dispositivo/navegador.
- [ ] Oclusión de etiquetas tras muros (`WalkableWorld.lineOfSight` existe pero `sightBlocks` no se puebla; hoy la interacción es solo por distancia).
- [ ] Audio ambiental opcional (río/viento/aves con gesto); la experiencia funciona completa sin sonido.
- [ ] Conmutador manual de «modo bajo».
