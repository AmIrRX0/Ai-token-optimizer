// ============================================================
//  tokenizer.js — Lightweight token estimator (no API needed)
//  Heuristics based on GPT/Claude tokenization patterns
// ============================================================

/**
 * Estimate token count for a string.
 * Uses different heuristics per script type.
 */
function estimateTokens(text) {
  if (!text || text.length === 0) return 0;

  let tokens = 0;

  // Split into "chunks" by detecting script type per character run
  const chunks = splitByScript(text);

  for (const { type, value } of chunks) {
    switch (type) {
      case 'latin':
        // English/Latin: ~4 chars per token on average
        // Words split roughly as: short words = 1 token, long words = 2+ tokens
        tokens += countLatinTokens(value);
        break;

      case 'cjk':
        // Chinese/Japanese: ~1.5 chars per token
        tokens += Math.ceil(value.length / 1.5);
        break;

      case 'arabic':
        // Arabic/Persian/Urdu: ~3 chars per token
        tokens += Math.ceil(value.length / 3);
        break;

      case 'cyrillic':
        // Russian etc: ~3 chars per token
        tokens += Math.ceil(value.length / 3);
        break;

      case 'code':
        // Code-like text: roughly 1 token per symbol/word
        tokens += Math.ceil(value.length / 3.5);
        break;

      default:
        tokens += Math.ceil(value.length / 4);
    }
  }

  return Math.max(1, Math.round(tokens));
}

function countLatinTokens(text) {
  // Split on whitespace and punctuation
  const words = text.split(/\s+/).filter(Boolean);
  let count = 0;
  for (const word of words) {
    if (word.length <= 4)       count += 1;
    else if (word.length <= 8)  count += 1.3;
    else if (word.length <= 12) count += 1.8;
    else                        count += 2.5;
  }
  // Add tokens for punctuation/symbols
  const punctuation = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  count += punctuation * 0.3;
  return count;
}

function splitByScript(text) {
  const chunks = [];
  let current = '';
  let currentType = null;

  for (const char of text) {
    const type = getCharType(char);
    if (type !== currentType) {
      if (current) chunks.push({ type: currentType, value: current });
      current = char;
      currentType = type;
    } else {
      current += char;
    }
  }
  if (current) chunks.push({ type: currentType, value: current });
  return chunks;
}

function getCharType(char) {
  const code = char.codePointAt(0);

  // CJK
  if ((code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3040 && code <= 0x30FF) ||
      (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0x3000 && code <= 0x303F)) return 'cjk';

  // Arabic / Persian / Urdu
  if ((code >= 0x0600 && code <= 0x06FF) ||
      (code >= 0x0750 && code <= 0x077F) ||
      (code >= 0xFB50 && code <= 0xFDFF) ||
      (code >= 0xFE70 && code <= 0xFEFF)) return 'arabic';

  // Cyrillic
  if (code >= 0x0400 && code <= 0x04FF) return 'cyrillic';

  // Code-like characters
  if (/[{}\[\]()<>\/\\|=+\-*&^%$#@!;:,.`~]/.test(char)) return 'code';

  // Default: latin
  return 'latin';
}

/**
 * Format token count as human-readable string.
 */
function formatTokens(count) {
  if (count < 1000) return `${count}`;
  return `${(count / 1000).toFixed(1)}k`;
}

/**
 * Estimate tokens saved after compression.
 */
function estimateSavings(original, compressed) {
  const before = estimateTokens(original);
  const after  = estimateTokens(compressed);
  const saved  = Math.max(0, before - after);
  const pct    = before > 0 ? Math.round((saved / before) * 100) : 0;
  return { before, after, saved, pct };
}

// Export for content script usage (loaded via content.js)
window.TokenSaver = window.TokenSaver || {};
window.TokenSaver.estimateTokens = estimateTokens;
window.TokenSaver.formatTokens   = formatTokens;
window.TokenSaver.estimateSavings = estimateSavings;