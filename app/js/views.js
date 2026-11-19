// Views: everything the user sees — the checklist table, the guide detail
// pane, the roadmap stages, the missables page and the about page. All markup
// is built with DOM calls (no innerHTML from data), so trophy text can never
// inject markup.
import { GRADE_LABELS, GRADE_ORDER, KINDS, ROADMAP, trophyById, trophyPoints } from './data.js';
import { isEarned, setNote, toggleEarned } from './store.js';
import { applyFilters, isMasked, sortForChecklist } from './filters.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  if (grade === 'missable') return missableBadge();
  return el('span', `badge ${grade}`, GRADE_LABELS[grade]);
}

function missableBadge() {
  return el('span', 'badge missable', 'Missable');
}

export function renderProgress(doc, state) {
  const earned = doc.trophies.filter((t) => isEarned(state, t.id));
  document.getElementById('earned-count').textContent = String(earned.length);
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${(earned.length / doc.trophies.length) * 100}%`;
  document.getElementById('progress-bar-wrap').setAttribute('aria-valuenow', String(earned.length));
  const counts = GRADE_ORDER.map((g) => {
    const total = doc.trophies.filter((t) => t.grade === g).length;
    const got = earned.filter((t) => t.grade === g).length;
    return `${GRADE_LABELS[g]} ${got}/${total}`;
  }).join(' · ');
  document.getElementById('grade-counts').textContent = counts;
  const points = earned.reduce((sum, t) => sum + trophyPoints(t), 0);
  const maxPoints = doc.trophies.reduce((sum, t) => sum + trophyPoints(t), 0);
  document.getElementById('points-line').textContent =
    `${points} of ${maxPoints} PSN trophy points · 55 trophies · 28 hidden · 0 online`;
}

export function renderChecklist(doc, state, query, selectedId, onSelect) {
  const rows = document.getElementById('rows');
  rows.replaceChildren();
  const visible = sortForChecklist(applyFilters(doc.trophies, state, query));
  document.getElementById('result-line').textContent =
    `Showing ${visible.length} of ${doc.trophies.length} trophies` +
    (state.settings.spoilers ? ' · story spoilers hidden (unearned hidden trophies are masked)' : '');
  for (const t of visible) {
    const tr = document.createElement('tr');
    if (t.id === selectedId) tr.classList.add('selected');
    if (isEarned(state, t.id)) tr.classList.add('earned-row');
    const masked = isMasked(t, state);

    const tdCheck = el('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t.id);
    box.setAttribute('aria-label', `Mark ${masked ? 'hidden trophy' : t.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      toggleEarned(state, t.id);
      onSelect(t.id, { keepSelection: true });
    });
    tdCheck.append(box);

    const tdName = el('td');
    const name = el('div', masked ? 'trophy-name masked' : 'trophy-name', masked ? 'Hidden trophy' : t.name);
    const desc = el('div', masked ? 'trophy-desc masked' : 'trophy-desc',
      masked ? 'Earn this trophy to reveal its name and description.' : t.description);
    tdName.append(name, desc);
    if (t.missable) tdName.append(gradeBadge('missable'));
    if (t.hidden && !masked) tdName.append(el('span', 'badge hidden', 'Hidden'));

    const tdGrade = el('td');
    tdGrade.append(gradeBadge(t.grade));
    const tdKind = el('td', 'kind-label', KINDS[t.kind] ?? t.kind);

    tr.append(tdCheck, tdName, tdGrade, tdKind);
    tr.addEventListener('click', () => onSelect(t.id, { keepSelection: true }));
    rows.append(tr);
  }
  if (visible.length === 0) {
    const tr = document.createElement('tr');
    const td = el('td', null, 'No trophies match these filters. Clear the search or widen the filters.');
    td.colSpan = 4;
    tr.append(td);
    rows.append(tr);
  }
}

