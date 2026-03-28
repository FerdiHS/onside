import { Fish, Zap } from 'lucide-react';

interface TinyFishBadgeProps {
  variant?: 'default' | 'live' | 'compact';
}

export function TinyFishBadge({ variant = 'default' }: TinyFishBadgeProps) {
  if (variant === 'compact') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
        style={{
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          color: 'var(--accent-blue)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        }}
      >
        <Fish className="w-3 h-3" />
        <span>TinyFish</span>
      </span>
    );
  }
  
  if (variant === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: 'rgba(224, 255, 106, 0.1)',
          color: 'var(--accent-lime)',
          border: '1px solid rgba(224, 255, 106, 0.3)',
        }}
      >
        <div className="relative">
          <Fish className="w-3.5 h-3.5" />
          <Zap className="w-2 h-2 absolute -top-0.5 -right-0.5" style={{ color: 'var(--accent-lime)' }} />
        </div>
        <span>Live via TinyFish</span>
      </span>
    );
  }
  
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded"
      style={{
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        border: '1px solid rgba(96, 165, 250, 0.3)',
      }}
    >
      <Fish className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
      <span className="text-sm" style={{ color: 'var(--accent-blue)' }}>
        Powered by TinyFish
      </span>
    </div>
  );
}
