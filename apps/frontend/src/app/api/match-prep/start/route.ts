import type { NextRequest } from "next/server";

import { getMatchPrepScenario } from "@/lib/mock-data";
import {
  getActiveMatchPrepRunByMatchId,
  getCachedMatchPrepResult,
  registerActiveMatchPrepRun,
} from "@/lib/match-prep-jobs";
import { mapMatchPrepRuntimeError } from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
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
  const scenario = getMatchPrepScenario(matchId);
  if (!scenario) {
    const failure = createFailureResponse(
      "NOT_FOUND",
      `Unsupported matchId: ${matchId}`,
      createMeta("live", "partial", { progress_supported: true }),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const cached = getCachedMatchPrepResult(matchId);
  if (cached) {
    return Response.json({
      success: true,
      data: {
        match_id: matchId,
        run_id: cached.runId,
        status: "completed",
        cached: true,
        poll_url: buildStatusUrl(matchId),
        result_url: buildResultUrl(matchId),
      },
      meta: createMeta("live", cached.completeness, { progress_supported: true }),
    });
  }

  const active = getActiveMatchPrepRunByMatchId(matchId);
  if (active) {
    return Response.json({
      success: true,
      data: {
        match_id: matchId,
        run_id: active.runId,
        status: active.status,
        cached: false,
        poll_url: buildStatusUrl(matchId),
        result_url: buildResultUrl(matchId),
        streaming_url: active.streamingUrl,
      },
      meta: createMeta("live", "partial", { progress_supported: true }),
    });
  }

  try {
    const started = await startLiveMatchPrepRun(scenario);
    registerActiveMatchPrepRun({
      matchId,
      runId: started.runId,
      status: "pending",
    });

    return Response.json({
      success: true,
      data: {
        match_id: matchId,
        run_id: started.runId,
        status: "pending",
        cached: false,
        poll_url: buildStatusUrl(matchId),
        result_url: buildResultUrl(matchId),
      },
      meta: createMeta("live", "partial", { progress_supported: true }),
    });
  } catch (error) {
    const failure = mapMatchPrepRuntimeError(error);

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

  return {
    success: true as const,
    matchId: raw.matchId.trim(),
  };
}

function buildStatusUrl(matchId: string): string {
  return `/api/match-prep/status?matchId=${encodeURIComponent(matchId)}`;
}

function buildResultUrl(matchId: string): string {
  return `/api/match-prep?matchId=${encodeURIComponent(matchId)}&mode=live`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
