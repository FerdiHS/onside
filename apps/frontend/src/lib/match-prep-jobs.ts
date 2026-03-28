import "server-only";

import type { Completeness, MatchPrepData } from "@/lib/schemas";

export type MatchPrepJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type CachedMatchPrepResult = {
  matchId: string;
  runId: string | null;
  data: MatchPrepData;
  completeness: Completeness;
  updatedAt: string;
};

type ActiveMatchPrepRun = {
  matchId: string;
  runId: string;
  status: Extract<MatchPrepJobStatus, "pending" | "running">;
  createdAt: string;
  updatedAt: string;
  streamingUrl: string | null;
};

type MatchPrepStore = {
  cachedByMatchId: Map<string, CachedMatchPrepResult>;
  activeByMatchId: Map<string, ActiveMatchPrepRun>;
  matchIdByRunId: Map<string, string>;
};

declare global {
  var __onsideMatchPrepStore: MatchPrepStore | undefined;
}

const store = globalThis.__onsideMatchPrepStore ??= {
  cachedByMatchId: new Map<string, CachedMatchPrepResult>(),
  activeByMatchId: new Map<string, ActiveMatchPrepRun>(),
  matchIdByRunId: new Map<string, string>(),
};

export function getCachedMatchPrepResult(matchId: string): CachedMatchPrepResult | null {
  return store.cachedByMatchId.get(matchId) ?? null;
}

export function setCachedMatchPrepResult(input: {
  matchId: string;
  runId: string | null;
  data: MatchPrepData;
  completeness: Completeness;
}): CachedMatchPrepResult {
  const cached: CachedMatchPrepResult = {
    matchId: input.matchId,
    runId: input.runId,
    data: input.data,
    completeness: input.completeness,
    updatedAt: new Date().toISOString(),
  };

  store.cachedByMatchId.set(input.matchId, cached);
  if (input.runId) {
    clearActiveMatchPrepRun(input.runId);
  }

  return cached;
}

export function getActiveMatchPrepRunByMatchId(
  matchId: string,
): ActiveMatchPrepRun | null {
  return store.activeByMatchId.get(matchId) ?? null;
}

export function getActiveMatchPrepRunByRunId(runId: string): ActiveMatchPrepRun | null {
  const matchId = store.matchIdByRunId.get(runId);
  if (!matchId) {
    return null;
  }

  const active = store.activeByMatchId.get(matchId);
  return active?.runId === runId ? active : null;
}

export function registerActiveMatchPrepRun(input: {
  matchId: string;
  runId: string;
  status?: Extract<MatchPrepJobStatus, "pending" | "running">;
  streamingUrl?: string | null;
}): ActiveMatchPrepRun {
  const now = new Date().toISOString();
  const active: ActiveMatchPrepRun = {
    matchId: input.matchId,
    runId: input.runId,
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
    streamingUrl: input.streamingUrl ?? null,
  };

  store.activeByMatchId.set(input.matchId, active);
  store.matchIdByRunId.set(input.runId, input.matchId);
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

  store.activeByMatchId.set(active.matchId, updated);
  return updated;
}

export function clearActiveMatchPrepRun(runId: string): void {
  const matchId = store.matchIdByRunId.get(runId);
  if (!matchId) {
    return;
  }

  store.matchIdByRunId.delete(runId);
  const active = store.activeByMatchId.get(matchId);
  if (active?.runId === runId) {
    store.activeByMatchId.delete(matchId);
  }
}

export function getKnownMatchIdForRunId(runId: string): string | null {
  return store.matchIdByRunId.get(runId) ?? null;
}
