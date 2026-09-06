// HowItWorksPage.jsx — Comprehensive "How TutorLink Works" page.
//
// Structured into plain, clear sections explaining TutorLink's complete workflow:
// 1. For Guardians:
//    - Step 1: Post a Tuition Job (specify subject, salary, location, days)
//    - Step 2: Review Tutor Applicants (compare credentials, ratings & verified badges)
//    - Step 3: Hire with Confidence (accept application, schedule demo & sessions)
//    - Step 4: Guardian Subscription (30 Tk/mo unlocks unlimited posts & AI Matching)
// 2. For Tutors:
//    - Step 1: Subscribe for Priority (50 Tk/mo for Priority Pro placement in directory)
//    - Step 2: Browse & Apply (search tuition jobs by subject/district & send customized proposals)
//    - Step 3: Get Accepted & Hired (guardian confirms hire; 15% platform commission obligation is logged)
//    - Step 4: Build Reputation & Ratings (receive authentic guardian reviews)
// 3. AI-Powered Smart Matching:
//    - Natural language query parser (understands "need math tutor in Dhanmondi")
//    - Relational constraints matching & Haversine proximity calculation
//    - Gemini AI personalized match rationale generation
//
// Styled with TutorLink's purple design system tokens (#4f46e5 / #764ba2).

import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Badge from '../../components/Badge'
import './HowItWorksPage.css'

function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <Navbar />

      <main className="how-page-container">
        {/* Header Hero */}
        <section className="how-hero-section">
          <Badge variant="primary" icon="⚡">
            Platform Workflow Guide
          </Badge>
          <h1>How TutorLink Works</h1>
          <p>
            A transparent, AI-assisted tuition marketplace connecting qualified tutors with guardians and students across Bangladesh.
          </p>
        </section>

        {/* SECTION 1: FOR GUARDIANS */}
        <section className="role-workflow-section">
          <div className="role-section-header">
            <span className="role-icon-badge">👨‍👩‍👧</span>
            <div>
              <h2>Workflow for Guardians & Students</h2>
              <p>Find, evaluate, and hire verified tutors for any subject in 4 easy steps.</p>
            </div>
          </div>

          <div className="workflow-cards-grid">
            <div className="workflow-card">
              <div className="step-badge-num">1</div>
              <h3>Post a Tuition Job</h3>
              <p>
                Create a tuition requirement listing specifying class, subject, monthly salary budget, preferred days, and your location.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-badge-num">2</div>
              <h3>Review Applicants</h3>
              <p>
                Receive detailed applications from verified tutors. Compare qualifications, subjects taught, academic backgrounds, and student ratings.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-badge-num">3</div>
              <h3>Hire Your Tutor</h3>
              <p>
                Accept your top applicant with one click. Directly communicate to schedule trial lessons and confirm tuition timings.
              </p>
            </div>

            <div className="workflow-card highlighted">
              <div className="step-badge-num">4</div>
              <h3>Guardian Subscription</h3>
              <p>
                Subscribe for just <strong>30 Tk/month</strong> to unlock unlimited tuition postings, verified guardian badge, and the AI Matchmaking Assistant.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: FOR TUTORS */}
        <section className="role-workflow-section">
          <div className="role-section-header">
            <span className="role-icon-badge">👨‍🏫</span>
            <div>
              <h2>Workflow for Tutors</h2>
              <p>Grow your teaching career, find verified tuition posts, and earn platform trust.</p>
            </div>
          </div>

          <div className="workflow-cards-grid">
            <div className="workflow-card highlighted">
              <div className="step-badge-num">1</div>
              <h3>Subscribe for Priority</h3>
              <p>
                Subscribe for <strong>50 Tk/month</strong> to receive the <strong>Priority Pro Badge</strong> and top ranking placement in guardian search results.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-badge-num">2</div>
              <h3>Browse & Apply</h3>
              <p>
                Filter active tuition posts by subject, district, and distance. Submit tailored cover notes highlighting your educational strengths.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-badge-num">3</div>
              <h3>Get Accepted & Hired</h3>
              <p>
                When a guardian accepts your application, the hire is confirmed. A transparent 15% platform commission record is automatically tracked.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-badge-num">4</div>
              <h3>Earn Reviews & Ratings</h3>
              <p>
                Deliver high-quality tuition sessions, collect genuine ratings and reviews from guardians, and boost your credibility on the platform.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: AI-POWERED MATCHMAKING FEATURES */}
        <section className="ai-features-overview-section">
          <div className="ai-overview-header">
            <span className="ai-tag-pill">🤖 Built-in AI Intelligence</span>
            <h2>Next-Generation Smart Matching</h2>
            <p>
              TutorLink integrates Google Gemini AI to revolutionize how students and educators connect.
            </p>
          </div>

          <div className="ai-cards-grid">
            <div className="ai-feature-card">
              <div className="ai-feature-icon">💬</div>
              <h3>Natural Language Query Parser</h3>
              <p>
                Guardians and tutors can type in conversational language (e.g., <em>"Need a female math tutor in Dhanmondi for 3 days"</em>). The AI parses subjects, days, budget, and location into structured search criteria.
              </p>
            </div>

            <div className="ai-feature-card">
              <div className="ai-feature-icon">📍</div>
              <h3>Multi-Constraint & Proximity Sorting</h3>
              <p>
                Candidates are ranked by matching subjects, availability schedules, budget fit, Haversine geographic distance, and Priority Pro subscriber status.
              </p>
            </div>

            <div className="ai-feature-card">
              <div className="ai-feature-icon">✨</div>
              <h3>Personalized Match Rationales</h3>
              <p>
                The AI generates a personalized 1-sentence match explanation for each top result, explaining precisely why each tutor or post fits your exact needs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="how-cta-banner">
          <h2>Ready to get started?</h2>
          <p>Join thousands of students, guardians, and verified tutors on TutorLink today.</p>
          <div className="how-cta-actions">
            <Link to="/register" className="btn-how-primary">Create Free Account</Link>
            <Link to="/tutors" className="btn-how-secondary">Browse Verified Tutors</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HowItWorksPage