export function renderDetail(doc, state, selectedId, onChanged) {
  const pane = document.getElementById('detail');
  pane.replaceChildren();
  const t = selectedId == null ? null : trophyById(doc, selectedId);
  if (!t) {
    pane.append(el('p', 'detail-empty', 'Select a trophy on the left to read its guide, sources and notes.'));
    return;
  }
  const masked = isMasked(t, state);
  const earned = isEarned(state, t.id);

  const head = el('div');
  head.append(gradeBadge(t.grade));
  if (t.missable) head.append(gradeBadge('missable'));
  if (t.hidden) head.append(el('span', 'badge hidden', 'Hidden'));
  pane.append(head);
  pane.append(el('h2', null, masked ? 'Hidden trophy' : t.name));
  pane.append(el('p', 'detail-desc', masked
    ? 'This trophy is hidden on PlayStation until earned. Turn the spoiler setting off to see its name and description, or earn it to reveal it here.'
    : t.description));

  const meta = el('p', 'detail-meta');
  meta.append(
    document.createTextNode(`Kind: ${KINDS[t.kind] ?? t.kind} · `),
    document.createTextNode(`Xbox: ${t.gamerscore ?? 0}G`),
  );
  if (t.target) meta.append(document.createTextNode(` · Target: ${t.target}`));
  pane.append(meta);

  if (t.missable && !masked) {
    const warn = el('div', 'warning');
    const b = el('b', null, 'Missable. ');
    warn.append(b, document.createTextNode(
      'One meditation spot — Lucia\u2019s balcony in Chapter 1 — disappears after that chapter ends. Meditate there before finishing Chapter 1 and keep a manual save at the start of every chapter.'));
    pane.append(warn);
  }

  if (!masked) {
    pane.append(el('h3', null, 'Guide'));
    pane.append(el('p', 'guide-text', t.guide));
    pane.append(el('h3', null, 'Sources'));
    const list = el('ul', 'sources');
    for (const key of t.src ?? []) {
      const source = doc.sources[key];
      if (!source) continue;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = source.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = source.name;
      li.append(a);
      list.append(li);
    }
    const own = document.createElement('li');
    own.textContent = 'Guide text: our own words, written for this entry from the official description; methods early guides have not confirmed are marked as unconfirmed, never guessed.';
    list.append(own);
    pane.append(list);
  }

  const noteLabel = el('label', 'note-label', 'Your notes (saved in this browser)');
  const note = document.createElement('textarea');
  note.className = 'note-box';
  note.value = state.notes[String(t.id)] ?? '';
  note.placeholder = 'Where you found it, what worked, what to try next…';
  note.addEventListener('input', () => setNote(state, t.id, note.value));
  noteLabel.append(note);
  pane.append(noteLabel);

  const toggle = el('button', 'earned-toggle', earned ? '✓ Earned — click to unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    toggleEarned(state, t.id);
    onChanged();
  });
  pane.append(toggle);
}

export function renderRoadmap(doc, state, onSelect) {
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  const next = document.getElementById('nextup');
  next.replaceChildren();

  // Next up: the first unearned trophy in roadmap order.
  let nextTrophy = null;
  for (const stage of ROADMAP) {
    nextTrophy = stage.ids.map((id) => trophyById(doc, id)).find((t) => t && !isEarned(state, t.id));
    if (nextTrophy) break;
  }
  if (nextTrophy) {
    next.append(el('h2', null, 'Up next'));
    const p = el('p');
    p.append(
      document.createTextNode('The next trophy in roadmap order is '),
      el('span', 'nextup-name', nextTrophy.name),
      document.createTextNode(` — ${nextTrophy.description} Select it in the checklist to read its guide.`),
    );
    next.append(p);
  } else {
    next.append(el('h2', null, 'Up next'));
    next.append(el('p', null, 'Every trophy is earned. Vice Got a Price! is yours — congratulations, Leonida Legend.'));
  }

  for (const [index, stage] of ROADMAP.entries()) {
    const card = el('div', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h2', null, stage.title));
    const done = stage.ids.filter((id) => isEarned(state, id)).length;
    head.append(el('span', 'stage-count', `${done} of ${stage.ids.length} earned`));
    card.append(head);
    card.append(el('p', null, stage.blurb));
    const bar = el('div', 'progress-bar');
    const fill = el('div', 'progress-fill');
    fill.style.width = `${(done / stage.ids.length) * 100}%`;
    bar.append(fill);
    card.append(bar);
    const list = el('ul', 'stage-trophies');
    for (const id of stage.ids) {
      const t = trophyById(doc, id);
      if (!t) continue;
      const li = el('li');
      const got = isEarned(state, id);
      if (got) li.classList.add('done');
      const tick = el('span', 'tick', got ? '✓' : '○');
      li.append(tick, document.createTextNode(` ${t.name} `));
      li.append(gradeBadge(t.grade));
      if (t.missable) li.append(gradeBadge('missable'));
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => onSelect(id));
      list.append(li);
    }
    card.append(list);
    wrap.append(card);
    void index;
  }
}

