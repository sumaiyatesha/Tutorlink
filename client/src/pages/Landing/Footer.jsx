// Footer.jsx — Footer component for TutorLink Landing Page.
//
// Features:
// 1. TutorLink brand title + one-line description.
// 2. Useful links column (About, Privacy Policy, Terms of Use, FAQ).
// 3. Contact column (placeholder email, phone, Dhaka address).
// 4. Copyright note.

import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        
        {/* Brand Column */}
        <div className="footer-col-brand">
          <h3>TutorLink</h3>
          <p>
            The #1 tuition marketplace connecting verified tutors with students and guardians for academic excellence.
          </p>
        </div>

        {/* Useful Links Column */}
        <div className="footer-col-links">
          <h4 className="footer-col-title">Useful Links</h4>
          <ul className="footer-links-list">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="footer-col-contact">
          <h4 className="footer-col-title">Contact Us</h4>
          <div className="footer-contact-item">
            <span>✉️</span> support@tutorlink.com
          </div>
          <div className="footer-contact-item">
            <span>📞</span> +880 1700-000000
          </div>
          <div className="footer-contact-item">
            <span>📍</span> Dhaka, Bangladesh
          </div>
        </div>

      </div>

      {/* Copyright Note */}
      <div className="landing-footer-bottom">
        <p>&copy; {currentYear} TutorLink by SumaiyaTesha. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
