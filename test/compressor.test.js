'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

// compressor.js references TokenSaver.estimateTokens via previewCompression,
// so load the tokenizer first to populate globalThis.TokenSaver.
require('../utils/tokenizer.js');
const { compress, splitOnCode } = require('../content/compressor.js');

const LEVELS = ['light', 'medium', 'aggressive'];

test('compression never makes prose longer', () => {
  const input =
    'Please could you kindly help me, basically I would like to understand, ' +
    'in order to improve, due to the fact that I am a beginner. Thanks!';
  for (const level of LEVELS) {
    const out = compress(input, level);
    assert.ok(out.length <= input.length, `${level}: output longer than input`);
  }
});

test('compression actually saves on verbose input', () => {
  const input = 'Basically, I would like to ask you, in order to learn, as soon as possible.';
  const out = compress(input, 'aggressive');
  assert.ok(out.length < input.length);
});

test('no orphaned punctuation left after filler removal', () => {
  const out = compress('Well, basically, I think this works.', 'medium');
  assert.ok(!/\s[,;]\s/.test(out), `orphaned punctuation in: "${out}"`);
  assert.ok(!/[.!?]\s*,/.test(out), `comma after sentence end in: "${out}"`);
});

test('fenced code blocks are left byte-for-byte intact', () => {
  const code = '```js\nconst   x =   1;\n\n\n   return x;\n```';
  const input = `Please run this for me:\n${code}\nThanks!`;
  for (const level of LEVELS) {
    const out = compress(input, level);
    assert.ok(out.includes(code), `${level}: fenced code block was modified`);
  }
});

test('inline code spans are preserved exactly', () => {
  const input = 'Use the `const   spaced` value please.';
  const out = compress(input, 'aggressive');
  assert.ok(out.includes('`const   spaced`'), `inline code modified: "${out}"`);
});

test('splitOnCode round-trips to the original text', () => {
  const input = 'before ```code\nblock``` middle `inline` after';
  const joined = splitOnCode(input)
    .map((s) => s.value)
    .join('');
  assert.strictEqual(joined, input);
});

test('compression is idempotent (compressing twice == once)', () => {
  const input = 'Please, basically, I would like to understand this in order to learn.';
  for (const level of LEVELS) {
    const once = compress(input, level);
    const twice = compress(once, level);
    assert.strictEqual(twice, once, `${level}: not idempotent`);
  }
});

test('empty / whitespace input is returned unchanged-ish', () => {
  assert.strictEqual(compress('', 'light'), '');
  assert.strictEqual(compress('   ', 'light'), '   ');
});

test('contractions are applied at medium level', () => {
  const out = compress('I do not think this will not work.', 'medium');
  assert.ok(out.includes("don't"));
  assert.ok(out.includes("won't"));
});

test('aggressive abbreviates known phrases', () => {
  const out = compress('Please send this as soon as possible using machine learning.', 'aggressive');
  assert.ok(/ASAP/.test(out));
  assert.ok(/\bML\b/.test(out));
});
