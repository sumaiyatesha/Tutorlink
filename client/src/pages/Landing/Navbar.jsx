// Navbar.jsx — Sticky Top Navigation Bar for TutorLink Landing Page.
//
// Features:
// 1. Fixed/sticky header staying visible at top when user scrolls.
// 2. Brand logo (TutorLink) linking back to homepage.
// 3. Public nav links: Browse Tutors, Browse Tuition Posts, How It Works.
// 4. Action buttons: Login and Register (using design system purple styles).

import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <header className="landing-navbar">
      <div className="landing-navbar-container">
        
        {/* Left: TutorLink Brand Logo */}
        <Link to="/" className="landing-logo">
          TutorLink
        </Link>

        {/* Center: Public Navigation Links */}
        <nav className="landing-nav-links">
          <Link to="/tutors" className="landing-nav-link">
            Browse Tutors
          </Link>
          <Link to="/posts" className="landing-nav-link">
            Browse Tuition Posts
          </Link>
          <a href="#how-it-works" className="landing-nav-link">
            How It Works
          </a>
        </nav>

        {/* Right: Login and Register CTA Buttons */}
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-nav-login">
            Login
          </Link>
          <Link to="/register" className="btn-nav-register">
            Register
          </Link>
        </div>

      </div>
    </header>
  )
}

export default Navbar
