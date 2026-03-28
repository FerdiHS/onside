# Onside

Onside is a football intelligence web app built for the TinyFish Hackathon.

It turns scattered live football information into structured, source-backed insights for clubs and serious football users. The current MVP focuses on match preparation, player monitoring, and a club-facing loan monitor workflow.

---

## Overview

Football teams, analysts, creators, and serious fans often need to open many tabs to prepare for a match or understand player developments.

Onside aims to reduce that manual work by using live web research to generate concise and structured intelligence views.

The product is positioned primarily as a **club-facing football intelligence copilot**, with club operations and player monitoring as the main story.

---

## MVP Scope

### Core features

- **Match Prep**
- **Player Watch**
- **Club Package** with **Loan Monitor**

### Match Prep

Generate a structured pre-match briefing for a selected match.

Expected output:

- competition
- kickoff time
- home team and away team
- probable lineups
- injuries and absences
- recent context
- 3 key talking points
- source links

### Player Watch

Generate a structured player intelligence summary for a selected club and player.

Expected output:

- player name
- club
- status
- recent updates
- availability notes
- recent mentions
- summary
- source links

### Club Package / Loan Monitor

Show the premium club-facing workflow by monitoring loaned-out players.

Expected output:

- tracked players for a selected club
- simple status cards
- short development summaries
- source-backed updates

---

## Demo Scope

The app architecture is generic, but the current hackathon demo uses:

- **Chelsea** as the primary demo club
- **Manchester United** as the secondary showcase club

These clubs are demo data and example inputs only. The product should not be hardcoded around them.

---

## Product Positioning

This is **not** a generic fan app and **not** a betting-style product.

Primary positioning:

- football intelligence tool
- club-facing workflow
- match preparation and player monitoring
- source-backed structured outputs

Secondary positioning:

- creators
- analysts
- serious fans

---

## Design Direction

Onside is designed as a dark, premium football intelligence dashboard.

The UI should feel like:

- a football ops room
- a scouting or monitoring tool
- a structured match briefing interface

It should **not** feel like:

- a football blog
- a betting app
- a social feed
- a noisy fan site

---

## Tech Stack

Current planned stack:

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Next.js Route Handlers** for backend endpoints
- **TinyFish** for live web extraction
- **OpenAI API** for server-side synthesis
- **Zod** for runtime schema validation
- **Vercel** optional for deployment

Initial MVP assumptions:

- no separate backend
- no database at first
- local-first development
- optional deployment later

---

## TinyFish Usage

TinyFish is a core part of the product.

It is used to perform live web extraction and turn football web pages into structured outputs for:

- Match Prep
- Player Watch
- Loan Monitor

### Integration principles

- TinyFish must be called **server-side only**
- `TINYFISH_API_KEY` must never be exposed to the client
- prompts should request structured JSON
- failures should return structured error responses
- partial data should be handled gracefully

### Current Match Prep implementation

The current Match Prep foundation supports:

- `GET /api/fixtures` for the mock upcoming match selector
- `GET /api/match-prep?matchId=<id>&mode=mock|live&detail=summary|full`
- `POST /api/match-prep/start` to start a live TinyFish run quickly
- `GET /api/match-prep/status?matchId=<id>&detail=summary|full` to poll a live TinyFish run
- `GET /api/match-prep/stream?matchId=<id>&detail=summary` for TinyFish live research streaming
- pending polling responses include `next_poll_after_ms` and a `Retry-After` header so the frontend can poll predictably

The current live Match Prep source strategy uses a curated football source pack:

- Sofascore as the primary source
- OneFootball, GOAL, B/R Football, and 433 as supporting sources

Completed Match Prep results are cached in memory per dev-server instance for faster follow-up reads.
Cached responses that originated from the direct sync route may not include a `run_id`, because no async TinyFish run handle exists for them.

The `detail` level is important for UX:

- `detail=summary` asks TinyFish for a lighter, faster summary-focused payload
- `detail=full` asks TinyFish for the richer Match Prep payload, including lineups and absences when available

Both detail levels keep the same JSON shape. In summary mode, lineup and absence fields may intentionally be empty arrays.
When `OPENAI_API_KEY` is configured, live `detail=summary` responses may also include an additive `display` layer with AI-assisted projected lineups or summary text for missing fields while preserving the TinyFish root fields as the source-backed core.
When `NEXT_PUBLIC_MATCH_PREP_MODE=live`, the frontend now prefers the TinyFish live research stream first, showing a curated activity feed plus browser preview when available, and falls back to `start` plus `status` polling if streaming is unavailable or disconnects.

---

---

## OpenAI Usage

OpenAI is used as a **server-side synthesis layer**.

It is intended for tasks such as:

- turning structured match data into concise briefing summaries
- generating short talking points from structured football signals
- producing short Player Watch summaries
- polishing Loan Monitor summaries into clear club-facing text

### Integration principles

- OpenAI must be called **server-side only**
- `OPENAI_API_KEY` must never be exposed to the client
- OpenAI should synthesize from structured inputs, not replace source-backed fields
- AI-assisted Match Prep fallback should live in additive display fields, not overwrite the root TinyFish payload
- if synthesis fails, the app should still render usable structured data
- the output should stay concise, factual, and dashboard-friendly

## Mock Mode and Live Mode

The app should support both:

### Mock mode

Used for:

- development
- UI work
- fallback demos
- stable screenshots and recorded flows

### Live mode

Used for:

- TinyFish extraction
- final validation
- judge-facing demos when reliable

