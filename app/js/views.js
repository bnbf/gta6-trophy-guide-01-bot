// Renders every view of the guide: the header progress, the checklist with
// its detail pane and Next-up planner, the roadmap stages and the missables
// page. All text comes from the trophy data; nothing here fetches the
// network — the only links out are the source links the reader follows.
import { STAGES, KIND_LABELS, trophyById, nextUp } from './data.js';
import { visibleTrophies, isSpoilerMasked, displayName, displayDescription } from './filters.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function medal(grade) {
  const dot = el('span', `medal ${grade}`);
  dot.title = grade;
  return dot;
}

export function renderProgress(doc, earned) {
  const total = doc.trophies.length;
  const done = doc.trophies.filter((t) => earned.has(t.name)).length;
  document.getElementById('earned-count').textContent = done;
  document.getElementById('progress-fill').style.width = `${(done / total) * 100}%`;
  document.getElementById('progress-note').textContent =
    `${Math.round((done / total) * 100)}% toward the platinum — ${total - done} to go`;
  const chips = document.getElementById('grade-chips');
  chips.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = doc.trophies.filter((t) => t.grade === grade).length;
    const got = doc.trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
    const span = el('span', null, ` ${got}/${all} ${grade}  `);
    span.prepend(medal(grade));
    chips.append(span);
  }
}

export function renderChecklist(doc, state, onSelect, onToggle) {
  const list = document.getElementById('trophy-list');
  const shown = visibleTrophies(doc, state);
  document.getElementById('list-meta').textContent =
    `Showing ${shown.length} of ${doc.trophies.length} trophies` +
    (state.spoiler ? ' · spoiler-free is on: story trophies stay hidden until earned' : '');
  list.replaceChildren();
  for (const t of shown) {
    const li = el('li');
    if (state.earned.has(t.name)) li.classList.add('earned');
    if (state.selectedId === t.id) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', (e) => { e.stopPropagation(); onToggle(t); });
    const body = el('div');
    const masked = isSpoilerMasked(t, state);
    const name = el('div', 'trophy-name', displayName(t, state));
    if (masked) name.append(el('span', 'hidden-tag', ' — hidden'));
    body.append(name);
    body.append(el('div', 'trophy-desc', displayDescription(t, state)));
    const meta = el('div', 'trophy-meta');
    meta.append(el('span', 'tag', KIND_LABELS[t.kind]));
    if (t.missable) meta.append(el('span', 'tag missable', 'Missable'));
    if (masked) meta.append(el('span', 'tag spoilered', 'Spoiler hidden'));
    body.append(meta);
    const gradeCell = el('div', 'grade-cell');
    gradeCell.append(medal(t.grade));
    gradeCell.append(document.createTextNode(t.grade));
    li.append(box, body, gradeCell);
    // A click on the checkbox itself must not select the row: selecting
    // re-renders the list, which would destroy the checkbox before its
    // change event fires and the tick would be lost.
    li.addEventListener('click', (e) => {
      if (e.target.closest('input, button, a, select, textarea')) return;
      onSelect(t.id);
    });
    list.append(li);
  }
}

