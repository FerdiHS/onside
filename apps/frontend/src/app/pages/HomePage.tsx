'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Users, Building2, Calendar, Fish } from 'lucide-react';

import { ClubBadge } from '../components/ClubBadge';
import { DataModeBadge } from '../components/DataModeBadge';
import { getDefaultMatchPrepMode } from '@/lib/frontend-config';
import { FrontendApiError, fetchFixtures, formatKickoff } from '@/lib/match-prep-client';
import type { MatchSummary } from '@/lib/schemas';

const workflows = [
  { href: '/match-prep', icon: ClipboardList, title: 'Match Prep', description: 'Structured pre-match briefings with lineups, absences, and key talking points' },
  { href: '/player-watch', icon: Users, title: 'Player Watch', description: 'Player intelligence files with recent updates, availability, and monitoring' },
  { href: '/club-package', icon: Building2, title: 'Club Package', description: 'Premium club-facing dashboard for tracking players across loan networks' },
];

const howItWorks = [
  { icon: Fish, title: 'TinyFish Powered', description: 'Real-time web intelligence aggregation from trusted football sources worldwide' },
  { icon: ClipboardList, title: 'Structured Reports', description: 'Organized briefings designed for quick scanning and decision-making' },
  { icon: Building2, title: 'Source-Backed', description: 'Every insight is linked to its original source for verification' },
];

const demoClubs = ['Chelsea', 'Manchester United', 'Arsenal', 'Liverpool'];

export function Home() {
  const mode = getDefaultMatchPrepMode();
  const [fixtures, setFixtures] = useState<MatchSummary[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(true);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFixtures() {
      setIsLoadingFixtures(true);
      setFixturesError(null);

      try {
        const response = await fetchFixtures();
        if (!cancelled) {
          setFixtures(response.data);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof FrontendApiError
            ? error.message
            : 'Could not load upcoming matches right now.';
        setFixturesError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingFixtures(false);
        }
      }
    }

    void loadFixtures();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ marginBottom: '56px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.2 }}>
            Football Intelligence Dashboard
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7fa3' }}>
            Real-time intelligence for club operations, scouting, and match preparation
          </p>
        </div>

        <div style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '20px' }}>
            Product Workflows
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {workflows.map(({ href, icon: Icon, title, description }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    backgroundColor: '#1a2540',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '28px 24px',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
                    <Icon size={32} color="#4a9eff" strokeWidth={1.5} />
                    {title === 'Match Prep' ? <DataModeBadge mode={mode} /> : null}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '10px' }}>{title}</h3>
                  <p style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5' }}>
              Upcoming Matches
            </h2>
            <DataModeBadge mode={mode} />
          </div>

          {isLoadingFixtures ? (
            <FixtureStateCard
              title="Loading upcoming matches..."
              body="Fetching the latest Match Prep selector from the backend."
            />
          ) : fixturesError ? (
            <FixtureStateCard
              title="Could not load upcoming matches"
              body={fixturesError}
            />
          ) : fixtures.length === 0 ? (
            <FixtureStateCard
              title="No upcoming matches available"
              body="The fixture selector is empty right now. Add or refresh the seeded fixtures to continue."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fixtures.map((match) => {
                const kickoff = formatKickoff(match.kickoff_time);

                return (
                  <div key={match.id} style={{
                    backgroundColor: '#1a2540',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Calendar size={18} color="#4a5568" strokeWidth={1.5} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#e8edf5' }}>{match.home_team}</span>
                          <span style={{ fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>vs</span>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#e8edf5' }}>{match.away_team}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', color: '#6b7fa3' }}>{match.competition ?? 'Competition TBD'}</span>
                          <span style={{ color: '#2d3a52' }}>•</span>
                          <span style={{ fontSize: '12.5px', color: '#6b7fa3' }}>{kickoff.fullLabel}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/match-prep/${match.id}`} style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                    }}>
                      View Prep
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '20px' }}>
            Demo Scope
          </h2>
          <div style={{
            backgroundColor: '#131d2e',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <p style={{ fontSize: '13.5px', color: '#6b7fa3', marginBottom: '16px' }}>
              This demonstration includes data for the following clubs:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {demoClubs.map(club => (
                <ClubBadge key={club} club={club} size="md" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '20px' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {howItWorks.map(({ icon: Icon, title, description }) => (
              <div key={title} style={{
                backgroundColor: '#131d2e',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <Icon size={24} color="#4a9eff" strokeWidth={1.5} style={{ display: 'block', marginBottom: '14px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e8edf5', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function FixtureStateCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#1a2540',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  );
}
