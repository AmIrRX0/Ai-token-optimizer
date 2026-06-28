// ============================================================
//  AI Token Saver — Background Service Worker
// ============================================================

const DEFAULT_SETTINGS = {
  enabled: true,
  showTokenCounter: true,
  autoCompress: false,
  compressionLevel: 'light',     // 'light' | 'medium' | 'aggressive'
  rateLimitWarning: true,
  rateLimitThreshold: 80,        // warn at 80% of estimated limit
  promptLibrary: true,
  contextSummary: true,
  sites: {
    'claude.ai':             { enabled: true, messagesPerHour: 40 },
    'chatgpt.com':           { enabled: true, messagesPerHour: 40 },
    'chat.openai.com':       { enabled: true, messagesPerHour: 40 },
    'gemini.google.com':     { enabled: true, messagesPerHour: 60 },
    'aistudio.google.com':   { enabled: true, messagesPerHour: 60 },
    'perplexity.ai':         { enabled: true, messagesPerHour: 50 },
    'chat.deepseek.com':     { enabled: true, messagesPerHour: 50 },
    'copilot.microsoft.com': { enabled: true, messagesPerHour: 30 },
    'poe.com':               { enabled: true, messagesPerHour: 30 },
    'you.com':               { enabled: true, messagesPerHour: 50 },
  }
};

// ── Init ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    await chrome.storage.local.set({
      messageCounts: {},   // { hostname: [timestamps] }
      totalSaved: 0,       // total tokens saved (estimated)
      promptLibrary: [],   // saved prompts
      sessionStats: {}     // per-tab stats
    });
    console.log('[AI Token Saver] Installed & initialized.');
  }
});

// ── Message Router ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'GET_SETTINGS':
        sendResponse(await getSettings());
        break;

      case 'SAVE_SETTINGS':
        await chrome.storage.sync.set({ settings: msg.settings });
        sendResponse({ ok: true });
        break;

      case 'LOG_MESSAGE': {
        const count = await logMessage(msg.hostname);
        sendResponse({ count, limit: getSiteLimit(msg.hostname, await getSettings()) });
        break;
      }

      case 'GET_RATE_STATUS': {
        const settings = await getSettings();
        const data     = await getLocalData();
        const counts   = data.messageCounts || {};
        const hostname = msg.hostname;
        const limit    = getSiteLimit(hostname, settings);
        const recent   = getRecentMessages(counts[hostname] || []);
        sendResponse({ count: recent, limit, pct: Math.round((recent / limit) * 100) });
        break;
      }

      case 'SAVE_TOKENS': {
        const data = await getLocalData();
        const saved = (data.totalSaved || 0) + msg.tokens;
        await chrome.storage.local.set({ totalSaved: saved });
        sendResponse({ totalSaved: saved });
        break;
      }

      case 'GET_STATS': {
        const data = await getLocalData();
        sendResponse({ totalSaved: data.totalSaved || 0 });
        break;
      }

      case 'SAVE_PROMPT': {
        const data = await getLocalData();
        const library = data.promptLibrary || [];
        const entry = {
          id: Date.now().toString(),
          title: msg.title,
          text: msg.text,
          tokens: msg.tokens,
          created: Date.now()
        };
        library.unshift(entry);
        if (library.length > 100) library.splice(100); // max 100 prompts
        await chrome.storage.local.set({ promptLibrary: library });
        sendResponse({ ok: true, entry });
        break;
      }

      case 'GET_PROMPT_LIBRARY': {
        const data = await getLocalData();
        sendResponse({ library: data.promptLibrary || [] });
        break;
      }

      case 'IMPORT_LIBRARY': {
        // Merge imported prompts with the existing library, de-duping by
        // text. Imported entries are validated/normalized so a malformed
        // file can't corrupt storage.
        const data = await getLocalData();
        const existing = data.promptLibrary || [];
        const incoming = Array.isArray(msg.library) ? msg.library : [];
        const seen = new Set(existing.map((p) => p.text));
        let added = 0;
        for (const raw of incoming) {
          if (!raw || typeof raw.text !== 'string' || !raw.text.trim()) continue;
          if (seen.has(raw.text)) continue;
          seen.add(raw.text);
          existing.push({
            id: (raw.id && String(raw.id)) || `${Date.now()}-${added}`,
            title: String(raw.title || raw.text.slice(0, 60)),
            text: raw.text,
            tokens: Number(raw.tokens) || 0,
            created: Number(raw.created) || Date.now(),
          });
          added++;
        }
        existing.sort((a, b) => (b.created || 0) - (a.created || 0));
        if (existing.length > 100) existing.splice(100);
        await chrome.storage.local.set({ promptLibrary: existing });
        sendResponse({ ok: true, added, total: existing.length });
        break;
      }

      case 'EXPORT_LIBRARY': {
        const data = await getLocalData();
        sendResponse({ library: data.promptLibrary || [] });
        break;
      }

      case 'DELETE_PROMPT': {
        const data = await getLocalData();
        const library = (data.promptLibrary || []).filter(p => p.id !== msg.id);
        await chrome.storage.local.set({ promptLibrary: library });
        sendResponse({ ok: true });
        break;
      }

      case 'RESET_STATS': {
        await chrome.storage.local.set({ totalSaved: 0, messageCounts: {} });
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  return true; // async response
});

// ── Helpers ─────────────────────────────────────────────────
async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
}

async function getLocalData() {
  return chrome.storage.local.get(null);
}

async function logMessage(hostname) {
  const data   = await getLocalData();
  const counts = data.messageCounts || {};
  const ts     = Date.now();
  const arr    = getRecentTimestamps(counts[hostname] || []);
  arr.push(ts);
  counts[hostname] = arr;
  await chrome.storage.local.set({ messageCounts: counts });
  return arr.length;
}

function getRecentTimestamps(arr) {
  const oneHourAgo = Date.now() - 3600_000;
  return arr.filter(t => t > oneHourAgo);
}

function getRecentMessages(arr) {
  return getRecentTimestamps(arr).length;
}

function getSiteLimit(hostname, settings) {
  const clean = hostname.replace(/^www\./, '');
  return settings.sites?.[clean]?.messagesPerHour ?? 40;
}