// Hero.jsx — Hero Section for TutorLink Landing Page.
//
// Features:
// 1. Core value headline & subtext (Guardians find tutors, Tutors find jobs, AI matching).
// 2. Simple search bar navigating to /tutors?query=...
// 3. Custom purple theme SVG illustration graphic on the right with floating badges.

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
            Connect with Verified Tutors & <br />
            <span className="gradient-text">Unlock Academic Success</span>
          </h1>

          <p className="hero-subtext">
            TutorLink helps guardians find trusted, background-checked tutors, while passionate educators discover tuition jobs — boosted by smart AI matching.
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

        {/* Right Column: Custom SVG Graphic Illustration */}
        <div className="hero-right">
          <div className="hero-illustration-wrapper">
            
            {/* Clean original SVG Graphic matching TutorLink Purple Palette */}
            <svg
              className="hero-svg-bg"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer soft glow circle */}
              <circle cx="200" cy="200" r="170" fill="url(#hero-grad-outer)" opacity="0.15" />
              
              {/* Main rounded container card */}
              <rect x="50" y="60" width="300" height="280" rx="24" fill="url(#hero-card-grad)" />
              
              {/* Decorative top header bar */}
              <rect x="70" y="85" width="160" height="16" rx="8" fill="#ffffff" opacity="0.3" />
              <circle cx="320" cy="93" r="8" fill="#ffffff" opacity="0.4" />
              
              {/* Graduation Cap graphic vector */}
              <path
                d="M200 130L290 170L200 210L110 170L200 130Z"
                fill="#ffffff"
              />
              <path
                d="M140 195V230C140 245 167 255 200 255C233 255 260 245 260 230V195"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M275 180V240"
                stroke="#f093fb"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="275" cy="245" r="7" fill="#f093fb" />

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="hero-grad-outer" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#667eea" />
                  <stop offset="1" stopColor="#764ba2" />
                </linearGradient>
                <linearGradient id="hero-card-grad" x1="50" y1="60" x2="350" y2="340" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#667eea" />
                  <stop offset="1" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating feature chip 1 */}
            <div className="hero-chip chip-1">
              <span className="chip-icon">🛡️</span>
              <div>
                <span>100% Verified</span>
                <span className="chip-sub">Tutor Qualification</span>
              </div>
            </div>

            {/* Floating feature chip 2 */}
            <div className="hero-chip chip-2">
              <span className="chip-icon">⚡</span>
              <div>
                <span>AI Smart Match</span>
                <span className="chip-sub">Fast & Accurate</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
