# CONTRACTS

## Purpose

This document defines the **data contracts** and **route-level contracts** for Onside.

The goal is to keep the MVP predictable, validateable, and easy to evolve during the hackathon.

This is **not** a public enterprise API specification. It is the source of truth for:

- frontend to backend contracts
- mock mode and live mode response shapes
- shared domain models
- error and fallback behavior

---

## Design Principles

1. **Structured outputs first**
   - Every server response should have a stable shape.
   - The UI should not depend on raw unvalidated agent output.

2. **Same contract for mock and live mode**
   - Mock mode and live TinyFish mode should return the same response shapes.

3. **Graceful degradation**
   - Partial responses are allowed.
   - Missing data must not break the page.

4. **Server-only live extraction**
   - TinyFish is called server-side only.
   - The client never receives raw secrets or uncontrolled agent outputs.

5. **Generic product, club-specific demo**
   - Chelsea and Manchester United are demo clubs only.
   - Contracts must remain generic.

6. **Structured synthesis stays secondary**
   - OpenAI-powered synthesis may enrich summaries or talking points.
   - Structured source-backed fields remain the source of truth.

---

## Shared Conventions

### Content type

All JSON routes return:

```http
Content-Type: application/json
```

### Timestamps

Use ISO 8601 UTC timestamps where applicable.

Example:

```json
"generated_at": "2026-03-28T12:34:56Z"
```

### IDs

IDs are string-based for the hackathon MVP.

Examples:

- `clubId`: `"chelsea"`
- `playerId`: `"jimmy-jay-morgan"`
- `matchId`: `"friendly-usa-vs-belgium-2026-03-28"`

No UUID requirement for the MVP.

### Enums

#### Status

```ts
type WatchStatus = "rising" | "stable" | "concern";
```

#### Mode

```ts
type DataMode = "mock" | "live";
```

#### Result completeness

```ts
type Completeness = "full" | "partial";
```

---

## Standard Response Metadata

Feature responses should include metadata where useful:

```ts
type ResponseMeta = {
  mode: "mock" | "live";
  completeness: "full" | "partial";
  generated_at: string;
  detail?: "summary" | "full";
  progress_supported?: boolean;
};
```

This metadata helps:

- explain the current execution mode
- communicate fallback behavior
- support debugging during demo

---

## Error Contract

### Failure Response

All route-level failures should normalize to this shape:

```ts
type FailureResponse = {
  success: false;
  error: {
    code:
      | "BAD_REQUEST"
      | "NOT_FOUND"
      | "UPSTREAM_FAILURE"
      | "VALIDATION_ERROR"
      | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: Partial<ResponseMeta>;
};
```

### Notes

- `UPSTREAM_FAILURE` is used when TinyFish or another live extraction step fails.
- `VALIDATION_ERROR` is used when structured output cannot be safely parsed.
- `NOT_FOUND` is used when the requested club, match, or player does not exist in supported demo scope.

---

## Shared Domain Models

## SourceLink

```ts
type SourceLink = {
  title: string;
  url: string;
  domain?: string | null;
};
```

---

## Club

```ts
type Club = {
  id: string;
  name: string;
  short_name?: string | null;
  badge_url?: string | null;
  primary_color?: string | null;
};
```

---

## MatchSummary

Used on the homepage and selection views.

```ts
type MatchSummary = {
  id: string;
  competition: string | null;
  kickoff_time: string | null;
  home_team: string;
  away_team: string;
  home_club_id?: string | null;
  away_club_id?: string | null;
};
```

---

## PlayerSummary

Used in lists and club package cards.

```ts
type PlayerSummary = {
  id: string;
  name: string;
  parent_club_id: string;
  current_club_name?: string | null;
  role?: string | null;
  status: "rising" | "stable" | "concern";
  summary: string;
};
```

---

## Synthesis Contract

OpenAI-powered synthesis is optional but supported.

### Rules

- OpenAI synthesis happens server-side only.
- It should enrich existing structured outputs, not replace them.
- If synthesis fails, the route may still return `success: true` as long as the structured fields are valid.
- Synthesized text should remain concise and grounded in the structured inputs.

### Typical uses

- Match Prep concise briefing summary
- Match Prep polished talking points
- Player Watch short summary
- Loan Monitor short player summaries

