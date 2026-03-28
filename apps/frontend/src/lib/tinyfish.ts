import "server-only";

import { z } from "zod";

import type { MatchPrepScenario } from "@/lib/mock-data";
import { buildMatchPrepGoal } from "@/lib/prompts";
import {
  normalizeMatchPrepData,
  type Completeness,
  type FailureCode,
  type MatchPrepData,
  type MatchPrepDetail,
  type MatchPrepSeedContext,
} from "@/lib/schemas";

type TinyFishBrowserProfile = "lite" | "stealth";
export type TinyFishRunStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

type TinyFishProxyConfig = {
  enabled: boolean;
  country_code?: string;
};

type TinyFishRunRequest = {
  url: string;
  goal: string;
  browser_profile?: TinyFishBrowserProfile;
  proxy_config?: TinyFishProxyConfig;
  api_integration?: string;
};

type TinyFishErrorPayload = {
  message?: string;
  category?: string;
  code?: string;
  retry_after?: number;
  help_url?: string;
  help_message?: string;
};

type TinyFishRunResponse = {
  run_id?: string | null;
  status?: TinyFishRunStatus;
  started_at?: string | null;
  finished_at?: string | null;
  num_of_steps?: number | null;
  result?: unknown;
  resultJson?: unknown;
  error?: TinyFishErrorPayload | null;
};

type TinyFishRunDetailsResponse = TinyFishRunResponse & {
  goal?: string;
  created_at?: string | null;
  streaming_url?: string | null;
};

type TinyFishAsyncRunResponse = {
  run_id?: string | null;
  error?: TinyFishErrorPayload | null;
};

type TinyFishGoalFailureEnvelope = {
  success: false;
  error_type?: string;
  error_message?: string;
  partial_data?: unknown;
  data?: unknown;
};

type LiveMatchPrepResult =
  | {
      kind: "success";
      data: MatchPrepData;
      completeness: Completeness;
    }
  | {
      kind: "failure";
      code: FailureCode;
      message: string;
      details?: Record<string, unknown>;
    };

type LiveLoanMonitorResult =
  | {
      kind: "success";
      players: LoanMonitorPlayer[];
    }
  | {
      kind: "failure";
      code: FailureCode;
      message: string;
      details?: Record<string, unknown>;
    };

export type LiveLoanMonitorRunPollResult =
  | {
      kind: "pending";
      runId: string;
      status: Extract<TinyFishRunStatus, "PENDING" | "RUNNING">;
      details?: Record<string, unknown>;
    }
  | {
      kind: "success";
      runId: string;
      status: "COMPLETED";
      players: LoanMonitorPlayer[];
      details?: Record<string, unknown>;
    }
  | {
      kind: "failure";
      runId: string;
      status: Extract<TinyFishRunStatus, "COMPLETED" | "FAILED" | "CANCELLED">;
      code: FailureCode;
      message: string;
      details?: Record<string, unknown>;
    };

export type LoanMonitorPlayer = {
  id: string;
  name: string;
  loanClub: string;
  position: string;
  performance: {
    appearances: number;
    goals: number;
    assists: number;
  };
  developmentNotes: string[];
  status: "rising" | "stable" | "concern";
};

export type LiveMatchPrepRunPollResult =
  | {
      kind: "pending";
      runId: string;
      status: Extract<TinyFishRunStatus, "PENDING" | "RUNNING">;
      streamingUrl: string | null;
      details?: Record<string, unknown>;
    }
  | {
      kind: "success";
      runId: string;
      status: "COMPLETED";
      data: MatchPrepData;
      completeness: Completeness;
      streamingUrl: string | null;
      details?: Record<string, unknown>;
    }
  | {
      kind: "failure";
      runId: string;
      status: Extract<TinyFishRunStatus, "COMPLETED" | "FAILED" | "CANCELLED">;
      code: FailureCode;
      message: string;
      details?: Record<string, unknown>;
      streamingUrl: string | null;
    };

const DEFAULT_BASE_URL = "https://agent.tinyfish.ai";
const RUN_ENDPOINT_PATH = "/v1/automation/run";
const RUN_ASYNC_ENDPOINT_PATH = "/v1/automation/run-async";
const RUNS_ENDPOINT_PATH = "/v1/runs";
const DEFAULT_REQUEST_TIMEOUT_MS = 300_000;

const LoanMonitorPlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  loanClub: z.string().min(1),
  position: z.string().min(1),
  performance: z.object({
    appearances: z.number().int().nonnegative(),
    goals: z.number().int().nonnegative(),
    assists: z.number().int().nonnegative(),
  }),
  developmentNotes: z.array(z.string()),
  status: z.enum(["rising", "stable", "concern"]),
});

const LoanMonitorPayloadSchema = z.object({
  players: z.array(LoanMonitorPlayerSchema),
});

export async function getLiveMatchPrep(
  scenario: MatchPrepScenario,
  detail: MatchPrepDetail = "full",
): Promise<LiveMatchPrepResult> {
  const response = await runTinyFishAutomation(buildAutomationInput(scenario, detail));

  return interpretTinyFishMatchPrepPayload(
    unwrapTinyFishResult(response),
    getScenarioSeed(scenario),
    detail,
    getRunDetails(response),
  );
}

export async function getLiveLoanMonitor(): Promise<LiveLoanMonitorResult> {
  const response = await runTinyFishAutomation({
    url: "https://www.premierleague.com",
    goal: [
      "Return strict JSON only.",
      "Provide exactly 2 football loan players.",
      'Use this shape: {"players":[{"id":"string","name":"string","loanClub":"string","position":"string","performance":{"appearances":0,"goals":0,"assists":0},"developmentNotes":["string"],"status":"rising|stable|concern"}]}',
      "Do not include markdown or extra commentary.",
    ].join(" "),
    api_integration: "onside",
  });

  return interpretTinyFishLoanMonitorPayload(
    unwrapTinyFishResult(response),
    getRunDetails(response),
  );
}

export async function startLiveLoanMonitorRun(): Promise<{ runId: string }> {
  console.log("TinyFish starting new loan-monitor run");

  const response = await runTinyFishAutomationAsync({
    url: "https://www.premierleague.com",
    goal: [
      "Return strict JSON only.",
      "Provide exactly 2 football loan players.",
      'Use this shape: {"players":[{"id":"string","name":"string","loanClub":"string","position":"string","performance":{"appearances":0,"goals":0,"assists":0},"developmentNotes":["string"],"status":"rising|stable|concern"}]}',
      "Do not include markdown or extra commentary.",
    ].join(" "),
    api_integration: "onside",
  });

  if (!response.run_id) {
    throw new TinyFishUpstreamError(
      response.error?.message ?? "TinyFish did not return a run_id for the loan-monitor automation.",
      getTinyFishErrorDetails(response.error),
    );
  }

  console.log("TinyFish loan-monitor runId:", response.run_id);

  return {
    runId: response.run_id,
  };
}

export async function getLiveLoanMonitorRunStatus(
  runId: string,
): Promise<LiveLoanMonitorRunPollResult> {
  console.log("TinyFish polling existing loan-monitor run");
  console.log("TinyFish loan-monitor runId:", runId);

  const run = await getTinyFishRun(runId);
  const runDetails = getRunDetails(run);

  if (run.status === "PENDING" || run.status === "RUNNING") {
    console.log("TinyFish loan-monitor status:", run.status);

    return {
      kind: "pending",
      runId,
      status: run.status,
      details: runDetails,
    };
  }

  if (run.status === "FAILED" || run.status === "CANCELLED") {
    console.log("TinyFish loan-monitor failed");

    return {
      kind: "failure",
      runId,
      status: run.status,
      code: "UPSTREAM_FAILURE",
      message:
        run.error?.message ??
        `TinyFish run ${run.status.toLowerCase()} before producing loan-monitor data.`,
      details: {
        ...runDetails,
        ...getTinyFishErrorDetails(run.error),
      },
    };
  }

  if (run.status !== "COMPLETED") {
    console.log("TinyFish loan-monitor failed");

    return {
      kind: "failure",
      runId,
      status: "FAILED",
      code: "UPSTREAM_FAILURE",
      message: "TinyFish returned an unexpected run status.",
      details: {
        ...runDetails,
        received_status: run.status ?? "unknown",
      },
    };
  }

  const interpreted = interpretTinyFishLoanMonitorPayload(run.result, runDetails);

  if (interpreted.kind === "failure") {
    console.log("TinyFish loan-monitor failed");

    return {
      kind: "failure",
      runId,
      status: "COMPLETED",
      code: interpreted.code,
      message: interpreted.message,
      details: interpreted.details,
    };
  }

  console.log("TinyFish loan-monitor completed");

  return {
    kind: "success",
    runId,
    status: "COMPLETED",
    players: interpreted.players,
    details: runDetails,
  };
}

