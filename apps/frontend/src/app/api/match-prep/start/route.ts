import type { NextRequest } from "next/server";

import { getMatchPrepScenario } from "@/lib/mock-data";
import {
  getActiveMatchPrepRunByMatchId,
  getCachedMatchPrepResult,
  registerActiveMatchPrepRun,
} from "@/lib/match-prep-jobs";
import {
  getMatchPrepPollIntervalMs,
  mapMatchPrepRuntimeError,
  retryAfterSeconds,
  resolveMatchPrepDetail,
} from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
  isMatchPrepDetail,
  type MatchPrepDetail,
  type MatchPrepRunResponse,
} from "@/lib/schemas";
import { startLiveMatchPrepRun } from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await parseRequestBody(request);
  if (!body.success) {
    return body.response;
  }

  const matchId = body.matchId;
  const detail = body.detail;
  const scenario = getMatchPrepScenario(matchId);
  if (!scenario) {
    const failure = createFailureResponse(
      "NOT_FOUND",
      `Unsupported matchId: ${matchId}`,
      createMeta("live", "partial", { progress_supported: true, detail }),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const cached = getCachedMatchPrepResult(matchId, detail);
  if (cached) {
    return Response.json({
      success: true,
      data: {
        match_id: matchId,
        status: "completed",
        cached: true,
        poll_url: buildStatusUrl(matchId, detail),
        result_url: buildResultUrl(matchId, detail),
        ...(cached.runId ? { run_id: cached.runId } : {}),
      },
      meta: createMeta("live", cached.completeness, {
        progress_supported: true,
        detail,
      }),
    });
  }

  const active = getActiveMatchPrepRunByMatchId(matchId, detail);
  if (active) {
    const nextPollAfterMs = getMatchPrepPollIntervalMs(active.status);
    const response: MatchPrepRunResponse = {
      success: true,
      data: {
        match_id: matchId,
        run_id: active.runId,
        status: active.status,
        cached: false,
        poll_url: buildStatusUrl(matchId, detail),
        result_url: buildResultUrl(matchId, detail),
        streaming_url: active.streamingUrl,
        next_poll_after_ms: nextPollAfterMs,
      },
      meta: createMeta("live", "partial", { progress_supported: true, detail }),
    };

    return Response.json(response, {
      headers: {
        "Retry-After": retryAfterSeconds(nextPollAfterMs),
      },
    });
  }

  try {
    const started = await startLiveMatchPrepRun(scenario, detail);
    const nextPollAfterMs = getMatchPrepPollIntervalMs("pending");
    registerActiveMatchPrepRun({
      matchId,
      detail,
      runId: started.runId,
      status: "pending",
    });

    const response: MatchPrepRunResponse = {
      success: true,
      data: {
        match_id: matchId,
        run_id: started.runId,
        status: "pending",
        cached: false,
        poll_url: buildStatusUrl(matchId, detail),
        result_url: buildResultUrl(matchId, detail),
        next_poll_after_ms: nextPollAfterMs,
      },
      meta: createMeta("live", "partial", { progress_supported: true, detail }),
    };

    return Response.json(response, {
      headers: {
        "Retry-After": retryAfterSeconds(nextPollAfterMs),
      },
    });
  } catch (error) {
    const failure = mapMatchPrepRuntimeError(error, detail);

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }
}

async function parseRequestBody(request: NextRequest) {
  let raw: unknown;

  try {
    raw = (await request.json()) as unknown;
  } catch {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "Request body must be valid JSON.",
      createMeta("live", "partial", { progress_supported: true }),
    );

    return {
      success: false as const,
      response: Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      }),
    };
  }

  if (!isRecord(raw) || typeof raw.matchId !== "string" || raw.matchId.trim().length === 0) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "Request body must include a non-empty matchId.",
      createMeta("live", "partial", { progress_supported: true }),
    );

    return {
      success: false as const,
      response: Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      }),
    };
  }

  if (
    "detail" in raw &&
    raw.detail !== undefined &&
    raw.detail !== null &&
    (typeof raw.detail !== "string" || !isMatchPrepDetail(raw.detail.trim()))
  ) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      'Request body detail must be either "summary" or "full".',
      createMeta("live", "partial", { progress_supported: true }),
    );

    return {
      success: false as const,
      response: Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      }),
    };
  }

  return {
    success: true as const,
    matchId: raw.matchId.trim(),
    detail:
      typeof raw.detail === "string" && isMatchPrepDetail(raw.detail.trim())
        ? resolveMatchPrepDetail(raw.detail.trim())
        : "full",
  };
}

function buildStatusUrl(matchId: string, detail: MatchPrepDetail): string {
  return `/api/match-prep/status?matchId=${encodeURIComponent(matchId)}&detail=${detail}`;
}

function buildResultUrl(matchId: string, detail: MatchPrepDetail): string {
  return `/api/match-prep?matchId=${encodeURIComponent(matchId)}&mode=live&detail=${detail}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
