// Frontera de persistencia de historias: valida forma, IDs y límite de escritura.
// Guarda solo IDs y texto propio necesario; un dato corrupto se descarta, no rompe la sesión.
import { MAX_WRITING } from '../data/stories.js';

export function restoreHistorias(raw, stories) {
 const byId = new Map(stories.map(s => [s.id, s]));
 const data = raw && typeof raw === 'object' ? raw : {};
 const src = data.results && typeof data.results === 'object' ? data.results : {};
 const results = {};
 for (const [storyId, r] of Object.entries(src)) {
  const story = byId.get(storyId);
  if (!story || !r || typeof r !== 'object') continue;
  const outcome = story.outcomes.find(o => o.id === r.outcomeId);
  if (!outcome) continue;
  const text = story.kind === 'writing' && typeof r.text === 'string' ? r.text.slice(0, MAX_WRITING) : '';
  results[storyId] = { storyId, encounterId:story.encounterId, locationId:story.locationId, outcomeId:outcome.id, text };
 }
 return { results };
}
export function serializeHistorias(state) {
 return { version:1, results:{ ...state.results } };
}
