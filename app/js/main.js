// Boot and wiring: loads the trophy list, restores saved progress, wires the
// tabs, filters, spoiler setting, export/import and reset, and re-renders the
// views whenever state changes. The app fetches only data/trophies.json from
// its own files and makes no network request at run time.
import { loadTrophies } from './data.js';
import { downloadExport, loadState, parseImport, saveState, blankState } from './store.js';
import { renderAbout, renderChecklist, renderDetail, renderMissables, renderProgress, renderRoadmap } from './views.js';

const query = { search: '', kind: 'all', grade: 'all', missableOnly: false, unearnedOnly: false };
let doc = null;
let state = loadState();
let selectedId = null;
let activeTab = 'checklist';

function renderAll() {
  renderProgress(doc, state);
  renderChecklist(doc, state, query, selectedId, selectTrophy);
  renderDetail(doc, state, selectedId, renderAll);
  renderRoadmap(doc, state, selectTrophy);
  renderMissables(doc, state, selectTrophy);
}

function selectTrophy(id, { keepSelection = false } = {}) {
  selectedId = id;
  if (!keepSelection) switchTab('checklist');
  renderAll();
  const pane = document.getElementById('detail');
  if (pane && !keepSelection) pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function switchTab(tab) {
  activeTab = tab;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.tab === tab);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('active', section.id === `view-${tab}`);
  }
}

async function boot() {
  try {
    doc = await loadTrophies();
  } catch (error) {
    document.getElementById('result-line').textContent =
      'The trophy list could not be loaded. Serve the app/ folder with a static server (node serve.ts) and reload.';
    console.error(error);
    return;
  }

  // Tabs.
  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  }

  // Filters.
  document.getElementById('search').addEventListener('input', (e) => {
    query.search = e.target.value;
    renderChecklist(doc, state, query, selectedId, selectTrophy);
  });
  document.getElementById('kind').addEventListener('change', (e) => {
    query.kind = e.target.value;
    renderChecklist(doc, state, query, selectedId, selectTrophy);
  });
  document.getElementById('grade').addEventListener('change', (e) => {
    query.grade = e.target.value;
    renderChecklist(doc, state, query, selectedId, selectTrophy);
  });
  document.getElementById('missable-only').addEventListener('change', (e) => {
    query.missableOnly = e.target.checked;
    renderChecklist(doc, state, query, selectedId, selectTrophy);
  });
  document.getElementById('unearned-only').addEventListener('change', (e) => {
    query.unearnedOnly = e.target.checked;
    renderChecklist(doc, state, query, selectedId, selectTrophy);
  });

  // Spoiler setting (persisted with progress).
  const spoilers = document.getElementById('spoilers');
  spoilers.checked = state.settings.spoilers === true;
  spoilers.addEventListener('change', () => {
    state.settings.spoilers = spoilers.checked;
    saveState(state);
    renderAll();
  });

  // Export / import / reset.
  document.getElementById('export').addEventListener('click', () => downloadExport(state));
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const result = parseImport(await file.text(), doc.trophies.map((t) => t.id));
    if (result.error) {
      document.getElementById('result-line').textContent = `Import failed: ${result.error}`;
      return;
    }
    state = result.state;
    saveState(state);
    document.getElementById('spoilers').checked = state.settings.spoilers === true;
    document.getElementById('result-line').textContent =
      `Imported progress: ${result.imported} trophies earned.`;
    renderAll();
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies, notes and settings in this browser?')) return;
    state = blankState();
    saveState(state);
    selectedId = null;
    document.getElementById('spoilers').checked = false;
    renderAll();
  });

  renderAbout(doc);
  renderAll();
}

boot();
