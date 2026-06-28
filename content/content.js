// ============================================================
//  AI Token Saver — Content Script
//  Injected into all supported AI chat platforms
// ============================================================

(function () {
  'use strict';

  // ── Site Detection ──────────────────────────────────────────────────────────
  const SITE_CONFIGS = {
    'claude.ai': {
      name: 'Claude',
      color: '#d97706',
      inputSelectors: [
        '[contenteditable="true"][data-placeholder]',
        'div.ProseMirror',
        '[contenteditable="true"]'
      ],
      sendButtonSelectors: ['button[aria-label*="Send"]', 'button[data-testid*="send"]'],
    },
    'chatgpt.com': {
      name: 'ChatGPT',
      color: '#10a37f',
      inputSelectors: ['#prompt-textarea', 'textarea[placeholder*="Message"]', 'div[contenteditable="true"]'],
      sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send"]'],
    },
    'chat.openai.com': {
      name: 'ChatGPT',
      color: '#10a37f',
      inputSelectors: ['#prompt-textarea', 'textarea[placeholder*="Message"]'],
      sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send"]'],
    },
    'gemini.google.com': {
      name: 'Gemini',
      color: '#4285f4',
      inputSelectors: ['rich-textarea .ql-editor', 'div[contenteditable="true"]', 'textarea'],
      sendButtonSelectors: ['button.send-button', 'button[aria-label*="Send"]', 'button[mattooltip*="Send"]'],
    },
    'aistudio.google.com': {
      name: 'AI Studio',
      color: '#4285f4',
      inputSelectors: ['textarea', 'div[contenteditable="true"]'],
      sendButtonSelectors: ['button[aria-label*="Send"]'],
    },
    'perplexity.ai': {
      name: 'Perplexity',
      color: '#20b2aa',
      inputSelectors: ['textarea[placeholder*="Ask"]', 'textarea'],
      sendButtonSelectors: ['button[aria-label*="Submit"]', 'button[type="submit"]'],
    },
    'chat.deepseek.com': {
      name: 'DeepSeek',
      color: '#4d6bfe',
      inputSelectors: ['textarea#chat-input', 'textarea[placeholder*="Message"]', 'textarea'],
      sendButtonSelectors: ['div[role="button"][aria-disabled]', 'button[type="submit"]', 'button[aria-label*="Send"]'],
    },
    'copilot.microsoft.com': {
      name: 'Copilot',
      color: '#0078d4',
      inputSelectors: ['textarea[id*="userInput"]', 'div[contenteditable="true"]', 'textarea'],
      sendButtonSelectors: ['button[aria-label*="Send"]', 'button[type="submit"]'],
    },
    'poe.com': {
      name: 'Poe',
      color: '#8b5cf6',
      inputSelectors: ['textarea[class*="GrowingTextArea"]', 'textarea'],
      sendButtonSelectors: ['button[class*="SendButton"]', 'button[aria-label*="Send"]'],
    },
    'you.com': {
      name: 'You.com',
      color: '#6366f1',
      inputSelectors: ['textarea[id*="search"]', 'textarea'],
      sendButtonSelectors: ['button[type="submit"]', 'button[aria-label*="Send"]'],
    },
  };

  const hostname = location.hostname.replace(/^www\./, '');
  const SITE = SITE_CONFIGS[hostname] || {
    name: 'AI',
    color: '#6366f1',
    inputSelectors: ['textarea', 'div[contenteditable="true"]'],
    sendButtonSelectors: ['button[type="submit"]', 'button[aria-label*="Send"]'],
  };

  // ── State ───────────────────────────────────────────────────────────────────
  let settings = null;
  let activeInput = null;
  let overlay = null;
  let messageCount = 0;
  let rateLimit = 40;
  let initialized = false;
  let sendIntercepted = false;

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  async function init() {
    if (initialized) return;
    initialized = true;

    // tokenizer.js و compressor.js حالا از طریق manifest به‌عنوان content script لود می‌شن

    settings = await sendMessage({ type: 'GET_SETTINGS' });

    const status = await sendMessage({ type: 'GET_RATE_STATUS', hostname });
    if (status) {
      messageCount = status.count;
      rateLimit    = status.limit;
    }

    startObserving();
    injectToolbar();
  }

  // ── DOM Observer ────────────────────────────────────────────────────────────
  function startObserving() {
    const observer = new MutationObserver(() => tryBindInput());
    observer.observe(document.body, { childList: true, subtree: true });
    tryBindInput();
  }

  function tryBindInput() {
    for (const selector of SITE.inputSelectors) {
      const el = document.querySelector(selector);
      if (el && el !== activeInput) {
        bindInput(el);
        return;
      }
    }
  }

  function bindInput(el) {
    activeInput = el;
    attachCounter(el);
    el.addEventListener('input', onInputChange);
    el.addEventListener('keydown', onKeyDown);
    interceptSend();
    console.log(`[AI Token Saver] Bound to ${SITE.name} input`);
  }

  // ── Token Counter UI ────────────────────────────────────────────────────────
  function attachCounter(el) {
    if (!settings?.showTokenCounter || !settings?.enabled) return;

    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'ats-counter';
    overlay.innerHTML = `
      <span id="ats-count" title="Local estimate, calibrated to ~97% of real tokenizers. No data leaves your browser.">≈ 0 tokens</span>
      <span id="ats-rate" title="Messages sent this hour"></span>
      <button id="ats-compress-btn" title="Compress text to save tokens">⚡ Compress</button>
      <button id="ats-save-btn" title="Save to prompt library">💾</button>
    `;

    const parent = el.closest('form') || el.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    document.getElementById('ats-compress-btn')?.addEventListener('click', handleCompress);
    document.getElementById('ats-save-btn')?.addEventListener('click', handleSavePrompt);

    updateCounter();
    updateRateDisplay();
  }

  function updateCounter() {
    if (!settings?.enabled) return;
    if (!activeInput || !overlay) return;
    const text   = getText();
    const model  = settings?.estimateModel || 'generic';
    const tokens = window.TokenSaver?.estimateTokensFor?.(text, model)
      ?? window.TokenSaver?.estimateTokens(text) ?? 0;
    const el     = document.getElementById('ats-count');
    if (!el) return;

    el.textContent = `≈ ${tokens.toLocaleString()} tokens`;
    el.style.color = tokens > 2000 ? '#ef4444' : tokens > 800 ? '#f59e0b' : '#22c55e';
  }

  function updateRateDisplay() {
    const el = document.getElementById('ats-rate');
    if (!el) return;
    const pct = Math.round((messageCount / rateLimit) * 100);
    el.textContent = `${messageCount}/${rateLimit} msgs`;
    el.style.color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#9ca3af';
  }

  // ── Event Handlers ──────────────────────────────────────────────────────────
  function onInputChange() {
    updateCounter();
  }

  function onKeyDown(e) {
    // Alt+Shift+C / Alt+Shift+S — avoids clashing with Chrome's built-in
    // Ctrl+Shift+C (DevTools inspector) and Ctrl+Shift+S shortcuts.
    if (e.altKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      handleCompress();
    }
    if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      handleSavePrompt();
    }
  }

  function handleCompress() {
    if (!settings?.enabled) return;
    const text  = getText();
    if (!text.trim()) return;

    const level = settings?.compressionLevel || 'light';
    const compressed = window.TokenSaver?.compress(text, level) ?? text;
    if (compressed === text) {
      showToast('Nothing to compress 👍');
      return;
    }

    const before = window.TokenSaver?.estimateTokens(text) ?? 0;
    const after  = window.TokenSaver?.estimateTokens(compressed) ?? 0;
    const saved  = Math.max(0, before - after);

    setText(compressed);
    updateCounter();
    showToast(`⚡ Saved ~${saved} tokens (${Math.round((saved/before)*100)}%)`);

    if (saved > 0) {
      sendMessage({ type: 'SAVE_TOKENS', tokens: saved });
    }
  }

  async function handleSavePrompt() {
    if (!settings?.enabled) return;
    const text = getText();
    if (!text.trim()) return;
    const tokens = window.TokenSaver?.estimateTokens(text) ?? 0;
    const title  = text.slice(0, 60) + (text.length > 60 ? '…' : '');
    await sendMessage({ type: 'SAVE_PROMPT', title, text, tokens });
    showToast('💾 Saved to prompt library');
  }

  // ── Send Interception ───────────────────────────────────────────────────────
  function interceptSend() {
    // Guard: attach the global click listener only once. bindInput() can run
    // many times as the SPA re-renders inputs; without this guard every send
    // click would be logged multiple times, inflating the rate counter.
    if (sendIntercepted) return;
    sendIntercepted = true;

    document.addEventListener('click', async (e) => {
      const btn = e.target.closest(SITE.sendButtonSelectors.join(','));
      if (!btn) return;

      if (!settings?.enabled) return;

      if (settings?.autoCompress) {
        const text = getText();
        if (text.trim()) {
          const level = settings?.compressionLevel || 'light';
          const compressed = window.TokenSaver?.compress(text, level) ?? text;
          if (compressed !== text) {
            setText(compressed);
          }
        }
      }

      const result = await sendMessage({ type: 'LOG_MESSAGE', hostname });
      if (result) {
        messageCount = result.count;
        rateLimit    = result.limit;
        updateRateDisplay();

        const pct = Math.round((messageCount / rateLimit) * 100);
        const threshold = settings?.rateLimitThreshold ?? 80;
        if (settings?.rateLimitWarning && pct >= threshold) {
          showToast(`⚠️ Rate limit: ${messageCount}/${rateLimit} messages this hour (${pct}%)`, 'warn', 5000);
        }
        if (pct >= 100) {
          showToast(`🛑 Rate limit reached! Wait before sending more.`, 'error', 8000);
        }
      }
    }, true); 
  }

  // ── Floating Toolbar ────────────────────────────────────────────────────────
  function injectToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'ats-toolbar';
    toolbar.innerHTML = `
      <div id="ats-toolbar-inner">
        <span id="ats-logo">⚡ ATS</span>
        <div id="ats-actions">
          <button id="ats-open-library" title="Open Prompt Library">📚</button>
          <button id="ats-toggle" title="Toggle AI Token Saver" style="color:${settings?.enabled ? '#22c55e' : '#ef4444'}">●</button>
        </div>
      </div>
      <div id="ats-library-panel" style="display:none;"></div>
    `;
    document.body.appendChild(toolbar);

    document.getElementById('ats-toggle')?.addEventListener('click', toggleEnabled);
    document.getElementById('ats-open-library')?.addEventListener('click', toggleLibrary);
  }

  function toggleEnabled() {
    settings.enabled = !settings.enabled;
    const btn = document.getElementById('ats-toggle');
    if (btn) btn.style.color = settings.enabled ? '#22c55e' : '#ef4444';
    sendMessage({ type: 'SAVE_SETTINGS', settings });
    showToast(settings.enabled ? '✅ AI Token Saver enabled' : '⏸ AI Token Saver paused');

    if (settings.enabled && activeInput) {
      attachCounter(activeInput);
    } else if (!settings.enabled && overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  async function toggleLibrary() {
    const panel = document.getElementById('ats-library-panel');
    if (!panel) return;
    if (panel.style.display !== 'none') {
      panel.style.display = 'none';
      return;
    }
    await renderLibrary();
    panel.style.display = 'block';
  }

  async function renderLibrary() {
    const panel = document.getElementById('ats-library-panel');
    if (!panel) return;
    const { library } = await sendMessage({ type: 'GET_PROMPT_LIBRARY' });
    if (!library || library.length === 0) {
      panel.innerHTML = '<p style="padding:10px;color:#9ca3af;font-size:12px;">No saved prompts yet.<br>Use 💾 to save prompts.</p>';
    } else {
      panel.innerHTML = `
        <div style="padding:8px;font-size:11px;color:#9ca3af;border-bottom:1px solid #374151;">PROMPT LIBRARY (${library.length})</div>
        ${library.map(p => `
          <div class="ats-prompt-item" data-id="${p.id}">
            <span class="ats-prompt-title">${escapeHtml(p.title)}</span>
            <div class="ats-prompt-meta">${p.tokens} tokens</div>
            <div class="ats-prompt-actions">
              <button class="ats-use-btn" data-text="${escapeHtml(p.text)}">Use</button>
              <button class="ats-del-btn" data-id="${p.id}">✕</button>
            </div>
          </div>
        `).join('')}
      `;
      panel.querySelectorAll('.ats-use-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-text');
          if (text && activeInput) {
            setText(text);
            updateCounter();
            panel.style.display = 'none';
            activeInput.focus();
          }
        });
      });
      panel.querySelectorAll('.ats-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await sendMessage({ type: 'DELETE_PROMPT', id: btn.dataset.id });
          await renderLibrary();
        });
      });
    }
  }

  // ── Utilities ───────────────────────────────────────────────────────────────
  function getText() {
    if (!activeInput) return '';
    if (activeInput.tagName === 'TEXTAREA' || activeInput.tagName === 'INPUT') {
      return activeInput.value || '';
    }
    return activeInput.innerText || activeInput.textContent || '';
  }

  function setText(text) {
    if (!activeInput) return;

    if (activeInput.tagName === 'TEXTAREA' || activeInput.tagName === 'INPUT') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeInput, text);
      } else {
        activeInput.value = text;
      }
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      activeInput.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      if (!activeInput.innerText.includes(text.slice(0, 20))) {
        activeInput.innerText = text;
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  function showToast(msg, type = 'info', duration = 3000) {
    const existing = document.getElementById('ats-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ats-toast';
    toast.className = `ats-toast ats-toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sendMessage(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, resolve);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();