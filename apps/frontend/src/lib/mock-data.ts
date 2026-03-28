import {
  createMeta,
  type MatchPrepDetail,
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

const DEFAULT_LIVE_NOTES = [
  "Use Sofascore first for fixture identity and probable lineups before checking the supporting football media URLs.",
  "Use OneFootball or GOAL for preview context and availability notes. Treat B/R Football and 433 as supporting context, not as the sole basis for lineup or injury claims.",
];

const MATCH_PREP_SCENARIOS: Record<string, MatchPrepScenario> = {
  "friendly-colombia-vs-france-2026-03-29": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: DEFAULT_LIVE_NOTES,
    mock: {
      match_id: "friendly-colombia-vs-france-2026-03-29",
      competition: "International Friendly",
      kickoff_time: "2026-03-29T19:00:00Z",
      home_team: "Colombia",
      away_team: "France",
      probable_lineups: {
        home: [
          "Camilo Vargas",
          "Daniel Munoz",
          "Davinson Sanchez",
          "Carlos Cuesta",
          "Deiver Machado",
          "Jefferson Lerma",
          "Richard Rios",
          "Jhon Arias",
          "James Rodriguez",
          "Luis Diaz",
          "Jhon Duran",
        ],
        away: [
          "Mike Maignan",
          "Jules Kounde",
          "Ibrahima Konate",
          "William Saliba",
          "Theo Hernandez",
          "Aurelien Tchouameni",
          "Eduardo Camavinga",
          "Michael Olise",
          "Ousmane Dembele",
          "Kylian Mbappe",
          "Marcus Thuram",
        ],
      },
      injuries_or_absences: {
        home: [
          "Monitor the final midfield balance and whether Colombia adds an extra runner off Duran.",
        ],
        away: [
          "Track France's final attacking mix and any late rest decisions before the summer tournament window.",
        ],
      },
      recent_context: [
        "France travel to Landover, Maryland to face Colombia on Sunday, March 29, 2026 in the second match of Les Bleus' U.S. spring tour.",
        "The fixture gives both nations a high-level intercontinental test less than three months before the 2026 FIFA World Cup begins.",
        "Colombia's wide threat through Luis Diaz and Arias makes France's rest defense and transition control a central tactical theme.",
      ],
      key_talking_points: [
        "France's ability to manage Diaz's transition carries will likely define how aggressively the full-backs can advance.",
        "Colombia can make the game uncomfortable if they win second balls around James Rodriguez and attack France's defensive spacing early.",
        "Midfield control between Tchouameni, Camavinga, Lerma, and Rios should shape tempo more than pure possession share.",
      ],
      sources: [
        {
          title: "Les Bleus face au Bresil et la Colombie",
          url: "https://www.fff.fr/article/15965-les-bleus-face-au-bresil-et-la-colombie.html",
          domain: "fff.fr",
        },
        {
          title: "Colombie - France match page",
          url: "https://www.fff.fr/selection/matchs/3736-colombie-france.html",
          domain: "fff.fr",
        },
      ],
    },
  },
  "friendly-mexico-vs-portugal-2026-03-28": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: DEFAULT_LIVE_NOTES,
    mock: {
      match_id: "friendly-mexico-vs-portugal-2026-03-28",
      competition: "International Friendly",
      kickoff_time: "2026-03-29T01:00:00Z",
      home_team: "Mexico",
      away_team: "Portugal",
      probable_lineups: {
        home: [
          "Luis Malagon",
          "Jorge Sanchez",
          "Cesar Montes",
          "Johan Vazquez",
          "Jesus Gallardo",
          "Edson Alvarez",
          "Luis Chavez",
          "Orbelin Pineda",
          "Uriel Antuna",
          "Hirving Lozano",
          "Santiago Gimenez",
        ],
        away: [
          "Diogo Costa",
          "Joao Cancelo",
          "Ruben Dias",
          "Antonio Silva",
          "Nuno Mendes",
          "Joao Neves",
          "Vitinha",
          "Bernardo Silva",
          "Bruno Fernandes",
          "Rafael Leao",
          "Goncalo Ramos",
        ],
      },
      injuries_or_absences: {
        home: ["Track Mexico's final wing selection and whether the midfield stays double-pivot or more aggressive."],
        away: ["Confirm Portugal's final front-three mix and full-back rotations before kickoff."],
      },
      recent_context: [
        "Mexico host Portugal at Mexico City Stadium on Saturday, March 28, 2026 as part of both teams' final World Cup build-up.",
        "Portugal then travel to Atlanta for a second March friendly, which should influence how much Roberto Martinez rotates key attackers.",
        "Altitude, crowd pressure, and Mexico's direct wing play give this match a different profile than Portugal's usual European control game.",
      ],
      key_talking_points: [
        "Mexico's best route is to attack the spaces behind Portugal's advancing full-backs before the possession game settles.",
        "Portugal should own more controlled possession, but Mexico's transitions can turn the rhythm quickly if Alvarez and Chavez win central duels.",
        "The match is a useful stress test for both teams' set-piece organization and emotional control before the World Cup.",
      ],
      sources: [
        {
          title: "Portugal senior team schedule",
          url: "https://www.fpf.pt/pt/selecoes/futebol-masculino/selecao-a/agenda",
          domain: "fpf.pt",
        },
        {
          title: "Mexico - Portugal match page",
          url: "https://www.fpf.pt/pt/selecoes/futebol-masculino/selecao-a/jogos/ficha-de-jogo/match/2473717",
          domain: "fpf.pt",
        },
      ],
    },
  },
  "fifa-series-indonesia-vs-bulgaria-2026-03-30": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: [
      ...DEFAULT_LIVE_NOTES,
      "This FIFA Series pairing may require careful fixture disambiguation because tournament-format paths can create nearby related matches in the same window.",
    ],
    mock: {
      match_id: "fifa-series-indonesia-vs-bulgaria-2026-03-30",
      competition: "FIFA Series 2026",
      kickoff_time: "2026-03-30T08:30:00Z",
      home_team: "Indonesia",
      away_team: "Bulgaria",
      probable_lineups: {
        home: [
          "Maarten Paes",
          "Sandy Walsh",
          "Jay Idzes",
          "Jordi Amat",
          "Pratama Arhan",
          "Thom Haye",
          "Ivar Jenner",
          "Marselino Ferdinan",
          "Yakob Sayuri",
          "Rafael Struick",
          "Ole Romeny",
        ],
        away: [
          "Plamen Andreev",
          "Ivan Turitsov",
          "Valentin Antov",
          "Aleks Petkov",
          "Anton Nedyalkov",
          "Ilia Gruev",
          "Filip Krastev",
          "Georgi Milanov",
          "Marin Petkov",
          "Kiril Despodov",
          "Aleksandar Kolev",
        ],
      },
      injuries_or_absences: {
        home: ["Monitor final availability across Indonesia's naturalized core and the wide channels."],
        away: ["Track whether Bulgaria lean into a more experienced midfield or a younger pressing setup."],
      },
      recent_context: [
        "Indonesia and Bulgaria sit in the same March-April 2026 FIFA Series window, making this a useful emerging-market cross-confederation test fixture seed.",
        "Indonesia's home support and wide pace can create momentum swings quickly, especially if the match state opens up.",
        "Bulgaria bring a more physical, structured UEFA profile, so second balls and defensive rest shape are likely to matter as much as possession totals.",
      ],
      key_talking_points: [
        "Indonesia's first line of pressure needs to be coordinated or Bulgaria will play through into direct service for Despodov and the center-forward.",
        "Bulgaria's set-piece threat is a real edge in a match that may produce long stoppages and chaotic phases.",
        "The midfield duel should decide whether the game becomes a transition battle or a slower tactical arm wrestle.",
      ],
      sources: [
        {
          title: "FIFA Series 2026 match schedule now available",
          url: "https://inside.fifa.com/organisation/media-releases/fifa-series-2026-match-schedule-now-available",
          domain: "fifa.com",
        },
        {
          title: "PSSI official website",
          url: "https://www.pssi.org/",
          domain: "pssi.org",
        },
      ],
    },
  },
  "friendly-usa-vs-belgium-2026-03-28": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: DEFAULT_LIVE_NOTES,
    mock: {
      match_id: "friendly-usa-vs-belgium-2026-03-28",
      competition: "International Friendly",
      kickoff_time: "2026-03-28T19:30:00Z",
      home_team: "USA",
      away_team: "Belgium",
      probable_lineups: {
        home: [
          "Matt Turner",
          "Sergino Dest",
          "Chris Richards",
          "Tim Ream",
          "Antonee Robinson",
          "Tyler Adams",
          "Weston McKennie",
          "Yunus Musah",
          "Tim Weah",
          "Christian Pulisic",
          "Folarin Balogun",
        ],
        away: [
          "Thibaut Courtois",
          "Timothy Castagne",
          "Wout Faes",
          "Zeno Debast",
          "Arthur Theate",
          "Amadou Onana",
          "Youri Tielemans",
          "Jeremy Doku",
          "Kevin De Bruyne",
          "Leandro Trossard",
          "Romelu Lukaku",
        ],
      },
      injuries_or_absences: {
        home: ["Track the final center-back pairing and whether the USA protect minutes for key World Cup starters."],
        away: ["Monitor Belgium's veteran load management, especially around De Bruyne and Courtois."],
      },
      recent_context: [
        "The USA host Belgium in Atlanta on Saturday, March 28, 2026 as the first of four final U.S. pre-World Cup sendoff matches.",
        "Belgium arrive as one of the marquee opponents in the U.S. spring schedule, giving Mauricio Pochettino a high-level benchmark before the 2026 World Cup.",
        "The match pits the USA's transition athleticism against Belgium's technical control and final-third experience.",
      ],
      key_talking_points: [
        "The USA need Adams and McKennie to protect central zones so Pulisic and Weah can attack Belgium's back line with pace.",
        "Belgium can punish slow defensive transitions if De Bruyne gets repeated touches between the U.S. midfield and defense.",
        "This is a strong stress test for the USA's rest defense and game management against an elite attacking core.",
      ],
      sources: [
        {
          title: "Venues set for final four USMNT matches before the 2026 World Cup",
          url: "https://www.ussoccer.com/stories/2025/12/venues-set-for-final-four-matches-for-usmnt-before-fifa-world-cup-belgium-portugal-germany",
          domain: "ussoccer.com",
        },
        {
          title: "USMNT Road to 2026 ticket presale",
          url: "https://www.ussoccer.com/road-to-2026-presale",
          domain: "ussoccer.com",
        },
      ],
    },
  },
  "ucl-real-madrid-vs-bayern-munchen-2026-04-07": {
    live_source_pack: DEFAULT_MATCH_PREP_SOURCE_PACK,
    live_notes: [
      ...DEFAULT_LIVE_NOTES,
      "Be especially careful to skip historical Real Madrid vs Bayern coverage and only keep pages that clearly reference the 2026 fixture window.",
    ],
    mock: {
      match_id: "ucl-real-madrid-vs-bayern-munchen-2026-04-07",
      competition: "UEFA Champions League",
      kickoff_time: "2026-04-07T19:00:00Z",
      home_team: "Real Madrid",
      away_team: "Bayern Munchen",
      probable_lineups: {
        home: [
          "Thibaut Courtois",
          "Dani Carvajal",
          "Antonio Rudiger",
          "Eder Militao",
          "Ferland Mendy",
          "Federico Valverde",
          "Aurelien Tchouameni",
          "Jude Bellingham",
          "Rodrygo",
          "Kylian Mbappe",
          "Vinicius Junior",
        ],
        away: [
          "Manuel Neuer",
          "Konrad Laimer",
          "Dayot Upamecano",
          "Min-jae Kim",
          "Alphonso Davies",
          "Joshua Kimmich",
          "Aleksandar Pavlovic",
          "Jamal Musiala",
          "Michael Olise",
          "Leroy Sane",
          "Harry Kane",
        ],
      },
      injuries_or_absences: {
        home: ["Track whether Madrid protect any returning defenders in the first leg."],
        away: ["Monitor Bayern's full-back and center-back availability before the trip to Madrid."],
      },
      recent_context: [
        "Real Madrid versus Bayern Munchen remains one of the defining heavyweight pairings in European club football.",
        "Both squads carry elite transition threat, so controlling turnover moments should matter as much as possession volume.",
        "This mock seed is designed as a high-recognition Champions League briefing test for the Onside Match Prep experience.",
      ],
      key_talking_points: [
        "Madrid's front line can attack Bayern's last line quickly if Musiala and Olise lose the ball in central build-up zones.",
        "Bayern's route runs through Kane's link play and whether they can keep Musiala facing forward around Madrid's midfield screen.",
        "Set pieces and wide isolation battles may decide the margins more than total shot count.",
      ],
      sources: [
        {
          title: "Real Madrid football homepage",
          url: "https://www.realmadrid.com/en-US/football",
          domain: "realmadrid.com",
        },
        {
          title: "FC Bayern match center",
          url: "https://fcbayern.com/en/match-center/matchday",
          domain: "fcbayern.com",
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
  detail: MatchPrepDetail = "full",
): MatchPrepResponse {
  return {
    success: true,
    data: scenario.mock,
    meta: createMeta("mock", "full", { detail }),
  };
}
