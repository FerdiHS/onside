import type { NextRequest } from "next/server";

import { getMatchPrepScenario } from "@/lib/mock-data";
import {
  clearActiveMatchPrepRun,
  getActiveMatchPrepRunByMatchId,
  getCachedMatchPrepResult,
  registerActiveMatchPrepRun,
  updateActiveMatchPrepRun,
} from "@/lib/match-prep-jobs";
import {
  cacheFinalLiveMatchPrepResult,
  finalizeLiveMatchPrepData,
} from "@/lib/match-prep-live";
import {
  createFailureResponse,
  createMeta,
  failureStatusCode,
  isMatchPrepDetail,
  type MatchPrepDetail,
} from "@/lib/schemas";
import {
  TinyFishConfigError,
  TinyFishUpstreamError,
  interpretLiveMatchPrepStreamResult,
  streamLiveMatchPrepRunEvents,
} from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamErrorPayload = {
  match_id: string;
  run_id?: string;
  code: string;
  message: string;
  timestamp?: string;
};

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  const detailParam = request.nextUrl.searchParams.get("detail")?.trim();

  if (!matchId) {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "matchId is required.",
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
      { received: detailParam },
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }

  const detail: MatchPrepDetail = detailParam === "summary" ? "summary" : "full";
  if (detail !== "summary") {
    const failure = createFailureResponse(
      "BAD_REQUEST",
      "Live streaming is currently supported only for detail=summary.",
      createMeta("live", "partial", { progress_supported: true, detail }),
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
    const data = await finalizeLiveMatchPrepData(cached.data, detail);
    if (data !== cached.data) {
      await cacheFinalLiveMatchPrepResult({
        matchId,
        detail,
        runId: cached.runId,
        data,
        completeness: cached.completeness,
      });
    }

    return createEventStreamResponse(async (emit, close) => {
      emit("complete", {
        match_id: matchId,
        ...(cached.runId ? { run_id: cached.runId } : {}),
        result: data,
        completeness: cached.completeness,
        timestamp: new Date().toISOString(),
      });
      close();
    });
  }

  const active = getActiveMatchPrepRunByMatchId(matchId, detail);
  if (active) {
    return createEventStreamResponse(async (emit, close) => {
      emit("started", {
        match_id: matchId,
        run_id: active.runId,
        timestamp: active.createdAt,
      });

      if (active.streamingUrl) {
        emit("preview", {
          match_id: matchId,
          run_id: active.runId,
          streaming_url: active.streamingUrl,
          timestamp: active.updatedAt,
        });
      }

      emit("progress", {
        match_id: matchId,
        run_id: active.runId,
        label: "Reconnecting to the existing TinyFish run through polling.",
        timestamp: new Date().toISOString(),
      });

      emit("error", {
        match_id: matchId,
        run_id: active.runId,
        code: "STREAM_REATTACH_REQUIRED",
        message:
          "A live TinyFish run is already active. Falling back to status polling.",
        timestamp: new Date().toISOString(),
      } satisfies StreamErrorPayload);

      close();
    });
  }

  return createEventStreamResponse(async (emit, close) => {
    let runId: string | null = null;

    try {
      for await (const event of streamLiveMatchPrepRunEvents(scenario, detail)) {
        const eventTimestamp =
          typeof event.timestamp === "string" && event.timestamp.trim().length > 0
            ? event.timestamp
            : new Date().toISOString();

        if (event.type === "STARTED" && event.run_id) {
          runId = event.run_id;
          registerActiveMatchPrepRun({
            matchId,
            detail,
            runId,
            status: "pending",
          });

          emit("started", {
            match_id: matchId,
            run_id: runId,
            timestamp: eventTimestamp,
          });
          continue;
        }

        if (event.type === "STREAMING_URL" && event.streaming_url) {
          if (runId) {
            updateActiveMatchPrepRun({
              runId,
              status: "running",
              streamingUrl: event.streaming_url,
            });
          }

          emit("preview", {
            match_id: matchId,
            ...(runId ? { run_id: runId } : {}),
            streaming_url: event.streaming_url,
            timestamp: eventTimestamp,
          });
          continue;
        }

        if (event.type === "PROGRESS") {
          if (runId) {
            updateActiveMatchPrepRun({
              runId,
              status: "running",
            });
          }

          emit("progress", {
            match_id: matchId,
            ...(runId ? { run_id: runId } : {}),
            label: curateTinyFishProgressLabel(event.purpose),
            ...(typeof event.purpose === "string" && event.purpose.trim().length > 0
              ? { raw_purpose: event.purpose.trim() }
              : {}),
            timestamp: eventTimestamp,
          });
          continue;
        }

        if (event.type === "HEARTBEAT") {
          emit("heartbeat", {
            timestamp: eventTimestamp,
          });
          continue;
        }

        if (event.type === "COMPLETE") {
          if (event.status !== "COMPLETED") {
            if (runId) {
              clearActiveMatchPrepRun(runId);
            }

            emit("error", {
              match_id: matchId,
              ...(runId ? { run_id: runId } : {}),
              code: "UPSTREAM_FAILURE",
              message: "TinyFish finished without a completed status.",
              timestamp: eventTimestamp,
            } satisfies StreamErrorPayload);
            close();
            return;
          }

          const interpreted = interpretLiveMatchPrepStreamResult(
            event.result,
            scenario,
            detail,
            {
              ...(runId ? { run_id: runId } : {}),
              ...(event.status ? { status: event.status } : {}),
              ...(event.streaming_url ? { streaming_url: event.streaming_url } : {}),
              ...(event.timestamp ? { timestamp: event.timestamp } : {}),
            },
          );

          if (interpreted.kind === "failure") {
            if (runId) {
              clearActiveMatchPrepRun(runId);
            }

            emit("error", {
              match_id: matchId,
              ...(runId ? { run_id: runId } : {}),
              code: interpreted.code,
              message: interpreted.message,
              timestamp: eventTimestamp,
            } satisfies StreamErrorPayload);
            close();
            return;
          }

          const data = await cacheFinalLiveMatchPrepResult({
            matchId,
            detail,
            runId,
            data: interpreted.data,
            completeness: interpreted.completeness,
          });

          emit("complete", {
            match_id: matchId,
            ...(runId ? { run_id: runId } : {}),
            result: data,
            completeness: interpreted.completeness,
            timestamp: eventTimestamp,
          });
          close();
          return;
        }

        if (event.type === "ERROR") {
          if (runId) {
            clearActiveMatchPrepRun(runId);
          }

          emit("error", {
            match_id: matchId,
            ...(runId ? { run_id: runId } : {}),
            code: event.error?.code ?? "UPSTREAM_FAILURE",
            message:
              event.message ??
              event.error?.message ??
              "TinyFish streaming failed before completion.",
            timestamp: eventTimestamp,
          } satisfies StreamErrorPayload);
          close();
          return;
        }
      }

      if (runId) {
        clearActiveMatchPrepRun(runId);
      }

      emit("error", {
        match_id: matchId,
        ...(runId ? { run_id: runId } : {}),
        code: "UPSTREAM_FAILURE",
        message: "TinyFish streaming ended before a completed result was received.",
        timestamp: new Date().toISOString(),
      } satisfies StreamErrorPayload);
      close();
    } catch (error) {
      if (runId) {
        clearActiveMatchPrepRun(runId);
      }

      emit("error", {
        match_id: matchId,
        ...(runId ? { run_id: runId } : {}),
        ...mapStreamErrorPayload(error),
        timestamp: new Date().toISOString(),
      } satisfies StreamErrorPayload);
      close();
    }
  });
}

