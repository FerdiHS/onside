'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { TrendingUp, Minus, AlertTriangle } from 'lucide-react';
import { ClubBadge } from '../components/ClubBadge';

type PlayerStatus = 'rising' | 'stable' | 'concern' | 'critical';

type ClubSource = {
  title: string;
  domain: string;
};

type ClubPlayer = {
  name: string;
  currentClub: string;
  status: PlayerStatus;
  summary: string;
  lastUpdate: string;
  isLoan?: boolean;
};

type ClubInfo = {
  trackedPlayers: number;
  rising: number;
  stable: number;
  concern: number;
  players: ClubPlayer[];
  sources: ClubSource[];
};

type LoanMonitorApiPlayer = {
  id: string;
  name: string;
  loanClub: string;
  position: string;
  performance: {
    appearances: number;
    goals: number;
    assists: number;
  };
  developmentNotes: string[];
  status: PlayerStatus;
};

type LoanMonitorSuccessResponse = {
  success: true;
  data: {
    players: LoanMonitorApiPlayer[];
  };
  meta?: {
    source?: string;
  };
};

type LoanMonitorPendingResponse = {
  success: false;
  status: 'pending';
  runId: string;
};

type LoanMonitorFailedResponse = {
  success: false;
  status: 'failed';
  error: {
    message: string;
  };
};

type LoanMonitorResponse =
  | LoanMonitorSuccessResponse
  | LoanMonitorPendingResponse
  | LoanMonitorFailedResponse;

const clubs = ['Chelsea', 'Manchester United', 'Arsenal', 'Liverpool'];

const clubData: Record<string, ClubInfo> = {
  'Chelsea': {
    trackedPlayers: 18,
    rising: 6,
    stable: 10,
    concern: 2,
    players: [
      { name: 'Cole Palmer', currentClub: 'Chelsea', status: 'rising', summary: '8 goals in last 10 matches. Exceptional form.', lastUpdate: '2 hours ago' },
      { name: 'Ian Maatsen', currentClub: 'Aston Villa', isLoan: true, status: 'rising', summary: 'Strong performances, 3 assists in 5 matches', lastUpdate: '5 hours ago' },
      { name: 'Armando Broja', currentClub: 'Fulham', isLoan: true, status: 'stable', summary: 'Regular starter, 2 goals in last 6 matches', lastUpdate: '1 day ago' },
      { name: 'Romelu Lukaku', currentClub: 'Roma', isLoan: true, status: 'stable', summary: 'Consistent performances in Serie A', lastUpdate: '1 day ago' },
      { name: 'Trevoh Chalobah', currentClub: 'Chelsea', status: 'concern', summary: 'Limited playing time, injury concerns', lastUpdate: '3 hours ago' },
    ],
    sources: [
      { title: 'Chelsea Loan Report', domain: 'chelseafc.com' },
      { title: 'Premier League Statistics', domain: 'premierleague.com' },
      { title: 'Serie A Match Reports', domain: 'legaseriea.it' },
    ],
  },
  'Manchester United': {
    trackedPlayers: 15,
    rising: 4,
    stable: 9,
    concern: 2,
    players: [
      { name: 'Bruno Fernandes', currentClub: 'Manchester United', status: 'rising', summary: 'Captain, 10 goal contributions in last 8 games', lastUpdate: '1 hour ago' },
      { name: 'Marcus Rashford', currentClub: 'Manchester United', status: 'stable', summary: 'Consistent performances, 15 goals this season', lastUpdate: '4 hours ago' },
      { name: 'Facundo Pellistri', currentClub: 'Espanyol', isLoan: true, status: 'rising', summary: 'Impressive in La Liga, 4 goals, 3 assists', lastUpdate: '6 hours ago' },
    ],
    sources: [
      { title: 'Man Utd Official Report', domain: 'manutd.com' },
      { title: 'La Liga News', domain: 'laliga.com' },
    ],
  },
  'Arsenal': {
    trackedPlayers: 16,
    rising: 7,
    stable: 8,
    concern: 1,
    players: [
      { name: 'Bukayo Saka', currentClub: 'Arsenal', status: 'rising', summary: 'Goal and assist in latest match. PFA Player of the Month.', lastUpdate: '1 hour ago' },
      { name: 'Martin Ødegaard', currentClub: 'Arsenal', status: 'stable', summary: 'Orchestrating play with 94% pass accuracy', lastUpdate: '2 hours ago' },
      { name: 'Gabriel Jesus', currentClub: 'Arsenal', status: 'concern', summary: 'Returning from knee injury, minutes being managed', lastUpdate: '3 hours ago' },
      { name: 'Nélson Semedo', currentClub: 'Nottingham Forest', isLoan: true, status: 'stable', summary: 'Solid at right back, keeping clean sheets', lastUpdate: '1 day ago' },
    ],
    sources: [
      { title: 'Arsenal Official News', domain: 'arsenal.com' },
      { title: 'Premier League Stats', domain: 'premierleague.com' },
    ],
  },
  'Liverpool': {
    trackedPlayers: 17,
    rising: 8,
    stable: 8,
    concern: 1,
    players: [
      { name: 'Mohamed Salah', currentClub: 'Liverpool', status: 'rising', summary: 'Hat-trick vs Wolves. 200 Premier League goals reached.', lastUpdate: '30 mins ago' },
      { name: 'Darwin Núñez', currentClub: 'Liverpool', status: 'stable', summary: 'Scored and held up play well vs Wolves', lastUpdate: '1 hour ago' },
      { name: 'Alexis Mac Allister', currentClub: 'Liverpool', status: 'stable', summary: 'Covered 12.4km in latest win. Engine of the press.', lastUpdate: '1 hour ago' },
    ],
    sources: [
      { title: 'Liverpool Match Report', domain: 'liverpoolfc.com' },
      { title: 'Premier League Stats', domain: 'premierleague.com' },
    ],
  },
};

