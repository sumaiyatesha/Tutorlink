// Navbar.jsx — Main Navigation Bar for TutorLink.
//
// Features:
// 1. Brand logo leading back to home ("/")
// 2. Dynamic navigation links based on user role (Guest, Guardian, Tutor, Admin)
// 3. Notification bell icon with unread count badge
// 4. Profile menu with avatar initials and toggleable dropdown menu
//
// Simple, lightweight, and thoroughly commented for viva defense.

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import NotificationBell from './NotificationBell'
import './Navbar.css'

function Navbar() {
  // Get current user and logout function from AuthContext
  const { user, logout } = useAuth()

  // State to track whether profile dropdown menu is open or closed
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // React Router hook for programmatically navigating after logout
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Function to toggle dropdown menu visibility when avatar is clicked
  function toggleDropdown() {
    setDropdownOpen((prev) => !prev)
  }

  // Handle user logout action
  function handleLogout() {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  // Helper function to extract user's avatar initial (e.g. 'J' from 'John')
  function getInitials() {
    if (!user || !user.username) return '👤'
    return user.username.charAt(0).toUpperCase()
  }

  // Render role-specific navigation links
  function renderNavLinks() {
    const role = user ? user.role : null

    if (role === 'guardian') {
      return (
        <>
          <Link to="/dashboard/guardian" className="site-nav-link">
            Dashboard
          </Link>
          <Link to="/guardian/posts" className="site-nav-link">
            My Posts
          </Link>
        </>
      )
    }

    if (role === 'tutor') {
      return (
        <>
          <Link to="/dashboard/tutor" className="site-nav-link">
            Dashboard
          </Link>
          <Link to="/posts" className="site-nav-link">
            Browse Posts
          </Link>
          <Link to="/tutor/applications" className="site-nav-link">
            My Applications
          </Link>
        </>
      )
    }

    if (role === 'admin') {
      return (
        <>
          <Link to="/dashboard/admin" className="site-nav-link">
            Dashboard
          </Link>
          <Link to="/admin/analytics" className="site-nav-link">
            Analytics
          </Link>
        </>
      )
    }

    // Default Guest links (when user is logged out)
    return (
      <>
        <Link to="/tutors" className="site-nav-link">
          Browse Tutors
        </Link>
        <Link to="/posts" className="site-nav-link">
          Browse Posts
        </Link>
        <Link to="/how-it-works" className="site-nav-link">
          How It Works
        </Link>
        <Link to="/login" className="site-nav-link">
          Login
        </Link>
        <Link to="/register" className="site-nav-cta">
          Register
        </Link>
      </>
    )
  }

  return (
    <nav className="site-navbar">
      <div className="site-navbar-container">
        
        {/* Site Brand / Logo */}
        <Link to="/" className="site-logo">
          TutorLink
        </Link>

        {/* Dynamic Navigation Links */}
        <div className="site-nav-links">{renderNavLinks()}</div>

        {/* User Controls: Bell Icon & Profile Dropdown (Shown when logged in) */}
        {user && (
          <div className="site-nav-user-area" ref={profileMenuRef}>
            
            {/* Interactive Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar & Dropdown Trigger */}
            <div className="profile-trigger" onClick={toggleDropdown}>
              <div className="avatar-circle">{getInitials()}</div>
              <span className="profile-username">{user.username}</span>
              <span className="dropdown-arrow">▼</span>
            </div>

            {/* Toggleable Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-header-info">
                  <span className="dropdown-role-label">{user.role} Account</span>
                </div>
                <Link
                  to="/profile"
                  className="dropdown-item-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 Profile
                </Link>
                <button className="dropdown-item-button" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </nav>
  )
}

export default Navbar
