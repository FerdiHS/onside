'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { RefreshCw } from 'lucide-react';

import { ClubBadge } from '../components/ClubBadge';
import { DataModeBadge } from '../components/DataModeBadge';
import {
  buildMatchPrepStreamUrl,
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

type LiveResearchProgressEvent = {
  label: string;
  timestamp?: string;
  rawPurpose?: string;
};

type LiveResearchStartedPayload = {
  match_id: string;
  run_id: string;
  timestamp?: string;
};

type LiveResearchPreviewPayload = {
  match_id: string;
  run_id?: string;
  streaming_url: string;
  timestamp?: string;
};

type LiveResearchProgressPayload = {
  match_id: string;
  run_id?: string;
  label: string;
  raw_purpose?: string;
  timestamp?: string;
};

type LiveResearchCompletePayload = {
  match_id: string;
  run_id?: string;
  result: MatchPrepData;
  completeness: 'full' | 'partial';
  timestamp?: string;
};

type LiveResearchErrorPayload = {
  match_id?: string;
  run_id?: string;
  code: string;
  message: string;
  timestamp?: string;
};

const DETAIL: MatchPrepDetail = 'summary';
const MAX_PROGRESS_EVENTS = 8;

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
  const [liveStreamingUrl, setLiveStreamingUrl] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<LiveResearchProgressEvent[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;
    let streamSettled = false;
    let fallbackStarted = false;

    function appendProgressEvent(event: LiveResearchProgressEvent) {
      setProgressEvents((current) => {
        const next = [...current];
        const previous = next.at(-1);

        if (
          previous &&
          previous.label === event.label &&
          previous.rawPurpose === event.rawPurpose
        ) {
          next[next.length - 1] = event;
          return next;
        }

        next.push(event);
        return next.slice(-MAX_PROGRESS_EVENTS);
      });
    }

    function handleLoadError(loadError: unknown) {
      const message =
        loadError instanceof FrontendApiError
          ? loadError.message
          : 'Match Prep could not be loaded right now.';

      setError(message);
      setIsStreaming(false);
      setIsLoading(false);
      setIsRefreshing(false);
    }

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
      setLiveStreamingUrl(null);
      setIsStreaming(false);
      setStreamingError(null);
      setProgressEvents([]);
      setStatusMessage('Showing backend mock summary.');
      setIsLoading(false);
      setIsRefreshing(false);
    }

    async function loadLiveWithPolling() {
      const started = await startMatchPrepRun({
        matchId,
        detail: DETAIL,
      });

      if (cancelled) {
        return;
      }

      const startStatus = started.response.data.status;
      setLiveStatus(startStatus);
      setLiveStreamingUrl(started.response.data.streaming_url ?? null);
      setIsStreaming(false);

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
        setStreamingError(null);
        appendProgressEvent({
          label: 'Showing cached live summary',
          timestamp: new Date().toISOString(),
        });
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
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const initialStatus = statusMessageForLiveStatus(startStatus);
      setStatusMessage(initialStatus);
      appendProgressEvent({
        label: 'Following TinyFish run via status polling',
        timestamp: new Date().toISOString(),
      });

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
          setLiveStreamingUrl(polled.response.data.streaming_url ?? null);

          if (pollStatus === 'pending' || pollStatus === 'running') {
            const nextLabel = statusMessageForLiveStatus(pollStatus);
            setStatusMessage(nextLabel);
            appendProgressEvent({
              label: nextLabel,
              timestamp: new Date().toISOString(),
            });
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

            appendProgressEvent({
              label: 'Live summary ready',
              timestamp: new Date().toISOString(),
            });
            setStatusMessage('Showing live TinyFish summary.');
            setStreamingError(null);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }

          setError(
            polled.response.data.error?.message ??
              'Live match summary could not be completed.',
          );
          setStreamingError(null);
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

    async function fallbackToPolling(message: string) {
      if (cancelled || fallbackStarted) {
        return;
      }

      fallbackStarted = true;
      setIsStreaming(false);
      setStreamingError(message);
      setStatusMessage(message);
      appendProgressEvent({
        label: 'Switching to status polling',
        timestamp: new Date().toISOString(),
      });

      await loadLiveWithPolling();
    }

    function loadLiveViaStream() {
      if (typeof EventSource === 'undefined') {
        void fallbackToPolling(
          'Live research streaming is unavailable in this browser. Falling back to status polling...',
        );
        return;
      }

      setIsStreaming(true);
      setStreamingError(null);
      setLiveStatus('pending');
      setLiveStreamingUrl(null);
      setStatusMessage('Opening TinyFish live research...');
      setProgressEvents([
        {
          label: 'Opening TinyFish live research',
          timestamp: new Date().toISOString(),
        },
      ]);

      const streamUrl = buildMatchPrepStreamUrl({
        matchId,
        detail: DETAIL,
      });
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('started', (rawEvent) => {
        if (cancelled) {
          return;
        }

        const event = parseStreamEvent<LiveResearchStartedPayload>(rawEvent);
        if (!event) {
          return;
        }

        setLiveStatus('pending');
        setStatusMessage('TinyFish live research started.');
        appendProgressEvent({
          label: 'Live research started',
          timestamp: event.timestamp,
        });
      });

      eventSource.addEventListener('preview', (rawEvent) => {
        if (cancelled) {
          return;
        }

        const event = parseStreamEvent<LiveResearchPreviewPayload>(rawEvent);
        if (!event) {
          return;
        }

        setLiveStatus('running');
        setLiveStreamingUrl(event.streaming_url);
        setStatusMessage('TinyFish shared a live browser preview.');
        appendProgressEvent({
          label: 'Live browser preview available',
          timestamp: event.timestamp,
        });
      });

      eventSource.addEventListener('progress', (rawEvent) => {
        if (cancelled) {
          return;
        }

        const event = parseStreamEvent<LiveResearchProgressPayload>(rawEvent);
        if (!event) {
          return;
        }

        setLiveStatus('running');
        setStatusMessage(event.label);
        appendProgressEvent({
          label: event.label,
          timestamp: event.timestamp,
          rawPurpose: event.raw_purpose,
        });
      });

      eventSource.addEventListener('heartbeat', () => {
        if (!cancelled) {
          setIsStreaming(true);
        }
      });

      eventSource.addEventListener('complete', (rawEvent) => {
        if (cancelled) {
          return;
        }

        const event = parseStreamEvent<LiveResearchCompletePayload>(rawEvent);
        if (!event) {
          return;
        }

        streamSettled = true;
        eventSource?.close();
        dataRef.current = event.result;
        setData(event.result);
        setLiveStatus('completed');
        setIsStreaming(false);
        setStreamingError(null);
        setStatusMessage('Showing live TinyFish summary.');
        setIsLoading(false);
        setIsRefreshing(false);
        appendProgressEvent({
          label: 'Live summary ready',
          timestamp: event.timestamp,
        });
      });

      eventSource.addEventListener('error', (rawEvent) => {
        if (cancelled || streamSettled) {
          return;
        }

        const event = parseStreamEvent<LiveResearchErrorPayload>(rawEvent);
        if (!event) {
          return;
        }

        streamSettled = true;
        eventSource?.close();
        void fallbackToPolling(event.message);
      });

      eventSource.onerror = () => {
        if (cancelled || streamSettled) {
          return;
        }

        eventSource?.close();
        void fallbackToPolling(
          'Live Research stream disconnected. Falling back to status polling...',
        );
      };
    }

    const task = mode === 'live' ? Promise.resolve().then(loadLiveViaStream) : loadMock();
    void task.catch(handleLoadError);

    return () => {
      cancelled = true;
      streamSettled = true;
      eventSource?.close();
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [matchId, mode, refreshKey]);

  const kickoff = formatKickoff(data?.kickoff_time ?? null);
  const display = data ? data.display ?? createSourceBackedMatchPrepDisplay(data) : null;
  const renderLivePanel = mode === 'live';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e1521' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#e8edf5',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {data ? `${data.home_team} vs ${data.away_team}` : 'Match Prep'}
                </h1>
                <DataModeBadge mode={mode} />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
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
                setLiveStreamingUrl(null);
                setStreamingError(null);
                setProgressEvents([]);

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
              <RefreshCw
                size={14}
                className={isLoading || isRefreshing ? 'animate-spin' : ''}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && !data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {renderLivePanel ? (
              <TinyFishLivePanel
                status={liveStatus}
                streamingUrl={liveStreamingUrl}
                statusMessage={statusMessage}
                isStreaming={isStreaming}
                streamingError={streamingError}
                progressEvents={progressEvents}
              />
            ) : null}
            <div style={card}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#e8edf5',
                  marginBottom: '8px',
                }}
              >
                Match Prep unavailable
              </div>
              <div style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
                {error}
              </div>
            </div>
          </div>
        ) : !data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {renderLivePanel ? (
              <TinyFishLivePanel
                status={liveStatus}
                streamingUrl={liveStreamingUrl}
                statusMessage={statusMessage}
                isStreaming={isStreaming}
                streamingError={streamingError}
                progressEvents={progressEvents}
              />
            ) : null}
            <div style={card}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#e8edf5',
                  marginBottom: '8px',
                }}
              >
                Building Match Summary
              </div>
              <div style={{ fontSize: '13.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
                {statusMessage}
              </div>
              {mode === 'live' && liveStatus ? (
                <div
                  style={{
                    marginTop: '14px',
                    fontSize: '12px',
                    color: '#4a9eff',
                    textTransform: 'capitalize',
                    letterSpacing: '0.04em',
                  }}
                >
                  Current status: {liveStatus}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {renderLivePanel ? (
                <TinyFishLivePanel
                  status={liveStatus}
                  streamingUrl={liveStreamingUrl}
                  statusMessage={error ? error : statusMessage}
                  isStreaming={isStreaming}
                  streamingError={streamingError}
                  progressEvents={progressEvents}
                />
              ) : null}

              <div style={card}>
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#e8edf5',
                    marginBottom: '24px',
                  }}
                >
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
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#e8edf5',
                    marginBottom: '16px',
                  }}
                >
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
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#e8edf5',
                    marginBottom: '14px',
                  }}
                >
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
                          <div style={{ fontSize: '13px', color: '#c8d8f0', marginBottom: '2px' }}>
                            {source.title}
                          </div>
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
              <span style={{ color: '#4a9eff', fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>
                •
              </span>
              <span style={{ fontSize: '13.5px', color: '#e8edf5', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))
        )}
        {showNote && note ? (
          <div style={{ fontSize: '12px', color: '#6b7fa3', lineHeight: 1.5 }}>{note}</div>
        ) : null}
      </div>
    </div>
  );
}