export function renderDetail(doc, state, onToggle, onNote) {
  const pane = document.getElementById('detail');
  const t = trophyById(doc, state.selectedId);
  pane.replaceChildren();
  if (!t) {
    pane.append(el('h2', null, 'Pick a trophy'));
    pane.append(el('p', null, 'Click any trophy in the list to read its guide, its sources and when it can be missed.'));
    return;
  }
  const masked = isSpoilerMasked(t, state);
  pane.append(el('h2', null, displayName(t, state)));
  const sub = el('p', 'trophy-meta');
  sub.append(medal(t.grade));
  sub.append(document.createTextNode(` ${t.grade} · ${KIND_LABELS[t.kind]}`));
  if (t.missable) sub.append(document.createTextNode(' · Missable'));
  pane.append(sub);
  pane.append(el('p', 'trophy-desc', displayDescription(t, state)));
  if (t.missable) {
    const note = el('p', 'missable-note',
      'Missable: this trophy is flagged because its description reads like a one-time moment. Do it when the chance comes — the game released on 2026-11-19 and the exact trigger is not yet confirmed by any guide.');
    pane.append(note);
  }
  if (!masked) {
    pane.append(el('p', 'guide', t.guide));
    const src = el('p', 'sources');
    src.append(el('b', null, 'Sources: '));
    const labels = t.sources.map((key) => doc.sources[key] ?? key);
    src.append(document.createTextNode(labels.join(' · ')));
    pane.append(src);
    const links = el('p', 'sources');
    links.append(el('b', null, 'Official list: '));
    for (const [key, url] of Object.entries(doc.sourceUrls ?? {})) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = key === 'exophase' ? 'Exophase' : 'PSNProfiles';
      links.append(a, document.createTextNode('  '));
    }
    pane.append(links);
  } else {
    pane.append(el('p', 'guide', 'Earn this trophy to reveal its guide.'));
  }
  const label = el('label', null, 'Your note');
  const area = document.createElement('textarea');
  area.value = state.notes[t.name] ?? '';
  area.placeholder = 'e.g. “Found the range behind the mall — gold on the third try.”';
  area.addEventListener('input', () => onNote(t, area.value));
  label.append(area);
  pane.append(label);
  const btn = el('button', `earn-btn${state.earned.has(t.name) ? ' earned' : ''}`,
    state.earned.has(t.name) ? '✓ Earned — click to untick' : 'Mark earned');
  btn.type = 'button';
  btn.addEventListener('click', () => onToggle(t));
  pane.append(btn);
}

export function renderPlanner(doc, state, onSelect) {
  const box = document.getElementById('planner');
  box.replaceChildren();
  box.append(el('h2', null, 'Next up'));
  const next = nextUp(doc, state.earned);
  if (!next) {
    box.append(el('p', null, 'All 55 earned — Leonida Legend. The platinum is yours.'));
    return;
  }
  const stage = STAGES.find((s) => s.n === next.stage);
  const p = el('p');
  p.append(document.createTextNode(`Stage ${next.stage} · ${stage.title}: `));
  const name = el('span', 'next-name', next.name);
  p.append(name);
  box.append(p);
  box.append(el('p', null, next.description));
  const btn = el('button', 'earn-btn', 'Open its guide');
  btn.type = 'button';
  btn.addEventListener('click', () => onSelect(next.id));
  box.append(btn);
}

export function renderRoadmap(doc, state, onSelect) {
  const host = document.getElementById('roadmap');
  host.replaceChildren();
  for (const stage of STAGES) {
    const items = doc.trophies.filter((t) => t.stage === stage.n);
    const done = items.filter((t) => state.earned.has(t.name)).length;
    const card = el('section', 'stage');
    const h = el('h2', null, `Stage ${stage.n} — ${stage.title}`);
    h.append(el('span', 'stage-count', `${done}/${items.length} earned`));
    card.append(h);
    card.append(el('p', null, stage.blurb));
    const ul = el('ul');
    for (const t of items) {
      const li = el('li');
      if (state.earned.has(t.name)) li.classList.add('done');
      li.append(medal(t.grade));
      const name = el('span', null, t.name);
      li.append(name);
      if (t.missable) li.append(el('span', 'tag missable', 'Missable'));
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => onSelect(t.id));
      ul.append(li);
    }
    card.append(ul);
    host.append(card);
  }
}

export function renderMissables(doc, state, onSelect) {
  const host = document.getElementById('missables');
  host.replaceChildren();
  document.getElementById('missable-badge').textContent =
    String(doc.trophies.filter((t) => t.missable).length);
  for (const t of doc.trophies.filter((x) => x.missable)) {
    const card = el('article', 'missable-card');
    const h = el('h2', null, t.name);
    h.prepend(medal(t.grade));
    card.append(h);
    card.append(el('p', 'why', 'Flagged missable — one-time moment, from the official description'));
    card.append(el('p', 'trophy-desc', t.description));
    card.append(el('p', 'guide', t.guide));
    const btn = el('button', 'earn-btn', state.earned.has(t.name) ? '✓ Earned' : 'Open in checklist');
    btn.type = 'button';
    btn.addEventListener('click', () => onSelect(t.id));
    card.append(btn);
    host.append(card);
  }
}
