// Frontera de persistencia: valida forma e IDs y migra nombres del formato v1.
export function restoreProgress(raw, locations, contentIds) {
 const data = raw && typeof raw === 'object' ? raw : {};
 const list = value => Array.isArray(value) ? value : [];
 const names = new Map(Object.entries(locations).map(([id,l]) => [l.name,id]));
 const visited = list(data.visited).map(v => Object.hasOwn(locations,v) ? v : names.get(v)).filter(Boolean);
 return { discovered:new Set(visited), answered:new Set(list(data.answers).filter(id => contentIds.includes(id))) };
}
export function serializeProgress(state) {
 return { version:2, visited:[...state.discovered], answers:[...state.answered] };
}