## Match Prep Contracts

## MatchPrepResponse

```ts
type MatchPrepResponse = {
  success: true;
  data: {
    match_id: string;
    competition: string | null;
    kickoff_time: string | null;
    home_team: string;
    away_team: string;
    probable_lineups: {
      home: string[];
      away: string[];
    };
    injuries_or_absences: {
      home: string[];
      away: string[];
    };
    recent_context: string[];
    key_talking_points: string[];
    sources: SourceLink[];
    display?: {
      probable_lineups: {
        home: {
          items: string[];
          provenance: "source-backed" | "ai-assisted" | "mixed";
          note?: string;
          confidence?: "low" | "medium" | "high";
        };
        away: {
          items: string[];
          provenance: "source-backed" | "ai-assisted" | "mixed";
          note?: string;
          confidence?: "low" | "medium" | "high";
        };
      };
      injuries_or_absences: {
        home: {
          items: string[];
          provenance: "source-backed" | "ai-assisted" | "mixed";
          note?: string;
          confidence?: "low" | "medium" | "high";
        };
        away: {
          items: string[];
          provenance: "source-backed" | "ai-assisted" | "mixed";
          note?: string;
          confidence?: "low" | "medium" | "high";
        };
      };
      recent_context: {
        items: string[];
        provenance: "source-backed" | "ai-assisted" | "mixed";
        note?: string;
        confidence?: "low" | "medium" | "high";
      };
      key_talking_points: {
        items: string[];
        provenance: "source-backed" | "ai-assisted" | "mixed";
        note?: string;
        confidence?: "low" | "medium" | "high";
      };
    };
  };
  meta: ResponseMeta;
};
```

### Rules

- `probable_lineups.home` and `probable_lineups.away` may be empty arrays.
- `injuries_or_absences` may be empty even when the response is valid.
- `recent_context` and `key_talking_points` should be concise and factual.
- No invented facts.
- Root Match Prep fields stay as the normalized TinyFish payload.
- `data.display` is optional and may contain AI-assisted fallback presentation fields for summary-mode live responses.

---

## Player Watch Contracts

## PlayerWatchResponse

```ts
type PlayerWatchResponse = {
  success: true;
  data: {
    club_id: string;
    player_id: string;
    player_name: string;
    status: "rising" | "stable" | "concern";
    recent_updates: string[];
    availability_notes: string[];
    recent_mentions: string[];
    summary: string;
    sources: SourceLink[];
  };
  meta: ResponseMeta;
};
```

### Rules

- `club_id` refers to the parent club context in the app.
- `recent_updates`, `availability_notes`, and `recent_mentions` may be empty.
- `summary` should still exist even in partial mode, but it may be brief.

---

## Loan Monitor Contracts

## LoanMonitorResponse

```ts
type LoanMonitorResponse = {
  success: true;
  data: {
    club_id: string;
    club_name: string;
    players: Array<{
      id: string;
      name: string;
      parent_club_id: string;
      current_club_name?: string | null;
      role?: string | null;
      status: "rising" | "stable" | "concern";
      summary: string;
      latest_updates: string[];
      sources: SourceLink[];
    }>;
  };
  meta: ResponseMeta;
};
```

### Rules

- This is a club-facing extension of Player Watch.
- The page may initially support only a few tracked players per demo club.
- `players` may be empty only if the selected club is supported but no player dataset exists yet.

---

## Selector / Listing Contracts

## ClubsResponse

```ts
type ClubsResponse = {
  success: true;
  data: Club[];
  meta: ResponseMeta;
};
```

---

## FixturesResponse

```ts
type FixturesResponse = {
  success: true;
  data: MatchSummary[];
  meta: ResponseMeta;
};
```

### Notes

- For the MVP, fixtures may come from mock data.
- Live fixture sourcing can be added later without changing the response shape.

---

## PlayersForClubResponse

```ts
type PlayersForClubResponse = {
  success: true;
  data: {
    club_id: string;
    players: PlayerSummary[];
  };
  meta: ResponseMeta;
};
```

---

## Route Contracts

These contracts assume Next.js Route Handlers under `app/api`.

The exact HTTP methods can remain simple for the MVP.

## `GET /api/clubs`

