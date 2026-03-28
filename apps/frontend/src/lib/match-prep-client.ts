import type {
  FailureResponse,
  FixturesResponse,
  MatchPrepDetail,
  MatchPrepResponse,
  MatchPrepRunResponse,
} from "@/lib/schemas";

import type { FrontendMatchPrepMode } from "@/lib/frontend-config";

export class FrontendApiError extends Error {
  code: FailureResponse["error"]["code"];
  details?: Record<string, unknown>;
  status: number;

  constructor(
    message: string,
    input: {
      code: FailureResponse["error"]["code"];
      status: number;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "FrontendApiError";
    this.code = input.code;
    this.details = input.details;
    this.status = input.status;
  }
}

type MatchPrepRunFetchResult = {
  response: MatchPrepRunResponse;
  retryAfterMs: number | null;
};

const DEFAULT_POLL_DELAY_MS = 2_000;

export async function fetchFixtures(input?: {
  clubId?: string;
  competition?: string;
}): Promise<FixturesResponse> {
  const params = new URLSearchParams();
  if (input?.clubId) {
    params.set("clubId", input.clubId);
  }
  if (input?.competition) {
    params.set("competition", input.competition);
  }

  const query = params.toString();
  return fetchApiJson<FixturesResponse>(`/api/fixtures${query ? `?${query}` : ""}`);
}

export async function fetchMatchPrep(input: {
  matchId: string;
  mode: FrontendMatchPrepMode;
  detail: MatchPrepDetail;
}): Promise<MatchPrepResponse> {
  const params = new URLSearchParams({
    matchId: input.matchId,
    mode: input.mode,
    detail: input.detail,
  });

  return fetchApiJson<MatchPrepResponse>(`/api/match-prep?${params.toString()}`);
}

export async function startMatchPrepRun(input: {
  matchId: string;
  detail: MatchPrepDetail;
}): Promise<MatchPrepRunFetchResult> {
  return fetchApiRunJson("/api/match-prep/start", {
    method: "POST",
    body: JSON.stringify({
      matchId: input.matchId,
      detail: input.detail,
    }),
  });
}

export async function pollMatchPrepStatus(input: {
  matchId: string;
  detail: MatchPrepDetail;
}): Promise<MatchPrepRunFetchResult> {
  const params = new URLSearchParams({
    matchId: input.matchId,
    detail: input.detail,
  });

  return fetchApiRunJson(`/api/match-prep/status?${params.toString()}`);
}

export function resolvePollDelayMs(
  response: MatchPrepRunResponse,
  retryAfterMs: number | null,
): number {
  return response.data.next_poll_after_ms ?? retryAfterMs ?? DEFAULT_POLL_DELAY_MS;
}

export function formatKickoff(kickoffTime: string | null): {
  dateLabel: string;
  timeLabel: string;
  fullLabel: string;
} {
  if (!kickoffTime) {
    return {
      dateLabel: "TBD",
      timeLabel: "Time TBD",
      fullLabel: "Kickoff TBD",
    };
  }

  const kickoff = new Date(kickoffTime);
  if (Number.isNaN(kickoff.getTime())) {
    return {
      dateLabel: "TBD",
      timeLabel: "Time TBD",
      fullLabel: "Kickoff TBD",
    };
  }

  const dateLabel = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(kickoff);

  const timeLabel = `${new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(kickoff)} UTC`;

  return {
    dateLabel,
    timeLabel,
    fullLabel: `${dateLabel} at ${timeLabel}`,
  };
}

async function fetchApiRunJson(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<MatchPrepRunFetchResult> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as unknown;

  if (isFailureResponse(payload)) {
    throw new FrontendApiError(payload.error.message, {
      code: payload.error.code,
      status: response.status,
      details: payload.error.details,
    });
  }

  return {
    response: payload as MatchPrepRunResponse,
    retryAfterMs: parseRetryAfterMs(response.headers.get("Retry-After")),
  };
}

async function fetchApiJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input, { cache: "no-store" });
  const payload = (await response.json()) as unknown;

  if (isFailureResponse(payload)) {
    throw new FrontendApiError(payload.error.message, {
      code: payload.error.code,
      status: response.status,
      details: payload.error.details,
    });
  }

  return payload as T;
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number.parseInt(value, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return seconds * 1000;
}

function isFailureResponse(value: unknown): value is FailureResponse {
  return isRecord(value) && value.success === false && isRecord(value.error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
