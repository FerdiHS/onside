---
name: issue-implementation
description: Plan and implement a GitHub issue in small, reviewable steps. Use when working on a feature, bug, refactor, or docs issue and the task should go from issue scope to a PR-ready branch with multiple logical commits.
---

# Purpose

Use this skill to implement a GitHub issue from start to finish in a disciplined way.

This repository expects Codex to:
- plan first for non-trivial tasks
- ask questions only if needed
- implement incrementally
- use multiple normal commits instead of one giant commit
- continue until the issue is finished or clearly blocked
- run relevant checks before declaring the work done
- review the branch before saying it is PR-ready

Read `AGENTS.md` first. Follow it over this skill if there is any conflict.

# Inputs

Expected inputs:
- issue number and title
- issue description or acceptance criteria
- base branch
- target branch name
- any constraints from the user

If some inputs are missing, infer what you reasonably can from the repo and the issue. Ask questions only if there is a real blocker.

# Workflow

1. Read `AGENTS.md`, `README.md`, and any issue-relevant docs.
2. Inspect the current codebase and identify the files most likely involved.
3. Restate the task in a short implementation plan.
4. For non-trivial work, explicitly list:
   - assumptions
   - dependencies
   - risks
   - definition of done
5. If ambiguity remains and blocks good implementation, ask focused questions.
6. Implement the smallest working version first.
7. Continue incrementally until the issue is complete or a real blocker is hit.
8. Make multiple logical commits when the work naturally splits, for example:
   - scaffolding
   - main implementation
   - error handling / polish
   - docs / tests
9. Run relevant verification commands.
10. Review the branch against the base branch.
11. Summarize:
   - what changed
   - what was verified
   - remaining risks
   - whether the branch is PR-ready

# Guardrails for this repository

- Keep club logic parameterized
- Do not hardcode Chelsea or Manchester United into core logic
- Keep TinyFish server-side only
- Keep OpenAI server-side only
- Preserve mock mode support
- Prefer reliability and demo quality over extra features
- Do not refactor unrelated areas
