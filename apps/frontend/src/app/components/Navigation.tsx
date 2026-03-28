'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';  
import { Activity, ClipboardList, Users, Building2 } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    { path: '/', label: 'Home', icon: Activity },
    { path: '/match-prep', label: 'Match Prep', icon: ClipboardList },
    { path: '/player-watch', label: 'Player Watch', icon: Users },
    { path: '/club-package', label: 'Club Package', icon: Building2 },
  ];
  
  return (
    <nav className="border-b" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Activity className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Onside
              </span>
            </Link>
            
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
                    style={{
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}