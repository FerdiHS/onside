---
name: tinyfish-feature
description: Add or modify a TinyFish-backed feature with strict server-side handling, structured outputs, and graceful fallback behavior. Use when building or updating Match Prep, Player Watch, Loan Monitor, prompts, or live extraction routes.
---

# Purpose

Use this skill when the task touches TinyFish integration.

This repository depends on TinyFish for live extraction, but hackathon reliability matters more than ideological purity. Features should support clean fallback behavior and never expose secrets.

Read `AGENTS.md` first.

# Core rules

- TinyFish calls must happen server-side only
- Never expose `TINYFISH_API_KEY` to the client
- Keep integration logic centralized
- Use strict structured outputs
- Handle structured failure cleanly
- Support mock/live mode strategy

# Preferred file locations

Keep TinyFish-specific code in:
- `lib/tinyfish.ts`
- `lib/prompts.ts`
- server route handlers under `app/api/`

# Documentation to consult

Before changing TinyFish integration, read the references in this skill folder:
- `references/quick-start.md`
- `references/endpoints.md`
- `references/goal-prompting.md`
- `references/ai-integration.md`
- `references/anti-bot-and-progress.md`

# Workflow

1. Inspect current schemas, routes, and mock data.
2. Read the local TinyFish references before changing behavior.
3. Identify the exact feature shape needed.
4. Define or confirm the response schema first.
5. Design the prompt to request:
   - exact structured fields
   - stop conditions
   - failure output
6. Implement the server-side integration.
7. Parse and validate the response before UI usage.
8. Add graceful fallback behavior.
9. Verify the page still works in mock mode if live extraction fails.

# Repository-specific focus

For this project, TinyFish is especially relevant to:
- Match Prep live extraction
- Player Watch live extraction
- Loan Monitor updates derived from player-watch-like data
