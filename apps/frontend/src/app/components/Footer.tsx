import { Fish } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backgroundColor: '#0b1120',
      marginTop: '64px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6b7fa3' }}>Powered by</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: '#1a2540',
          }}>
            <Fish size={14} color="#4a9eff" strokeWidth={1.5} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#e8edf5' }}>TinyFish</span>
          </div>
          <span style={{ fontSize: '12px', color: '#4a5568' }}>Real-time web intelligence</span>
        </div>

        <div style={{ fontSize: '12px', color: '#4a5568' }}>
          © 2026 Onside. All data sourced and verified through TinyFish.
        </div>
      </div>
    </footer>
  );
}
