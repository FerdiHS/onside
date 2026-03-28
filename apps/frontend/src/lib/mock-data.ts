import {
  LoanMonitorResponseSchema,
  LoanMonitorRouteInputSchema,
  MatchPrepResponseSchema,
  MatchPrepRouteInputSchema,
  PlayerWatchResponseSchema,
  PlayerWatchRouteInputSchema,
} from "@/lib/schemas";

function createMeta() {
  return {
    mode: "mock" as const,
    completeness: "full" as const,
    generated_at: new Date().toISOString(),
  };
}

export function getMockMatchPrep(input: unknown) {
  const { matchId } = MatchPrepRouteInputSchema.parse(input);

  const response = {
    success: true as const,
    data: {
      match_id: matchId,
      competition: "Premier League",
      kickoff_time: "2026-04-01T19:45:00Z",
      home_team: "Chelsea",
      away_team: "Manchester United",
      probable_lineups: {
        home: [
          "Robert Sanchez",
          "Reece James",
          "Axel Disasi",
          "Levi Colwill",
          "Ben Chilwell",
          "Moises Caicedo",
          "Enzo Fernandez",
          "Cole Palmer",
          "Noni Madueke",
          "Mykhailo Mudryk",
          "Nicolas Jackson",
        ],
        away: [
          "Andre Onana",
          "Diogo Dalot",
          "Lisandro Martinez",
          "Harry Maguire",
          "Luke Shaw",
          "Kobbie Mainoo",
          "Casemiro",
          "Bruno Fernandes",
          "Alejandro Garnacho",
          "Marcus Rashford",
          "Rasmus Hojlund",
        ],
      },
      injuries_or_absences: {
        home: ["Christopher Nkunku - late fitness check"],
        away: ["Luke Shaw - managed minutes after recent return"],
      },
      recent_context: [
        "Chelsea have been stronger at home in recent league matches.",
        "Manchester United remain dangerous in transition through Rashford and Garnacho.",
        "Set pieces look important with both sides carrying aerial threats.",
      ],
      key_talking_points: [
        "Chelsea's midfield control against Bruno Fernandes between the lines.",
        "How Manchester United defend wide overloads around Palmer and James.",
        "Which side manages transitions better after turnovers in midfield.",
      ],
      sources: [
        {
          title: "Premier League match preview",
          url: "https://www.premierleague.com",
          domain: "premierleague.com",
        },
        {
          title: "Club availability update",
          url: "https://www.chelseafc.com",
          domain: "chelseafc.com",
        },
      ],
    },
    meta: createMeta(),
  };

  return MatchPrepResponseSchema.parse(response);
}

export function getMockPlayerWatch(input: unknown) {
  const { clubId, playerId } = PlayerWatchRouteInputSchema.parse(input);

  const response = {
    success: true as const,
    data: {
      club_id: clubId,
      player_id: playerId,
      player_name: "Jimmy-Jay Morgan",
      status: "rising" as const,
      recent_updates: [
        "Started regularly in recent loan fixtures.",
        "Contributed with sharp movement in the box and improved link play.",
      ],
      availability_notes: ["Available and building match rhythm."],
      recent_mentions: [
        "Praised by local coverage for work rate out of possession.",
        "Noted by coaching staff for improved pressing intensity.",
      ],
      summary:
        "Morgan is trending positively with steady minutes, useful attacking involvement, and encouraging signs in his all-round game.",
      sources: [
        {
          title: "Loan match report",
          url: "https://www.chelseafc.com",
          domain: "chelseafc.com",
        },
        {
          title: "Local player coverage",
          url: "https://www.bbc.com/sport/football",
          domain: "bbc.com",
        },
      ],
    },
    meta: createMeta(),
  };

  return PlayerWatchResponseSchema.parse(response);
}

export function getMockLoanMonitor(input: unknown) {
  const { clubId } = LoanMonitorRouteInputSchema.parse(input);

  const response = {
    success: true as const,
    data: {
      club_id: clubId,
      club_name: "Chelsea",
      players: [
        {
          id: "jimmy-jay-morgan",
          name: "Jimmy-Jay Morgan",
          parent_club_id: clubId,
          current_club_name: "Gillingham",
          role: "Forward",
          status: "rising" as const,
          summary:
            "Regular minutes and sharper box movement have made his recent loan spell encouraging.",
          latest_updates: [
            "Started the last two league matches.",
            "Produced one goal contribution across his recent run.",
          ],
          sources: [
            {
              title: "Loan report",
              url: "https://www.chelseafc.com",
              domain: "chelseafc.com",
            },
          ],
        },
        {
          id: "cesare-casadei",
          name: "Cesare Casadei",
          parent_club_id: clubId,
          current_club_name: "Leicester City",
          role: "Midfielder",
          status: "stable" as const,
          summary:
            "Minutes remain useful, with his physical presence and late box arrivals still standing out.",
          latest_updates: [
            "Used in a mixed role across midfield during the last three matches.",
            "Maintained steady availability without a major fitness concern.",
          ],
          sources: [
            {
              title: "Club loan round-up",
              url: "https://www.chelseafc.com",
              domain: "chelseafc.com",
            },
          ],
        },
      ],
    },
    meta: createMeta(),
  };

  return LoanMonitorResponseSchema.parse(response);
}
