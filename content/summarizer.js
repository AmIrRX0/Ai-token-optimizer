// ============================================================
//  summarizer.js — build a compact "recap" from a saved chat
//
//  The extension has NO LLM and makes NO network calls, so this
//  is an *extractive* recap: it pulls your own prompts (which
//  carry the intent/goals/decisions), compresses each line with
//  the existing compressor, and trims to a token budget. It is
//  not an AI-abstracted summary — see LIMITATIONS.md.
//
//  Pasting this recap at the top of a NEW chat gives the model
//  the gist of the previous one for ~150 tokens instead of
//  replaying the whole transcript.
// ============================================================

(function () {
  'use strict';

  const root =
    typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
      ? globalThis
      : this;
  root.TokenSaver = root.TokenSaver || {};

  const DEFAULT_BUDGET = 200; // target tokens for the recap

  /**
   * Build a recap string from ordered chat messages.
   * @param {Array<{role:string, text:string}>} messages
   * @param {{ site?:string, date?:string, budget?:number }} [opts]
   * @returns {string} recap text (empty string if no usable messages)
   */
  function buildRecap(messages, opts = {}) {
    const list = Array.isArray(messages) ? messages : [];
    const budget = Math.max(60, Number(opts.budget) || DEFAULT_BUDGET);
    const site = opts.site || 'a previous chat';
    const date = opts.date || '';

    const compress = root.TokenSaver.compress || ((t) => t);
    const estimate = root.TokenSaver.estimateTokens || ((t) => Math.ceil(t.length / 4));

    // Clean + compress each message, keep role.
    const cleaned = list
      .map((m) => ({
        role: m && m.role === 'assistant' ? 'assistant' : 'user',
        text: cleanLine(compress(String((m && m.text) || ''), 'medium')),
      }))
      .filter((m) => m.text.length > 0);

    if (cleaned.length === 0) return '';

    const userLines = cleaned.filter((m) => m.role === 'user').map((m) => m.text);
    // Short assistant lines can carry useful decisions/answers; keep concise ones.
    const noteLines = cleaned
      .filter((m) => m.role === 'assistant')
      .map((m) => firstSentence(m.text))
      .filter((t) => t.length > 0 && t.length <= 160);

    // Assemble within budget. The header is always included; user goals first
    // (most important), then notes, dropping the oldest of each as needed.
    const header = `[Context from ${site}${date ? ` — ${date}` : ''}]`;
    const footer = '(Continue from here.)';

    let goals = [...userLines];
    let notes = [...noteLines];

    function render() {
      const parts = [header];
      if (goals.length) {
        parts.push('What I was working on:');
        parts.push(...goals.map((t) => `- ${t}`));
      }
      if (notes.length) {
        parts.push('Notes / decisions:');
        parts.push(...notes.map((t) => `- ${t}`));
      }
      parts.push(footer);
      return parts.join('\n');
    }

    // Trim to budget: drop notes first (oldest first), then oldest goals,
    // but never drop the last remaining goal — we always keep at least one.
    let recap = render();
    while (estimate(recap) > budget && (notes.length > 0 || goals.length > 1)) {
      if (notes.length > 0) {
        notes.shift();
      } else {
        goals.shift();
      }
      recap = render();
    }

    return recap;
  }

  // Collapse a message to a single clean line: strip newlines, code fences,
  // and excess whitespace so each bullet stays compact.
  function cleanLine(text) {
    return String(text || '')
      .replace(/```[\s\S]*?```/g, '[code]') // collapse code blocks
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstSentence(text) {
    const m = String(text || '').match(/^.*?[.!?](\s|$)/);
    return (m ? m[0] : String(text || '')).trim();
  }

  root.TokenSaver.buildRecap = buildRecap;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildRecap };
  }
})();
