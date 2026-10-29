// LandingPage.jsx — Main Landing Page for TutorLink (public, no login required).
//
// Structured inspired by tuition marketplace layout, using TutorLink's purple palette.
//
// Sections included:
// 1. Navbar — Sticky top navbar with logo, links, login & register buttons.
// 2. Hero — Value proposition, search bar, and purple vector illustration graphic.
// 3. StatsBar — Key metrics (Registered Tutors, Tuition Posts, Applications, Verified Tutors).
// 4. BecomeTutorCTA — Banner prompting tutors to sign up.
// 5. CategoryGrid — Grid of popular subject categories (Mathematics, English, etc.).
// 6. HowItWorks — Interactive tabs for Guardians (4 steps) & Tutors (3 steps).
// 7. Testimonials — User reviews from guardians and tutors.
// 8. Footer — Useful links, contact info, copyright.

import Navbar from '../../components/Navbar'
import Hero from './Hero'
import StatsBar from './StatsBar'
import BecomeTutorCTA from './BecomeTutorCTA'
import CategoryGrid from './CategoryGrid'
import HowItWorks from './HowItWorks'
import Testimonials from './Testimonials'
import Footer from './Footer'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page-container">
      {/* 1. Sticky Top Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Stats Bar */}
      <StatsBar />

      {/* 4. Become a Tutor CTA Banner */}
      <BecomeTutorCTA />

      {/* 5. Subject Category Grid */}
      <CategoryGrid />

      {/* 6. How It Works Section */}
      <HowItWorks />

      {/* 7. Testimonials Section */}
      <Testimonials />

      {/* 8. Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage
