# Architecture

## Overview

Onside is a **club-facing football intelligence web app** built for the TinyFish Hackathon.

The MVP helps users:
- prepare for matches
- monitor players
- view a club-facing loan monitor workflow

The core product idea is to transform scattered football web information into structured, source-backed intelligence views.

---

## Product Goals

### Primary goals
- Build a **clean, demo-ready football intelligence product**
- Use **live web extraction** where it matters
- Keep the architecture **simple enough for a solo hackathon**
- Preserve a **reliable fallback path** when live extraction is unstable

### Secondary goals
- Make the product feel club-facing and serious
- Keep the design aligned with a football ops / scouting dashboard theme
- Leave room for future expansion without overbuilding now

---

## Non-Goals

For the hackathon MVP, we explicitly avoid:
- separate backend services
- a database
- user authentication
- background jobs or queues
- live score systems
- betting or fantasy features
- heavy enterprise infrastructure
- advanced fan sentiment systems
- advanced sponsor analytics

The architecture should optimize for:
- feasibility
- clarity
- speed of implementation
- demo reliability

---

## High-Level Architecture

The app uses a **single Next.js codebase**.

It contains:
- frontend pages and components
- route handlers for server-side data access
- mock datasets
- TinyFish integration for live extraction
- OpenAI integration for server-side synthesis
- shared schemas and formatting helpers

## Diagram

```text
Browser UI
   │
   ▼
Next.js Pages / Components
   │
   ▼
Next.js Route Handlers (server-side)
   ├── Mock data providers
   ├── TinyFish integration
   │       │
   │       ▼
   │   External football web pages
   └── OpenAI synthesis layer
           │
           ▼
     Concise club-facing summaries
```

---

## Why This Architecture

This architecture is intentionally simple because:
- the project is being built **solo**
- the hackathon rewards a working product more than infra complexity
- the frontend already needs some server-side logic to safely call TinyFish
- route handlers are enough for the MVP

This avoids:
- deploying and debugging multiple services
- database setup overhead
- authentication overhead
- unnecessary cross-service contracts

---

## Main Building Blocks

## 1. Frontend

### Responsibility
- render pages and components
- handle navigation and selection flows
- display structured data
- render loading, empty, error, and partial-data states
- show lightweight progress text during live loading when progress events are available

### Main pages
- `/` — homepage
- `/match/[id]` — Match Prep
- `/players` — Player Watch
- `/club/[clubId]` or `/club` — Club Package / Loan Monitor

### UI design goals
The frontend should feel like:
- a football ops room
- a scouting dashboard
- a structured intelligence product

It should not feel like:
- a betting app
- a social feed
- a fan blog

---

## 2. Route Handlers

### Responsibility
- receive requests from the UI
- decide whether to use mock mode or live mode
- fetch and normalize data
- start and poll long-running live extraction when needed
- validate responses before sending to the client
- keep secrets server-side

### Why route handlers
They are sufficient for the MVP because they:
- remove the need for a separate backend
- protect secrets like `TINYFISH_API_KEY`
- provide a stable internal API layer
- fit naturally into Next.js

---

## 3. Mock Data Layer

### Responsibility
- provide stable development data
- unblock UI work before live extraction is ready
- act as a fallback demo path
- keep mock mode and live mode aligned

### Why it matters
Mock data is not just for convenience.
It is part of the reliability strategy.

If live extraction is unstable, the app should still:
- render
- demonstrate flows
- show meaningful examples

---

## 4. TinyFish Integration Layer

### Responsibility
- perform live web extraction
- transform relevant football pages into structured outputs
- power live Match Prep and live Player Watch where possible

### Design rules
- server-side only
- centralized integration code
- centralized prompt templates
- structured outputs only
- graceful fallback on failures
- prefer async start plus polling for long-running live extraction

### Recommended file ownership
- `lib/tinyfish.ts`
- `lib/prompts.ts`

### Why centralization matters
Without centralization:
- prompts drift
- error handling becomes inconsistent
- feature pages become harder to maintain

