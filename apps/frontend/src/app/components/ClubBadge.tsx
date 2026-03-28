interface ClubBadgeProps {
  club: string;
  size?: 'sm' | 'md' | 'lg';
}

const CLUB_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Chelsea':           { bg: 'rgba(3,70,148,0.25)',   border: 'rgba(3,70,148,0.6)',   text: '#4a9eff' },
  'Arsenal':           { bg: 'rgba(239,1,7,0.15)',    border: 'rgba(239,1,7,0.5)',    text: '#ff6b6b' },
  'Liverpool':         { bg: 'rgba(200,16,46,0.15)',  border: 'rgba(200,16,46,0.5)',  text: '#ff5c7a' },
  'Manchester United': { bg: 'rgba(218,41,28,0.15)',  border: 'rgba(218,41,28,0.5)',  text: '#ff6b5b' },
  'Manchester City':   { bg: 'rgba(108,171,221,0.15)',border: 'rgba(108,171,221,0.5)',text: '#6cabdd' },
  'Tottenham':         { bg: 'rgba(255,255,255,0.08)',border: 'rgba(255,255,255,0.2)',text: '#e0e0e0' },
  'Newcastle':         { bg: 'rgba(255,255,255,0.08)',border: 'rgba(255,255,255,0.2)',text: '#e0e0e0' },
  'Aston Villa':       { bg: 'rgba(149,28,100,0.15)', border: 'rgba(149,28,100,0.5)', text: '#d17abf' },
  'Brighton':          { bg: 'rgba(0,87,184,0.2)',    border: 'rgba(0,87,184,0.5)',   text: '#4a9eff' },
  'West Ham':          { bg: 'rgba(122,38,58,0.2)',   border: 'rgba(122,38,58,0.5)',  text: '#e07a8a' },
};

const DEFAULT = { bg: 'rgba(74,158,255,0.1)', border: 'rgba(74,158,255,0.2)', text: '#93b4d8' };

export function ClubBadge({ club, size = 'md' }: ClubBadgeProps) {
  const colors = CLUB_COLORS[club] ?? DEFAULT;
  const padding = size === 'sm' ? '4px 10px' : size === 'lg' ? '8px 18px' : '6px 14px';
  const fontSize = size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px';

  return (
    <span style={{
      padding,
      fontSize,
      fontWeight: 500,
      borderRadius: '6px',
      color: colors.text,
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      display: 'inline-block',
    }}>
      {club}
    </span>
  );
}
