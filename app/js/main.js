// Boots the guide: loads the trophy list, restores saved progress and
// settings, wires the filters, the tabs (hash routing) and export/import,
// and re-renders on every change. No network at run time beyond the app's
// own files; the guide works with the network off.
import { loadTrophies } from './data.js';
import { loadProgress, saveProgress, loadSettings, saveSettings, serializeExport, parseImport } from './store.js';
import { renderProgress, renderChecklist, renderDetail, renderPlanner, renderRoadmap, renderMissables } from './views.js';

const doc = await loadTrophies();
const progress = loadProgress();
const settings = loadSettings();

const state = {
  earned: progress.earned,
  notes: progress.notes,
  spoiler: settings.spoiler,
  hideEarned: settings.hideEarned,
  kind: 'all',
  grade: 'all',
  search: '',
  selectedId: null,
  tab: 'checklist',
};

function persist() {
  saveProgress({ earned: state.earned, notes: state.notes });
  saveSettings({ spoiler: state.spoiler, hideEarned: state.hideEarned });
}

function renderAll() {
  renderProgress(doc, state.earned);
  document.querySelectorAll('.tabs a').forEach((a) => {
    a.classList.toggle('active', a.dataset.tab === state.tab);
  });
  document.getElementById('view-checklist').hidden = state.tab !== 'checklist';
  document.getElementById('view-roadmap').hidden = state.tab !== 'roadmap';
  document.getElementById('view-missables').hidden = state.tab !== 'missables';
  document.getElementById('toolbar').style.display = state.tab === 'checklist' ? '' : 'none';
  if (state.tab === 'checklist') {
    renderChecklist(doc, state, selectTrophy, toggleEarned);
    renderDetail(doc, state, toggleEarned, saveNote);
    renderPlanner(doc, state, selectTrophy);
  } else if (state.tab === 'roadmap') {
    renderRoadmap(doc, state, selectTrophy);
  } else {
    renderMissables(doc, state, selectTrophy);
  }
}

function selectTrophy(id) {
  state.selectedId = id;
  state.tab = 'checklist';
  location.hash = '#/checklist';
  renderAll();
  document.getElementById('detail-col')?.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(trophy) {
  if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
  else state.earned.add(trophy.name);
  persist();
  renderAll();
}

function saveNote(trophy, text) {
  if (text.trim()) state.notes[trophy.name] = text;
  else delete state.notes[trophy.name];
  persist();
}

function route() {
  const hash = location.hash || '#/checklist';
  const tab = hash.replace(/^#\//, '').split('/')[0];
  state.tab = ['checklist', 'roadmap', 'missables'].includes(tab) ? tab : 'checklist';
  renderAll();
}

// Filters and search.
document.getElementById('search').addEventListener('input', (e) => {
  state.search = e.target.value;
  renderAll();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.grade = e.target.value;
  renderAll();
});
document.getElementById('hide-earned').addEventListener('change', (e) => {
  state.hideEarned = e.target.checked;
  persist();
  renderAll();
});
document.getElementById('spoiler').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  persist();
  renderAll();
});
document.getElementById('kind-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-kind]');
  if (!btn) return;
  state.kind = btn.dataset.kind;
  document.querySelectorAll('#kind-filters button').forEach((b) => {
    b.classList.toggle('active', b === btn);
  });
  renderAll();
});

// Export, import, reset.
document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([serializeExport({ earned: state.earned, notes: state.notes },
    { spoiler: state.spoiler, hideEarned: state.hideEarned })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const { progress: imported, settings: importedSettings } = parseImport(await file.text());
    state.earned = imported.earned;
    state.notes = imported.notes;
    state.spoiler = importedSettings.spoiler;
    state.hideEarned = importedSettings.hideEarned;
    document.getElementById('spoiler').checked = state.spoiler;
    document.getElementById('hide-earned').checked = state.hideEarned;
    persist();
    renderAll();
  } catch {
    alert('That file is not a Leonida Platinum progress export.');
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear every tick, note and setting?')) return;
  state.earned = new Set();
  state.notes = {};
  state.spoiler = false;
  state.hideEarned = false;
  document.getElementById('spoiler').checked = false;
  document.getElementById('hide-earned').checked = false;
  persist();
  renderAll();
});

// Restore settings into the controls, pick a first trophy to show, and go.
document.getElementById('spoiler').checked = state.spoiler;
document.getElementById('hide-earned').checked = state.hideEarned;
if (state.selectedId === null) {
  const open = doc.trophies.filter((t) => !state.earned.has(t.name))
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  state.selectedId = open[0]?.id ?? doc.trophies[0].id;
}
window.addEventListener('hashchange', route);
route();
