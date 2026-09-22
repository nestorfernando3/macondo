# Mejoras de jugabilidad — 22 septiembre 2026

Implementado: tolerancia de 8 px al toque; una única fuente de gestos de cámara mediante Pointer Events; teclas físicas independientes; limpieza de arrastres al perder foco; frenado más rápido y parada sin deriva; destinos finitos y libres dentro del mapa; cancelación de vuelo bloqueado; clic de desplazamiento separado del botón Explorar; control manual interrumpe guía inmediatamente; R centra, M abre mapa, Escape detiene; tutorial práctico de tres pasos persistente y repetible; siguiente lugar pendiente visible y usado por Guiarme; mensajes de destino rechazado y fin de vuelo.

Verificación:
- node --test tests/*.test.js: 34/34.
- npm run build: correcto; aviso de bundle superior a 500 kB de Three.js.
- cdp_lectura.mjs: correcto, lectura, respuesta, escritura persistida, mapa y viewport móvil sin desborde.
- cdp_jugabilidad.mjs: correcto, avance del tutorial, omisión persistente, repetición y botones accesibles a 390 px.
- Capturas inspeccionadas: /tmp/macondo-jugabilidad/tutorial-movil.png y tutorial-escritorio.png.

La emulación de tamaño de pantalla no sustituye pruebas multitáctiles en teléfono físico. No se implementó resolución de colisiones de cámara con edificios ni búsqueda de ruta arbitraria por clic; el mapa utiliza las rutas existentes y el vuelo directo se cancela si encuentra un obstáculo.
