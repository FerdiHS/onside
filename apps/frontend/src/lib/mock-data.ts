import {
  createMeta,
  type MatchPrepData,
  type MatchPrepResponse,
  type SourceLink,
} from "@/lib/schemas";

export type MatchPrepScenario = {
  live_source_pack: {
    primary: SourceLink;
    supporting: SourceLink[];
  };
  live_notes: string[];
  mock: MatchPrepData;
};

const DEFAULT_MATCH_PREP_SOURCE_PACK = {
  primary: {
    title: "Sofascore",
    url: "https://www.sofascore.com/",
    domain: "sofascore.com",
  },
  supporting: [
    {
      title: "OneFootball",
      url: "https://onefootball.com/en/",
      domain: "onefootball.com",
    },
    {
      title: "GOAL",
      url: "https://www.goal.com/",
      domain: "goal.com",
    },
    {
      title: "B/R Football",
      url: "https://bleacherreport.com/world-football",
      domain: "bleacherreport.com",
    },
    {
      title: "433",
      url: "https://www.433football.com/",
      domain: "433football.com",
    },
  ],
} satisfies MatchPrepScenario["live_source_pack"];

const MATCH_PREP_SCENARIOS: Record<string, MatchPrepScenario> = {
  "epl-chelsea-vs-manchester-city-2026-04-12": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: [
      "Use Sofascore first for fixture identity and probable lineups before checking the supporting football media URLs.",
      "Use OneFootball or GOAL for preview context and availability notes. Treat B/R Football and 433 as supporting context, not as the sole basis for lineup or injury claims.",
    ],
    mock: {
      match_id: "epl-chelsea-vs-manchester-city-2026-04-12",
      competition: "Premier League",
      kickoff_time: "2026-04-12T15:30:00Z",
      home_team: "Chelsea",
      away_team: "Manchester City",
      probable_lineups: {
        home: [
          "Robert Sanchez",
          "Reece James",
          "Wesley Fofana",
          "Levi Colwill",
          "Marc Cucurella",
          "Moises Caicedo",
          "Enzo Fernandez",
          "Cole Palmer",
          "Pedro Neto",
          "Noni Madueke",
          "Nicolas Jackson",
        ],
        away: [
          "Ederson",
          "Rico Lewis",
          "Ruben Dias",
          "Josko Gvardiol",
          "Nathan Ake",
          "Rodri",
          "Bernardo Silva",
          "Phil Foden",
          "Savinho",
          "Jeremy Doku",
          "Erling Haaland",
        ],
      },
      injuries_or_absences: {
        home: [
          "Confirm final selection in the back line and wide roles before match day.",
        ],
        away: [
          "Track late availability updates in City's defensive rotation before kickoff.",
        ],
      },
      recent_context: [
        "Chelsea host Manchester City on Sunday, April 12, 2026 at 16:30 BST in a high-profile Matchweek 32 fixture.",
        "Manchester City arrive under title-race pressure, with the Premier League's March 14, 2026 update describing the Etihad meeting with Arsenal a week later as a major swing game.",
        "Chelsea's ability to control transitions after losing the ball is central against City's wide-speed and final-third volume.",
      ],
      key_talking_points: [
        "Chelsea need Palmer and Fernandez to receive between City's midfield and back line without exposing the pivot in transition.",
        "City's left-side overloads can force Chelsea's right-back channel into repeated recovery defending.",
        "Rest defense and set-piece execution should matter as much as open-play chance creation.",
      ],
      sources: [
        {
          title: "Fixture changes announced for April 2026",
          url: "https://www.premierleague.com/en/news/4606462/fixture-changes-announced-for-april-2026/",
          domain: "premierleague.com",
        },
        {
          title: "Premier League title race: How it stands and remaining fixtures",
          url: "https://www.premierleague.com/en/news/4572119/how-does-the-title-race-stand-after-arsenal-2-3-man-utd",
          domain: "premierleague.com",
        },
      ],
    },
  },
  "epl-manchester-city-vs-arsenal-2026-04-19": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: [
      "Use Sofascore first for fixture identity and probable lineups before checking the supporting football media URLs.",
      "Use OneFootball or GOAL for preview context and availability notes. Treat B/R Football and 433 as supporting context, not as the sole basis for lineup or injury claims.",
    ],
    mock: {
      match_id: "epl-manchester-city-vs-arsenal-2026-04-19",
      competition: "Premier League",
      kickoff_time: "2026-04-19T15:30:00Z",
      home_team: "Manchester City",
      away_team: "Arsenal",
      probable_lineups: {
        home: [
          "Ederson",
          "Rico Lewis",
          "Ruben Dias",
          "Josko Gvardiol",
          "Nathan Ake",
          "Rodri",
          "Bernardo Silva",
          "Phil Foden",
          "Savinho",
          "Jeremy Doku",
          "Erling Haaland",
        ],
        away: [
          "David Raya",
          "Jurrien Timber",
          "William Saliba",
          "Gabriel",
          "Riccardo Calafiori",
          "Martin Odegaard",
          "Declan Rice",
          "Mikel Merino",
          "Bukayo Saka",
          "Kai Havertz",
          "Gabriel Martinelli",
        ],
      },
      injuries_or_absences: {
        home: ["Monitor late defensive availability before finalizing City's back four."],
        away: ["Confirm final attacking and full-back availability before locking Arsenal's XI."],
      },
      recent_context: [
        "Manchester City host Arsenal on Sunday, April 19, 2026 at 16:30 BST in one of the decisive fixtures of the Premier League run-in.",
        "The Premier League's March 14, 2026 title-race update said Arsenal were nine points clear of City, having played one extra match, making this Etihad meeting a direct leverage point in the table.",
        "Both teams prefer long control phases, so the matchup may hinge on set plays, rest defense, and how quickly either side can attack the half-spaces after regains.",
      ],
      key_talking_points: [
        "City's ability to pin Arsenal's full-backs and isolate Haaland against the center-backs remains the headline tactical question.",
        "Arsenal's midfield spacing around Odegaard and Rice will decide whether they can progress cleanly through City's counter-press.",
        "The first goal could reshape the whole tactical script because both teams are comfortable defending from a control-led structure.",
      ],
      sources: [
        {
          title: "Fixture changes announced for April 2026",
          url: "https://www.premierleague.com/en/news/4606462/fixture-changes-announced-for-april-2026/",
          domain: "premierleague.com",
        },
        {
          title: "Premier League title race: How it stands and remaining fixtures",
          url: "https://www.premierleague.com/en/news/4572119/how-does-the-title-race-stand-after-arsenal-2-3-man-utd",
          domain: "premierleague.com",
        },
      ],
    },
  },
};

export function getMatchPrepScenario(matchId: string): MatchPrepScenario | null {
  return MATCH_PREP_SCENARIOS[matchId] ?? null;
}

export function createMockMatchPrepResponse(
  scenario: MatchPrepScenario,
): MatchPrepResponse {
  return {
    success: true,
    data: scenario.mock,
    meta: createMeta("mock", "full"),
  };
}
