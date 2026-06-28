# Contributing to AI Token Saver

Thanks for wanting to help! This is a small, dependency-free Chrome extension —
contributions of all sizes are welcome.

## Getting started

```bash
git clone https://github.com/AmIrRX0/Ai-token-optimizer.git
cd Ai-token-optimizer
npm install        # installs eslint (the only dev dependency)
npm test           # run the test suite
npm run lint       # check code style
```

To try your changes in the browser:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project folder
4. Reload the extension after each change (↻ on the extension card)

## Project layout

| Path | What it does |
|---|---|
| `manifest.json` | Manifest V3 config |
| `background.js` | Service worker: settings, rate tracking, prompt storage |
| `content/` | Injected counter, toolbar, and the compression engine |
| `utils/` | Token estimator + popup↔background storage bridge |
| `popup/` | Toolbar popup UI |
| `options/` | Full settings page |
| `test/` | `node --test` unit tests |

## Ground rules

- **No runtime dependencies.** The extension must stay zero-dependency and run fully
  locally — no network calls, no analytics. ESLint is the only dev dependency.
- **Keep token claims honest.** The counter is a calibrated *estimate* (shown with `≈`).
  Don't add "100% accurate" wording — if you improve accuracy, update the tests in
  `test/tokenizer.test.js` with real reference counts instead.
- **Never mangle user code.** The compressor must leave fenced/inline code untouched
  (`test/compressor.test.js` enforces this).
- Add or update a test for any behaviour change. CI runs `npm run lint && npm test`.

## Adding a new platform

1. Add the host to `content_scripts.matches` in `manifest.json`.
2. Add a `SITE_CONFIGS` entry in `content/content.js` (input + send-button selectors).
3. Add a default `messagesPerHour` to `DEFAULT_SETTINGS.sites` in `background.js`.
4. List it under "Supported Platforms" in the README.

## Submitting

Open a PR against `main` with a clear description. Make sure `npm run lint && npm test`
passes locally — the same checks run in CI.