export async function startLiveMatchPrepRun(
  scenario: MatchPrepScenario,
  detail: MatchPrepDetail = "full",
): Promise<{ runId: string }> {
  const response = await runTinyFishAutomationAsync(buildAutomationInput(scenario, detail));

  if (!response.run_id) {
    throw new TinyFishUpstreamError(
      response.error?.message ?? "TinyFish did not return a run_id for the async automation.",
      getTinyFishErrorDetails(response.error),
    );
  }

  return {
    runId: response.run_id,
  };
}

export async function getLiveMatchPrepRunStatus(
  runId: string,
  scenario: MatchPrepScenario,
  detail: MatchPrepDetail = "full",
): Promise<LiveMatchPrepRunPollResult> {
  const run = await getTinyFishRun(runId);
  const runDetails = getRunDetails(run);
  const streamingUrl = run.streaming_url ?? null;

  if (run.status === "PENDING" || run.status === "RUNNING") {
    return {
      kind: "pending",
      runId,
      status: run.status,
      streamingUrl,
      details: runDetails,
    };
  }

  if (run.status === "FAILED" || run.status === "CANCELLED") {
    return {
      kind: "failure",
      runId,
      status: run.status,
      code: "UPSTREAM_FAILURE",
      message:
        run.error?.message ??
        `TinyFish run ${run.status.toLowerCase()} before producing a structured result.`,
      details: {
        ...runDetails,
        ...getTinyFishErrorDetails(run.error),
      },
      streamingUrl,
    };
  }

  if (run.status !== "COMPLETED") {
    return {
      kind: "failure",
      runId,
      status: "FAILED",
      code: "UPSTREAM_FAILURE",
      message: "TinyFish returned an unexpected run status.",
      details: {
        ...runDetails,
        received_status: run.status ?? "unknown",
      },
      streamingUrl,
    };
  }

  const interpreted = interpretTinyFishMatchPrepPayload(
    run.result,
    getScenarioSeed(scenario),
    detail,
    runDetails,
  );

  if (interpreted.kind === "failure") {
    return {
      kind: "failure",
      runId,
      status: "COMPLETED",
      code: interpreted.code,
      message: interpreted.message,
      details: interpreted.details,
      streamingUrl,
    };
  }

  return {
    kind: "success",
    runId,
    status: "COMPLETED",
    data: interpreted.data,
    completeness: interpreted.completeness,
    streamingUrl,
    details: runDetails,
  };
}

export function isTinyFishConfigured(): boolean {
  return Boolean(process.env.TINYFISH_API_KEY?.trim());
}

export class TinyFishConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TinyFishConfigError";
  }
}

export class TinyFishUpstreamError extends Error {
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "TinyFishUpstreamError";
    this.details = details;
  }
}

function buildAutomationInput(
  scenario: MatchPrepScenario,
  detail: MatchPrepDetail,
): TinyFishRunRequest {
  return {
    url: scenario.live_source_pack.primary.url,
    goal: buildMatchPrepGoal(scenario, detail),
    browser_profile: getBrowserProfile(),
    proxy_config: getProxyConfig(),
    api_integration: "onside",
  };
}

function getScenarioSeed(scenario: MatchPrepScenario): MatchPrepSeedContext {
  return {
    match_id: scenario.mock.match_id,
    competition: scenario.mock.competition,
    kickoff_time: scenario.mock.kickoff_time,
    home_team: scenario.mock.home_team,
    away_team: scenario.mock.away_team,
  };
}

async function runTinyFishAutomation(
  input: TinyFishRunRequest,
): Promise<TinyFishRunResponse> {
  const payload = await requestTinyFishJson(
    RUN_ENDPOINT_PATH,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "TinyFish returned a malformed JSON response.",
  );

  if (!isRecord(payload)) {
    throw new TinyFishUpstreamError("TinyFish returned a malformed JSON response.", {
      payload,
    });
  }

  return payload as TinyFishRunResponse;
}

async function runTinyFishAutomationAsync(
  input: TinyFishRunRequest,
): Promise<TinyFishAsyncRunResponse> {
  const payload = await requestTinyFishJson(
    RUN_ASYNC_ENDPOINT_PATH,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "TinyFish returned a malformed JSON response.",
  );

  if (!isRecord(payload)) {
    throw new TinyFishUpstreamError("TinyFish returned a malformed JSON response.", {
      payload,
    });
  }

  return payload as TinyFishAsyncRunResponse;
}

