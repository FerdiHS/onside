import { Fish } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Powered by
            </span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Fish className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                TinyFish
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Real-time web intelligence
            </span>
          </div>
          
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 Onside. All data sourced and verified through TinyFish.
          </div>
        </div>
      </div>
    </footer>
  );
}