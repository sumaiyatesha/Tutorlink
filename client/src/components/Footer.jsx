// Footer.jsx — Simple Footer component for TutorLink.
//
// Displays the brand logo, short tagline, navigation links, and copyright text.
// Simple, clean, and well-commented for university viva presentation.

import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  // Dynamically retrieve current year for copyright line
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        
        {/* Brand name and tagline */}
        <div className="footer-brand-info">
          <h3>TutorLink</h3>
          <p>Connecting students with qualified tutors for academic success.</p>
        </div>

        {/* Quick navigation links */}
        <div className="footer-nav-links">
          <Link to="/">Home</Link>
          <Link to="/tutors">Browse Tutors</Link>
          <Link to="/posts">Browse Posts</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/subscription">Subscription</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

      </div>

      {/* Dynamic copyright note */}
      <div className="footer-copyright">
        <p>&copy; {currentYear} TutorLink by SumaiyaTesha. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
