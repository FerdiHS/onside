import {
  createFailureResponse,
  createMeta,
  type MatchPrepDetail,
  type FailureResponse,
} from "@/lib/schemas";
import {
  TinyFishConfigError,
  TinyFishUpstreamError,
  isTinyFishConfigured,
} from "@/lib/tinyfish";

export function resolveMatchPrepMode(modeParam?: string): "mock" | "live" {
  if (modeParam === "mock" || modeParam === "live") {
    return modeParam;
  }

  if (process.env.LIVE_TINYFISH?.trim().toLowerCase() === "true") {
    return isTinyFishConfigured() ? "live" : "mock";
  }

  return "mock";
}

export function resolveMatchPrepDetail(detailParam?: string): MatchPrepDetail {
  return detailParam === "summary" ? "summary" : "full";
}

export function mapMatchPrepRuntimeError(
  error: unknown,
  detail: MatchPrepDetail = "full",
): FailureResponse {
  if (error instanceof TinyFishConfigError) {
    return createFailureResponse(
      "INTERNAL_ERROR",
      error.message,
      createMeta("live", "partial", { progress_supported: true, detail }),
    );
  }

  if (error instanceof TinyFishUpstreamError) {
    return createFailureResponse(
      "UPSTREAM_FAILURE",
      error.message,
      createMeta("live", "partial", { progress_supported: true, detail }),
      error.details,
    );
  }

  return createFailureResponse(
    "INTERNAL_ERROR",
    "Unexpected error while building match prep.",
    createMeta("live", "partial", { progress_supported: true, detail }),
  );
}
