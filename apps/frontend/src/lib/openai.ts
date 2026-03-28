import "server-only";

import { buildMatchPrepSummaryEnrichmentPrompt } from "@/lib/prompts";
import {
  createMatchPrepDisplayList,
  createSourceBackedMatchPrepDisplay,
  type MatchPrepData,
  type MatchPrepDisplayConfidence,
  type MatchPrepDisplayData,
} from "@/lib/schemas";

type MatchPrepDisplayCandidate = {
  items: string[];
  note: string;
  confidence: "" | MatchPrepDisplayConfidence;
};

type MatchPrepSummaryEnrichmentCandidate = {
  probable_lineups: {
    home: MatchPrepDisplayCandidate;
    away: MatchPrepDisplayCandidate;
  };
  injuries_or_absences: {
    home: MatchPrepDisplayCandidate;
    away: MatchPrepDisplayCandidate;
  };
  recent_context: MatchPrepDisplayCandidate;
  key_talking_points: MatchPrepDisplayCandidate;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_TIMEOUT_MS = 20_000;
const DEFAULT_LINEUP_NOTE =
  "Projected with OpenAI from the available preview context and source-backed match signals.";
const DEFAULT_SUMMARY_NOTE =
  "Supplemented with OpenAI from the available structured match context.";

const DISPLAY_CANDIDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items", "note", "confidence"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "string",
      },
    },
    note: {
      type: "string",
    },
    confidence: {
      type: "string",
      enum: ["", "low", "medium", "high"],
    },
  },
} as const;

const MATCH_PREP_SUMMARY_ENRICHMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "probable_lineups",
    "injuries_or_absences",
    "recent_context",
    "key_talking_points",
  ],
  properties: {
    probable_lineups: {
      type: "object",
      additionalProperties: false,
      required: ["home", "away"],
      properties: {
        home: DISPLAY_CANDIDATE_SCHEMA,
        away: DISPLAY_CANDIDATE_SCHEMA,
      },
    },
    injuries_or_absences: {
      type: "object",
      additionalProperties: false,
      required: ["home", "away"],
      properties: {
        home: DISPLAY_CANDIDATE_SCHEMA,
        away: DISPLAY_CANDIDATE_SCHEMA,
      },
    },
    recent_context: DISPLAY_CANDIDATE_SCHEMA,
    key_talking_points: DISPLAY_CANDIDATE_SCHEMA,
  },
} as const;

