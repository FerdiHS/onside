---
name: ui-feature-build
description: Build or refine a user-facing page or component while preserving the repository's football intelligence theme, information hierarchy, and demo-ready states. Use when implementing homepage, Match Prep, Player Watch, Club Package, or shared UI components.
---

# Purpose

Use this skill for UI and page implementation work.

This repository wants a serious football intelligence dashboard, not a fan page, betting app, or noisy admin panel. The UI should feel calm, premium, and structured.

Read `AGENTS.md` first. If `docs/design.md` exists, read it too.

# Workflow

1. Understand the target page or component.
2. Inspect existing design patterns in the repo.
3. Reuse shared components where possible.
4. Implement the page shell first.
5. Add the main information sections.
6. Add loading, empty, error, and partial-data states.
7. Polish spacing, hierarchy, and labels.

# Repository-specific guidance

For this project:
- homepage should quickly explain Match Prep and Club Package entry points
- Match Prep should read like a structured briefing
- Player Watch should read like a player intelligence file
- Loan Monitor should feel like the premium club-facing dashboard
