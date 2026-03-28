'use client';

import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { ClubBadge } from '../components/ClubBadge';

type Lineup = {
  formation: string;
  goalkeeper: string[];
  defenders: string[];
  midfielders: string[];
  forwards: string[];
};
type MatchPrepProps = {
  params: {
    matchId: string;
  };
};

type Injury = {
  team: string;
  player: string;
  status: string;
  issue: string;
};

type Source = {
  title: string;
  domain: string;
};

type MatchPrepData = {
  match: {
    home: string;
    away: string;
    competition: string;
    kickoff: string;
  };
  homeLineup: Lineup;
  awayLineup: Lineup;
  injuries: Injury[];
  keyPoints: string[];
  homeForm: string[];
  awayForm: string[];
  sources: Source[];
};

const matchPrepData: Record<string, MatchPrepData> = {
  'chelsea-vs-arsenal': {
    match: {
      home: 'Chelsea',
      away: 'Arsenal',
      competition: 'Premier League',
      kickoff: 'Mar 29, 2026 at 15:00 GMT',
    },
    homeLineup: {
      formation: '4-3-3',
      goalkeeper: ['Sánchez'],
      defenders: ['James', 'Fofana', 'Colwill', 'Chilwell'],
      midfielders: ['Caicedo', 'Enzo', 'Gallagher'],
      forwards: ['Palmer', 'Jackson', 'Sterling'],
    },
    awayLineup: {
      formation: '4-3-3',
      goalkeeper: ['Raya'],
      defenders: ['White', 'Saliba', 'Gabriel', 'Timber'],
      midfielders: ['Rice', 'Ødegaard', 'Havertz'],
      forwards: ['Saka', 'Trossard', 'Martinelli'],
    },
    injuries: [
      { team: 'Chelsea', player: 'Reece James', status: 'Doubtful', issue: 'Hamstring' },
      { team: 'Arsenal', player: 'Thomas Partey', status: 'Out', issue: 'Muscle injury' },
    ],
    keyPoints: [
      'Arsenal unbeaten in last 5 matches, while Chelsea won 3 of last 5',
      'Both teams strong defensively — Arsenal 2nd best, Chelsea 4th best defensive records',
      'Cole Palmer has 8 goals in last 10 games for Chelsea',
    ],
    homeForm: ['W', 'W', 'D', 'W', 'L'],
    awayForm: ['W', 'W', 'W', 'D', 'W'],
    sources: [
      { title: 'Chelsea Official Team News', domain: 'chelseafc.com' },
      { title: 'Arsenal Pre-Match Press Conference', domain: 'arsenal.com' },
      { title: 'Premier League Injury Report', domain: 'premierleague.com' },
      { title: 'Sky Sports Match Preview', domain: 'skysports.com' },
    ],
  },

  'manchester-united-vs-liverpool': {
    match: {
      home: 'Manchester United',
      away: 'Liverpool',
      competition: 'Premier League',
      kickoff: 'Mar 30, 2026 at 16:30 GMT',
    },
    homeLineup: {
      formation: '4-2-3-1',
      goalkeeper: ['Onana'],
      defenders: ['Dalot', 'Varane', 'Martínez', 'Shaw'],
      midfielders: ['Mainoo', 'Casemiro', 'Bruno Fernandes'],
      forwards: ['Garnacho', 'Højlund', 'Rashford'],
    },
    awayLineup: {
      formation: '4-3-3',
      goalkeeper: ['Alisson'],
      defenders: ['Alexander-Arnold', 'Konaté', 'Van Dijk', 'Robertson'],
      midfielders: ['Mac Allister', 'Szoboszlai', 'Endo'],
      forwards: ['Salah', 'Núñez', 'Luis Díaz'],
    },
    injuries: [
      { team: 'Manchester United', player: 'Luke Shaw', status: 'Doubtful', issue: 'Knock' },
      { team: 'Liverpool', player: 'Diogo Jota', status: 'Out', issue: 'Hamstring' },
    ],
    keyPoints: [
      'Liverpool have scored 11 goals in their last 3 matches',
      'Manchester United remain dangerous in transition at Old Trafford',
      'Mohamed Salah is in red-hot form entering this fixture',
    ],
    homeForm: ['W', 'L', 'D', 'W', 'W'],
    awayForm: ['W', 'W', 'W', 'W', 'D'],
    sources: [
      { title: 'Manchester United Team News', domain: 'manutd.com' },
      { title: 'Liverpool Match Centre', domain: 'liverpoolfc.com' },
      { title: 'Premier League Injury Update', domain: 'premierleague.com' },
    ],
  },
};

