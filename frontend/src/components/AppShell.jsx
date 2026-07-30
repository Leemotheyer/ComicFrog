import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'List', icon: '📚' },
  { to: '/add', label: 'Add', icon: '➕' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function AppShell({ pullListCount = 0 }) {
  const { configured } = useAuth();
  const location = useLocation();
  const hideNav = !configured && location.pathname !== '/settings';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo">🐸</span>
          <div>
            <p className="topbar__title">ComicFrog</p>
            <p className="topbar__subtitle">Comic collection</p>
          </div>
        </div>
        {configured && (
          <span className="connection-pill connected">Connected</span>
        )}
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
            >
              <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
              <span className="bottom-nav__label">{item.label}</span>
              {item.to === '/' && pullListCount > 0 && (
                <span className="bottom-nav__badge">{pullListCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
