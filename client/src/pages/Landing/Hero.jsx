// Hero.jsx — Hero Section for TutorLink Landing Page.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'

function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Handle hero search submission -> navigate to Browse Tutors with query param
  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/tutors?query=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/tutors')
    }
  }

  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* Left Column: Headline, Description & Search Form */}
        <div className="hero-left">
          <div className="hero-badge">
            <span>✨</span> AI-Powered Tuition Marketplace
          </div>

          <h1 className="hero-title">
            Connect with verified tutors and find quality tuition in Bangladesh
          </h1>

          <p className="hero-subtext">
            TutorLink helps guardians find background-checked, qualified tutors and empowers passionate educators to discover tuition opportunities — supported by smart AI matching.
          </p>

          {/* Search Form */}
          <form className="hero-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by subject, class, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-button">
              Find a Tutor
            </button>
          </form>
        </div>

        {/* Right Column: Clean SVG Graphic Illustration */}
        <div className="hero-right">
          <div className="hero-illustration-wrapper">
            
            {/* Clean SVG Graphic matching TutorLink Purple Palette */}
            <svg
              className="hero-svg-bg"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer soft circle */}
              <circle cx="200" cy="200" r="160" fill="#f5f3ff" />
              
              {/* Main rounded container card */}
              <rect x="60" y="70" width="280" height="260" rx="16" fill="#4f46e5" />
              
              {/* Decorative top header bar */}
              <rect x="80" y="95" width="140" height="12" rx="6" fill="#ffffff" opacity="0.4" />
              <circle cx="310" cy="101" r="6" fill="#ffffff" opacity="0.6" />
              
              {/* Graduation Cap graphic vector */}
              <path
                d="M200 135L280 170L200 205L120 170L200 135Z"
                fill="#ffffff"
              />
              <path
                d="M145 195V225C145 238 168 248 200 248C232 248 255 238 255 225V195"
                stroke="#ffffff"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M268 180V235"
                stroke="#c7d2fe"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="268" cy="240" r="6" fill="#c7d2fe" />
            </svg>

            {/* Feature chip 1 */}
            <div className="hero-chip chip-1">
              <span className="chip-icon">🛡️</span>
              <div>
                <span>Verified Credentials</span>
                <span className="chip-sub">Background Checked</span>
              </div>
            </div>

            {/* Feature chip 2 */}
            <div className="hero-chip chip-2">
              <span className="chip-icon">⚡</span>
              <div>
                <span>Smart AI Matching</span>
                <span className="chip-sub">Schedule & Budget</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
