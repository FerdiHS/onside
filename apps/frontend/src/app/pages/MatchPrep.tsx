'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { RefreshCw } from 'lucide-react';

import { ClubBadge } from '../components/ClubBadge';
import { DataModeBadge } from '../components/DataModeBadge';
import {
  FrontendApiError,
  fetchMatchPrep,
  formatKickoff,
  pollMatchPrepStatus,
  resolvePollDelayMs,
  startMatchPrepRun,
} from '@/lib/match-prep-client';
import { getDefaultMatchPrepMode } from '@/lib/frontend-config';
import {
  createSourceBackedMatchPrepDisplay,
  type MatchPrepData,
  type MatchPrepDetail,
  type MatchPrepPollStatus,
} from '@/lib/schemas';

type MatchPrepProps = {
  params: {
    matchId: string;
  };
};

const DETAIL: MatchPrepDetail = 'summary';

const card: CSSProperties = {
  backgroundColor: '#1a2540',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '24px',
};

export default function MatchPrep({ params }: MatchPrepProps) {
  const matchId = params.matchId;
  const mode = useMemo(() => getDefaultMatchPrepMode(), []);
  const dataRef = useRef<MatchPrepData | null>(null);

  const [data, setData] = useState<MatchPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    mode === 'live'
      ? 'Starting live TinyFish match summary...'
      : 'Loading mock match summary...',
  );
  const [liveStatus, setLiveStatus] = useState<MatchPrepPollStatus | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadMock() {
      const response = await fetchMatchPrep({
        matchId,
        mode: 'mock',
        detail: DETAIL,
      });

      if (cancelled) {
        return;
      }

      dataRef.current = response.data;
      setData(response.data);
      setLiveStatus(null);
      setStatusMessage('Showing backend mock summary.');
      setIsLoading(false);
      setIsRefreshing(false);
    }

    async function loadLive() {
      const started = await startMatchPrepRun({
        matchId,
        detail: DETAIL,
      });

      if (cancelled) {
        return;
      }

      const startStatus = started.response.data.status;
      if (startStatus === 'completed') {
        setStatusMessage('Loading cached live summary...');
        const cached = await fetchMatchPrep({
          matchId,
          mode: 'live',
          detail: DETAIL,
        });

        if (cancelled) {
          return;
        }

        dataRef.current = cached.data;
        setData(cached.data);
        setLiveStatus('completed');
        setStatusMessage('Showing live TinyFish summary.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (startStatus === 'failed' || startStatus === 'cancelled') {
        setError(
          started.response.data.error?.message ??
            'Live match summary could not be started.',
        );
        setLiveStatus(startStatus);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setLiveStatus(startStatus);
      setStatusMessage(statusMessageForLiveStatus(startStatus));

      const poll = async () => {
        try {
          const polled = await pollMatchPrepStatus({
            matchId,
            detail: DETAIL,
          });

          if (cancelled) {
            return;
          }

          const pollStatus = polled.response.data.status;
          setLiveStatus(pollStatus);

          if (pollStatus === 'pending' || pollStatus === 'running') {
            setStatusMessage(statusMessageForLiveStatus(pollStatus));
            const nextDelay = resolvePollDelayMs(
              polled.response,
              polled.retryAfterMs,
            );
            pollTimer = setTimeout(() => {
              void poll();
            }, nextDelay);
            return;
          }

          if (pollStatus === 'completed') {
            if (polled.response.data.result) {
              dataRef.current = polled.response.data.result;
              setData(polled.response.data.result);
            } else {
              const finalResult = await fetchMatchPrep({
                matchId,
                mode: 'live',
                detail: DETAIL,
              });

              if (cancelled) {
                return;
              }

              dataRef.current = finalResult.data;
              setData(finalResult.data);
            }

            setStatusMessage('Showing live TinyFish summary.');
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }

          setError(
            polled.response.data.error?.message ??
              'Live match summary could not be completed.',
          );
          setIsLoading(false);
          setIsRefreshing(false);
        } catch (pollError) {
          if (cancelled) {
            return;
          }

          handleLoadError(pollError);
        }
      };

      const initialDelay = resolvePollDelayMs(
        started.response,
        started.retryAfterMs,
      );
      pollTimer = setTimeout(() => {
        void poll();
      }, initialDelay);
    }

    function handleLoadError(loadError: unknown) {
      const message =
        loadError instanceof FrontendApiError
          ? loadError.message
          : 'Match Prep could not be loaded right now.';

      setError(message);
      setIsLoading(false);
      setIsRefreshing(false);
    }

    const task = mode === 'live' ? loadLive() : loadMock();
    void task.catch(handleLoadError);

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [matchId, mode, refreshKey]);

  const kickoff = formatKickoff(data?.kickoff_time ?? null);
  const display = data ? data.display ?? createSourceBackedMatchPrepDisplay(data) : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.02em' }}>
                  {data ? `${data.home_team} vs ${data.away_team}` : 'Match Prep'}
                </h1>
                <DataModeBadge mode={mode} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#6b7fa3' }}>
                  {data?.competition ?? 'Loading competition...'}
                </span>
                <span style={{ color: '#2d3a52' }}>•</span>
                <span style={{ fontSize: '14px', color: '#6b7fa3' }}>
                  {kickoff.fullLabel}
                </span>
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7fa3' }}>
                {error ? error : statusMessage}
              </div>
            </div>

            <button
              onClick={() => {
                setError(null);
                setLiveStatus(null);
                setStatusMessage(
                  mode === 'live'
                    ? 'Starting live TinyFish match summary...'
                    : 'Loading mock match summary...',
                );

                if (dataRef.current) {
                  setIsRefreshing(true);
                } else {
                  setIsLoading(true);
                }

                setRefreshKey((current) => current + 1);
              }}
              disabled={isLoading || isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#1a2540',
                color: '#e8edf5',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: isLoading || isRefreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: isLoading || isRefreshing ? 0.65 : 1,
              }}
            >
              <RefreshCw size={14} className={isLoading || isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && !data ? (
          <div style={card}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e8edf5', marginBottom: '8px' }}>
              Match Prep unavailable
            </div>
            <div style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
              {error}
            </div>
          </div>
        ) : !data ? (
          <div style={card}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e8edf5', marginBottom: '8px' }}>
              Building Match Summary
            </div>
            <div style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
              {statusMessage}
            </div>
            {mode === 'live' && liveStatus ? (
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#4a9eff', textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                Current status: {liveStatus}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={card}>
                <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '24px' }}>
                  Probable Lineups
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <TeamListCard
                    club={data.home_team}
                    title="Projected XI"
                    items={display?.probable_lineups.home.items ?? data.probable_lineups.home}
                    emptyLabel="No confirmed home lineup signals in summary mode."
                    note={display?.probable_lineups.home.note}
                    showNote={
                      display?.probable_lineups.home.provenance === 'ai-assisted' ||
                      display?.probable_lineups.home.provenance === 'mixed'
                    }
                  />
                  <TeamListCard
                    club={data.away_team}
                    title="Projected XI"
                    items={display?.probable_lineups.away.items ?? data.probable_lineups.away}
                    emptyLabel="No confirmed away lineup signals in summary mode."
                    note={display?.probable_lineups.away.note}
                    showNote={
                      display?.probable_lineups.away.provenance === 'ai-assisted' ||
                      display?.probable_lineups.away.provenance === 'mixed'
                    }
                  />
                </div>
              </div>

              <div style={card}>
                <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#e8edf5', marginBottom: '16px' }}>
                  Injuries & Absences
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <TeamListCard
                    club={data.home_team}
                    title="Home"
                    items={
                      display?.injuries_or_absences.home.items ??
                      data.injuries_or_absences.home
                    }
                    emptyLabel="No notable home absences captured."
                  />
                  <TeamListCard
                    club={data.away_team}
                    title="Away"
                    items={
                      display?.injuries_or_absences.away.items ??
                      data.injuries_or_absences.away
                    }
                    emptyLabel="No notable away absences captured."
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <BulletCard
                title="Key Talking Points"
                items={display?.key_talking_points.items ?? data.key_talking_points}
                emptyLabel="No talking points were captured yet."
                note={display?.key_talking_points.note}
                showNote={display?.key_talking_points.provenance === 'ai-assisted'}
              />

              <BulletCard
                title="Recent Context"
                items={display?.recent_context.items ?? data.recent_context}
                emptyLabel="No recent context was captured yet."
                note={display?.recent_context.note}
                showNote={display?.recent_context.provenance === 'ai-assisted'}
              />

              <div style={card}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>
                  Sources
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.sources.length === 0 ? (
                    <EmptyListLabel label="No sources were captured for this summary." />
                  ) : (
                    data.sources.map((source, index) => {
                      const domain = source.domain ?? deriveDomain(source.url) ?? 'Unknown source';

                      return (
                        <a
                          key={`${source.url}-${index}`}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#131d2e',
                            border: '1px solid rgba(255,255,255,0.04)',
                            textDecoration: 'none',
                            display: 'block',
                          }}
                        >
                          <div style={{ fontSize: '13px', color: '#c8d8f0', marginBottom: '2px' }}>{source.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#4a5568' }}>{domain}</div>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamListCard({
  club,
  title,
  items,
  emptyLabel,
  note,
  showNote = false,
}: {
  club: string;
  title: string;
  items: string[];
  emptyLabel: string;
  note?: string;
  showNote?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <ClubBadge club={club} size="md" />
        <span style={{ fontSize: '12px', color: '#4a5568' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.length === 0 ? (
          <EmptyListLabel label={emptyLabel} />
        ) : (
          items.map((item, index) => (
            <div key={`${club}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#4a9eff', fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: '13.5px', color: '#e8edf5', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))
        )}
        {showNote && note ? (
          <div style={{ fontSize: '12px', color: '#6b7fa3', lineHeight: 1.5 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BulletCard({
  title,
  items,
  emptyLabel,
  note,
  showNote = false,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  note?: string;
  showNote?: boolean;
}) {
  return (
    <div style={card}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8edf5', marginBottom: '14px' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.length === 0 ? (
          <EmptyListLabel label={emptyLabel} />
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#4a9eff', fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))
        )}
        {showNote && note ? (
          <div style={{ fontSize: '12px', color: '#6b7fa3', lineHeight: 1.5 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyListLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>
      {label}
    </div>
  );
}

function statusMessageForLiveStatus(status: Extract<MatchPrepPollStatus, 'pending' | 'running'>) {
  return status === 'running'
    ? 'TinyFish is collecting the live match summary...'
    : 'Starting the TinyFish live match summary...';
}

function deriveDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./u, '');
  } catch {
    return null;
  }
}
