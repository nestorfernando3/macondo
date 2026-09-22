// Panel compartido por el pueblo y la alternativa sin WebGL.
export class StoryInteraction {
  constructor(root, { preview = () => {}, speech = globalThis.speechSynthesis,
    utterance = text => new SpeechSynthesisUtterance(text) } = {}) {
    this.root = root; this.preview = preview; this.speech = speech; this.utterance = utterance;
    this.speaking = false;
  }
  stop() { this.currentClip = null; if (this.speaking) this.speech?.cancel(); this.speaking = false; }
  clear() { this.stop(); this.root.replaceChildren(); this.currentText = null; this.seen = new Set(); this.labels = {}; }
  render(story, resolved) {
    this.clear(); this.story = story;
    if (resolved) return;
    let garden;
    if (story.kind === 'observation') {
      garden = document.createElement('div'); garden.className = 'story-garden'; garden.setAttribute('aria-hidden','true');
      for (const [name,text] of [['tree',''],['bench','☾'],['petals','· · · ·']]) {
        const part = document.createElement('span'); part.className = name; part.textContent = text; garden.append(part);
      }
      this.root.append(garden);
    }
    if (story.views) {
      const caption = document.createElement('p'); caption.setAttribute('role','status');
      caption.textContent = 'Elige una versión para leerla.';
      const buttons = [];
      for (const view of story.views) {
        const button = document.createElement('button'); button.textContent = view.label;
        button.setAttribute('aria-pressed','false');
        button.onclick = () => {
          this.stop(); this.seen.add(view.id); this.currentText = view.text;
          caption.textContent = view.text;
          if (garden) garden.classList.toggle('rainy', view.id === 'lluvia');
          buttons.forEach(b => b.setAttribute('aria-pressed',String(b === button)));
          if (view.effectId) this.preview(story.id, view.effectId);
        };
        buttons.push(button); this.root.append(button);
      }
      this.root.append(caption);
      if (story.kind === 'versions') {
        const listen = document.createElement('button'); listen.textContent = 'Escuchar versión';
        listen.disabled = !this.speech;
        listen.onclick = () => {
          if (!this.currentText) { caption.textContent = 'Elige primero una versión.'; return; }
          this.stop(); const clip = this.utterance(this.currentText); clip.lang = 'es-CO';
          this.currentClip = clip;
          clip.onend = clip.onerror = () => { if (this.currentClip === clip) { this.speaking = false; this.currentClip = null; } };
          this.speaking = true;
          try { this.speech.speak(clip); } catch { this.speaking = false; }
        };
        const stop = document.createElement('button'); stop.textContent = 'Detener voz'; stop.onclick = () => this.stop();
        this.root.append(listen, stop);
        const note = document.createElement('p'); note.textContent = 'Texto completo siempre disponible. Voz opcional del dispositivo.'; this.root.append(note);
      }
    }
    for (const object of story.objects || []) {
      const label = document.createElement('label'); label.textContent = object.description;
      const select = document.createElement('select');
      select.append(new Option('Elige una etiqueta', ''));
      for (const item of story.objects) select.append(new Option(item.id, item.id));
      select.onchange = () => { this.labels[object.id] = select.value; };
      label.append(select); this.root.append(label);
    }
  }
  ready() {
    if (this.story.views && this.seen.size !== this.story.views.length) return 'Mira las dos versiones antes de conservar un detalle.';
    if (this.story.objects?.some(o => this.labels[o.id] !== o.id)) return 'Revisa las etiquetas: la llave abre, la jarra sirve agua y el carrete guarda hilo.';
    return '';
  }
}
