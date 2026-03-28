import type { NextRequest } from "next/server";

import { getMatchPrepScenario } from "@/lib/mock-data";
import {
  clearActiveMatchPrepRun,
  getActiveMatchPrepRunByMatchId,
  getCachedMatchPrepResult,
  getKnownMatchPrepRequestForRunId,
  registerActiveMatchPrepRun,
  setCachedMatchPrepResult,
  updateActiveMatchPrepRun,
} from "@/lib/match-prep-jobs";
import {
  mapMatchPrepRuntimeError,
  resolveMatchPrepDetail,
} from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
  isMatchPrepDetail,
  type MatchPrepDetail,
} from "@/lib/schemas";
import { getLiveMatchPrepRunStatus } from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const runIdParam = request.nextUrl.searchParams.get("runId")?.trim();
  const matchIdParam = request.nextUrl.searchParams.get("matchId")?.trim();
  const detailParam = request.nextUrl.searchParams.get("detail")?.trim();

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

  if (detailParam && !isMatchPrepDetail(detailParam)) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      'detail must be either "summary" or "full".',
      createMeta("live", "partial", { progress_supported: true }),
      {
        received: detailParam,
      },
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const knownRequest = runIdParam ? getKnownMatchPrepRequestForRunId(runIdParam) : null;
  const requestedDetail = detailParam ? resolveMatchPrepDetail(detailParam) : null;
  if (requestedDetail && knownRequest && requestedDetail !== knownRequest.detail) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "detail does not match the known runId for this app instance.",
      createMeta("live", "partial", {
        progress_supported: true,
        detail: knownRequest.detail,
      }),
      {
        run_id: runIdParam,
        requested_detail: requestedDetail,
        known_detail: knownRequest.detail,
      },
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const matchId = matchIdParam ?? knownRequest?.matchId ?? null;
  const detail =
    requestedDetail ?? knownRequest?.detail ?? "full";
  if (!matchId) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "runId is unknown to this app instance. Provide matchId as well or start a new run.",
      createMeta("live", "partial", { progress_supported: true, detail }),
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
        run_id: cached.runId,
        status: "completed",
        cached: true,
        poll_url: buildStatusUrl(matchId, detail),
        result_url: buildResultUrl(matchId, detail),
        result: cached.data,
      },
      meta: createMeta("live", cached.completeness, {
        progress_supported: true,
        detail,
      }),
    });
  }

  const active = getActiveMatchPrepRunByMatchId(matchId, detail);
  const runId = runIdParam ?? active?.runId;
  if (!runId) {
    const failure = createFailureResponse(
      "NOT_FOUND",
      `No active or cached TinyFish run exists for matchId: ${matchId}`,
      createMeta("live", "partial", { progress_supported: true, detail }),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  try {
    const polled = await getLiveMatchPrepRunStatus(runId, scenario, detail);

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
          detail,
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
          poll_url: buildStatusUrl(matchId, detail),
          result_url: buildResultUrl(matchId, detail),
          streaming_url: polled.streamingUrl,
        },
        meta: createMeta("live", "partial", { progress_supported: true, detail }),
      });
    }

    if (polled.kind === "success") {
      setCachedMatchPrepResult({
        matchId,
        detail,
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
          poll_url: buildStatusUrl(matchId, detail),
          result_url: buildResultUrl(matchId, detail),
          streaming_url: polled.streamingUrl,
          result: polled.data,
        },
        meta: createMeta("live", polled.completeness, {
          progress_supported: true,
          detail,
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
        poll_url: buildStatusUrl(matchId, detail),
        result_url: buildResultUrl(matchId, detail),
        streaming_url: polled.streamingUrl,
        error: {
          code: polled.code,
          message: polled.message,
          ...(polled.details ? { details: polled.details } : {}),
        },
      },
      meta: createMeta("live", "partial", { progress_supported: true, detail }),
    });
  } catch (error) {
    const failure = mapMatchPrepRuntimeError(error, detail);

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }
}

function buildStatusUrl(matchId: string, detail: MatchPrepDetail): string {
  return `/api/match-prep/status?matchId=${encodeURIComponent(matchId)}&detail=${detail}`;
}

function buildResultUrl(matchId: string, detail: MatchPrepDetail): string {
  return `/api/match-prep?matchId=${encodeURIComponent(matchId)}&mode=live&detail=${detail}`;
}

function toClientPendingStatus(status: "PENDING" | "RUNNING"): "pending" | "running" {
  return status === "PENDING" ? "pending" : "running";
}