export function renderMissables(doc, state, onSelect) {
  const wrap = document.getElementById('missables');
  wrap.replaceChildren();

  const save = el('div', 'save-box');
  save.append(el('h2', null, 'Save early, save often'));
  const intro = el('p', null, 'GTA VI has no mission replay and no New Game Plus, so a manual save is the only way back. Early guides agree on this routine:');
  save.append(intro);
  const list = document.createElement('ul');
  for (const tip of [
    'Keep a manual save at the start of every chapter (1–4) and one before the final mission.',
    'Meditate at Lucia\u2019s balcony spot in Chapter 1 before that chapter ends — it is the one missable step on the list.',
    'Never turn on a cheat while chasing trophies: cheats disable trophies (and saving).',
    'Everything else on the list is earned in free roam or through the story, so it can be cleaned up after the credits.',
  ]) {
    const li = document.createElement('li');
    li.textContent = tip;
    list.append(li);
  }
  save.append(list);
  const cite = el('p', null, 'Sources: Output Lag (no mission replay; the Chapter 1 balcony spot), KeenGamer and GTA Vibes (one potentially missable trophy), PowerPyx via Planet GTA 6 (cheats disable trophies).');
  save.append(cite);
  wrap.append(save);

  const missable = doc.trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = el('div', 'miss-card');
    const head = el('div');
    head.append(gradeBadge(t.grade), gradeBadge('missable'));
    card.append(head);
    card.append(el('h2', null, t.name));
    card.append(el('p', null, t.description));
    card.append(el('p', 'guide-text', t.guide));
    const btn = el('button', null, 'Open in checklist');
    btn.type = 'button';
    btn.addEventListener('click', () => onSelect(t.id));
    card.append(btn);
    wrap.append(card);
  }

  const note = el('div', 'save-box');
  note.append(el('h2', null, 'What about the rest?'));
  note.append(el('p', null, 'Every other trophy is earned through the story (unmissable as you play) or in free roam after the story, so none of them can be missed. Planet GTA 6 notes the game is only days old and no reliable missable list exists yet — this page will stay honest about that: one flagged missable, the rest safe, and manual saves as the safety net.'));
  wrap.append(note);
}

export function renderAbout(doc) {
  const wrap = document.getElementById('about');
  wrap.replaceChildren();

  wrap.append(el('h2', null, 'How this guide works'));
  wrap.append(el('p', null, 'Leonida Trophy Atlas is a static web app: open index.html in a desktop browser and it works with the network off. Your checklist progress, notes and settings are saved in this browser (localStorage) and never leave it. Export writes them to a JSON file you can back up or move to another browser; import reads one back.'));
  wrap.append(el('p', null, 'The spoiler setting hides the names and descriptions of the 28 hidden trophies until you earn them — the story trophies stay secret while you play. Turn it off any time to see the full list.'));

  wrap.append(el('h2', null, 'The list at a glance'));
  const table = document.createElement('table');
  const head = document.createElement('tr');
  head.append(el('th', null, 'Grade'), el('th', null, 'Trophies'), el('th', null, 'Xbox Gamerscore'));
  table.append(head);
  for (const g of GRADE_ORDER) {
    const row = document.createElement('tr');
    const items = doc.trophies.filter((t) => t.grade === g);
    row.append(
      el('td', null, GRADE_LABELS[g]),
      el('td', null, String(items.length)),
      el('td', null, `${items.reduce((s, t) => s + (t.gamerscore ?? 0), 0)}G`),
    );
    table.append(row);
  }
  const total = document.createElement('tr');
  total.append(el('td', null, 'Total'), el('td', null, '55'), el('td', null, '1,000G'));
  table.append(total);
  wrap.append(table);
  wrap.append(el('p', null, '28 trophies are hidden on PlayStation until earned, including all 12 story trophies. None of the 55 needs online play. Early guides estimate about 200 hours to the platinum (Push Square says up to 300 or more) at a difficulty of roughly 4 out of 10 — long, not hard.'));

  wrap.append(el('h2', null, 'Sources'));
  wrap.append(el('p', null, 'Names, descriptions, grades and PSN counts come from the official list as published on Exophase and PSNProfiles, which agree on every name, description and grade. Counts (250 stunts, 42 Shooting Range challenges, 18 meditation spots and the rest) are the counts PSN tracks. Specific facts — the 397 stunts in the game, the Chapter 1 balcony meditation, the lack of mission replay — are cited beside the trophy they belong to.'));
  const list = el('ul', 'sources');
  for (const source of Object.values(doc.sources)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = source.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = source.name;
    li.append(a);
    list.append(li);
  }
  wrap.append(list);
  wrap.append(el('p', null, 'Every guide is written for this entry in its own words. Sources are cited, never copied. Where early guides have not yet confirmed a method, the guide says so instead of guessing.'));
}
