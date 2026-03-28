import "server-only";

import type {
  Completeness,
  MatchPrepData,
  MatchPrepDetail,
} from "@/lib/schemas";

export type MatchPrepJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type CachedMatchPrepResult = {
  cacheKey: string;
  matchId: string;
  detail: MatchPrepDetail;
  runId: string | null;
  data: MatchPrepData;
  completeness: Completeness;
  updatedAt: string;
};

type ActiveMatchPrepRun = {
  cacheKey: string;
  matchId: string;
  detail: MatchPrepDetail;
  runId: string;
  status: Extract<MatchPrepJobStatus, "pending" | "running">;
  createdAt: string;
  updatedAt: string;
  streamingUrl: string | null;
};

type MatchPrepStore = {
  cachedByKey: Map<string, CachedMatchPrepResult>;
  activeByKey: Map<string, ActiveMatchPrepRun>;
  requestByRunId: Map<string, { matchId: string; detail: MatchPrepDetail }>;
};

declare global {
  var __onsideMatchPrepStore: MatchPrepStore | undefined;
}

const store = globalThis.__onsideMatchPrepStore ??= {
  cachedByKey: new Map<string, CachedMatchPrepResult>(),
  activeByKey: new Map<string, ActiveMatchPrepRun>(),
  requestByRunId: new Map<string, { matchId: string; detail: MatchPrepDetail }>(),
};

export function getCachedMatchPrepResult(
  matchId: string,
  detail: MatchPrepDetail,
): CachedMatchPrepResult | null {
  return store.cachedByKey.get(createMatchPrepCacheKey(matchId, detail)) ?? null;
}

export function setCachedMatchPrepResult(input: {
  matchId: string;
  detail: MatchPrepDetail;
  runId: string | null;
  data: MatchPrepData;
  completeness: Completeness;
}): CachedMatchPrepResult {
  const cacheKey = createMatchPrepCacheKey(input.matchId, input.detail);
  const cached: CachedMatchPrepResult = {
    cacheKey,
    matchId: input.matchId,
    detail: input.detail,
    runId: input.runId,
    data: input.data,
    completeness: input.completeness,
    updatedAt: new Date().toISOString(),
  };

  store.cachedByKey.set(cacheKey, cached);
  if (input.runId) {
    clearActiveMatchPrepRun(input.runId);
  }

  return cached;
}

export function getActiveMatchPrepRunByMatchId(
  matchId: string,
  detail: MatchPrepDetail,
): ActiveMatchPrepRun | null {
  return store.activeByKey.get(createMatchPrepCacheKey(matchId, detail)) ?? null;
}

export function getActiveMatchPrepRunByRunId(runId: string): ActiveMatchPrepRun | null {
  const request = store.requestByRunId.get(runId);
  if (!request) {
    return null;
  }

  const active = store.activeByKey.get(
    createMatchPrepCacheKey(request.matchId, request.detail),
  );
  return active?.runId === runId ? active : null;
}

export function registerActiveMatchPrepRun(input: {
  matchId: string;
  detail: MatchPrepDetail;
  runId: string;
  status?: Extract<MatchPrepJobStatus, "pending" | "running">;
  streamingUrl?: string | null;
}): ActiveMatchPrepRun {
  const now = new Date().toISOString();
  const cacheKey = createMatchPrepCacheKey(input.matchId, input.detail);
  const active: ActiveMatchPrepRun = {
    cacheKey,
    matchId: input.matchId,
    detail: input.detail,
    runId: input.runId,
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
    streamingUrl: input.streamingUrl ?? null,
  };

  store.activeByKey.set(cacheKey, active);
  store.requestByRunId.set(input.runId, {
    matchId: input.matchId,
    detail: input.detail,
  });
  return active;
}

export function updateActiveMatchPrepRun(input: {
  runId: string;
  status: Extract<MatchPrepJobStatus, "pending" | "running">;
  streamingUrl?: string | null;
}): ActiveMatchPrepRun | null {
  const active = getActiveMatchPrepRunByRunId(input.runId);
  if (!active) {
    return null;
  }

  const updated: ActiveMatchPrepRun = {
    ...active,
    status: input.status,
    streamingUrl:
      input.streamingUrl !== undefined ? input.streamingUrl : active.streamingUrl,
    updatedAt: new Date().toISOString(),
  };

  store.activeByKey.set(updated.cacheKey, updated);
  return updated;
}

export function clearActiveMatchPrepRun(runId: string): void {
  const request = store.requestByRunId.get(runId);
  if (!request) {
    return;
  }

  store.requestByRunId.delete(runId);
  const active = store.activeByKey.get(
    createMatchPrepCacheKey(request.matchId, request.detail),
  );
  if (active?.runId === runId) {
    store.activeByKey.delete(active.cacheKey);
  }
}

export function getKnownMatchPrepRequestForRunId(
  runId: string,
): { matchId: string; detail: MatchPrepDetail } | null {
  return store.requestByRunId.get(runId) ?? null;
}

export function createMatchPrepCacheKey(
  matchId: string,
  detail: MatchPrepDetail,
): string {
  return `${matchId}::${detail}`;
}
