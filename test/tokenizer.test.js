'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const T = require('../utils/tokenizer.js');

// Reference token counts gathered from real BPE tokenizers
// (OpenAI tiktoken cl100k_base / o200k_base) for these exact strings.
// The estimator is a heuristic, so we assert it lands close — not exact.
const REFERENCE = [
  ['Hello, world!', 4],
  ['The quick brown fox jumps over the lazy dog.', 10],
  ['I would like to ask you a question about machine learning.', 12],
  ['Please write a Python script that reads a CSV file.', 11],
  ['Summarize the following article in three concise bullet points.', 11],
  ['antidisestablishmentarianism', 6],
  ['The year was 1984 and the count reached 1000000.', 13],
  ['function getUserName(userId) { return users.find(userId); }', 18],
];

test('estimates are within tolerance of real token counts', () => {
  let totalErr = 0;
  for (const [text, ref] of REFERENCE) {
    const est = T.estimateTokens(text);
    const errPct = Math.abs(est - ref) / ref;
    totalErr += errPct;
    // Per-string guardrail: no single estimate should be wildly off.
    assert.ok(
      errPct <= 0.45,
      `"${text.slice(0, 40)}" est=${est} ref=${ref} (${(errPct * 100).toFixed(0)}% off)`
    );
  }
  const meanErr = totalErr / REFERENCE.length;
  // Corpus-level guardrail: average error stays small.
  assert.ok(
    meanErr <= 0.2,
    `mean abs error ${(meanErr * 100).toFixed(1)}% exceeds 20%`
  );
});

test('empty / falsy input is zero tokens', () => {
  assert.strictEqual(T.estimateTokens(''), 0);
  assert.strictEqual(T.estimateTokens(null), 0);
  assert.strictEqual(T.estimateTokens(undefined), 0);
});

test('any non-empty input is at least one token', () => {
  assert.ok(T.estimateTokens('a') >= 1);
  assert.ok(T.estimateTokens('.') >= 1);
});

test('longer text yields more tokens (monotonic-ish)', () => {
  const short = T.estimateTokens('hello there friend');
  const long = T.estimateTokens('hello there friend, how are you doing today my good pal');
  assert.ok(long > short);
});

test('model-aware estimate applies a multiplier', () => {
  const text = 'The quick brown fox jumps over the lazy dog repeatedly.';
  const generic = T.estimateTokensFor(text, 'generic');
  const claude = T.estimateTokensFor(text, 'claude');
  // Claude multiplier > 1, so its estimate should be >= generic.
  assert.ok(claude >= generic);
});

test('unknown model falls back to generic', () => {
  const text = 'some example prompt text here';
  assert.strictEqual(
    T.estimateTokensFor(text, 'totally-unknown-model'),
    T.estimateTokens(text)
  );
});

test('formatTokens renders k-suffix above 1000', () => {
  assert.strictEqual(T.formatTokens(950), '950');
  assert.strictEqual(T.formatTokens(1500), '1.5k');
});

test('CJK text counts roughly one token per character', () => {
  const cjk = '你好世界你好世界'; // 8 chars
  const est = T.estimateTokens(cjk);
  assert.ok(est >= 5 && est <= 9, `CJK estimate ${est} out of expected band`);
});

test('estimateSavings reports a positive saving when text shrinks', () => {
  const { saved, pct } = T.estimateSavings(
    'this is a much longer original string with many words',
    'short string'
  );
  assert.ok(saved > 0);
  assert.ok(pct > 0);
});
