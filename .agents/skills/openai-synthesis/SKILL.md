---
name: openai-synthesis
description: Add or modify server-side OpenAI-powered synthesis that turns structured football data into concise, club-facing summaries and talking points. Use when implementing or refining Match Prep, Player Watch, or Club Package text generation.
---

# Purpose

Use this skill when the task involves OpenAI-based synthesis.

In this repository, OpenAI is used to transform structured football data into concise, readable intelligence outputs.
It should not be used as the raw scraping layer and should not replace source-backed structured fields.

Read `AGENTS.md` first.

# Core rules

- OpenAI calls must happen server-side only
- Never expose `OPENAI_API_KEY` to the client
- Use structured inputs whenever possible
- Keep outputs concise, factual, and club-facing
- If synthesis fails, the app must still render usable structured data

# Expected architecture

Preferred ownership:
- `lib/openai.ts`
- `lib/prompts.ts` or a closely related shared prompt module
- route handlers or server-side helpers call the integration
- UI consumes normalized outputs, not raw model responses

# Workflow

1. Read `AGENTS.md`, `README.md`, relevant contracts, and the relevant issue.
2. Inspect the current structured input shape.
3. Confirm what the synthesized output should add.
4. Implement or reuse a shared OpenAI helper.
5. Keep model configuration centralized.
6. Generate synthesis from structured inputs only.
7. Normalize the output before it reaches the UI.
8. Add graceful fallback behavior if synthesis fails.

# Repository-specific guidance

For this project, OpenAI is best used for:
- Match Prep talking points and concise briefing summary
- Player Watch short summary
- Loan Monitor short player summaries
