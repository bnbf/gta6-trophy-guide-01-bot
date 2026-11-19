// Saved progress: the earned set, per-trophy notes and the spoiler and
// hide-earned settings, all in localStorage, all exportable to a file and
// importable back. Nothing leaves the browser except through export.
const PROGRESS_KEY = 'leonida-platinum-progress-v1';
const SETTINGS_KEY = 'leonida-platinum-settings-v1';

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
    return {
      earned: new Set(Array.isArray(raw.earned) ? raw.earned : []),
      notes: (raw.notes && typeof raw.notes === 'object') ? raw.notes : {},
    };
  } catch {
    return { earned: new Set(), notes: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({
    earned: [...progress.earned],
    notes: progress.notes,
  }));
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return {
      spoiler: raw.spoiler === true,
      hideEarned: raw.hideEarned === true,
    };
  } catch {
    return { spoiler: false, hideEarned: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function serializeExport(progress, settings) {
  return JSON.stringify({
    app: 'leonida-platinum',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...progress.earned],
    notes: progress.notes,
    settings,
  }, null, 2);
}

export function parseImport(text) {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object') throw new Error('not an object');
  const earned = new Set(Array.isArray(raw.earned) ? raw.earned.filter((n) => typeof n === 'string') : []);
  const notes = (raw.notes && typeof raw.notes === 'object') ? raw.notes : {};
  const settings = {
    spoiler: raw.settings?.spoiler === true,
    hideEarned: raw.settings?.hideEarned === true,
  };
  return { progress: { earned, notes }, settings };
}
