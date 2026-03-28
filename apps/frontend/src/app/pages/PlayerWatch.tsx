'use client';

import { useState } from 'react';
import { ClubBadge } from '../components/ClubBadge';

const clubs = ['Chelsea', 'Manchester United', 'Arsenal', 'Liverpool'];

const playersByClub: Record<string, string[]> = {
  'Chelsea': ['Cole Palmer', 'Enzo Fernández', 'Nicolas Jackson'],
  'Manchester United': ['Bruno Fernandes', 'Marcus Rashford', 'Rasmus Højlund'],
  'Arsenal': ['Bukayo Saka', 'Martin Ødegaard', 'Gabriel Jesus'],
  'Liverpool': ['Mohamed Salah', 'Darwin Núñez', 'Alexis Mac Allister'],
};

const playerData: Record<string, any> = {
  'Cole Palmer': {
    club: 'Chelsea',
    position: 'Attacking Midfielder',
    status: 'rising',
    summary: 'In exceptional form with 8 goals in last 10 matches. Key creative force for Chelsea.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Scored and assisted in 3-1 win vs Brighton', type: 'Performance' },
      { date: 'Mar 25, 2026', text: 'Named in England squad for upcoming friendlies', type: 'International' },
      { date: 'Mar 22, 2026', text: 'Extended contract through 2029', type: 'Contract' },
    ],
    sources: [
      { title: 'Chelsea Match Report', domain: 'chelseafc.com' },
      { title: 'England Squad Announcement', domain: 'thefa.com' },
      { title: 'Palmer Contract Extension', domain: 'skysports.com' },
    ],
  },
  'Enzo Fernández': {
    club: 'Chelsea',
    position: 'Central Midfielder',
    status: 'stable',
    summary: 'Consistent performances in midfield. Strong passing and defensive contributions.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: '92% pass accuracy vs Brighton, 8 recoveries', type: 'Performance' },
      { date: 'Mar 24, 2026', text: 'Played full 90 minutes in Argentina friendly', type: 'International' },
    ],
    sources: [
      { title: 'Chelsea Statistics', domain: 'premierleague.com' },
      { title: 'Argentina Team News', domain: 'afa.com.ar' },
    ],
  },
  'Nicolas Jackson': {
    club: 'Chelsea',
    position: 'Striker',
    status: 'stable',
    summary: 'Reliable striker with good movement. Contributing regularly to Chelsea\'s attack.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Scored opener in win vs Brighton', type: 'Performance' },
    ],
    sources: [{ title: 'Chelsea Match Report', domain: 'chelseafc.com' }],
  },
  'Bruno Fernandes': {
    club: 'Manchester United',
    position: 'Attacking Midfielder',
    status: 'stable',
    summary: 'Captain and creative hub for Manchester United. Consistent contributor.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 26, 2026', text: 'Two assists in draw vs Tottenham', type: 'Performance' },
    ],
    sources: [{ title: 'Man United Match Report', domain: 'manutd.com' }],
  },
  'Marcus Rashford': {
    club: 'Manchester United',
    position: 'Forward',
    status: 'concern',
    summary: 'Inconsistent form this season. Looking to rediscover best performances.',
    availability: 'Doubtful',
    recentUpdates: [
      { date: 'Mar 25, 2026', text: 'Missed training session — under assessment', type: 'Injury' },
    ],
    sources: [{ title: 'Man United Injury Update', domain: 'manutd.com' }],
  },
  'Rasmus Højlund': {
    club: 'Manchester United',
    position: 'Striker',
    status: 'rising',
    summary: 'Young striker showing promising form with recent goals.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 26, 2026', text: 'Scored his 10th Premier League goal of the season', type: 'Performance' },
    ],
    sources: [{ title: 'Premier League Stats', domain: 'premierleague.com' }],
  },
  'Bukayo Saka': {
    club: 'Arsenal',
    position: 'Right Winger',
    status: 'rising',
    summary: 'Arsenal\'s standout performer. Direct, creative and clinical in front of goal.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Goal and assist in Arsenal win', type: 'Performance' },
      { date: 'Mar 24, 2026', text: 'Named PFA Player of the Month', type: 'Award' },
    ],
    sources: [{ title: 'Arsenal Match Report', domain: 'arsenal.com' }],
  },
  'Martin Ødegaard': {
    club: 'Arsenal',
    position: 'Central Midfielder',
    status: 'stable',
    summary: 'Arsenal captain. Orchestrates play from midfield with precision.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Completed 94% of passes, created 4 chances', type: 'Performance' },
    ],
    sources: [{ title: 'Arsenal Stats', domain: 'premierleague.com' }],
  },
  'Gabriel Jesus': {
    club: 'Arsenal',
    position: 'Striker',
    status: 'concern',
    summary: 'Returning from injury. Minutes being managed carefully.',
    availability: 'Doubtful',
    recentUpdates: [
      { date: 'Mar 23, 2026', text: 'Returned to light training after knee issue', type: 'Injury' },
    ],
    sources: [{ title: 'Arsenal Injury News', domain: 'arsenal.com' }],
  },
  'Mohamed Salah': {
    club: 'Liverpool',
    position: 'Right Winger',
    status: 'rising',
    summary: 'In the form of his life. Leading the Premier League golden boot race.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Hat-trick in 4-0 win vs Wolves', type: 'Performance' },
      { date: 'Mar 22, 2026', text: 'Reached 200 Premier League goals', type: 'Milestone' },
    ],
    sources: [{ title: 'Liverpool Match Report', domain: 'liverpoolfc.com' }],
  },
  'Darwin Núñez': {
    club: 'Liverpool',
    position: 'Striker',
    status: 'stable',
    summary: 'Powerful striker providing a physical presence for Liverpool up front.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Scored and held up play well vs Wolves', type: 'Performance' },
    ],
    sources: [{ title: 'Liverpool Stats', domain: 'premierleague.com' }],
  },
  'Alexis Mac Allister': {
    club: 'Liverpool',
    position: 'Central Midfielder',
    status: 'stable',
    summary: 'Energetic midfielder key to Liverpool\'s press and build-up play.',
    availability: 'Available',
    recentUpdates: [
      { date: 'Mar 27, 2026', text: 'Covered 12.4km in win vs Wolves', type: 'Performance' },
    ],
    sources: [{ title: 'Liverpool Match Report', domain: 'liverpoolfc.com' }],
  },
};

