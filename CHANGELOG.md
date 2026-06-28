# Changelog

All notable changes to **AI Token Saver** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-06-28

A reliability + polish release. The goal of this round was to make the extension
**accurate, honest, and safe to recommend** — the things that actually earn trust
(and stars) on GitHub.

### Added
- **Per-model token estimates.** `estimateTokensFor(text, model)` biases the count
  toward a tokenizer family (GPT / Claude / Gemini / DeepSeek) via a small multiplier
  table. Selectable in the new Settings page.
- **Full options page** (`options/`): editable per-site rate limits, model selection,
  and **prompt-library import/export as JSON** (backup or move between browsers).
- **Code-safe compression.** The compressor now splits text on fenced (` ``` `) and
  inline (`` ` ``) code spans and only compresses the prose between them — your code is
  never touched.
- **Test suite** (`node --test`): tokenizer accuracy is checked against real reference
  counts (mean error ≈4.5%); compressor tests enforce code passthrough, idempotency, and
  no orphaned punctuation.
- **Continuous integration** (`.github/workflows/ci.yml`): lint + tests on every push/PR.
- **Project docs:** `LICENSE` (MIT), `CONTRIBUTING.md`, issue templates,
  [`LIMITATIONS.md`](LIMITATIONS.md), and a [token primer](docs/TOKENS.md).
- **Packaging script** (`scripts/build-zip.mjs`): builds a store-ready
  `dist/ai-token-saver-v1.1.0.zip`.

### Changed
- **Tokenizer rewritten** from coarse word-length buckets to a calibrated, script-aware
  estimator: sub-word splits, CamelCase/identifier boundaries, digit-run and
  punctuation-run handling, and whitespace counting.
- **Honest UI.** The counter now shows `≈ N tokens` with a tooltip explaining it is a
  local estimate (~97%). No "100% accurate" claims anywhere — by design.
- **Keyboard shortcuts** moved from `Ctrl+Shift+C/S` to **`Alt+Shift+C/S`** to avoid
  clashing with Chrome DevTools' inspector.
- README reworked into a proper project showcase with an honest accuracy section.
- Supported-site lists reconciled across manifest, content configs, and settings; added a
  first-class **DeepSeek** config.

### Fixed
- **Popup was orphaned** — `manifest.json` had no `action` entry, so clicking the toolbar
  icon did nothing. The popup is now registered and opens correctly.
- **Double-counted messages** — `interceptSend()` attached a fresh global click listener
  every time the page re-rendered its input, inflating the rate counter. Now attached once.
- **Compressor left orphaned punctuation** (e.g. `. , I think`) after removing filler
  words. Cleanup pass added.
- Removed a dead `character.ai` entry from default settings that no content config matched.

---

## [1.0.0] — 2026-06-26

Initial release.

### Added
- Live token counter injected into supported AI chat platforms.
- One-click prompt compression with three levels (Light / Medium / Aggressive).
- Prompt library (save / reuse / delete).
- Per-site hourly rate-limit tracking with warnings.
- Toolbar popup with lifetime savings counter and quick settings.
- Support for Claude, ChatGPT, Gemini, AI Studio, Perplexity, Copilot, Poe, You.com.

[1.1.0]: https://github.com/AmIrRX0/Ai-token-optimizer/releases/tag/v1.1.0
[1.0.0]: https://github.com/AmIrRX0/Ai-token-optimizer/releases/tag/v1.0.0