function statusStyle(status: string) {
  if (status === 'rising') return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: 'Rising' };
  if (status === 'concern') return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Concern' };
  if (status === 'critical') return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Critical' };
  return { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Stable' };
}

function mapLoanMonitorPlayers(players: LoanMonitorApiPlayer[]): ClubPlayer[] {
  return players.map((player) => ({
    name: player.name,
    currentClub: player.loanClub,
    isLoan: true,
    status: player.status,
    summary: `${player.position}. ${player.performance.goals} goals, ${player.performance.assists} assists in ${player.performance.appearances} appearances. ${player.developmentNotes[0] ?? ''}`.trim(),
    lastUpdate: 'Live via TinyFish',
  }));
}

function getClubInfoWithPlayers(base: ClubInfo, players: ClubPlayer[]): ClubInfo {
  return {
    ...base,
    trackedPlayers: players.length,
    rising: players.filter((player) => player.status === 'rising').length,
    stable: players.filter((player) => player.status === 'stable').length,
    concern: players.filter((player) => player.status === 'concern').length,
    players,
  };
}

const card: React.CSSProperties = {
  backgroundColor: '#1a2540',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '24px',
};

const selectStyle: React.CSSProperties = {
  width: '260px',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1a2540',
  color: '#e8edf5',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
};

function MetricCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#1a2540',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12.5px', color: '#6b7fa3' }}>{label}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export function ClubPackage() {
  const [selectedClub, setSelectedClub] = useState('Chelsea');
  const [loanMonitorRunId, setLoanMonitorRunId] = useState<string | null>(null);
  const [loanMonitorStatus, setLoanMonitorStatus] = useState<'idle' | 'loading' | 'polling' | 'success' | 'error'>('idle');
  const [loanMonitorError, setLoanMonitorError] = useState<string | null>(null);
  const [loanMonitorPlayers, setLoanMonitorPlayers] = useState<ClubPlayer[] | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoanMonitorPoll = useEffectEvent(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  });

  const pollLoanMonitor = useEffectEvent(async (nextRunId?: string) => {
    clearLoanMonitorPoll();
    setLoanMonitorStatus(nextRunId ? 'polling' : 'loading');
    try {
      const query = nextRunId ? `?runId=${encodeURIComponent(nextRunId)}` : '';
      const response = await fetch(`/api/loan-monitor${query}`, { cache: 'no-store' });
      const payload = (await response.json()) as LoanMonitorResponse;

      if (!payload.success && payload.status === 'pending') {
        setLoanMonitorRunId(payload.runId);
        setLoanMonitorError(null);
        setLoanMonitorStatus('polling');

        pollTimeoutRef.current = setTimeout(() => {
          void pollLoanMonitor(payload.runId);
        }, 1500);

        return;
      }

      if (!payload.success) {
        setLoanMonitorRunId(null);
        setLoanMonitorStatus('error');
        setLoanMonitorError(payload.error.message);
        return;
      }

      setLoanMonitorRunId(null);
      setLoanMonitorError(null);
      setLoanMonitorPlayers(mapLoanMonitorPlayers(payload.data.players));
      setLoanMonitorStatus('success');
    } catch (error) {
      setLoanMonitorRunId(null);
      setLoanMonitorStatus('error');
      setLoanMonitorError(error instanceof Error ? error.message : 'Failed to load loan monitor');
    }
  });

  useEffect(() => {
    if (selectedClub !== 'Chelsea') {
      clearLoanMonitorPoll();
      setLoanMonitorRunId(null);
      setLoanMonitorError(null);
      setLoanMonitorPlayers(null);
      setLoanMonitorStatus('idle');
      return;
    }

    void pollLoanMonitor();

    return () => {
      clearLoanMonitorPoll();
    };
  }, [clearLoanMonitorPoll, pollLoanMonitor, selectedClub]);

  const baseClub = clubData[selectedClub] ?? clubData['Chelsea'];
  const current =
    selectedClub === 'Chelsea' && loanMonitorPlayers
      ? getClubInfoWithPlayers(baseClub, loanMonitorPlayers)
      : baseClub;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Club Package
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7fa3' }}>
            Premium monitoring dashboard for club operations and loan networks
          </p>
        </div>

        {/* Club Selection */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ ...card, backgroundColor: '#131d2e' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#6b7fa3', marginBottom: '8px' }}>
              Select Club
            </label>
            <select value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)} style={selectStyle}>
              {clubs.map(club => <option key={club} value={club}>{club}</option>)}
            </select>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          <MetricCard label="Tracked Players" value={current.trackedPlayers} color="#4a9eff" />
          <MetricCard label="Rising" value={current.rising} color="#34d399" icon={<TrendingUp size={15} />} />
          <MetricCard label="Stable" value={current.stable} color="#60a5fa" icon={<Minus size={15} />} />
          <MetricCard label="Concern" value={current.concern} color="#fbbf24" icon={<AlertTriangle size={15} />} />
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* Left — Player list */}
          <div style={{
            backgroundColor: '#1a2540',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e8edf5' }}>Player Monitoring</h2>
              <span style={{
                padding: '3px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'rgba(74,158,255,0.15)',
                color: '#4a9eff',
                border: '1px solid rgba(74,158,255,0.3)',
              }}>
                LIVE
              </span>
            </div>

            {selectedClub === 'Chelsea' && loanMonitorStatus !== 'idle' && (
              <div style={{
                padding: '14px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(74,158,255,0.08)',
                color: '#9bb4d4',
                fontSize: '12.5px',
              }}>
                {loanMonitorStatus === 'loading' && 'Loading loan monitor via TinyFish...'}
                {loanMonitorStatus === 'polling' && `TinyFish is still running${loanMonitorRunId ? ` (${loanMonitorRunId})` : ''}. Polling again in 1.5s...`}
                {loanMonitorStatus === 'success' && 'TinyFish completed. Showing live loan-monitor data.'}
                {loanMonitorStatus === 'error' && `TinyFish failed: ${loanMonitorError ?? 'Unknown error'}`}
              </div>
            )}

            {current.players.map((player: ClubPlayer, i: number) => {
              const st = statusStyle(player.status);
              const isLoan = player.isLoan;
              return (
                <div key={i} style={{
                  padding: '20px 24px',
                  borderBottom: i < current.players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5' }}>{player.name}</span>
                        <span style={{
                          padding: '2px 9px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: st.bg,
                          color: st.text,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <ClubBadge club={selectedClub} size="sm" />
                        {isLoan && (
                          <>
                            <span style={{ fontSize: '11px', color: '#4a5568' }}>→</span>
                            <ClubBadge club={player.currentClub} size="sm" />
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#6b7fa3',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                            }}>
                              Loan
                            </span>
                          </>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7fa3', marginBottom: '6px', lineHeight: 1.5 }}>{player.summary}</p>
                      <span style={{ fontSize: '11.5px', color: '#4a5568' }}>Last update: {player.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Package Info */}
            <div style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e8edf5', marginBottom: '12px' }}>Package Information</h3>
              <p style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.7, marginBottom: '10px' }}>
                Comprehensive monitoring of all players associated with{' '}
                <span style={{ color: '#e8edf5', fontWeight: 500 }}>{selectedClub}</span>, including those on loan.
              </p>
              <p style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.7 }}>
                Real-time updates on performance, availability, and key developments from trusted sources.
              </p>
            </div>

            {/* Sources */}
            <div style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>Sources</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {current.sources.map((source: ClubSource, i: number) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#131d2e',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ fontSize: '13px', color: '#c8d8f0', marginBottom: '2px' }}>{source.title}</div>
                    <div style={{ fontSize: '11.5px', color: '#4a5568' }}>{source.domain}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Legend */}
            <div style={card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>Status Guide</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { status: 'rising', desc: 'Strong recent form' },
                  { status: 'stable', desc: 'Consistent performance' },
                  { status: 'concern', desc: 'Needs attention' },
                ].map(({ status, desc }) => {
                  const st = statusStyle(status);
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '2px 9px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: st.bg,
                        color: st.text,
                      }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: '12.5px', color: '#6b7fa3' }}>{desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
