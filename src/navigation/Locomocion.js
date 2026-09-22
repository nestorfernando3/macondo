// Dueña del modo del paseo y de quién mueve a la mariposa.
//
// Antes esta regla vivía medio dentro y medio fuera de main.js: `state.mode` tenía seis
// escritores, el fallback sin 3D no escribía ninguno, y las banderas del recorrido se tocaban
// desde cuatro sitios. Las decisiones están aquí, sin DOM y sin Three, y main.js queda como
// el adapter que las aplica a la pantalla, la voz y el jugador.
//
// La interfaz son dos verbos y dos consultas:
//   ir(destino)              portada · transicion · paseo · lectura
//   bloquear({otroPanelAbierto}) / liberar()    el ciclo de cualquier panel
//   recorrido(accion, datos) iniciar · pausar · detener · llegar
//   relato(estado)           empezo · termino   (la narración de la llegada)
//   estado                   lo que hay que saber para decidir (incluido `puedeVolar`)
//
// Cada verbo devuelve EFECTOS (un objeto con claves opcionales: sólo lo que cambia). El
// llamador los aplica; nada se hace por detrás. Así estas reglas se prueban en Node.

export const MODOS = ['portada', 'transicion', 'paseo', 'lectura'];

export class Locomocion {
  // `narrador` se inyecta para poder probar las reglas de la voz con un doble.
  constructor({ narrador = null } = {}) {
    this.narrador = narrador;
    this.modo = 'portada';
    this.recorridoActivo = false;
    this.recorridoPausado = false;
    this.relatoPendiente = false;   // la llegada espera a que termine el relato
    this.ultimaLlegada = null;
    this.ultimaFueFinal = false;    // si la última llegada fue la del mirador
  }

  get estado() {
    return {
      modo: this.modo,
      recorrido: this.recorridoActivo,
      pausado: this.recorridoPausado,
      relato: this.relatoPendiente,
      ultimaLlegada: this.ultimaLlegada,
      // La única puerta de la locomoción: fuera del paseo, o con el recorrido guiando,
      // la mariposa no obedece al teclado.
      puedeVolar: this.modo === 'paseo' && !(this.recorridoActivo && !this.recorridoPausado),
    };
  }

  // Cambio de pantalla. Es el único sitio que escribe el modo, incluido el fallback sin 3D
  // (que antes se quedaba sin modo y dejaba la locomoción a medias).
  ir(destino) {
    if (!MODOS.includes(destino)) throw new Error(`Modo desconocido: ${destino}`);
    const antes = this.modo;
    this.modo = destino;
    if (destino !== 'paseo') {
      // Salir del paseo cancela el recorrido y deja de guiar: nadie conduce a la mariposa.
      const efectos = { modo: destino, vuelo: 'soltar', teclas: true };
      if (this.recorridoActivo) {
        this.recorridoActivo = false;
        this.recorridoPausado = false;
        efectos.recorrido = 'detener';
        efectos.banner = false;
      }
      return efectos;
    }
    return { modo: destino };
  }

  // Abrir un panel: todo se detiene y la mariposa suelta el vuelo.
  bloquear() {
    this.modo = 'lectura';
    const efectos = { modo: 'lectura', vuelo: 'soltar', teclas: true, voz: 'pausar' };
    if (this.recorridoActivo && !this.recorridoPausado) {
      this.recorridoPausado = true;
      efectos.recorrido = 'pausar';
    }
    return efectos;
  }

  // Cerrar un panel. Con otro panel todavía abierto no se libera nada.
  liberar({ otroPanelAbierto = false } = {}) {
    if (otroPanelAbierto) return {};
    this.modo = 'paseo';
    const efectos = { modo: 'paseo' };
    if (this.relatoPendiente) {
      // Un panel interrumpió el relato de la llegada: el gesto reabre el flujo.
      this.relatoPendiente = false;
      efectos.voz = 'cortar';
      efectos.continuar = !this.ultimaFueFinal;
    } else if (this.narrador?.paused) {
      efectos.voz = 'cortar';       // sin reanudación automática: Continuar o Escuchar son el gesto
    }
    if (this.recorridoActivo && this.recorridoPausado) {
      efectos.banner = true;
      efectos.continuar = !this.ultimaFueFinal;
      efectos.aviso = 'Recorrido en pausa.';
    }
    return efectos;
  }

  // El recorrido guiado. `iniciar` sólo confirma banderas: quien traza la ruta es el tour.
  recorrido(accion, datos = {}) {
    const { destino = null, esUltimo = false } = datos;
    switch (accion) {
      case 'iniciar':
        this.recorridoActivo = true;
        this.recorridoPausado = false;
        return { vuelo: 'seguir', banner: true, continuar: false };
      case 'pausar':
        if (!this.recorridoActivo || this.recorridoPausado) return {};
        this.recorridoPausado = true;
        return { recorrido: 'pausar' };
      case 'detener':
        this.recorridoActivo = false;
        this.recorridoPausado = false;
        return { recorrido: 'detener', vuelo: 'soltar', banner: false, voz: 'cortar' };
      case 'llegar': {
        this.recorridoActivo = false;
        this.recorridoPausado = false;
        this.ultimaLlegada = destino;
        this.ultimaFueFinal = esUltimo;
        const narra = !!(this.narrador?.enabled && this.narrador?.has('llegada-' + destino));
        this.relatoPendiente = narra;
        return {
          recorrido: 'detener', vuelo: 'soltar', banner: true,
          continuar: narra ? false : !esUltimo,
          voz: narra ? 'tocar' : undefined, clip: narra ? 'llegada-' + destino : undefined,
          aviso: 'Llegaste.',
        };
      }
      default: throw new Error(`Acción de recorrido desconocida: ${accion}`);
    }
  }

  // La narración de la llegada terminó (o la cortaron).
  relato(estado, { esUltimo = false } = {}) {
    if (estado === 'empezo') { this.relatoPendiente = true; return {}; }
    if (estado === 'termino') {
      if (!this.relatoPendiente) return {};
      this.relatoPendiente = false;
      return { continuar: !esUltimo };
    }
    throw new Error(`Estado de relato desconocido: ${estado}`);
  }
}
