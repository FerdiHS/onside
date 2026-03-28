import "server-only";

import { ensureLiveSummaryMatchPrepDisplay } from "@/lib/openai";
import { setCachedMatchPrepResult } from "@/lib/match-prep-jobs";
import type {
  Completeness,
  MatchPrepData,
  MatchPrepDetail,
} from "@/lib/schemas";

export async function finalizeLiveMatchPrepData(
  data: MatchPrepData,
  detail: MatchPrepDetail,
): Promise<MatchPrepData> {
  return detail === "summary"
    ? ensureLiveSummaryMatchPrepDisplay(data)
    : data;
}

export async function cacheFinalLiveMatchPrepResult(input: {
  matchId: string;
  detail: MatchPrepDetail;
  runId: string | null;
  data: MatchPrepData;
  completeness: Completeness;
}): Promise<MatchPrepData> {
  const finalData = await finalizeLiveMatchPrepData(input.data, input.detail);

  setCachedMatchPrepResult({
    matchId: input.matchId,
    detail: input.detail,
    runId: input.runId,
    data: finalData,
    completeness: input.completeness,
  });

  return finalData;
}
