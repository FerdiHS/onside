import { ExternalLink } from 'lucide-react';
import { TinyFishBadge } from './TinyFishBadge';

interface Source {
  title: string;
  domain: string;
  url?: string;
}

interface SourceCardProps {
  sources: Source[];
}

export function SourceCard({ sources }: SourceCardProps) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)', border: '1px solid' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Sources
        </h3>
        <TinyFishBadge variant="compact" />
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {source.title}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {source.domain}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}