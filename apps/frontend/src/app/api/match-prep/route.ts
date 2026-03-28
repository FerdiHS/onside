import type { NextRequest } from "next/server";

import {
  createMockMatchPrepResponse,
  getMatchPrepScenario,
} from "@/lib/mock-data";
import { getCachedMatchPrepResult, setCachedMatchPrepResult } from "@/lib/match-prep-jobs";
import {
  mapMatchPrepRuntimeError,
  resolveMatchPrepMode,
} from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
  isDataMode,
} from "@/lib/schemas";
import { getLiveMatchPrep } from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  const modeParam = request.nextUrl.searchParams.get("mode")?.trim();

  if (!matchId) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "matchId is required.",
      createMeta("mock", "partial"),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  if (modeParam && !isDataMode(modeParam)) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      'mode must be either "mock" or "live".',
      createMeta("mock", "partial"),
      {
        received: modeParam,
      },
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
      createMeta(modeParam === "live" ? "live" : "mock", "partial"),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const mode = resolveMatchPrepMode(modeParam);
  if (mode === "mock") {
    return Response.json(createMockMatchPrepResponse(scenario));
  }

  const cached = getCachedMatchPrepResult(matchId);
  if (cached) {
    return Response.json({
      success: true,
      data: cached.data,
      meta: createMeta("live", cached.completeness, { progress_supported: true }),
    });
  }

  try {
    const result = await getLiveMatchPrep(scenario);

    if (result.kind === "failure") {
      const failure = createFailureResponse(
        result.code,
        result.message,
        createMeta("live", "partial", { progress_supported: true }),
        result.details,
      );

      return Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      });
    }

    setCachedMatchPrepResult({
      matchId,
      runId: null,
      data: result.data,
      completeness: result.completeness,
    });

    return Response.json({
      success: true,
      data: result.data,
      meta: createMeta("live", result.completeness, { progress_supported: true }),
    });
  } catch (error) {
    const failure = mapMatchPrepRuntimeError(error);

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }
}
