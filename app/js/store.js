// Saved progress: earned trophies, per-trophy notes and settings, kept in
// localStorage under one key. Export writes the same shape to a JSON file;
// import reads one back and validates every id against the trophy list.
export const STORAGE_KEY = 'leonida-trophy-atlas-v1';

export function blankState() {
  return { earned: [], notes: {}, settings: { spoilers: false } };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const state = blankState();
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((n) => Number.isInteger(n));
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    if (parsed.settings && typeof parsed.settings === 'object') {
      state.settings = { ...state.settings, ...parsed.settings };
    }
    return state;
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): the app still works in memory.
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  if (isEarned(state, id)) state.earned = state.earned.filter((n) => n !== id);
  else state.earned.push(id);
  saveState(state);
}

export function setNote(state, id, text) {
  if (text.trim() === '') delete state.notes[String(id)];
  else state.notes[String(id)] = text;
  saveState(state);
}

export function exportFileName() {
  const day = new Date().toISOString().slice(0, 10);
  return `leonida-trophy-atlas-progress-${day}.json`;
}

export function exportJson(state) {
  return JSON.stringify(
    {
      app: 'leonida-trophy-atlas',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: [...state.earned].sort((a, b) => a - b),
      notes: state.notes,
      settings: state.settings,
    },
    null,
    2,
  );
}

export function downloadExport(state) {
  const blob = new Blob([exportJson(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Parses an imported file's text. Returns { state } or { error }.
export function parseImport(text, validIds) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'That file does not look like a Leonida Trophy Atlas export.' };
  }
  const ids = new Set(validIds);
  const earned = Array.isArray(parsed.earned)
    ? parsed.earned.filter((n) => Number.isInteger(n) && ids.has(n))
    : [];
  const notes = {};
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [key, value] of Object.entries(parsed.notes)) {
      const id = Number(key);
      if (ids.has(id) && typeof value === 'string') notes[key] = value;
    }
  }
  const state = blankState();
  state.earned = earned;
  state.notes = notes;
  if (parsed.settings && typeof parsed.settings === 'object') {
    state.settings = { ...state.settings, ...parsed.settings };
  }
  return { state, imported: earned.length };
}
