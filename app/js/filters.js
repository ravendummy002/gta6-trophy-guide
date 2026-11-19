// Filtering for the checklist: text search, kind, grade, missable-only and
// unearned-only, plus the spoiler rule — when spoilers are hidden, a hidden
// trophy the player has not earned yet shows masked, never by name.
export function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/…/g, '...');
}

export function isMasked(trophy, state) {
  return state.settings.spoilers && trophy.hidden && !state.earned.includes(trophy.id);
}

export function applyFilters(trophies, state, query) {
  const q = normalizeText(query.search.trim());
  return trophies.filter((t) => {
    if (query.kind !== 'all' && t.kind !== query.kind) return false;
    if (query.grade !== 'all' && t.grade !== query.grade) return false;
    if (query.missableOnly && !t.missable) return false;
    if (query.unearnedOnly && state.earned.includes(t.id)) return false;
    if (q) {
      const hay = normalizeText(`${t.name} ${t.description} ${t.guide}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortForChecklist(trophies) {
  // Platinum first, then gold, silver, bronze; within a grade, by list order.
  const rank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  return [...trophies].sort((a, b) => rank[a.grade] - rank[b.grade] || a.id - b.id);
}
