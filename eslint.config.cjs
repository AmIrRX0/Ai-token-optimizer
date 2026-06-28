// ESLint flat config — keeps the source honest without being fussy.
// Browser globals for extension code, Node globals for tests/scripts.

'use strict';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  chrome: 'readonly',
  console: 'readonly',
  location: 'readonly',
  navigator: 'readonly',
  MutationObserver: 'readonly',
  Event: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  globalThis: 'readonly',
  module: 'writable',
};

const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  process: 'readonly',
  console: 'readonly',
  globalThis: 'readonly',
  __dirname: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
};

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['warn', 'smart'],
      'no-var': 'warn',
    },
  },
  {
    files: ['test/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: nodeGlobals,
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { sourceType: 'module' },
  },
];
