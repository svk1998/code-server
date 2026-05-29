/* ===== ISWT Team Portal — application logic ===== */
(() => {
  'use strict';

  const STORAGE_KEY = 'iswt.portal.local';      // locally-added (unsaved) portals
  const DATA_URL = 'portals.json';

  // --- State ---
  let basePortals = [];   // from shared portals.json
  let localPortals = [];  // added in this browser, not yet committed
  let activeCategory = 'All';
  let searchTerm = '';

  // --- DOM ---
  const $ = (sel) => document.querySelector(sel);
  const grid = $('#grid');
  const filterBar = $('#filterBar');
  const emptyState = $('#emptyState');
  const resultCount = $('#resultCount');
  const searchInput = $('#searchInput');
  const unsavedBadge = $('#unsavedBadge');
  const categoryList = $('#categoryList');

  const modalOverlay = $('#modalOverlay');
  const registerForm = $('#registerForm');
  const formError = $('#formError');

  // --- Color palette for avatars (deterministic per name) ---
  const PALETTE = [
    ['#4f7cff', '#7a5cff'], ['#22d3a6', '#0ea5e9'], ['#f5a623', '#ef5a6f'],
    ['#ec4899', '#8b5cf6'], ['#14b8a6', '#22c55e'], ['#f97316', '#eab308'],
    ['#06b6d4', '#3b82f6'], ['#a855f7', '#ec4899']
  ];
  const colorFor = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  };

  const initials = (name) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  const hostOf = (url) => {
    try { return new URL(url).host; } catch { return url; }
  };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const slugify = (s) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portal';

  // --- Persistence ---
  const loadLocal = () => {
    try { localPortals = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { localPortals = []; }
  };
  const saveLocal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localPortals));
    unsavedBadge.hidden = localPortals.length === 0;
  };

  const allPortals = () => [...basePortals, ...localPortals];

  // --- Toast ---
  let toastTimer;
  const toast = (msg, kind = 'ok') => {
    const el = $('#toast');
    el.textContent = msg;
    el.className = `toast toast--${kind}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
  };

  // --- Rendering ---
  const renderFilters = () => {
    const cats = ['All', ...new Set(allPortals().map((p) => p.category).filter(Boolean))];
    filterBar.innerHTML = cats.map((c) =>
      `<button class="chip ${c === activeCategory ? 'chip--active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('');

    // refresh datalist for the register form
    const formCats = [...new Set(allPortals().map((p) => p.category).filter(Boolean))];
    categoryList.innerHTML = formCats.map((c) => `<option value="${escapeHtml(c)}">`).join('');
  };

  const matches = (p) => {
    const inCat = activeCategory === 'All' || p.category === activeCategory;
    if (!inCat) return false;
    if (!searchTerm) return true;
    const hay = `${p.name} ${p.category || ''} ${p.description || ''} ${p.url}`.toLowerCase();
    return hay.includes(searchTerm);
  };

  const renderGrid = () => {
    const list = allPortals().filter(matches);
    const total = allPortals().length;

    resultCount.textContent = searchTerm || activeCategory !== 'All'
      ? `Showing ${list.length} of ${total} portals`
      : `${total} portals available`;

    if (list.length === 0) {
      grid.innerHTML = '';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    grid.innerHTML = list.map((p) => {
      const [c1, c2] = colorFor(p.name);
      const isLocal = localPortals.some((lp) => lp.id === p.id);
      return `
        <a class="card" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" data-id="${escapeHtml(p.id)}">
          <div class="card__head">
            <div class="card__avatar" style="background:linear-gradient(135deg, ${c1}, ${c2});">${escapeHtml(initials(p.name))}</div>
            <div class="card__heading">
              <h3 class="card__name">
                ${escapeHtml(p.name)}
                <svg class="card__ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>
              </h3>
              <span class="card__category">${escapeHtml(p.category || 'Uncategorized')}</span>
            </div>
          </div>
          <p class="card__desc">${escapeHtml(p.description || 'No description provided.')}</p>
          <div class="card__footer">
            <span class="card__host">${escapeHtml(hostOf(p.url))}</span>
            ${isLocal
              ? `<button class="card__delete" data-del="${escapeHtml(p.id)}" title="Remove (local)" aria-label="Remove portal">&times;</button>`
              : ''}
          </div>
          ${isLocal ? `<span class="card__localTag" style="position:absolute;top:14px;right:14px;">unsaved</span>` : ''}
        </a>`;
    }).join('');
  };

  const renderAll = () => { renderFilters(); renderGrid(); };

  // --- Events: filter + search ---
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    renderAll();
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderGrid();
  });

  // "/" focuses search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && modalOverlay.hidden) {
      const tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); searchInput.focus(); }
    }
    if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
  });

  // --- Card click → navigate in new tab (handled by <a target=_blank>);
  //     intercept delete button ---
  grid.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      const id = del.dataset.del;
      localPortals = localPortals.filter((p) => p.id !== id);
      saveLocal();
      renderAll();
      toast('Portal removed', 'warn');
    }
  });

  // --- Modal ---
  const openModal = () => {
    modalOverlay.hidden = false;
    formError.hidden = true;
    registerForm.reset();
    setTimeout(() => $('#f-name').focus(), 50);
  };
  const closeModal = () => { modalOverlay.hidden = true; };

  $('#openRegisterBtn').addEventListener('click', openModal);
  $('#closeModalBtn').addEventListener('click', closeModal);
  $('#cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // --- Register submit ---
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());
    const name = (data.name || '').trim();
    let url = (data.url || '').trim();

    if (!name) return showFormError('Please enter a portal name.');
    if (!url) return showFormError('Please enter a URL.');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { return showFormError('That URL doesn’t look valid.'); }

    // unique id
    let id = slugify(name);
    const taken = new Set(allPortals().map((p) => p.id));
    if (taken.has(id)) { let n = 2; while (taken.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }

    const portal = {
      id,
      name,
      url,
      category: (data.category || '').trim() || 'Uncategorized',
      description: (data.description || '').trim()
    };

    localPortals.push(portal);
    saveLocal();
    activeCategory = 'All';
    searchTerm = '';
    searchInput.value = '';
    renderAll();
    closeModal();
    toast(`“${name}” registered — opening in a new tab`);

    // After click → navigate to the portal in another tab
    window.open(url, '_blank', 'noopener');
  });

  const showFormError = (msg) => { formError.textContent = msg; formError.hidden = false; };

  // --- Export merged portals.json (for committing the shared file) ---
  $('#exportBtn').addEventListener('click', async () => {
    const payload = {
      team: 'ISWT Team',
      updated: new Date().toISOString().slice(0, 10),
      portals: allPortals().map(({ id, name, url, category, description }) =>
        ({ id, name, url, category, description }))
    };
    const json = JSON.stringify(payload, null, 2) + '\n';

    // download a file
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'portals.json';
    a.click();
    URL.revokeObjectURL(a.href);

    // and copy to clipboard for convenience
    try { await navigator.clipboard.writeText(json); toast('portals.json downloaded & copied to clipboard'); }
    catch { toast('portals.json downloaded'); }
  });

  // --- Boot ---
  const init = async () => {
    loadLocal();
    unsavedBadge.hidden = localPortals.length === 0;
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      basePortals = Array.isArray(data) ? data : (data.portals || []);
    } catch (err) {
      basePortals = [];
      toast('Could not load portals.json — showing local entries only', 'warn');
    }
    // de-dupe: drop local entries that now exist in the shared file
    const baseIds = new Set(basePortals.map((p) => p.id));
    localPortals = localPortals.filter((p) => !baseIds.has(p.id));
    saveLocal();
    renderAll();
  };

  init();
})();