---



## 5. OpenAI Synthesis Layer

### Responsibility
- turn structured football signals into concise readable summaries
- generate compact talking points and short player summaries
- keep the UI concise without replacing structured source-backed fields

### Design rules
- server-side only
- centralized integration code
- structured inputs first
- concise dashboard-friendly outputs
- graceful fallback when synthesis fails

### Recommended file ownership
- `lib/openai.ts`
- shared synthesis prompts in `lib/prompts.ts` or a nearby shared module

### Why this layer exists
TinyFish and mock/live data provide the structured football signals.
OpenAI is used to synthesize those signals into concise club-facing text without forcing UI components to handle raw model output directly.

## 6. Shared Schema Layer

### Responsibility
- define stable response shapes
- validate live outputs
- normalize mock and live mode to one interface

### Expected schemas
- Match Prep
- Player Watch
- Loan Monitor
- Failure responses
- listing/selection responses

### Why it matters
The UI should trust normalized server responses, not raw agent output.

---

## Feature Architecture

## Match Prep

### User flow
1. User selects a match
2. Frontend requests structured match-prep data
3. In mock mode, the route returns the stable mock contract immediately
4. In live mode, the frontend may request either a summary-first pass or a full Match Prep pass
5. The frontend may start a TinyFish run, poll status, and then read the normalized result
6. Response is validated, normalized, and cached in memory for follow-up reads
7. Frontend renders briefing sections

### Main sections
- match overview
- probable lineups
- injuries / absences
- recent context
- key talking points
- sources

### Live mode focus
Match Prep is the best first candidate for live TinyFish extraction because it is:
- demoable
- clearly structured
- easy for judges to understand

OpenAI synthesis can then turn the structured result into concise talking points or a short briefing summary without changing the source-backed core fields.

### Current live implementation notes
- live Match Prep uses a curated football source pack instead of a generic web search start page
- the primary source is Sofascore, with OneFootball, GOAL, B/R Football, and 433 as supporting sources
- the app supports both direct sync reads and async TinyFish start plus polling endpoints
- the app supports `detail=summary` for a faster summary-first live request and `detail=full` for the richer Match Prep pass
- completed Match Prep results are cached in memory per app instance for faster follow-up reads
- active runs are tracked in memory only, so restarting the dev server clears run state and cache

---

## Player Watch

### User flow
1. User selects a club
2. User selects a tracked player
3. Frontend requests structured player-watch data
4. Route handler uses mock or live mode
5. Response is validated and rendered

### Main sections
- player summary
- status badge
- recent updates
- availability notes
- recent mentions
- sources

### Notes
For the MVP, Player Watch can be partially mock-backed if needed, as long as the UX and data contracts are stable.

Where useful, OpenAI can synthesize a short player summary from the structured inputs, but the structured fields remain the source of truth.

---

## Club Package / Loan Monitor

### User flow
1. User selects a club
2. Frontend requests loan-monitor data
3. Backend returns tracked player summaries for that club
4. Frontend renders the premium club-facing dashboard

### Why this feature matters
This is the strongest club-facing story in the MVP.

It helps the product feel like:
- football intelligence for clubs
- not just a generic football summary app

### Demo scope
Supported demo clubs:
- Chelsea
- Manchester United

The architecture must remain generic even though the demo data is club-specific.

---

## Supported Modes

## Mock Mode

### Purpose
- speed up UI development
- support fallback demos
- reduce dependence on live extraction during early development

### Requirements
- always available
- same output shape as live mode
- stable enough for screenshots and recorded demo segments

---

## Live Mode

### Purpose
- showcase TinyFish in the final product
- demonstrate real live web extraction
- improve judge-facing credibility

### Requirements
- server-side only
- same output shape as mock mode
- safe fallback when partial or failed
- never break the page completely

---

## Data Flow

## Mock flow

```text
Page
  -> Route Handler
    -> Mock Dataset
      -> Validation / normalization
        -> UI rendering
```

