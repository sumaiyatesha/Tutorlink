// Sidebar.jsx — Reusable Fixed Left Sidebar Component for Tutor & Guardian Dashboards.
//
// Features:
// 1. Tutor ID (e.g. T0012) or Guardian ID (e.g. G0005) calculated from user.id.
// 2. Role-specific navigation links with active state highlighting.
// 3. Coming Soon badges for stub routes.

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import './Sidebar.css'

function Sidebar({ role = 'tutor' }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Format ID string, e.g. "T0012" or "G0005"
  const formattedId = user
    ? (role === 'tutor' ? 'T' : 'G') + String(user.id || 1).padStart(4, '0')
    : role === 'tutor'
    ? 'T0001'
    : 'G0001'

  // User's display avatar initial
  const avatarInitial = user && user.username ? user.username.charAt(0).toUpperCase() : '👤'

  // Logout handler
  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Navigation config for Tutor role
  const tutorLinks = [
    { label: 'Dashboard', path: '/dashboard/tutor', icon: '📊' },
    { label: 'AI Match Assistant', path: '/ai-matching', icon: '🤖' },
    { label: 'Tuition Jobs', path: '/tutor/jobs', icon: '💼' },
    { label: 'My Profile', path: '/profile', icon: '👤' },
    { label: 'My Applications', path: '/tutor/applications', icon: '📝' },
    { label: 'Subscription Plan', path: '/subscription', icon: '⭐' },
  ]

  // Navigation config for Guardian role
  const guardianLinks = [
    { label: 'Dashboard', path: '/dashboard/guardian', icon: '📊' },
    { label: 'AI Match Assistant', path: '/ai-matching', icon: '🤖' },
    { label: 'My Tuition Posts', path: '/guardian/posts', icon: '📋' },
    { label: 'Post a Tuition', path: '/guardian/post-tuition', icon: '➕' },
    { label: 'Applicants', path: '/guardian/applicants', icon: '👥' },
    { label: 'Favorites', path: '/guardian/favorites', icon: '⭐' },
    { label: 'Subscription Plan', path: '/subscription', icon: '👑' },
  ]

  const links = role === 'tutor' ? tutorLinks : guardianLinks

  return (
    <aside className="dash-sidebar">
      {/* Brand Header */}
      <div className="dash-sidebar-header">
        <Link to="/" className="dash-sidebar-logo">
          TutorLink
        </Link>
      </div>

      {/* User Info Box */}
      <div className="dash-sidebar-user">
        <div className="dash-avatar-circle">{avatarInitial}</div>
        <div className="dash-user-info">
          <span className="dash-user-name">{user ? user.username : 'User'}</span>
          <span className="dash-user-id">
            {role === 'tutor' ? 'Tutor ID' : 'Guardian ID'}: {formattedId}
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="dash-sidebar-nav">
        {links.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`dash-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="dash-nav-icon">{link.icon}</span>
              <span>{link.label}</span>
              {link.stub && <span className="dash-badge-stub">{link.stub}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer Logout */}
      <div className="dash-sidebar-footer">
        <button className="btn-sidebar-logout" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