### Purpose

Return supported demo clubs.

### Query params

None.

### Success

```json
{
  "success": true,
  "data": [
    {
      "id": "chelsea",
      "name": "Chelsea"
    },
    {
      "id": "manchester-united",
      "name": "Manchester United"
    }
  ],
  "meta": {
    "mode": "mock",
    "completeness": "full",
    "generated_at": "2026-03-28T12:34:56Z"
  }
}
```

---

## `GET /api/fixtures`

### Purpose

Return available fixtures for Match Prep selection.

### Query params

Optional:

- `clubId`
- `competition`

### Success

Returns `FixturesResponse`.

### Failure

Returns `FailureResponse`.

### Current implementation notes

- The current implementation is mock-backed from the seeded Match Prep scenario list.
- Only fixtures with kickoff times at or after the current server time are returned.
- Optional `clubId` filters by either home or away club slug.
- Optional `competition` filters by exact competition label.

---

## `GET /api/match-prep?matchId=<id>`

### Purpose

Return structured match prep data.

### Notes

- The route may internally use OpenAI server-side synthesis to polish talking points or summaries.
- Even when synthesis is used, the returned shape must remain `MatchPrepResponse`.

### Required query params

- `matchId`

### Optional query params

- `mode=mock|live`
- `detail=summary|full`

### Success

Returns `MatchPrepResponse`.

### Failure

Returns `FailureResponse`.

### Notes

- `mode` can be omitted if the app decides mode using environment config.
- If live extraction partially fails, the route may still return `success: true` with `meta.completeness = "partial"`.
- In the current implementation, this route also returns a cached completed live result when one exists for the requested `matchId`.
- `detail=summary` keeps the same `MatchPrepResponse` shape but asks TinyFish for a lighter, faster summary-oriented live pass.
- When `OPENAI_API_KEY` is configured, live `detail=summary` responses may include `data.display` with AI-assisted projected lineups or summary bullets while leaving the root TinyFish fields unchanged.
- `detail=full` requests the richer Match Prep extraction and is the default when `detail` is omitted.

---

## `POST /api/match-prep/start`

### Purpose

Start a long-running live Match Prep TinyFish run and return a pollable handle quickly.

### Request body

```json
{
  "matchId": "friendly-usa-vs-belgium-2026-03-28",
  "detail": "summary"
}
```

### Success

```json
{
  "success": true,
  "data": {
    "match_id": "friendly-usa-vs-belgium-2026-03-28",
    "run_id": "tf_run_123",
    "status": "pending",
    "cached": false,
    "poll_url": "/api/match-prep/status?matchId=friendly-usa-vs-belgium-2026-03-28&detail=summary",
    "result_url": "/api/match-prep?matchId=friendly-usa-vs-belgium-2026-03-28&mode=live&detail=summary",
    "next_poll_after_ms": 1500
  },
  "meta": {
    "mode": "live",
    "completeness": "partial",
    "generated_at": "2026-03-28T12:34:56Z",
    "detail": "summary",
    "progress_supported": true
  }
}
```

### Notes

- If a completed cached result already exists, the route may return `status: "completed"` with `cached: true`.
- Cached responses that were produced by the direct sync Match Prep route may omit `run_id`, because no async TinyFish run handle exists for them.
- If an active run already exists for the same `matchId`, the route may return that existing `run_id` instead of starting a duplicate run.
- Pending responses include `next_poll_after_ms` and a `Retry-After` header to guide frontend polling cadence.
- `detail` is optional and defaults to `full` in the current route implementation.
- Failures return `FailureResponse`.

---

## `GET /api/match-prep/status?matchId=<id>`

### Purpose

Poll the current TinyFish run state for Match Prep and return the normalized result once it is ready.

### Query params

One of:

- `matchId`
- `runId`

Recommended:

- `matchId`

Optional:

- `detail=summary|full`

### Success states

- `status: "pending"`
- `status: "running"`
- `status: "completed"`
- `status: "failed"`
- `status: "cancelled"`

### Completed example

