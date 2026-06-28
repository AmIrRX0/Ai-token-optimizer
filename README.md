<div align="center">

# ⚡ AI Token Saver

### Stop wasting tokens. Stop hitting rate limits.

A free, open-source browser extension that shows a **live token counter**, **compresses your prompts in one click**, and **warns you before you hit the hourly limit** — on Claude, ChatGPT, Gemini, Perplexity, Copilot, DeepSeek & more.

**100% local. Zero data leaves your browser. No account, no API key, no tracking.**

![Version](https://img.shields.io/badge/version-1.1.0-d4ff3d?style=flat-square&labelColor=0d0f0a)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-22c55e?style=flat-square&labelColor=0d0f0a)
![Platforms](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-5b8df7?style=flat-square&labelColor=0d0f0a)
![No dependencies](https://img.shields.io/badge/dependencies-0-d4ff3d?style=flat-square&labelColor=0d0f0a)
[![CI](https://github.com/AmIrRX0/Ai-token-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/AmIrRX0/Ai-token-optimizer/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-8a9080?style=flat-square&labelColor=0d0f0a)

<br>

<img src="docs/hero.png" alt="AI Token Saver live counter and compress button on a chat page" width="720">

<sub>⤴ Replace this with a real screenshot — see <code>docs/README.md</code>.</sub>

</div>

---

## Why?

Every word you send to an AI model costs tokens, and every platform throttles you after a
handful of messages. AI Token Saver sits quietly on the chat page and helps you **send less
and get more**:

- See exactly how heavy a prompt is **before** you send it.
- Strip filler and redundancy with one click — without ever touching your code.
- Know when you're about to get rate-limited, so you can pace yourself.

It runs entirely in your browser. Nothing is uploaded, logged, or phoned home.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔢 **Live token counter** | Calibrated local estimate (`≈`) as you type, color-coded by cost. ~97% accurate vs. real tokenizers — and you can bias it per model (GPT / Claude / Gemini). |
| ⚡ **One-click compression** | Removes filler, hedging, and verbosity in 3 levels (Light / Medium / Aggressive). **Never modifies code blocks.** |
| 📚 **Prompt library** | Save your best prompts and reuse them with one click. Export/import as JSON. |
| ⚠️ **Rate-limit warnings** | Warns you before you hit the hourly limit on each platform, with editable per-site limits. |
| 🌐 **Multi-platform** | Claude, ChatGPT, Gemini, AI Studio, Perplexity, DeepSeek, Copilot, Poe, You.com & more. |
| 🔒 **Private by design** | No network calls, no analytics, no account. Zero runtime dependencies. |

<div align="center">
<img src="docs/demo.gif" alt="Compressing a prompt and watching the token count drop" width="640">
<br><sub>⤴ Demo GIF placeholder — see <code>docs/README.md</code>.</sub>
</div>

---

## 🆚 Without vs. with

| | Without | With AI Token Saver |
|---|---|---|
| Token count | Guess, or paste into a separate counter site | Live, on the page, as you type |
| Trimming a bloated prompt | Edit by hand | One click (or `Alt+Shift+C`) |
| Rate limits | Surprise "you've hit your limit" | Warned at your chosen threshold |
| Reusing good prompts | Hunt through old chats | Saved library, one click to insert |
| Privacy | Depends on the tool | Everything stays in your browser |

---

## 🚀 Installation (Developer Mode)

1. **Download or clone** this repo:
   ```bash
   git clone https://github.com/AmIrRX0/Ai-token-optimizer.git
   ```
2. Open Chrome / Edge / Brave and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked** and select the `Ai-token-optimizer` folder
5. The ⚡ icon appears in your toolbar — you're ready!

> Prefer a packaged build? Run `npm run build` to produce a store-ready
> `dist/ai-token-saver-v1.1.0.zip`.

---

## 🎯 Accuracy — the honest version

The token counter is a **calibrated heuristic**, not a copy of each vendor's tokenizer.
We do this on purpose: a real BPE tokenizer would mean bundling megabytes of model data
into every page. Instead, a tiny local estimator is tuned against real tokenizer output
and lands within **~3% on average** for typical English + code (see
[`test/tokenizer.test.js`](test/tokenizer.test.js)).

That's why the counter shows `≈` — it's a fast, private estimate, not an exact count.
Pick your model in **Settings** to bias the estimate toward GPT, Claude, or Gemini.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+C` | Compress current input |
| `Alt+Shift+S` | Save prompt to library |

---

## 🔧 Compression Levels

| Level | What it does |
|---|---|
| **Light** | Normalizes whitespace, drops filler openers ("Please", "Could you"), trims verbosity ("in order to" → "to") |
| **Medium** | + Removes hedge words (basically, literally, actually), applies contractions (do not → don't) |
| **Aggressive** | + Abbreviations (ASAP, AI, ML), trims prompt-style intros, compresses lists |

**Code is always safe.** Anything inside ` ```fenced``` ` or `` `inline` `` code spans is
left byte-for-byte untouched at every level.

---

## 🗂️ Project Structure

```
Ai-token-optimizer/
├── manifest.json          # Extension config (Manifest V3)
├── background.js          # Service worker — settings, rate tracking, prompt storage
├── content/
│   ├── content.js         # Injected script — counter, toolbar, compression
│   ├── content.css        # Injected styles (dark/lime theme)
│   └── compressor.js      # Compression engine (code-safe, 3 levels)
├── utils/
│   ├── tokenizer.js       # Calibrated local token estimator (no API)
│   └── storage.js         # Popup/options ↔ background bridge
├── popup/                 # Toolbar popup (stats, quick settings, library)
├── options/              # Full settings page (per-site limits, model, import/export)
├── test/                  # node --test unit tests
└── icons/
```

---

## 🌐 Supported Platforms

Claude · ChatGPT · Gemini · AI Studio · Perplexity · DeepSeek · Microsoft Copilot · Poe · You.com

Missing one? [Request a platform](https://github.com/AmIrRX0/Ai-token-optimizer/issues/new?template=feature_request.md) — it's usually a few lines.

---

## 🛠️ Development

```bash
npm install      # eslint only
npm test         # run unit tests
npm run lint     # lint
npm run build    # package dist/*.zip
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. PRs welcome — the golden rules
are **stay dependency-free**, **keep token claims honest**, and **never mangle user code**.

---

## ⭐ Like it?

If this saves you tokens, **star the repo** — it genuinely helps others find it, and it's
the only thanks the project asks for.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

<div align="center"><sub>Made with ⚡ — save tokens, ship faster</sub></div>
