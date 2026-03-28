export type WatchStatus = "rising" | "stable" | "concern";

export type DataMode = "mock" | "live";

export type Completeness = "full" | "partial";

export type ResponseMeta = {
  mode: DataMode;
  completeness: Completeness;
  generated_at: string;
  progress_supported?: boolean;
};

export type FailureResponse = {
  success: false;
  error: {
    code:
      | "BAD_REQUEST"
      | "NOT_FOUND"
      | "UPSTREAM_FAILURE"
      | "VALIDATION_ERROR"
      | "INTERNAL_ERROR";
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

export type MatchPrepResponse = {
  success: true;
  data: {
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
  meta: ResponseMeta;
};

export type PlayerWatchResponse = {
  success: true;
  data: {
    club_id: string;
    player_id: string;
    player_name: string;
    status: WatchStatus;
    recent_updates: string[];
    availability_notes: string[];
    recent_mentions: string[];
    summary: string;
    sources: SourceLink[];
  };
  meta: ResponseMeta;
};

export type LoanMonitorResponse = {
  success: true;
  data: {
    club_id: string;
    club_name: string;
    players: Array<{
      id: string;
      name: string;
      parent_club_id: string;
      current_club_name?: string | null;
      role?: string | null;
      status: WatchStatus;
      summary: string;
      latest_updates: string[];
      sources: SourceLink[];
    }>;
  };
  meta: ResponseMeta;
};