export async function ensureLiveSummaryMatchPrepDisplay(
  data: MatchPrepData,
): Promise<MatchPrepData> {
  const needsEnrichment = shouldEnrichMatchPrepSummary(data);
  if (data.display) {
    if (!isOpenAIConfigured()) {
      return data;
    }

    if (!needsEnrichment || hasAiAssistedDisplay(data.display)) {
      return data;
    }
  }

  const sourceDisplay = createSourceBackedMatchPrepDisplay(data);
  if (!needsEnrichment || !isOpenAIConfigured()) {
    return {
      ...data,
      display: sourceDisplay,
    };
  }

  try {
    const enrichment = await getMatchPrepSummaryEnrichment(data);
    return {
      ...data,
      display: mergeMatchPrepDisplay(data, sourceDisplay, enrichment),
    };
  } catch (error) {
    console.warn("OpenAI Match Prep summary enrichment failed.", error);
    return {
      ...data,
      display: sourceDisplay,
    };
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function shouldEnrichMatchPrepSummary(data: MatchPrepData): boolean {
  return (
    data.probable_lineups.home.length < 11 ||
    data.probable_lineups.away.length < 11 ||
    data.recent_context.length === 0 ||
    data.key_talking_points.length === 0
  );
}

function hasAiAssistedDisplay(display: MatchPrepDisplayData): boolean {
  return (
    display.probable_lineups.home.provenance !== "source-backed" ||
    display.probable_lineups.away.provenance !== "source-backed" ||
    display.injuries_or_absences.home.provenance !== "source-backed" ||
    display.injuries_or_absences.away.provenance !== "source-backed" ||
    display.recent_context.provenance !== "source-backed" ||
    display.key_talking_points.provenance !== "source-backed"
  );
}

async function getMatchPrepSummaryEnrichment(
  data: MatchPrepData,
): Promise<MatchPrepSummaryEnrichmentCandidate> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        temperature: 0.2,
        input: buildMatchPrepSummaryEnrichmentPrompt(data),
        text: {
          format: {
            type: "json_schema",
            name: "match_prep_summary_enrichment",
            strict: true,
            schema: MATCH_PREP_SUMMARY_ENRICHMENT_SCHEMA,
          },
        },
      }),
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      throw new Error(getOpenAIErrorMessage(payload));
    }

    const text = extractStructuredText(payload);
    const parsed = JSON.parse(text) as unknown;
    return normalizeMatchPrepSummaryEnrichmentCandidate(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

function mergeMatchPrepDisplay(
  data: MatchPrepData,
  sourceDisplay: MatchPrepDisplayData,
  enrichment: MatchPrepSummaryEnrichmentCandidate,
): MatchPrepDisplayData {
  return {
    probable_lineups: {
      home: mergeLineupDisplay(
        data.probable_lineups.home,
        enrichment.probable_lineups.home,
      ),
      away: mergeLineupDisplay(
        data.probable_lineups.away,
        enrichment.probable_lineups.away,
      ),
    },
    injuries_or_absences: {
      home: mergeAbsenceDisplay(
        data.injuries_or_absences.home,
        enrichment.injuries_or_absences.home,
      ),
      away: mergeAbsenceDisplay(
        data.injuries_or_absences.away,
        enrichment.injuries_or_absences.away,
      ),
    },
    recent_context:
      data.recent_context.length > 0
        ? sourceDisplay.recent_context
        : mergeSummaryListDisplay(enrichment.recent_context),
    key_talking_points:
      data.key_talking_points.length > 0
        ? sourceDisplay.key_talking_points
        : mergeSummaryListDisplay(enrichment.key_talking_points),
  };
}

function mergeLineupDisplay(
  sourceItems: string[],
  candidate: MatchPrepDisplayCandidate,
) {
  const source = sanitizeItems(sourceItems, 11);
  if (source.length >= 11) {
    return createMatchPrepDisplayList(source);
  }

  const projected = sanitizeItems(candidate.items, 11);
  if (projected.length === 0) {
    return createMatchPrepDisplayList(source);
  }

  if (source.length === 0) {
    return createMatchPrepDisplayList(projected, "ai-assisted", {
      note: normalizeNote(candidate.note) ?? DEFAULT_LINEUP_NOTE,
      confidence: normalizeConfidence(candidate.confidence),
    });
  }

  return createMatchPrepDisplayList(
    mergeUniqueItems(source, projected, 11),
    "mixed",
    {
      note: normalizeNote(candidate.note) ?? DEFAULT_LINEUP_NOTE,
      confidence: normalizeConfidence(candidate.confidence),
    },
  );
}

function mergeAbsenceDisplay(
  sourceItems: string[],
  candidate: MatchPrepDisplayCandidate,
) {
  const source = sanitizeItems(sourceItems);
  if (source.length === 0) {
    return createMatchPrepDisplayList(source);
  }

  const supplemented = sanitizeItems(candidate.items);
  if (supplemented.length === 0) {
    return createMatchPrepDisplayList(source);
  }

  const merged = mergeUniqueItems(source, supplemented);
  if (merged.length === source.length) {
    return createMatchPrepDisplayList(source);
  }

  return createMatchPrepDisplayList(merged, "mixed", {
    note: normalizeNote(candidate.note),
    confidence: normalizeConfidence(candidate.confidence),
  });
}

function mergeSummaryListDisplay(candidate: MatchPrepDisplayCandidate) {
  const supplemented = sanitizeItems(candidate.items);
  if (supplemented.length === 0) {
    return createMatchPrepDisplayList([]);
  }

  return createMatchPrepDisplayList(supplemented, "ai-assisted", {
    note: normalizeNote(candidate.note) ?? DEFAULT_SUMMARY_NOTE,
    confidence: normalizeConfidence(candidate.confidence),
  });
}

function normalizeMatchPrepSummaryEnrichmentCandidate(
  value: unknown,
): MatchPrepSummaryEnrichmentCandidate {
  const record = isRecord(value) ? value : {};

  return {
    probable_lineups: {
      home: normalizeDisplayCandidate(record.probable_lineups, "home"),
      away: normalizeDisplayCandidate(record.probable_lineups, "away"),
    },
    injuries_or_absences: {
      home: normalizeDisplayCandidate(record.injuries_or_absences, "home"),
      away: normalizeDisplayCandidate(record.injuries_or_absences, "away"),
    },
    recent_context: normalizeDisplayCandidate(record, "recent_context"),
    key_talking_points: normalizeDisplayCandidate(record, "key_talking_points"),
  };
}

function normalizeDisplayCandidate(
  parent: unknown,
  key: "home" | "away" | "recent_context" | "key_talking_points",
): MatchPrepDisplayCandidate {
  const record = isRecord(parent) ? parent[key] : undefined;
  const candidate = isRecord(record) ? record : {};

  return {
    items: sanitizeItems(Array.isArray(candidate.items) ? candidate.items : []),
    note: typeof candidate.note === "string" ? candidate.note.trim() : "",
    confidence: normalizeConfidenceValue(candidate.confidence),
  };
}

function extractStructuredText(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new Error("OpenAI returned a malformed response.");
  }

  if (typeof payload.output_text === "string" && payload.output_text.trim().length > 0) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!isRecord(item)) {
      continue;
    }

    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (!isRecord(part)) {
        continue;
      }

      if (typeof part.text === "string" && part.text.trim().length > 0) {
        return part.text;
      }

      if (
        typeof part.output_text === "string" &&
        part.output_text.trim().length > 0
      ) {
        return part.output_text;
      }
    }
  }

  throw new Error("OpenAI did not return structured text output.");
}

function getOpenAIErrorMessage(payload: unknown): string {
  if (isRecord(payload) && isRecord(payload.error)) {
    const message = payload.error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
  }

  return "OpenAI summary enrichment failed.";
}

function sanitizeItems(items: unknown[], limit?: number): string[] {
  const unique = [...new Set(
    items
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )];

  return typeof limit === "number" ? unique.slice(0, limit) : unique;
}

function mergeUniqueItems(
  primary: string[],
  supplemental: string[],
  limit?: number,
): string[] {
  const merged = [...new Set([...primary, ...supplemental])];
  return typeof limit === "number" ? merged.slice(0, limit) : merged;
}

function normalizeNote(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeConfidence(
  value: "" | MatchPrepDisplayConfidence,
): MatchPrepDisplayConfidence | undefined {
  return value === "" ? undefined : value;
}

function normalizeConfidenceValue(value: unknown): "" | MatchPrepDisplayConfidence {
  return value === "low" || value === "medium" || value === "high" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
