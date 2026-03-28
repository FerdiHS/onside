interface ClubBadgeProps {
  club: string;
  size?: 'sm' | 'md';
}

export function ClubBadge({ club, size = 'sm' }: ClubBadgeProps) {
  const getClubColor = (clubName: string) => {
    const colors: Record<string, string> = {
      'Chelsea': '#034694',
      'Manchester United': '#DA291C',
      'Arsenal': '#EF0107',
      'Liverpool': '#C8102E',
      'Manchester City': '#6CABDD',
      'Tottenham': '#132257',
    };
    return colors[clubName] || 'var(--accent-blue)';
  };
  
  const clubColor = getClubColor(club);
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const fontSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <span
      className={`inline-flex items-center ${padding} ${fontSize} rounded font-medium`}
      style={{
        backgroundColor: `${clubColor}15`,
        color: clubColor,
        border: `1px solid ${clubColor}40`,
      }}
    >
      {club}
    </span>
  );
}
