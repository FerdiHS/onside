---
name: vercel-deploy
description: Set up or review the optional Vercel deployment workflow after the local MVP is stable. Use when deployment is explicitly requested and core local functionality already works.
---

# Purpose

Use this skill only after the local app is stable enough to demo.

For this hackathon repository, deployment is optional. Local reliability comes first.

Read `AGENTS.md` first.

# Workflow

1. Inspect current Next.js app assumptions.
2. Confirm required environment variables.
3. Keep TinyFish and OpenAI secrets server-side only.
4. If using GitHub Actions for deployment, keep the workflow simple.
5. Ensure deployment is optional and does not block local development.
6. Document how to deploy and verify the result.
