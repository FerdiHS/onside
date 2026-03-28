---
name: pr-review
description: Review a branch against its base branch before opening a PR. Use when implementation is finished and you need a correctness, risk, and readiness review with concrete findings and next steps.
---

# Purpose

Use this skill to perform a disciplined pre-PR review.

This repository expects every substantial branch to be reviewed before it is declared PR-ready. The review should focus on correctness, reliability, missing states, risky assumptions, and hackathon demo readiness.

Read `AGENTS.md` first.

# Review checklist

Review the branch against base and check for:
- obvious bugs
- broken imports
- incorrect routes
- type mismatches
- schema mismatches
- missing null / empty handling
- accidental hardcoding of demo clubs into core logic
- missing loading / error / partial states
- secret exposure
- mock/live divergence
- page hierarchy or UI regressions
- unrelated scope creep

Use severity buckets:
- **Blocker**
- **Important**
- **Minor**

If supported by the environment, prefer reviewing in a PR-style comparison against the base branch.

# Output format

Return:
1. overall verdict
2. blockers
3. important issues
4. minor issues
5. verification observations
6. PR-readiness recommendation