## Live flow

```text
Page
  -> Route Handler
    -> TinyFish integration
      -> Async run start
        -> External football web pages
          -> Status polling
            -> Structured result
              -> Validation / normalization
                -> In-memory cache
                  -> UI rendering
```

---

## Error Handling Strategy

The architecture should assume:
- missing data
- partial data
- upstream failures
- validation issues
- unsupported demo inputs

### Principles
- fail gracefully
- preserve page usability
- show structured error states
- show partial results when safe
- never crash because one source is missing

### Required page states
Every major page should have:
- loading state
- empty state
- error state
- partial-data state

When live TinyFish progress is available, loading states may also show short progress text such as the current extraction step or the latest agent action.

---

## Club Parameterization

The app must treat clubs as **data**, not as hardcoded product logic.

### Good examples
- `clubId`
- shared club config
- shared routes
- shared page components

### Bad examples
- club-specific core functions
- club-specific architectural branches

### Why this matters
The demo uses:
- Chelsea
- Manchester United

But the architecture must stay reusable.

---

## Folder Structure

A recommended structure:

```text
app/
  page.tsx
  match/[id]/page.tsx
  players/page.tsx
  club/[clubId]/page.tsx
  api/
    clubs/route.ts
    fixtures/route.ts
    match-prep/route.ts
    players/route.ts
    player-watch/route.ts
    loan-monitor/route.ts

components/
  match/
  player/
  club/
  shared/

lib/
  schemas.ts
  mock-data.ts
  clubs.ts
  tinyfish.ts
  prompts.ts
  format.ts

docs/
  architecture.md
  design.md
  demo-script.md
```

The exact structure can vary slightly, but responsibilities should stay separated.

---

## Deployment Model

### Primary development model
- local-first
- mock mode always available
- live mode enabled when ready

### Optional deployment model
- Vercel
- route handlers remain server-side
- environment variables stay in server runtime
- deployment is optional for the hackathon MVP

### Why not GitHub Pages
GitHub Pages is static hosting and does not fit this architecture well because:
- the app uses server-side route handlers
- TinyFish secrets must stay server-side
- the app is not purely static

---

## Security and Secret Handling

### Core rule
Never expose `TINYFISH_API_KEY` to the client.

### Practical rules
- TinyFish calls happen only in server route handlers or server-side helpers
- no live extraction from browser code
- no `NEXT_PUBLIC_` secrets for TinyFish
- no raw upstream response dumping into the UI

---

## Implementation Strategy

Recommended order:

1. foundation and app shell
2. shared schemas and demo data
3. Match Prep in mock mode
4. Player Watch in mock mode
5. Club Package / Loan Monitor in mock mode
6. TinyFish server-side integration
7. OpenAI server-side synthesis integration
8. mock/live switching
9. app-wide loading / error / partial-data polish
10. demo and submission assets
11. optional deployment

### Why this order
It gives the project:
- a visible product early
- a fallback path early
- a stable contract layer before live integration
- lower risk than starting with the hardest infra piece

---

## Trade-Offs

### Chosen trade-offs
- simple architecture over purity
- mock/live dual-mode over live-only fragility
- one codebase over multiple services
- route handlers over custom backend
- demo reliability over ambitious breadth

### Accepted limitations
- no persistence initially
- no user-specific saved watchlists
- no real-time push updates
- limited supported demo clubs
- possibly partial live coverage in some flows

These are acceptable for the hackathon MVP.

---

## Future Evolution

After the hackathon, the architecture could expand into:
- saved watchlists
- historical trend snapshots
- database-backed club/player tracking
- richer club package features
- fan interest and sponsor pulse
- multi-user auth
- deeper source confidence scoring
- background jobs for periodic refresh

These are future extensions, not current requirements.

---

## Final Note

This architecture should feel like:
- a focused product architecture for a hackathon MVP
- not a fake enterprise blueprint
- not a throwaway prototype with no structure

The right balance is:
- small
- clear
- demoable
- resilient
