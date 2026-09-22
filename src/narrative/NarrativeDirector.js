// Director narrativo pequeño: un único encuentro activo a la vez.
// Estados: idle → invited (proximidad) → active (panel) → resolved (resultado).
// Acercarse solo invita; abrir es voluntario. Resolver es idempotente y una
// elección distinta reemplaza el resultado (no acumula). Cerrar desde cualquier
// estado devuelve el control. Emite callbacks simples; no toca DOM ni Three.js.
import { MAX_WRITING } from '../data/stories.js';

export class NarrativeDirector {
  constructor(stories, hooks = {}) {
    this.stories = new Map(stories.map(s => [s.id, s]));
    this.hooks = hooks;            // onOpen(story,{resolved}) · onResolve(story,result) · onClose(story|null)
    this.state = 'idle';           // idle | invited | active | resolved
    this.active = null;
    this.results = {};             // storyId → { storyId, encounterId, locationId, outcomeId, text }
  }

  restore(results) { this.results = { ...(results || {}) }; }
  resultOf(storyId) { return this.results[storyId] || null; }
  storyFor(encounterId) {
    for (const s of this.stories.values()) if (s.encounterId === encounterId) return s;
    return null;
  }

  // Proximidad: solo marca la invitación; nunca abre UI ni bloquea el paso.
  invite(storyId) {
    const story = this.stories.get(storyId);
    if (!story) return false;
    if (this.state === 'active' || this.state === 'resolved') return false;
    this.active = story; this.state = 'invited';
    return true;
  }

  // El jugador actuó (E, clic, botón): abre la escena desde cualquier estado previo.
  open(storyId) {
    const story = this.stories.get(storyId);
    if (!story) return false;
    if (['active','resolved'].includes(this.state) && this.active?.id !== storyId) this.close(); // un encuentro a la vez
    this.active = story; this.state = 'active';
    this.hooks.onOpen?.(story, { resolved:this.results[storyId] || null });
    return true;
  }

  // Acción declarada (choice) → resuelve. Devuelve el resultado o null.
  choose(actionId) {
    const story = this.active;
    if (!story || !['active','resolved'].includes(this.state)) return null;
    const action = story.actions.find(a => a.id === actionId);
    if (!action) return null;
    return this.resolve(action.outcomeId);
  }

  // Resolución idempotente: resultado idéntico no re-dispara; otro outcome lo reemplaza.
  resolve(outcomeId, text = '') {
    const story = this.active;
    if (!story || !['active','resolved'].includes(this.state)) return null;
    const outcome = story.outcomes.find(o => o.id === outcomeId);
    if (!outcome) return null;
    const clean = story.kind === 'writing' && text ? String(text).slice(0, MAX_WRITING) : '';
    const previous = this.results[story.id];
    const result = { storyId:story.id, encounterId:story.encounterId, locationId:story.locationId, outcomeId:outcome.id, text:clean };
    this.state = 'resolved';
    if (previous && previous.outcomeId === result.outcomeId && previous.text === clean) return result;
    this.results[story.id] = result;
    this.hooks.onResolve?.(story, result, previous);
    return result;
  }

  // Cerrar desde cualquier estado devuelve el control.
  close() {
    const story = this.active;
    this.active = null; this.state = 'idle';
    this.hooks.onClose?.(story || null);
  }
}
