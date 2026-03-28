import type { NextRequest } from "next/server";

import {
  createMockMatchPrepResponse,
  getMatchPrepScenario,
} from "@/lib/mock-data";
import { getCachedMatchPrepResult, setCachedMatchPrepResult } from "@/lib/match-prep-jobs";
import {
  resolveMatchPrepDetail,
  mapMatchPrepRuntimeError,
  resolveMatchPrepMode,
} from "@/lib/match-prep-runtime";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
  isDataMode,
  isMatchPrepDetail,
} from "@/lib/schemas";
import { getLiveMatchPrep } from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  const modeParam = request.nextUrl.searchParams.get("mode")?.trim();
  const detailParam = request.nextUrl.searchParams.get("detail")?.trim();

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

  if (detailParam && !isMatchPrepDetail(detailParam)) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      'detail must be either "summary" or "full".',
      createMeta("mock", "partial"),
      {
        received: detailParam,
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
  const detail = resolveMatchPrepDetail(detailParam);
  if (mode === "mock") {
    return Response.json(createMockMatchPrepResponse(scenario, detail));
  }

  const cached = getCachedMatchPrepResult(matchId, detail);
  if (cached) {
    return Response.json({
      success: true,
      data: cached.data,
      meta: createMeta("live", cached.completeness, {
        progress_supported: true,
        detail,
      }),
    });
  }

  try {
    const result = await getLiveMatchPrep(scenario, detail);

    if (result.kind === "failure") {
      const failure = createFailureResponse(
        result.code,
        result.message,
        createMeta("live", "partial", { progress_supported: true, detail }),
        result.details,
      );

      return Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      });
    }

    setCachedMatchPrepResult({
      matchId,
      detail,
      runId: null,
      data: result.data,
      completeness: result.completeness,
    });

    return Response.json({
      success: true,
      data: result.data,
      meta: createMeta("live", result.completeness, {
        progress_supported: true,
        detail,
      }),
    });
  } catch (error) {
    const failure = mapMatchPrepRuntimeError(error, detail);

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }
}
