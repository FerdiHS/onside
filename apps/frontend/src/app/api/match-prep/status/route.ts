import type { NextRequest } from "next/server";

import { getMatchPrepScenario } from "@/lib/mock-data";
import {
  clearActiveMatchPrepRun,
  getActiveMatchPrepRunByMatchId,
  getCachedMatchPrepResult,
  getKnownMatchIdForRunId,
  registerActiveMatchPrepRun,
  setCachedMatchPrepResult,
  updateActiveMatchPrepRun,
} from "@/lib/match-prep-jobs";
import { mapMatchPrepRuntimeError } from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
} from "@/lib/schemas";
import { getLiveMatchPrepRunStatus } from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const runIdParam = request.nextUrl.searchParams.get("runId")?.trim();
  const matchIdParam = request.nextUrl.searchParams.get("matchId")?.trim();

  if (!runIdParam && !matchIdParam) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      'Provide either "runId" or "matchId".',
      createMeta("live", "partial", { progress_supported: true }),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const matchId = matchIdParam ?? (runIdParam ? getKnownMatchIdForRunId(runIdParam) : null);
  if (!matchId) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "runId is unknown to this app instance. Provide matchId as well or start a new run.",
      createMeta("live", "partial", { progress_supported: true }),
      runIdParam ? { run_id: runIdParam } : undefined,
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

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
        result: cached.data,
      },
      meta: createMeta("live", cached.completeness, { progress_supported: true }),
    });
  }

  const active = getActiveMatchPrepRunByMatchId(matchId);
  const runId = runIdParam ?? active?.runId;
  if (!runId) {
    const failure = createFailureResponse(
      "NOT_FOUND",
      `No active or cached TinyFish run exists for matchId: ${matchId}`,
      createMeta("live", "partial", { progress_supported: true }),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  try {
    const polled = await getLiveMatchPrepRunStatus(runId, scenario);

    if (polled.kind === "pending") {
      if (active) {
        updateActiveMatchPrepRun({
          runId,
          status: toClientPendingStatus(polled.status),
          streamingUrl: polled.streamingUrl,
        });
      } else {
        registerActiveMatchPrepRun({
          matchId,
          runId,
          status: toClientPendingStatus(polled.status),
          streamingUrl: polled.streamingUrl,
        });
      }

      return Response.json({
        success: true,
        data: {
          match_id: matchId,
          run_id: runId,
          status: toClientPendingStatus(polled.status),
          cached: false,
          poll_url: buildStatusUrl(matchId),
          result_url: buildResultUrl(matchId),
          streaming_url: polled.streamingUrl,
        },
        meta: createMeta("live", "partial", { progress_supported: true }),
      });
    }

    if (polled.kind === "success") {
      setCachedMatchPrepResult({
        matchId,
        runId,
        data: polled.data,
        completeness: polled.completeness,
      });

      return Response.json({
        success: true,
        data: {
          match_id: matchId,
          run_id: runId,
          status: "completed",
          cached: false,
          poll_url: buildStatusUrl(matchId),
          result_url: buildResultUrl(matchId),
          streaming_url: polled.streamingUrl,
          result: polled.data,
        },
        meta: createMeta("live", polled.completeness, {
          progress_supported: true,
        }),
      });
    }

    clearActiveMatchPrepRun(runId);

    return Response.json({
      success: true,
      data: {
        match_id: matchId,
        run_id: runId,
        status: polled.status === "CANCELLED" ? "cancelled" : "failed",
        cached: false,
        poll_url: buildStatusUrl(matchId),
        result_url: buildResultUrl(matchId),
        streaming_url: polled.streamingUrl,
        error: {
          code: polled.code,
          message: polled.message,
          ...(polled.details ? { details: polled.details } : {}),
        },
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

function buildStatusUrl(matchId: string): string {
  return `/api/match-prep/status?matchId=${encodeURIComponent(matchId)}`;
}

function buildResultUrl(matchId: string): string {
  return `/api/match-prep?matchId=${encodeURIComponent(matchId)}&mode=live`;
}

function toClientPendingStatus(status: "PENDING" | "RUNNING"): "pending" | "running" {
  return status === "PENDING" ? "pending" : "running";
}
