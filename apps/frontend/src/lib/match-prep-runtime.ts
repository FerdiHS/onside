import {
  createFailureResponse,
  createMeta,
  type MatchPrepPollStatus,
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

const DEFAULT_MATCH_PREP_POLL_INTERVAL_MS = 2_000;

export function getMatchPrepPollIntervalMs(
  status: Extract<MatchPrepPollStatus, "pending" | "running"> = "pending",
): number {
  const raw = process.env.MATCH_PREP_POLL_INTERVAL_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  const fallback = status === "running" ? DEFAULT_MATCH_PREP_POLL_INTERVAL_MS : 1_500;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function retryAfterSeconds(intervalMs: number): string {
  return Math.max(1, Math.ceil(intervalMs / 1000)).toString();
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
