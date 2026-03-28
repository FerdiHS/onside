import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="min-h-screen">
          <Navigation />
          {children}  {/* ← Outlet becomes children */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
