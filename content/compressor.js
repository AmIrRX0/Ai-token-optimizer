// ============================================================
//  compressor.js — Smart text compression for AI prompts
//  Three levels: light / medium / aggressive
// ============================================================

window.TokenSaver = window.TokenSaver || {};

window.TokenSaver.compress = function compress(text, level = 'light') {
  if (!text || text.trim().length === 0) return text;

  let result = text;

  switch (level) {
    case 'light':
      result = applyLight(result);
      break;
    case 'medium':
      result = applyLight(result);
      result = applyMedium(result);
      break;
    case 'aggressive':
      result = applyLight(result);
      result = applyMedium(result);
      result = applyAggressive(result);
      break;
  }

  return result.trim();
};

// ── Level 1: Light ─────────────────────────────────────────
// Safe changes: whitespace, obvious redundancy
function applyLight(text) {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove 3+ consecutive blank lines → max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing spaces on each line
    .replace(/[ \t]+$/gm, '')
    // Remove leading spaces on each line
    .replace(/^[ \t]+/gm, '')
    // Collapse multiple spaces (not newlines)
    .replace(/[ \t]{2,}/g, ' ')
    // Remove "Please" / "Can you please" / "Could you please" at start
    .replace(/^(please |can you please |could you please |kindly )/i, '')
    // Remove trailing "thanks", "thank you", "cheers" etc.
    .replace(/\n*(thanks|thank you|cheers|thx|ty|regards)[!.,]?\s*$/i, '')
    // Collapse "I would like to" → "I want to"
    .replace(/\bI would like to\b/gi, 'I want to')
    .replace(/\bI'd like to\b/gi, 'I want to')
    // "in order to" → "to"
    .replace(/\bin order to\b/gi, 'to')
    // "due to the fact that" → "because"
    .replace(/\bdue to the fact that\b/gi, 'because')
    // "at this point in time" → "now"
    .replace(/\bat this point in time\b/gi, 'now')
    // "as well as" → "and"
    .replace(/\bas well as\b/gi, 'and');
}

// ── Level 2: Medium ────────────────────────────────────────
// Filler phrase removal, mild contractions
function applyMedium(text) {
  return text
    // Remove hedging intros
    .replace(/^(I think |I believe |I feel like |In my opinion, |It seems to me that )/i, '')
    // Remove filler meta-phrases
    .replace(/\b(basically|essentially|literally|actually|honestly|frankly|clearly|obviously|simply|just|really|very|quite|rather|somewhat|fairly|pretty much)\b/gi, '')
    // "it is important to note that" → ""
    .replace(/\bit is important to note that\b/gi, '')
    .replace(/\bit should be noted that\b/gi, '')
    .replace(/\bplease note that\b/gi, '')
    // "the fact that" → "that"
    .replace(/\bthe fact that\b/gi, 'that')
    // "a number of" → "many"
    .replace(/\ba number of\b/gi, 'many')
    // "in the event that" → "if"
    .replace(/\bin the event that\b/gi, 'if')
    // "on a regular basis" → "regularly"
    .replace(/\bon a regular basis\b/gi, 'regularly')
    // "at the present time" → "now"
    .replace(/\bat the present time\b/gi, 'now')
    // "in spite of the fact that" → "although"
    .replace(/\bin spite of the fact that\b/gi, 'although')
    // Contractions
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bcannot\b/g, "can't")
    .replace(/\bwill not\b/g, "won't")
    .replace(/\bdoes not\b/g, "doesn't")
    .replace(/\bdid not\b/g, "didn't")
    .replace(/\bshould not\b/g, "shouldn't")
    .replace(/\bwould not\b/g, "wouldn't")
    .replace(/\bcould not\b/g, "couldn't")
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bI have\b/g, "I've")
    .replace(/\bI will\b/g, "I'll")
    .replace(/\bIt is\b/g, "It's")
    .replace(/\bThat is\b/g, "That's")
    // Clean up double spaces left by removals
    .replace(/  +/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n');
}

// ── Level 3: Aggressive ────────────────────────────────────
// Structural compression, list shortening, abbreviations
function applyAggressive(text) {
  let result = text
    // "for example," → "e.g.,"
    .replace(/\bfor example\b,?/gi, 'e.g.')
    // "that is," → "i.e.,"
    .replace(/\bthat is\b,?/gi, 'i.e.')
    // "and so on" / "etc" normalization
    .replace(/\band so on\b/gi, 'etc.')
    .replace(/\band so forth\b/gi, 'etc.')
    // "with respect to" → "re:"
    .replace(/\bwith respect to\b/gi, 're:')
    // "as soon as possible" → "ASAP"
    .replace(/\bas soon as possible\b/gi, 'ASAP')
    // "artificial intelligence" → "AI"
    .replace(/\bartificial intelligence\b/gi, 'AI')
    // "machine learning" → "ML"
    .replace(/\bmachine learning\b/gi, 'ML')
    // "natural language processing" → "NLP"
    .replace(/\bnatural language processing\b/gi, 'NLP')
    // Remove "I want you to" / "Your task is to" type intros
    .replace(/^(I want you to |Your task is to |You are to |Please help me |Help me )/i, '')
    // Shorten intro "Act as..." style prompts slightly
    .replace(/^You are an? /i, 'As ')
    // Remove empty parentheses that might result from removals
    .replace(/\(\s*\)/g, '')
    // Remove extra punctuation
    .replace(/\.{2}/g, '.')
    // Collapse remaining double spaces
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  // Aggressive: if there are bullet list items with preamble text, trim preamble
  result = result.replace(/^(the following|here are|below are|listed below are)[^:]*:/gim, '');

  return result;
}

/**
 * Preview what each compression level would do.
 */
window.TokenSaver.previewCompression = function(text) {
  const { estimateTokens } = window.TokenSaver;
  const original = estimateTokens(text);

  const levels = ['light', 'medium', 'aggressive'];
  return levels.map(level => {
    const compressed = window.TokenSaver.compress(text, level);
    const after = estimateTokens(compressed);
    const saved = Math.max(0, original - after);
    const pct   = original > 0 ? Math.round((saved / original) * 100) : 0;
    return { level, text: compressed, original, after, saved, pct };
  });
};