```json
{
  "success": true,
  "data": {
    "match_id": "friendly-usa-vs-belgium-2026-03-28",
    "run_id": "tf_run_123",
    "status": "completed",
    "cached": false,
    "poll_url": "/api/match-prep/status?matchId=friendly-usa-vs-belgium-2026-03-28&detail=summary",
    "result_url": "/api/match-prep?matchId=friendly-usa-vs-belgium-2026-03-28&mode=live&detail=summary",
    "result": {
      "match_id": "friendly-usa-vs-belgium-2026-03-28",
      "competition": "International Friendly",
      "kickoff_time": "2026-03-28T19:30:00Z",
      "home_team": "USA",
      "away_team": "Belgium",
      "probable_lineups": { "home": [], "away": [] },
      "injuries_or_absences": { "home": [], "away": [] },
      "recent_context": [],
      "key_talking_points": [],
      "sources": []
    }
  },
  "meta": {
    "mode": "live",
    "completeness": "partial",
    "generated_at": "2026-03-28T12:34:56Z",
    "detail": "summary",
    "progress_supported": true
  }
}
```

### Notes

- In the current implementation, active run tracking and completed-result caching are in-memory only.
- Cached responses that were produced by the direct sync Match Prep route may omit `run_id`, because no async TinyFish run handle exists for them.
- Pending responses include `next_poll_after_ms` and a `Retry-After` header to guide frontend polling cadence.
- If the dev server restarts, a previously returned `runId` may no longer be known to the app instance unless `matchId` is also provided.
- Failures inside a completed or cancelled TinyFish run are returned inside the success payload's `data.error` field so the UI can keep polling and rendering one stable shape.
- Route-level validation or config failures still return `FailureResponse`.

---

## `GET /api/players?clubId=<id>`

### Purpose

Return tracked players for a selected club.

### Required query params

- `clubId`

### Success

Returns `PlayersForClubResponse`.

### Failure

Returns `FailureResponse`.

---

## `GET /api/player-watch?clubId=<id>&playerId=<id>`

### Purpose

Return structured player watch data for a selected club/player pair.

### Notes

- The route may internally use OpenAI server-side synthesis to produce the short summary field.
- Even when synthesis is used, the returned shape must remain `PlayerWatchResponse`.

### Required query params

- `clubId`
- `playerId`

### Optional query params

- `mode=mock|live`

### Success

Returns `PlayerWatchResponse`.

### Failure

Returns `FailureResponse`.

---

## `GET /api/loan-monitor?clubId=<id>`

### Purpose

Return the club package / loan monitor view.

### Required query params

- `clubId`

### Optional query params

- `mode=mock|live`

### Success

Returns `LoanMonitorResponse`.

### Failure

Returns `FailureResponse`.

---

## Mode Contract

## Mock mode

- Uses local structured demo data.
- Must obey the same response shape as live mode.
- Must always remain available during development.

## Live mode

- Uses TinyFish-backed server-side extraction.
- Must still return the same response shape.
- May set `meta.completeness = "partial"` when some fields are unavailable.
- Long-running live extraction may use a start plus poll flow without changing the final structured Match Prep result contract.

---

## Validation Contract

All live responses should be normalized through shared runtime validation before reaching the UI.

Expected validation flow:

1. fetch or receive raw result
2. parse JSON
3. validate against schema
4. normalize missing fields
5. return route-level response

If validation fails, return:

- `FailureResponse`
- `error.code = "VALIDATION_ERROR"`

---

## Optional Progress Streaming Contract

This contract is only needed if the app implements live progress text during loading.

### Purpose

Allow the UI to show what the live agent is currently doing during a long-running extraction.

### Suggested event shape

```ts
type ProgressEvent = {
  type: "progress";
  step: string;
  timestamp?: string;
};
```

### Rules

- Progress events are optional.
- The UI must still work if no progress events are available.
- Progress text should be concise and safe to display.
- Missing progress support must not change the final JSON route contract.

## Contract Stability Rules

During the hackathon:

- prefer additive changes
- avoid breaking response shapes unnecessarily
- keep mock and live mode aligned
- update this file if route or response contracts change materially

---

## Future Extensions

Possible future additions without breaking the current design:

- source confidence / confidence score
- richer fixture filters
- own squad watch
- fan interest pulse
- sponsor pulse
- persistence / saved watchlists
- auth and user-specific dashboards

These are out of scope for the MVP and should not change the current contracts unless explicitly implemented.