function resultColor(result: string): { bg: string; text: string } {
  if (result === 'W') return { bg: 'rgba(52,211,153,0.15)', text: '#34d399' };
  if (result === 'D') return { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' };
  return { bg: 'rgba(248,113,113,0.15)', text: '#f87171' };
}

function StatusBadge({ status }: { status: string }) {
  const isOut = status === 'Out';
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: isOut ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
        color: isOut ? '#f87171' : '#fbbf24',
        border: `1px solid ${isOut ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
      }}
    >
      {status}
    </span>
  );
}

function LineupSection({ label, players }: { label: string; players: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#4a5568',
          width: '30px',
          paddingTop: '2px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '13.5px', color: '#e8edf5', lineHeight: 1.6 }}>
        {players.join(', ')}
      </span>
    </div>
  );
}

const card: React.CSSProperties = {
  backgroundColor: '#1a2540',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '24px',
};

export default function MatchPrep({ params }: MatchPrepProps) {
  const matchId = params.matchId;

  const data =
    matchPrepData[matchId] ??
    matchPrepData['chelsea-vs-arsenal'];

  const {
    match,
    homeLineup,
    awayLineup,
    injuries,
    keyPoints,
    homeForm,
    awayForm,
    sources,
  } = data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.02em' }}>
                  {match.home} vs {match.away}
                </h1>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(74,158,255,0.15)',
                    color: '#4a9eff',
                    border: '1px solid rgba(74,158,255,0.3)',
                    letterSpacing: '0.05em',
                  }}
                >
                  LIVE
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', color: '#6b7fa3' }}>{match.competition}</span>
                <span style={{ color: '#2d3a52' }}>•</span>
                <span style={{ fontSize: '14px', color: '#6b7fa3' }}>{match.kickoff}</span>
              </div>
            </div>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#1a2540',
                color: '#e8edf5',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
                
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={card}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '24px' }}>
                Probable Lineups
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <ClubBadge club={match.home} size="md" />
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>{homeLineup.formation}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <LineupSection label="GK" players={homeLineup.goalkeeper} />
                    <LineupSection label="DEF" players={homeLineup.defenders} />
                    <LineupSection label="MID" players={homeLineup.midfielders} />
                    <LineupSection label="FWD" players={homeLineup.forwards} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <ClubBadge club={match.away} size="md" />
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>{awayLineup.formation}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <LineupSection label="GK" players={awayLineup.goalkeeper} />
                    <LineupSection label="DEF" players={awayLineup.defenders} />
                    <LineupSection label="MID" players={awayLineup.midfielders} />
                    <LineupSection label="FWD" players={awayLineup.forwards} />
                  </div>
                </div>
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '16px' }}>
                Injuries & Absences
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {injuries.map((injury, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#131d2e',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ClubBadge club={injury.team} size="sm" />
                      <span style={{ fontSize: '14px', color: '#e8edf5' }}>{injury.player}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12.5px', color: '#4a5568' }}>{injury.issue}</span>
                      <StatusBadge status={injury.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>
                Key Talking Points
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {keyPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#4a9eff', fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '16px' }}>
                Recent Context
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { club: match.home, form: homeForm },
                  { club: match.away, form: awayForm },
                ].map(({ club, form }) => (
                  <div key={club}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <ClubBadge club={club} size="sm" />
                      <span style={{ fontSize: '12px', color: '#4a5568' }}>Last 5 matches</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {form.map((result, i) => {
                        const c = resultColor(result);
                        return (
                          <div
                            key={i}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: c.bg,
                              color: c.text,
                            }}
                          >
                            {result}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>
                Sources
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map((source, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#131d2e',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#c8d8f0', marginBottom: '2px' }}>{source.title}</div>
                    <div style={{ fontSize: '11.5px', color: '#4a5568' }}>{source.domain}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}