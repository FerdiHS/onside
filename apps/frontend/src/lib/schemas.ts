import { z } from "zod";

export const WatchStatusSchema = z.enum(["rising", "stable", "concern"]);

export const DataModeSchema = z.enum(["mock", "live"]);

export const CompletenessSchema = z.enum(["full", "partial"]);

export const ResponseMetaSchema = z.object({
  mode: DataModeSchema,
  completeness: CompletenessSchema,
  generated_at: z.string().min(1),
  progress_supported: z.boolean().optional(),
});

export const FailureResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum([
      "BAD_REQUEST",
      "NOT_FOUND",
      "UPSTREAM_FAILURE",
      "VALIDATION_ERROR",
      "INTERNAL_ERROR",
    ]),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  meta: ResponseMetaSchema.partial().optional(),
});

const SourceLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  domain: z.string().nullable().optional(),
});

export const MatchPrepRouteInputSchema = z.object({
  matchId: z.string().min(1),
  mode: DataModeSchema.optional(),
});

export const MatchPrepResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    match_id: z.string().min(1),
    competition: z.string().nullable(),
    kickoff_time: z.string().nullable(),
    home_team: z.string().min(1),
    away_team: z.string().min(1),
    probable_lineups: z.object({
      home: z.array(z.string()),
      away: z.array(z.string()),
    }),
    injuries_or_absences: z.object({
      home: z.array(z.string()),
      away: z.array(z.string()),
    }),
    recent_context: z.array(z.string()),
    key_talking_points: z.array(z.string()),
    sources: z.array(SourceLinkSchema),
  }),
  meta: ResponseMetaSchema,
});

export const PlayerWatchRouteInputSchema = z.object({
  clubId: z.string().min(1),
  playerId: z.string().min(1),
  mode: DataModeSchema.optional(),
});

export const PlayerWatchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    club_id: z.string().min(1),
    player_id: z.string().min(1),
    player_name: z.string().min(1),
    status: WatchStatusSchema,
    recent_updates: z.array(z.string()),
    availability_notes: z.array(z.string()),
    recent_mentions: z.array(z.string()),
    summary: z.string().min(1),
    sources: z.array(SourceLinkSchema),
  }),
  meta: ResponseMetaSchema,
});

export const LoanMonitorRouteInputSchema = z.object({
  clubId: z.string().min(1),
  mode: DataModeSchema.optional(),
});

export const LoanMonitorResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    club_id: z.string().min(1),
    club_name: z.string().min(1),
    players: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        parent_club_id: z.string().min(1),
        current_club_name: z.string().nullable().optional(),
        role: z.string().nullable().optional(),
        status: WatchStatusSchema,
        summary: z.string().min(1),
        latest_updates: z.array(z.string()),
        sources: z.array(SourceLinkSchema),
      }),
    ),
  }),
  meta: ResponseMetaSchema,
});