async function getTinyFishRun(runId: string): Promise<TinyFishRunDetailsResponse> {
  const payload = await requestTinyFishJson(
    `${RUNS_ENDPOINT_PATH}/${encodeURIComponent(runId)}?screenshots=none`,
    {
      method: "GET",
    },
    "TinyFish returned a malformed JSON response.",
  );

  if (!isRecord(payload)) {
    throw new TinyFishUpstreamError("TinyFish returned a malformed JSON response.", {
      payload,
    });
  }

  return payload as TinyFishRunDetailsResponse;
}

async function requestTinyFishJson(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: string;
  },
  malformedMessage: string,
): Promise<unknown> {
  const apiKey = getApiKey();
  let response: Response;

  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      ...(init.body ? { body: init.body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(getRequestTimeoutMs()),
    });
  } catch (error) {
    if (isTimeoutLikeError(error)) {
      throw new TinyFishUpstreamError(
        `TinyFish request timed out after ${getRequestTimeoutMs()}ms.`,
        {
          error_name: getErrorName(error),
          error_message: getErrorMessage(error),
          timeout_ms: getRequestTimeoutMs(),
        },
      );
    }

    throw new TinyFishUpstreamError("Failed to reach TinyFish.", {
      error_name: getErrorName(error),
      error_message: getErrorMessage(error),
    });
  }

  const payload = await readJsonResponse(response, malformedMessage);

  if (!response.ok) {
    throw new TinyFishUpstreamError("TinyFish returned a non-success HTTP status.", {
      status: response.status,
      payload,
    });
  }

  return payload;
}

function unwrapTinyFishResult(response: TinyFishRunResponse): unknown {
  if (response.status === "FAILED") {
    throw new TinyFishUpstreamError(
      response.error?.message ?? "TinyFish automation failed before reaching a structured result.",
      {
        ...getRunDetails(response),
        ...getTinyFishErrorDetails(response.error),
      },
    );
  }

  const candidate =
    response.resultJson !== undefined
      ? response.resultJson
      : response.result !== undefined
        ? response.result
        : undefined;

  if (candidate !== undefined && candidate !== null) {
    return coerceStructuredValue(candidate);
  }

  throw new TinyFishUpstreamError(
    "TinyFish completed without returning a structured result payload.",
    getRunDetails(response),
  );
}

function interpretTinyFishMatchPrepPayload(
  result: unknown,
  seed: MatchPrepSeedContext,
  detail: MatchPrepDetail,
  details?: Record<string, unknown>,
): LiveMatchPrepResult {
  const structuredResult = coerceStructuredValue(result);

  if (isGoalFailureEnvelope(structuredResult)) {
    const partialCandidate = structuredResult.partial_data ?? structuredResult.data;
    if (partialCandidate !== undefined) {
      const normalized = normalizeMatchPrepData(partialCandidate, seed, detail);
      if (normalized.hasMeaningfulSignals) {
        return {
          kind: "success",
          data: normalized.data,
          completeness: "partial",
        };
      }
    }

    return {
      kind: "failure",
      code: "UPSTREAM_FAILURE",
      message:
        structuredResult.error_message ??
        "TinyFish could not complete live match-prep extraction.",
      details: {
        ...(details ?? {}),
        error_type: structuredResult.error_type ?? "goal_failed",
      },
    };
  }

  const payload = unwrapGoalSuccessPayload(structuredResult);
  const normalized = normalizeMatchPrepData(payload, seed, detail);

  if (!normalized.hasMeaningfulSignals) {
    return {
      kind: "failure",
      code: "VALIDATION_ERROR",
      message:
        "TinyFish completed, but the structured payload did not contain usable match-prep fields.",
      details: {
        ...(details ?? {}),
        issues: normalized.issues,
      },
    };
  }

  return {
    kind: "success",
    data: normalized.data,
    completeness: normalized.completeness,
  };
}

