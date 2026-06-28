# Tokens 101 — what they are and why they cost you every day

If you use ChatGPT, Claude, Gemini, or any AI chat, **everything you type and everything
the model replies is measured in tokens**. Tokens are the unit of both *cost* and *limits*.
This short guide explains what they are and how to spend fewer of them — which is exactly
what [AI Token Saver](../README.md) helps with.

---

## What is a token?

A token is a chunk of text — usually a word, part of a word, or a punctuation mark. Models
don't read letters or words; they read tokens.

Rough rules of thumb for English:

- **1 token ≈ 4 characters**
- **1 token ≈ ¾ of a word**
- **100 tokens ≈ 75 words**
- A short sentence ≈ 10–20 tokens

Examples (approximate, OpenAI-style tokenizer):

| Text | ~Tokens |
|---|---|
| `Hello, world!` | 4 |
| `The quick brown fox jumps over the lazy dog.` | 10 |
| `antidisestablishmentarianism` (one long word) | 6 |
| A 500-word email | ~650 |

Things that use **more** tokens than you'd expect: code, numbers, emoji, non-English
scripts, and anything with lots of punctuation or formatting.

> Want the exact split for OpenAI models? Try the official
> [OpenAI Tokenizer](https://platform.openai.com/tokenizer). AI Token Saver gives you a
> fast *local estimate* instead — see [LIMITATIONS.md](../LIMITATIONS.md) for why.

---

## Why tokens matter every day

**1. They cost money.** API pricing is per token (input + output). A wordy prompt you send
50 times a day adds up fast. Compressing a 400-token prompt to 280 saves 120 tokens × 50 ×
30 days = **180,000 tokens/month** for the same result.

**2. They hit limits.** Free and Plus tiers throttle you — by messages per hour and/or by a
shared context budget. Bloated prompts burn your allowance faster and push you into the
"please wait" wall sooner.

**3. They fill the context window.** Every model has a maximum number of tokens it can
"see" at once. Padding your prompt with filler leaves less room for the actual problem —
and long, rambling context can make answers *worse*, not better.

---

## How to spend fewer tokens (daily habits)

1. **Cut filler openers.** "Could you please kindly help me…" → "Help me…". Politeness is
   free for humans; it costs tokens with models.
2. **Drop hedges.** *basically, actually, literally, just, really, very* — almost always
   removable.
3. **Use shorter equivalents.** "in order to" → "to", "due to the fact that" → "because",
   "as soon as possible" → "ASAP".
4. **Don't repeat context.** If the model already has it in the conversation, don't paste
   it again.
5. **Keep code in code blocks** and only include the relevant lines — not the whole file.
6. **Reuse good prompts** instead of re-typing them verbosely each time.
7. **Watch the counter.** Seeing `≈ 1,200 tokens` *before* you send is the single best
   habit — it turns an invisible cost into a visible one.

---

## Where AI Token Saver fits

| Habit above | How the extension helps |
|---|---|
| See the cost before sending | Live `≈` counter as you type, color-coded |
| Cut filler / hedges / verbosity | One-click **Compress** (3 levels) — never touches code |
| Reuse good prompts | Built-in **prompt library** |
| Avoid the rate-limit wall | Per-site **hourly warnings** |

It's all local — your text never leaves your browser. Install steps are in the
[README](../README.md).

---

## Glossary

- **Token** — the unit a model reads text in; ~¾ of an English word.
- **Context window** — the max tokens a model can consider at once (prompt + reply).
- **Input tokens** — what you send. **Output tokens** — what the model returns. Both billed.
- **Tokenizer** — the algorithm that splits text into tokens (e.g. OpenAI's BPE). Different
  model families tokenize the same text slightly differently.
- **Rate limit** — a cap on how much/how often you can send, by messages and/or tokens.

---

<sub>This primer is part of the AI Token Saver project. Found an error? Open an issue —
accuracy matters here too.</sub>
