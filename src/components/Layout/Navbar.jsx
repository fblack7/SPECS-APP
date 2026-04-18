import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 18L7 6L12 14L17 9L21 18" stroke="#C9982A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="4" r="2" fill="#C9982A"/>
          </svg>
          <span className="brand-name">P&H Spec Reference</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Specs
          </Link>
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <div className="user-avatar">{(profile?.email || user?.email || '?')[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="user-email">{profile?.email || user?.email}</span>
            <span className={`user-role ${profile?.role}`}>{profile?.role || 'user'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )
}