function createEventStreamResponse(
  handler: (
    emit: (event: string, payload: Record<string, unknown>) => void,
    close: () => void,
  ) => Promise<void> | void,
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = (event: string, payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
      };

      const close = () => {
        controller.close();
      };

      void Promise.resolve(handler(emit, close)).catch((error) => {
        emit("error", {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Match Prep live research stream failed unexpectedly.",
          timestamp: new Date().toISOString(),
        });
        close();
      });
    },
  });

  return new Response(stream, {
    headers: STREAM_HEADERS,
  });
}

function curateTinyFishProgressLabel(purpose?: string | null): string {
  const normalized = typeof purpose === "string" ? purpose.trim().toLowerCase() : "";

  if (!normalized) {
    return "Working through live match research";
  }

  if (
    normalized.includes("lineup") ||
    normalized.includes("projected xi") ||
    normalized.includes("starting xi") ||
    normalized.includes("formation")
  ) {
    return "Extracting projected lineup";
  }

  if (
    normalized.includes("fixture") ||
    normalized.includes("match page") ||
    normalized.includes("verify") ||
    normalized.includes("disambiguat")
  ) {
    return "Checking fixture match";
  }

  if (
    normalized.includes("summary") ||
    normalized.includes("context") ||
    normalized.includes("talking point") ||
    normalized.includes("final")
  ) {
    return "Finalizing summary";
  }

  if (
    normalized.includes("source") ||
    normalized.includes("open") ||
    normalized.includes("navigate") ||
    normalized.includes("click") ||
    normalized.includes("sofascore") ||
    normalized.includes("onefootball") ||
    normalized.includes("goal.com") ||
    normalized.includes("goal ")
  ) {
    return "Opening trusted source";
  }

  return "Working through live match research";
}

function mapStreamErrorPayload(error: unknown): Pick<StreamErrorPayload, "code" | "message"> {
  if (error instanceof TinyFishConfigError) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }

  if (error instanceof TinyFishUpstreamError) {
    return {
      code: "UPSTREAM_FAILURE",
      message: error.message,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Match Prep live research failed unexpectedly.",
  };
}