function TinyFishLivePanel({
  status,
  streamingUrl,
  statusMessage,
  isStreaming,
  streamingError,
  progressEvents,
}: {
  status: MatchPrepPollStatus | null;
  streamingUrl: string | null;
  statusMessage: string;
  isStreaming: boolean;
  streamingError: string | null;
  progressEvents: LiveResearchProgressEvent[];
}) {
  return (
    <div style={card}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#e8edf5',
              marginBottom: '6px',
            }}
          >
            Live Research
          </h2>
          <div style={{ fontSize: '12px', color: '#6b7fa3', lineHeight: 1.5 }}>
            {statusMessage}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isStreaming ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#7dc0ff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: '#4a9eff',
                  boxShadow: '0 0 0 6px rgba(74, 158, 255, 0.12)',
                }}
              />
              Streaming
            </span>
          ) : null}
          {status ? (
            <div
              style={{
                fontSize: '11px',
                color: '#4a9eff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {status}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: '#131d2e',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9fb3d1', marginBottom: '12px' }}>
            Agent activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {progressEvents.length === 0 ? (
              <EmptyListLabel label="TinyFish will post short research updates here once the live run begins." />
            ) : (
              progressEvents.map((event, index) => (
                <div
                  key={`${event.label}-${event.timestamp ?? index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '10px 1fr',
                    gap: '10px',
                    alignItems: 'start',
                  }}
                >
                  <span
                    style={{
                      color: '#4a9eff',
                      fontSize: '16px',
                      lineHeight: 1,
                      marginTop: '2px',
                    }}
                  >
                    •
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#d7e3f5', lineHeight: 1.5 }}>
                      {event.label}
                    </div>
                    {event.timestamp ? (
                      <div style={{ fontSize: '11px', color: '#52627f', marginTop: '4px' }}>
                        {formatEventTime(event.timestamp)}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
          {streamingError ? (
            <div
              style={{
                marginTop: '14px',
                fontSize: '12px',
                color: '#f4c27d',
                lineHeight: 1.5,
              }}
            >
              {streamingError}
            </div>
          ) : null}
        </div>

        <div
          style={{
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.07)',
            backgroundColor: '#0e1521',
            overflow: 'hidden',
          }}
        >
          {streamingUrl ? (
            <>
              <iframe
                src={streamingUrl}
                title="TinyFish browser preview"
                style={{
                  width: '100%',
                  minHeight: '320px',
                  border: '0',
                  backgroundColor: '#0e1521',
                }}
              />
              <div
                style={{
                  padding: '12px 14px',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  fontSize: '12px',
                  color: '#6b7fa3',
                  lineHeight: 1.5,
                }}
              >
                Live browser preview from TinyFish. If the preview is blocked in-app,{' '}
                <a
                  href={streamingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#4a9eff', textDecoration: 'none' }}
                >
                  open it in a new tab
                </a>
                .
              </div>
            </>
          ) : (
            <div
              style={{
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '24px',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '14px', color: '#d7e3f5' }}>
                Waiting for live browser preview
              </div>
              <div style={{ fontSize: '12.5px', color: '#6b7fa3', lineHeight: 1.6 }}>
                TinyFish will expose a shareable browser preview when the run starts streaming.
                The activity feed will keep updating even if a preview never appears.
              </div>
            </div>
          )}
        </div>
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
              <span style={{ color: '#4a9eff', fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>
                •
              </span>
              <span style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))
        )}
        {showNote && note ? (
          <div style={{ fontSize: '12px', color: '#6b7fa3', lineHeight: 1.5 }}>{note}</div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyListLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.6 }}>{label}</div>
  );
}

function statusMessageForLiveStatus(
  status: Extract<MatchPrepPollStatus, 'pending' | 'running'>,
) {
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

function parseStreamEvent<T>(event: Event): T | null {
  if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
    return null;
  }

  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function formatEventTime(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
}
