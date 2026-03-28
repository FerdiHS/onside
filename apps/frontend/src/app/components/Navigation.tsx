'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ClipboardList, Users, Building2 } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Activity },
  { path: '/match-prep', label: 'Match Prep', icon: ClipboardList },
  { path: '/player-watch', label: 'Player Watch', icon: Users },
  { path: '/club-package', label: 'Club Package', icon: Building2 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav style={{
      backgroundColor: '#0b1120',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: '4px',
    }}>
      {/* Brand */}
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        textDecoration: 'none',
        marginRight: '16px',
      }}>
        <Activity size={17} color="#4a9eff" strokeWidth={2.5} />
        <span style={{ color: '#e8edf5', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>
          Onside
        </span>
      </Link>

      {/* Nav links */}
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = pathname === path;
        return (
          <Link key={path} href={path} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 13px',
            borderRadius: '7px',
            fontSize: '13.5px',
            fontWeight: isActive ? 500 : 400,
            textDecoration: 'none',
            color: isActive ? '#c8d8f0' : '#6b7fa3',
            backgroundColor: isActive ? 'rgba(74,158,255,0.12)' : 'transparent',
          }}>
            <Icon size={13} color={isActive ? '#4a9eff' : '#6b7fa3'} strokeWidth={2.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
