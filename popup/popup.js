// ============================================================
//  popup.js — wires the popup UI to background storage
// ============================================================

(async function () {
  const els = {
    enabledToggle: document.getElementById('enabled-toggle'),
    autoCompressToggle: document.getElementById('auto-compress-toggle'),
    counterToggle: document.getElementById('counter-toggle'),
    rateWarningToggle: document.getElementById('rate-warning-toggle'),
    thresholdSlider: document.getElementById('threshold-slider'),
    thresholdValue: document.getElementById('threshold-value'),
    levelSegmented: document.getElementById('level-segmented'),
    tokensSaved: document.getElementById('tokens-saved'),
    siteStatus: document.getElementById('site-status'),
    libraryList: document.getElementById('library-list'),
    libraryCount: document.getElementById('library-count'),
    resetBtn: document.getElementById('reset-stats-btn'),
    settingsBtn: document.getElementById('settings-btn'),
  };

  let settings = (await window.ATSStorage.getSettings()) || {};

  function render() {
    els.enabledToggle.checked = !!settings.enabled;
    els.autoCompressToggle.checked = !!settings.autoCompress;
    els.counterToggle.checked = !!settings.showTokenCounter;
    els.rateWarningToggle.checked = !!settings.rateLimitWarning;
    els.thresholdSlider.value = settings.rateLimitThreshold ?? 80;
    els.thresholdValue.textContent = settings.rateLimitThreshold ?? 80;

    els.levelSegmented.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.level === (settings.compressionLevel || 'light'));
    });
  }

  async function persist() {
    await window.ATSStorage.saveSettings(settings);
  }

  // ── Animated counter ────────────────────────────────────────────────────────
  function animateNumber(el, target) {
    const start = 0;
    const duration = 600;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const value = Math.round(start + (target - start) * (1 - Math.pow(1 - progress, 3)));
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = await window.ATSStorage.getStats();
  animateNumber(els.tokensSaved, stats?.totalSaved || 0);

  // ── Site status for the active tab ──────────────────────────────────────────
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname.replace(/^www\./, '');
      const status = await window.ATSStorage.getRateStatus(hostname);
      if (status) {
        const pct = status.pct ?? Math.round((status.count / status.limit) * 100);
        const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';
        els.siteStatus.innerHTML = `
          <span style="color:${color}">${hostname}</span>
          &nbsp;·&nbsp; ${status.count}/${status.limit} msgs this hour (${pct}%)
        `;
      }
    }
  } catch (e) {
    // not a supported tab, leave default message
  }

  // ── Prompt library ──────────────────────────────────────────────────────────
  async function renderLibrary() {
    const { library } = await window.ATSStorage.getLibrary();
    els.libraryCount.textContent = library?.length || 0;
    if (!library || library.length === 0) {
      els.libraryList.innerHTML = '<span class="ats-muted">No saved prompts yet. Use 💾 next to any chat box to save one.</span>';
      return;
    }
    els.libraryList.innerHTML = library
      .slice(0, 8)
      .map(
        (p) => `
        <div class="ats-lib-item">
          <span title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</span>
          <button data-id="${p.id}">✕</button>
        </div>`
      )
      .join('');

    els.libraryList.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await window.ATSStorage.deletePrompt(btn.dataset.id);
        renderLibrary();
      });
    });
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  await renderLibrary();

  // ── Event bindings ──────────────────────────────────────────────────────────
  els.enabledToggle.addEventListener('change', () => {
    settings.enabled = els.enabledToggle.checked;
    persist();
  });

  els.autoCompressToggle.addEventListener('change', () => {
    settings.autoCompress = els.autoCompressToggle.checked;
    persist();
  });

  els.counterToggle.addEventListener('change', () => {
    settings.showTokenCounter = els.counterToggle.checked;
    persist();
  });

  els.rateWarningToggle.addEventListener('change', () => {
    settings.rateLimitWarning = els.rateWarningToggle.checked;
    persist();
  });

  els.thresholdSlider.addEventListener('input', () => {
    settings.rateLimitThreshold = Number(els.thresholdSlider.value);
    els.thresholdValue.textContent = settings.rateLimitThreshold;
    persist();
  });

  els.levelSegmented.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      settings.compressionLevel = btn.dataset.level;
      render();
      persist();
    });
  });

  els.resetBtn.addEventListener('click', async () => {
    await window.ATSStorage.resetStats();
    animateNumber(els.tokensSaved, 0);
  });

  els.settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  render();
})();