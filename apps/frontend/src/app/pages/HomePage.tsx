import Link  from 'next/link';
import { ClipboardList, Users, Building2, Calendar, TrendingUp, Fish } from 'lucide-react';
import { ClubBadge } from '../components/ClubBadge';
import { TinyFishBadge }  from '../components/TinyFishBadge';

export function Home() {
  const upcomingMatches = [
    {
      home: 'Chelsea',
      away: 'Arsenal',
      competition: 'Premier League',
      date: 'Mar 29, 2026',
      time: '15:00 GMT',
    },
    {
      home: 'Manchester United',
      away: 'Liverpool',
      competition: 'Premier League',
      date: 'Mar 30, 2026',
      time: '16:30 GMT',
    },
  ];
  
  const demoClubs = ['Chelsea', 'Manchester United', 'Arsenal', 'Liverpool'];
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Football Intelligence Dashboard
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Real-time intelligence for club operations, scouting, and match preparation
            </p>
          </div>
        </div>
        
        {/* Primary Entry Cards */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Product Workflows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/match-prep"
              className="rounded-lg p-6 border transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border)',
              }}
            >
              <ClipboardList className="w-8 h-8 mb-4" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Match Prep
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Structured pre-match briefings with lineups, absences, and key talking points
              </p>
            </Link>
            
            <Link
              href="/player-watch"
              className="rounded-lg p-6 border transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border)',
              }}
            >
              <Users className="w-8 h-8 mb-4" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Player Watch
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Player intelligence files with recent updates, availability, and monitoring
              </p>
            </Link>
            
            <Link
              href="/club-package"
              className="rounded-lg p-6 border transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border)',
              }}
            >
              <Building2 className="w-8 h-8 mb-4" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Club Package
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Premium club-facing dashboard for tracking players across loan networks
              </p>
            </Link>
          </div>
        </div>
        
        {/* Upcoming Matches */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Upcoming Matches
          </h2>
          <div className="space-y-4">
            {upcomingMatches.map((match, index) => (
              <div
                key={index}
                className="rounded-lg p-5 border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--bg-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {match.home}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>vs</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {match.away}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {match.competition}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {match.date} at {match.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/match-prep"
                    className="px-4 py-2 rounded text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-blue)',
                      color: 'var(--bg-page)',
                    }}
                  >
                    View Prep
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Demo Clubs */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Demo Scope
          </h2>
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--bg-border)',
            }}
          >
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              This demonstration includes data for the following clubs:
            </p>
            <div className="flex flex-wrap gap-2">
              {demoClubs.map((club) => (
                <ClubBadge key={club} club={club} size="md" />
              ))}
            </div>
          </div>
        </div>
        
        {/* How It Works */}
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <Fish className="w-6 h-6 mb-3" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                TinyFish Powered
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Real-time web intelligence aggregation from trusted football sources worldwide
              </p>
            </div>
            
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <ClipboardList className="w-6 h-6 mb-3" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Structured Reports
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Organized briefings designed for quick scanning and decision-making
              </p>
            </div>
            
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <Building2 className="w-6 h-6 mb-3" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Source-Backed
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Every insight is linked to its original source for verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}