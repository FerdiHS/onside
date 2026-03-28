export type FrontendMatchPrepMode = "mock" | "live";

const DEFAULT_MATCH_PREP_MODE: FrontendMatchPrepMode = "mock";

export function normalizeMatchPrepMode(
  value?: string | null,
): FrontendMatchPrepMode {
  return value === "live" || value === "mock"
    ? value
    : DEFAULT_MATCH_PREP_MODE;
}

export function getDefaultMatchPrepMode(): FrontendMatchPrepMode {
  return normalizeMatchPrepMode(process.env.NEXT_PUBLIC_MATCH_PREP_MODE);
}
