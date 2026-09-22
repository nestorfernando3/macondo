const KEY = 'macondo-tutorial-v1';
const steps = [
  ['Tu primer vuelo', 'Usa WASD o las flechas. Espacio te sube y Shift te baja; en pantalla táctil, el joystick y los botones ▲▼. También puedes tocar el suelo para volar.', 'moved'],
  ['Mira a tu alrededor', 'Arrastra sobre el paisaje para girar la cámara. El botón Centrar cámara recupera la vista detrás de ti.', 'looked'],
  ['El pueblo tiene historias', 'Acércate al reloj de la plaza. Cuando aparezca Explorar, pulsa ese botón o la tecla E. Mapa y Guiarme te llevan a los demás lugares.', 'explored'],
];
export class Onboarding {
  constructor(root) {
    this.root = root;
    this.index = 0;
    root.querySelector('button').onclick = () => this.finish();
  }
  start(force = false) {
    let done = false;
    try { done = localStorage.getItem(KEY) === 'done'; } catch {}
    if (done && !force) return;
    this.index = 0;
    this.render();
  }
  observe(events) {
    if (this.root.hidden || !events[steps[this.index]?.[2]]) return;
    if (++this.index === steps.length) this.finish(); else this.render();
  }
  render() {
    this.root.hidden = false;
    this.root.querySelector('small').textContent = `APRENDE JUGANDO · ${this.index + 1} / ${steps.length}`;
    this.root.querySelector('strong').textContent = steps[this.index][0];
    this.root.querySelector('p').textContent = steps[this.index][1];
  }
  finish() {
    this.root.hidden = true;
    try { localStorage.setItem(KEY, 'done'); } catch {}
  }
}
