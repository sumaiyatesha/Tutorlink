// DashboardNav.jsx — Top navigation bar for all dashboard pages.
//
// Displays:
// 1. TutorLink logo (links to home /)
// 2. Currently logged-in user's username and role badge
// 3. Log Out button

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function DashboardNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Get role emoji badge
  function getRoleBadge(role) {
    if (role === 'guardian') return '🛡️ Guardian'
    if (role === 'tutor') return '📚 Tutor'
    if (role === 'admin') return '👑 Admin'
    return role
  }

  return (
    <nav className="dashboard-nav">
      <div className="dashboard-nav-container">
        {/* Brand Logo */}
        <Link to="/" className="dashboard-logo">
          TutorLink
        </Link>

        {/* User Info & Actions */}
        <div className="dashboard-nav-user">
          {user && (
            <div className="user-details">
              <span className="user-name">👤 {user.username}</span>
              <span className={`user-role-badge role-${user.role}`}>
                {getRoleBadge(user.role)}
              </span>
            </div>
          )}

          <button className="dashboard-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  )
}

export default DashboardNav
