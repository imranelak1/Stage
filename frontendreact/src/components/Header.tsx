import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onExport?: () => void;
}

const navItems = [
  { path: '/', name: 'Tableau de Bord' },
  { path: '/analytics', name: 'Analytiques' },
  { path: '/regions', name: 'Régions' },
  { path: '/verification', name: 'Vérification' },
  { path: '/map', name: 'Carte' },
  { path: '/settings', name: 'Paramètres' },
];

const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-20"
      style={{
        background: 'linear-gradient(90deg, #0a2342 80%, #19376d 100%)',
        fontFamily: 'Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
        height: '48px',
        minHeight: '48px',
        boxShadow: '0 2px 8px rgba(10,35,66,0.08)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex items-center gap-2" style={{ height: '100%' }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: '#19376d',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1,
            fontFamily: 'inherit',
          }}
        >
          ST
        </div>
        <span
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            fontFamily: 'inherit',
            letterSpacing: 0.5,
            marginLeft: 8,
            marginRight: 16,
            whiteSpace: 'nowrap',
          }}
        >
          T3 Shield
        </span>
      </div>
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-2 items-center" style={{ height: '100%' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: currentPath === item.path ? '#fff' : '#b0c4de',
              background: currentPath === item.path ? '#19376d' : 'transparent',
              fontWeight: 500,
              fontSize: 15,
              borderRadius: 6,
              padding: '6px 14px',
              transition: 'background 0.2s, color 0.2s',
              fontFamily: 'inherit',
              textDecoration: 'none',
              boxShadow: currentPath === item.path ? '0 2px 8px rgba(25,55,109,0.08)' : 'none',
              letterSpacing: 0.2,
              marginLeft: 2,
              marginRight: 2,
              display: 'inline-block',
            }}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden flex items-center justify-center"
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: 26, padding: 8, marginLeft: 8 }}
        aria-label="Ouvrir le menu"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-50 flex"
          onClick={() => setMobileOpen(false)}
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <nav
            className="bg-[#0a2342] w-64 h-full p-6 flex flex-col gap-2 shadow-lg"
            style={{ fontFamily: 'inherit' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-6">
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: '#19376d',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: 1,
                  fontFamily: 'inherit',
                }}
              >
                ST
              </div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 18, fontFamily: 'inherit', letterSpacing: 0.5, marginLeft: 8 }}>
                T3 Shield
              </span>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  color: currentPath === item.path ? '#fff' : '#b0c4de',
                  background: currentPath === item.path ? '#19376d' : 'transparent',
                  fontWeight: 500,
                  fontSize: 17,
                  borderRadius: 6,
                  padding: '12px 18px',
                  marginBottom: 4,
                  transition: 'background 0.2s, color 0.2s',
                  fontFamily: 'inherit',
                  textDecoration: 'none',
                  boxShadow: currentPath === item.path ? '0 2px 8px rgba(25,55,109,0.08)' : 'none',
                  letterSpacing: 0.2,
                  display: 'block',
                }}
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
