// Filtering, searching and the spoiler rule. The spoiler setting hides the
// name and description of a story trophy until it is earned — the trophy
// still shows in the list (so the count stays honest), but as a masked row.
export function visibleTrophies(doc, state) {
  const q = state.search.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (state.kind === 'missable') {
      if (!t.missable) return false;
    } else if (state.kind !== 'all' && t.kind !== state.kind) {
      return false;
    }
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.name)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function isSpoilerMasked(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.name);
}

export function displayName(trophy, state) {
  return isSpoilerMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoilerMasked(trophy, state)
    ? 'Hidden until earned — tick it off to reveal the name and description.'
    : trophy.description;
}
