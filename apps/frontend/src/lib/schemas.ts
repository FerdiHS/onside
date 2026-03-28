export type WatchStatus = "rising" | "stable" | "concern";
export type DataMode = "mock" | "live";
export type Completeness = "full" | "partial";
export type FailureCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "UPSTREAM_FAILURE"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type ResponseMeta = {
  mode: DataMode;
  completeness: Completeness;
  generated_at: string;
  progress_supported?: boolean;
};

export type FailureResponse = {
  success: false;
  error: {
    code: FailureCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: Partial<ResponseMeta>;
};

export type SourceLink = {
  title: string;
  url: string;
  domain?: string | null;
};

export type MatchPrepData = {
  match_id: string;
  competition: string | null;
  kickoff_time: string | null;
  home_team: string;
  away_team: string;
  probable_lineups: {
    home: string[];
    away: string[];
  };
  injuries_or_absences: {
    home: string[];
    away: string[];
  };
  recent_context: string[];
  key_talking_points: string[];
  sources: SourceLink[];
};

export type MatchPrepResponse = {
  success: true;
  data: MatchPrepData;
  meta: ResponseMeta;
};

export type MatchPrepSeedContext = Pick<
  MatchPrepData,
  "match_id" | "competition" | "kickoff_time" | "home_team" | "away_team"
>;

export type MatchPrepNormalizationResult = {
  data: MatchPrepData;
  completeness: Completeness;
  issues: string[];
  hasMeaningfulSignals: boolean;
};

type StringArrayResult = {
  value: string[];
  missing: boolean;
};

type SourceLinkArrayResult = {
  value: SourceLink[];
  missing: boolean;
};

export function createMeta(
  mode: DataMode,
  completeness: Completeness,
  extra?: Partial<ResponseMeta>,
): ResponseMeta {
  return {
    mode,
    completeness,
    generated_at: new Date().toISOString(),
    ...extra,
  };
}

export function createFailureResponse(
  code: FailureCode,
  message: string,
  meta?: Partial<ResponseMeta>,
  details?: Record<string, unknown>,
): FailureResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    ...(meta ? { meta } : {}),
  };
}

export function failureStatusCode(code: FailureCode): number {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "UPSTREAM_FAILURE":
      return 502;
    case "VALIDATION_ERROR":
      return 422;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

export function isDataMode(value: string): value is DataMode {
  return value === "mock" || value === "live";
}

export function inferDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./u, "");
  } catch {
    return null;
  }
}

export function normalizeMatchPrepData(
  value: unknown,
  seed: MatchPrepSeedContext,
): MatchPrepNormalizationResult {
  const issues: string[] = [];
  const record = isRecord(value) ? value : {};
  let completeness: Completeness = isRecord(value) ? "full" : "partial";

  const competition = readNullableString(record.competition, seed.competition);
  if (competition.usedFallback) {
    completeness = "partial";
    issues.push("competition");
  }

  const kickoffTime = readNullableString(record.kickoff_time, seed.kickoff_time);
  if (kickoffTime.usedFallback) {
    completeness = "partial";
    issues.push("kickoff_time");
  }

  const homeTeam = readRequiredString(record.home_team, seed.home_team);
  if (homeTeam.usedFallback) {
    completeness = "partial";
    issues.push("home_team");
  }

  const awayTeam = readRequiredString(record.away_team, seed.away_team);
  if (awayTeam.usedFallback) {
    completeness = "partial";
    issues.push("away_team");
  }

  const probableLineupsRecord = isRecord(record.probable_lineups)
    ? record.probable_lineups
    : {};
  if (!isRecord(record.probable_lineups)) {
    completeness = "partial";
    issues.push("probable_lineups");
  }

  const homeLineup = readStringArray(probableLineupsRecord.home);
  const awayLineup = readStringArray(probableLineupsRecord.away);
  if (homeLineup.missing || awayLineup.missing) {
    completeness = "partial";
    issues.push("probable_lineups.home", "probable_lineups.away");
  }

  const absencesRecord = isRecord(record.injuries_or_absences)
    ? record.injuries_or_absences
    : {};
  if (!isRecord(record.injuries_or_absences)) {
    completeness = "partial";
    issues.push("injuries_or_absences");
  }

  const homeAbsences = readStringArray(absencesRecord.home);
  const awayAbsences = readStringArray(absencesRecord.away);
  if (homeAbsences.missing || awayAbsences.missing) {
    completeness = "partial";
    issues.push("injuries_or_absences.home", "injuries_or_absences.away");
  }

  const recentContext = readStringArray(record.recent_context);
  if (recentContext.missing) {
    completeness = "partial";
    issues.push("recent_context");
  }

  const keyTalkingPoints = readStringArray(record.key_talking_points);
  if (keyTalkingPoints.missing) {
    completeness = "partial";
    issues.push("key_talking_points");
  }

  const sources = readSourceLinkArray(record.sources);
  if (sources.missing) {
    completeness = "partial";
    issues.push("sources");
  }

  const data: MatchPrepData = {
    match_id: seed.match_id,
    competition: competition.value,
    kickoff_time: kickoffTime.value,
    home_team: homeTeam.value,
    away_team: awayTeam.value,
    probable_lineups: {
      home: homeLineup.value,
      away: awayLineup.value,
    },
    injuries_or_absences: {
      home: homeAbsences.value,
      away: awayAbsences.value,
    },
    recent_context: recentContext.value,
    key_talking_points: keyTalkingPoints.value,
    sources: sources.value,
  };

  return {
    data,
    completeness,
    issues: [...new Set(issues)],
    hasMeaningfulSignals: hasMeaningfulMatchPrepSignals(data),
  };
}

export function hasMeaningfulMatchPrepSignals(data: MatchPrepData): boolean {
  return (
    data.probable_lineups.home.length > 0 ||
    data.probable_lineups.away.length > 0 ||
    data.injuries_or_absences.home.length > 0 ||
    data.injuries_or_absences.away.length > 0 ||
    data.recent_context.length > 0 ||
    data.key_talking_points.length > 0 ||
    data.sources.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNullableString(
  value: unknown,
  fallback: string | null,
): { value: string | null; usedFallback: boolean } {
  if (value === null) {
    return { value: null, usedFallback: false };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return { value: trimmed.length > 0 ? trimmed : null, usedFallback: false };
  }

  return { value: fallback, usedFallback: true };
}

function readRequiredString(
  value: unknown,
  fallback: string,
): { value: string; usedFallback: boolean } {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return { value: trimmed, usedFallback: false };
    }
  }

  return { value: fallback, usedFallback: true };
}

function readStringArray(value: unknown): StringArrayResult {
  if (!Array.isArray(value)) {
    return { value: [], missing: true };
  }

  return {
    value: value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
    missing: false,
  };
}

function readSourceLinkArray(value: unknown): SourceLinkArrayResult {
  if (!Array.isArray(value)) {
    return { value: [], missing: true };
  }

  const links: SourceLink[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const url = typeof item.url === "string" ? item.url.trim() : "";
    const domain =
      typeof item.domain === "string" && item.domain.trim().length > 0
        ? item.domain.trim()
        : inferDomain(url);

    if (title.length === 0 || url.length === 0) {
      continue;
    }

    links.push({
      title,
      url,
      domain,
    });
  }

  return {
    value: links,
    missing: false,
  };
}