function statusStyle(status: string): { bg: string; text: string; label: string } {
  if (status === 'rising') return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: 'Rising' };
  if (status === 'concern') return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Concern' };
  if (status === 'critical') return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Critical' };
  return { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Stable' };
}

const card: React.CSSProperties = {
  backgroundColor: '#1a2540',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '24px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1a2540',
  color: '#e8edf5',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
};

export function PlayerWatch() {
  const [selectedClub, setSelectedClub] = useState('Chelsea');
  const [selectedPlayer, setSelectedPlayer] = useState('Cole Palmer');

  const currentPlayer = playerData[selectedPlayer] ?? playerData['Cole Palmer'];
  const st = statusStyle(currentPlayer.status);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Selection Controls */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ ...card, backgroundColor: '#131d2e' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#6b7fa3', marginBottom: '8px' }}>
                  Select Club
                </label>
                <select
                  value={selectedClub}
                  onChange={(e) => {
                    setSelectedClub(e.target.value);
                    setSelectedPlayer(playersByClub[e.target.value][0]);
                  }}
                  style={selectStyle}
                >
                  {clubs.map(club => <option key={club} value={club}>{club}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#6b7fa3', marginBottom: '8px' }}>
                  Select Player
                </label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  style={selectStyle}
                >
                  {playersByClub[selectedClub].map(player => <option key={player} value={player}>{player}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Player Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                  {selectedPlayer}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClubBadge club={currentPlayer.club} size="md" />
                  <span style={{ color: '#2d3a52' }}>•</span>
                  <span style={{ fontSize: '13.5px', color: '#6b7fa3' }}>{currentPlayer.position}</span>
                </div>
              </div>
              <span style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: st.bg,
                color: st.text,
              }}>
                {st.label}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7fa3', lineHeight: 1.6 }}>{currentPlayer.summary}</p>
          </div>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Availability */}
            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '12px' }}>Availability</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(52,211,153,0.15)',
                  color: '#34d399',
                }}>
                  {currentPlayer.availability}
                </span>
                <span style={{ fontSize: '13px', color: '#6b7fa3' }}>No injury concerns reported</span>
              </div>
            </div>

            {/* Recent Updates */}
            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '16px' }}>Recent Updates</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentPlayer.recentUpdates.map((update: any, i: number) => (
                  <div key={i} style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#131d2e',
                    borderLeft: '2px solid #4a9eff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(74,158,255,0.12)',
                        color: '#4a9eff',
                      }}>
                        {update.type}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#4a5568' }}>{update.date}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#e8edf5', lineHeight: 1.5 }}>{update.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Sources */}
            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>Sources</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentPlayer.sources.map((source: any, i: number) => (
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

            {/* Recent Mentions */}
            <div style={card}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '16px' }}>Recent Mentions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7fa3' }}>News articles</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#4a9eff' }}>12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7fa3' }}>Last updated</span>
                  <span style={{ fontSize: '13px', color: '#e8edf5' }}>2 hours ago</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
