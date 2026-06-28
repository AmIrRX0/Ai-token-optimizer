// ============================================================
//  options.js — wires the full settings page to background storage
// ============================================================

(async function () {
  const S = window.ATSStorage;

  const els = {
    sitesList: document.getElementById('sites-list'),
    modelSeg: document.getElementById('model-seg'),
    exportBtn: document.getElementById('export-btn'),
    importFile: document.getElementById('import-file'),
    libStatus: document.getElementById('lib-status'),
    resetBtn: document.getElementById('reset-btn'),
    resetStatus: document.getElementById('reset-status'),
    versionTag: document.getElementById('version-tag'),
  };

  let settings = (await S.getSettings()) || {};
  settings.sites = settings.sites || {};

  // Show real version from the manifest.
  try {
    els.versionTag.textContent = 'v' + chrome.runtime.getManifest().version;
  } catch (_) {
    /* keep static fallback */
  }

  // ── Per-site rate limits ────────────────────────────────────
  function renderSites() {
    const entries = Object.entries(settings.sites);
    if (entries.length === 0) {
      els.sitesList.innerHTML =
        '<p class="hint">No sites configured.</p>';
      return;
    }
    els.sitesList.innerHTML = entries
      .map(
        ([host, cfg]) => `
        <div class="site-row">
          <span class="name">${escapeHtml(host)}</span>
          <span class="ctrl">
            <input type="number" min="1" max="9999" step="1"
                   data-host="${escapeHtml(host)}"
                   value="${Number(cfg.messagesPerHour) || 40}" />
            <span class="unit">msgs / hour</span>
          </span>
        </div>`
      )
      .join('');

    els.sitesList.querySelectorAll('input[data-host]').forEach((input) => {
      input.addEventListener('change', () => {
        const host = input.dataset.host;
        let v = parseInt(input.value, 10);
        if (!Number.isFinite(v) || v < 1) v = 1;
        if (v > 9999) v = 9999;
        input.value = v;
        settings.sites[host] = { ...(settings.sites[host] || {}), messagesPerHour: v };
        persist();
      });
    });
  }

  // ── Model selection ─────────────────────────────────────────
  function renderModel() {
    const current = settings.estimateModel || 'generic';
    els.modelSeg.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.model === current);
    });
  }

  els.modelSeg.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      settings.estimateModel = btn.dataset.model;
      renderModel();
      persist();
    });
  });

  // ── Import / export ─────────────────────────────────────────
  els.exportBtn.addEventListener('click', async () => {
    const { library } = (await S.exportLibrary()) || { library: [] };
    const blob = new Blob([JSON.stringify(library, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-token-saver-prompts.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(els.libStatus, `Exported ${library.length} prompt(s).`);
  });

  els.importFile.addEventListener('change', async () => {
    const file = els.importFile.files && els.importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const library = Array.isArray(parsed) ? parsed : parsed.library;
      if (!Array.isArray(library)) throw new Error('Not a prompt library file');
      const res = await S.importLibrary(library);
      setStatus(
        els.libStatus,
        `Imported ${res?.added ?? 0} new prompt(s). Library now holds ${res?.total ?? 0}.`
      );
    } catch (e) {
      setStatus(els.libStatus, `Import failed: ${e.message}`, 'err');
    } finally {
      els.importFile.value = '';
    }
  });

  // ── Reset ───────────────────────────────────────────────────
  els.resetBtn.addEventListener('click', async () => {
    await S.resetStats();
    setStatus(els.resetStatus, 'Stats reset. Saved prompts were kept.');
  });

  // ── Helpers ─────────────────────────────────────────────────
  async function persist() {
    await S.saveSettings(settings);
  }

  function setStatus(el, msg, kind) {
    el.textContent = msg;
    el.className = 'status' + (kind ? ' ' + kind : '');
    if (el._t) clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.textContent = '';
      el.className = 'status';
    }, 5000);
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  renderSites();
  renderModel();
})();
