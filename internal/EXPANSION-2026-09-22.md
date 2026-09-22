# Expansión de Macondo — 22 septiembre 2026

Solicitud: ampliar atractivo, agua y fluidez de navegación (ambas confirmadas por el usuario).

Entrega:
- Río con ondas, normales analíticas, corriente, brillo y ribera opuesta. Bote sincronizado con la misma función de altura.
- Fuente con 96 gotas instanciadas y 16 ondas de impacto; base corregida para que el agua sea visible.
- Materiales personalizados del kit preservados (antes se convertían en color de error).
- Seis hallazgos en nodos transitables, frases originales, guardado local, álbum con pistas, final opcional en el cuaderno. Postal habilitada con título del lugar actual.
- Modo ligero persistente: DPR máximo 1, sombras desactivadas.
- Límite de delta ampliado a 100 ms para evitar reducir a la mitad la velocidad a 10–20 FPS; colisiones divididas en pasos espaciales de máximo 10 cm.
- Reloj del paisaje acumulado: pausa sin salto temporal, movimiento reducido al inicio.

Verificación:
- 38/38 pruebas Node; incluyen agua acotada, trayectorias de gotas, hallazgos alcanzables y únicos, restauración tolerante, muros estrechos y materiales personalizados.
- Build correcto, 173,67 kB gzip JS; persiste advertencia de chunk >500 kB.
- cdp_expansion: OK en entrega final, sin errores de consola. Álbum, recogida, persistencia, pausa del agua, modo ligero y controles móviles; capturas revisadas en expansion-evidencia/.
- cdp_circuito: OK, cuatro llegadas, 4/4 explorados; muelle a 2,45 m y mirador a 5,1 m.
- cdp_rendimiento antes de añadir las dos láminas de ribera: plaza 220 llamadas / 87106 triángulos / 12,6 FPS; puerto 94 / 75344 / 17,5 FPS; mirador 269 / 88602 / 11,4 FPS. Las láminas añaden como máximo dos llamadas y cuatro triángulos. SwiftShader por CPU: no equivale a GPU ni teléfono real.

Límites: agua visual procedural, no simulación hidrodinámica; rendimiento y gestos multitáctiles pendientes de dispositivo físico. Se mantienen los límites del río y las rutas existentes. No se añadió navegación arbitraria alrededor de obstáculos ni colisión geométrica de cámara.