function interpretTinyFishLoanMonitorPayload(
  result: unknown,
  details?: Record<string, unknown>,
): LiveLoanMonitorResult {
  const structuredResult = coerceStructuredValue(result);

  if (isGoalFailureEnvelope(structuredResult)) {
    return {
      kind: "failure",
      code: "UPSTREAM_FAILURE",
      message:
        structuredResult.error_message ??
        "TinyFish could not complete live loan-monitor extraction.",
      details: {
        ...(details ?? {}),
        error_type: structuredResult.error_type ?? "goal_failed",
      },
    };
  }

  const payload = unwrapGoalSuccessPayload(structuredResult);
  const parsed = LoanMonitorPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      kind: "failure",
      code: "VALIDATION_ERROR",
      message:
        "TinyFish completed, but the structured payload did not contain usable loan-monitor fields.",
      details: {
        ...(details ?? {}),
        issues: parsed.error.issues,
      },
    };
  }

  return {
    kind: "success",
    players: parsed.data.players,
  };
}

function unwrapGoalSuccessPayload(result: unknown): unknown {
  let current = coerceStructuredValue(result);

  while (isRecord(current)) {
    if (current.success === false) {
      return current;
    }

    if (current.success === true && "data" in current) {
      current = coerceStructuredValue(current.data);
      continue;
    }

    if ("resultJson" in current && current.resultJson !== undefined) {
      current = coerceStructuredValue(current.resultJson);
      continue;
    }

    if ("result" in current && current.result !== undefined) {
      current = coerceStructuredValue(current.result);
      continue;
    }

    return current;
  }

  return current;
}

function isGoalFailureEnvelope(value: unknown): value is TinyFishGoalFailureEnvelope {
  return isRecord(value) && value.success === false;
}

function getApiKey(): string {
  const apiKey = process.env.TINYFISH_API_KEY?.trim();
  if (!apiKey) {
    throw new TinyFishConfigError(
      "TINYFISH_API_KEY is missing. Add it to apps/frontend/.env.local or the project root .env.local before using live mode.",
    );
  }

  return apiKey;
}

function getBaseUrl(): string {
  return process.env.TINYFISH_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getRequestTimeoutMs(): number {
  const raw = process.env.TINYFISH_TIMEOUT_MS?.trim();
  if (!raw) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_REQUEST_TIMEOUT_MS;
}

function getBrowserProfile(): TinyFishBrowserProfile {
  return process.env.TINYFISH_BROWSER_PROFILE?.trim() === "stealth"
    ? "stealth"
    : "lite";
}

function getProxyConfig(): TinyFishProxyConfig | undefined {
  const countryCode = process.env.TINYFISH_PROXY_COUNTRY?.trim().toUpperCase();
  if (!countryCode) {
    return undefined;
  }

  return {
    enabled: true,
    country_code: countryCode,
  };
}

async function readJsonResponse(
  response: Response,
  malformedMessage: string,
): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new TinyFishUpstreamError(malformedMessage, {
      status: response.status,
      body: text,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimeoutLikeError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function getRunDetails(
  response: TinyFishRunResponse | TinyFishRunDetailsResponse,
): Record<string, unknown> {
  return {
    ...(response.run_id ? { run_id: response.run_id } : {}),
    ...(response.status ? { status: response.status } : {}),
    ...(response.started_at ? { started_at: response.started_at } : {}),
    ...(response.finished_at ? { finished_at: response.finished_at } : {}),
    ...(response.num_of_steps !== undefined && response.num_of_steps !== null
      ? { num_of_steps: response.num_of_steps }
      : {}),
    ...("goal" in response && typeof response.goal === "string" && response.goal
      ? { goal: response.goal }
      : {}),
    ...("created_at" in response && response.created_at
      ? { created_at: response.created_at }
      : {}),
    ...("streaming_url" in response && response.streaming_url
      ? { streaming_url: response.streaming_url }
      : {}),
  };
}

function getTinyFishErrorDetails(
  error?: TinyFishErrorPayload | null,
): Record<string, unknown> {
  if (!error) {
    return {};
  }

  return {
    ...(error.category ? { error_category: error.category } : {}),
    ...(error.code ? { error_code: error.code } : {}),
    ...(error.retry_after !== undefined ? { retry_after: error.retry_after } : {}),
    ...(error.help_url ? { help_url: error.help_url } : {}),
    ...(error.help_message ? { help_message: error.help_message } : {}),
  };
}

function coerceStructuredValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }

  const direct = tryParseJson(trimmed);
  if (direct !== undefined) {
    return direct;
  }

  const fenced = extractFencedJson(trimmed);
  if (fenced) {
    const parsed = tryParseJson(fenced);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return value;
}

function tryParseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function extractFencedJson(value: string): string | null {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/u);
  return match?.[1] ?? null;
}
