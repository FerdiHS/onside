type StatusType = 'rising' | 'stable' | 'concern' | 'critical' | 'live' | 'partial';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'rising':
        return {
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          color: 'var(--status-rising)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
        };
      case 'stable':
        return {
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          color: 'var(--status-stable)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        };
      case 'concern':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: 'var(--status-concern)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'critical':
        return {
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          color: 'var(--status-critical)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
        };
      case 'live':
        return {
          backgroundColor: 'rgba(215, 255, 74, 0.1)',
          color: 'var(--accent-lime)',
          border: '1px solid rgba(215, 255, 74, 0.3)',
        };
      case 'partial':
        return {
          backgroundColor: 'rgba(168, 182, 199, 0.1)',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(168, 182, 199, 0.3)',
        };
      default:
        return {
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          color: 'var(--status-stable)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        };
    }
  };
  
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={getStatusStyles()}
    >
      {displayLabel}
    </span>
  );
}
