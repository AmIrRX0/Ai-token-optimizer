# Limitations & Honest Scope

AI Token Saver is intentionally small, private, and dependency-free. Those choices come
with real trade-offs. This page is the honest list of what the extension **can't** do, so
you know exactly what you're installing. (If a limitation here surprises you in practice,
please [open an issue](https://github.com/AmIrRX0/Ai-token-optimizer/issues).)

---

## 1. The token counter is an estimate, not an exact count

This is the big one.

The counter shows **`≈ N tokens`** — the `≈` is not decoration. We do **not** run each
platform's real tokenizer. Doing so would mean bundling megabytes of model-specific BPE
data (cl100k / o200k for OpenAI, separate vocabularies for Claude and Gemini) into a
script that loads on every chat page.

Instead, a tiny local heuristic is **calibrated** against real tokenizer output. In
practice it lands within **~3% on average** for ordinary English prose and code
(see [`test/tokenizer.test.js`](test/tokenizer.test.js)), but:

- It can be off by more on unusual input: heavy emoji, rare Unicode, long base64 blobs,
  dense math, or mixed scripts.
- The exact number will differ between GPT, Claude, and Gemini for the same text. The
  **Settings → model** option biases the estimate, but it's still an estimate.
- **Never** rely on it for billing-exact accounting. Use it for *relative* decisions
  ("this prompt is way heavier than it needs to be"), which is what it's good at.

Why we chose this: speed (instant, on every keystroke), privacy (nothing leaves your
browser), and zero bloat. We think an honest ~97% estimate beats a 50 MB "exact" one.

## 2. Compression is lossy and rule-based

The compressor removes filler, hedging, and verbosity with regex rules — it does **not**
understand meaning. Therefore:

- **Always read the result before sending.** Aggressive mode in particular can change
  nuance (e.g. dropping "I think", shortening intros).
- It's tuned for **English**. Other languages mostly pass through unchanged.
- It deliberately **never touches code** inside ` ``` ` fenced or `` ` `` inline spans —
  so it won't shrink code, by design (correctness > savings).
- Savings vary wildly by input: a terse prompt may compress 0%, a bloated one 30%+.

## 3. Rate-limit warnings are local estimates

- The extension counts the messages **you send from this browser** and compares against a
  configurable per-site number (`messagesPerHour`). It has **no access** to the platform's
  real server-side quota, your plan tier, or token-based limits.
- Counts are **per browser profile**, stored locally. They don't sync across devices and
  reset if you clear extension storage.
- Treat the warning as a self-pacing nudge, not a guarantee.

## 4. Platform selectors can break

Each site is matched by CSS selectors for its input box and send button
(`content/content.js`). When a platform ships a redesign, those selectors can go stale and
the counter/toolbar may not attach until we update them.

- There's a **generic fallback** (`textarea`, `[contenteditable]`) so it usually degrades
  gracefully, but placement may be off.
- New platform or a broken one? It's typically a few lines —
  [request it](https://github.com/AmIrRX0/Ai-token-optimizer/issues/new?template=feature_request.md)
  or send a PR (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## 5. Browser & manifest scope

- Built for **Chromium** browsers (Chrome, Edge, Brave) on **Manifest V3**. Not packaged
  for Firefox (different APIs) at this time.
- Runs only on the explicitly listed hosts in `manifest.json` — it does **not** read or
  inject into any other site.

## 6. Privacy boundaries (what it does *not* do)

- No network requests, no analytics, no account, no telemetry.
- Your prompts, library, and stats live in `chrome.storage` on your machine.
- Settings sync via your browser's account sync (if enabled) is the *only* data movement,
  and that's Google/Microsoft's sync, not ours.

---

### Summary

| Area | What it is | What it is **not** |
|---|---|---|
| Token count | ~97% local estimate | Exact / billing-grade |
| Compression | English regex rules | Meaning-aware rewriting |
| Rate limits | Local message tally | The platform's real quota |
| Selectors | Per-site + fallback | Guaranteed across redesigns |
| Privacy | Fully local | Cloud-backed in any way |

Honesty about these is deliberate. If you ever see the UI or README overstate accuracy,
that's a bug — please report it.
