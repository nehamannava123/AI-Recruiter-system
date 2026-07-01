import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Navbar({ minimal = false }) {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/setup', label: 'Setup' },
    { to: '/interview', label: 'Interview' },
    { to: '/results', label: 'Results' },
  ];

  if (minimal) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12 bg-void/80 backdrop-blur-md">
      <Link
        to="/"
        className="font-display text-xl font-bold text-primary tracking-tight"
      >
        Recluta
      </Link>

      {user ? (
        <div className="text-primary">
          {user.email?.split('@')[0]}
        </div>
      ) : (
        <Link to="/login" className="btn-ghost text-sm">
          Sign In
        </Link>
      )}
    </header>
  );
}
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-void/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl font-semibold text-primary tracking-tight">
          Recluta
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors duration-200 ${
                location.pathname === link.to
                  ? 'text-aurora'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 rounded-pill bg-elevated" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm text-primary transition hover:border-aurora/40"
              >
                <UserCircle2 size={16} />
                {user.email?.split('@')[0] || 'Profile'}
                <Menu size={16} className="text-secondary" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-card border border-border bg-card p-3 shadow-card">
                  <button
                    onClick={async () => {
                      await signOut();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-sm text-secondary transition hover:bg-elevated hover:text-primary"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