Recommended strategy:

- keep mock mode always available
- enable live mode explicitly
- never let a live extraction failure break the whole app
- when supported in live mode, show short progress text describing what the agent is doing

---

## Repository Structure

Planned structure:

```text
.
├── AGENTS.md
├── README.md
├── app/
│   ├── page.tsx
│   ├── match/
│   ├── players/
│   ├── club/
│   └── api/
├── components/
├── lib/
├── docs/
└── public/
```

### Expected responsibilities

- `app/`: pages and route handlers
- `components/`: reusable UI components
- `lib/`: schemas, mock data, prompts, integrations, formatting
- `docs/`: product, design, and demo documentation

---

## Environment Variables

Create a local `apps/frontend/.env.local` file.
Start by copying `apps/frontend/.env.example`.

Example:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local

TINYFISH_API_KEY=
OPENAI_API_KEY=
LIVE_TINYFISH=false
TINYFISH_TIMEOUT_MS=300000
TINYFISH_BROWSER_PROFILE=lite
TINYFISH_PROXY_COUNTRY=
MATCH_PREP_POLL_INTERVAL_MS=2000
NEXT_PUBLIC_MATCH_PREP_MODE=mock
NEXT_PUBLIC_APP_NAME=Onside
```

Notes:

- `TINYFISH_API_KEY` is required for live TinyFish mode
- `OPENAI_API_KEY` is required for server-side synthesis features, including the summary-mode Match Prep fallback display
- `TINYFISH_TIMEOUT_MS` controls how long the server waits for TinyFish sync calls before timing out
- `TINYFISH_BROWSER_PROFILE` can be `lite` or `stealth`
- `TINYFISH_PROXY_COUNTRY` is optional if geographic proxy routing is needed
- `MATCH_PREP_POLL_INTERVAL_MS` overrides the recommended async Match Prep polling interval
- `NEXT_PUBLIC_MATCH_PREP_MODE` controls whether the frontend defaults Match Prep requests to `mock` or `live`
- keep secrets server-side only
- do not commit `.env.local`

---

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Try the current Match Prep endpoints:

```bash
curl "http://localhost:3000/api/fixtures"

curl "http://localhost:3000/api/match-prep?matchId=friendly-usa-vs-belgium-2026-03-28&mode=mock"

curl -X POST "http://localhost:3000/api/match-prep/start" \
  -H "Content-Type: application/json" \
  -d '{"matchId":"friendly-usa-vs-belgium-2026-03-28","detail":"summary"}'

curl "http://localhost:3000/api/match-prep/status?matchId=friendly-usa-vs-belgium-2026-03-28&detail=summary"

curl -N "http://localhost:3000/api/match-prep/stream?matchId=friendly-usa-vs-belgium-2026-03-28&detail=summary"

curl "http://localhost:3000/api/match-prep?matchId=friendly-usa-vs-belgium-2026-03-28&mode=live&detail=summary"

curl "http://localhost:3000/api/match-prep?matchId=friendly-usa-vs-belgium-2026-03-28&mode=live&detail=full"
```

Notes:

- use `start` plus `status` with `detail=summary` for the best live UX on slow TinyFish runs
- the frontend now tries the live research stream first in `mode=live`, then falls back to `start` plus `status` if the stream cannot stay attached
- use `detail=full` only when you need the richer lineup and absence pass
- the direct `mode=live` route still works, but it waits for the live extraction unless a cached result already exists
- active live runs and cached results are currently in-memory only, so restarting `npm run dev` clears them

Run checks if configured:

```bash
npm run lint
npm run typecheck
npm run build
```

## Commit Convention (Release Please)

This repository uses Conventional Commits so Release Please can generate changelogs and release PRs consistently.

Recommended prefixes:

- `feat:` for user-facing features (minor release)
- `fix:` for bug fixes (patch release)
- `docs:` for documentation-only changes
- `chore:` for maintenance and tooling updates

Release automation uses a GitHub App token. Configure these repository settings:

- repository variable: `RELEASE_PLEASE_APP_ID`
- repository secret: `RELEASE_PLEASE_APP_PRIVATE_KEY`

---

## Current Implementation Plan

High-level build order:

1. foundation and app shell
2. shared schemas and demo data
3. Match Prep in mock mode
4. Player Watch in mock mode
5. Club Package / Loan Monitor in mock mode
6. TinyFish server-side integration
7. mock/live switching
8. loading, error, and partial-data polish
9. demo and submission assets
10. optional deployment

---

## What “Done” Means

A feature is only considered done if:

- it renders correctly
- it works in mock mode
- it handles loading and error states where relevant
- it does not hardcode demo clubs into architecture
- it is visually acceptable for demo
- it is reviewed before PR

---

## Non-Goals for the Hackathon MVP

The following are explicitly out of scope unless added later:

- live score systems
- betting features
- fantasy features
- full auth
- user accounts
- notifications
- complex admin tooling
- advanced fan sentiment analysis
- advanced sponsor analytics
- separate backend services
- database-backed multi-user features

---

## Demo Flow

Recommended hackathon demo flow:

1. Open the homepage
2. Show Match Prep for a selected upcoming match
3. Show Player Watch for a selected tracked player
4. Show Club Package with Loan Monitor for a demo club
5. Highlight that the same structured pipeline can support broader football intelligence workflows

---

## Status

This repository is currently a hackathon MVP in active development.

The first priority is a clean, reliable, demo-ready implementation of:

- Match Prep
- Player Watch
- Loan Monitor
