// HowItWorks.jsx — Interactive "How It Works" section for TutorLink.
//
// Features two role tabs:
// 1. "For Guardians": 4-step flow (Create Profile → Post Requirement → Get Applications → Hire Tutor)
// 2. "For Tutors": 3-step flow (Create Profile → Complete Profile & Upload CV → Apply for Tuition Jobs)
//
// Styled with purple theme numbered circles and clean card layouts.

import { useState } from 'react'
import Badge from '../../components/Badge'
import './HowItWorks.css'

function HowItWorks() {
  // State for active tab: 'guardian' or 'tutor'
  const [activeTab, setActiveTab] = useState('guardian')

  // Steps data for Guardians (4-step flow)
  const guardianSteps = [
    {
      step: 1,
      title: 'Create Profile',
      description: 'Sign up as a Guardian in less than 2 minutes with your phone or email.',
    },
    {
      step: 2,
      title: 'Post Your Requirement',
      description: 'Specify subject, class, budget, location, and preferred tutor qualifications.',
    },
    {
      step: 3,
      title: 'Get Tutor Applications',
      description: 'Receive applications from verified tutors and review their credentials & ratings.',
    },
    {
      step: 4,
      title: 'Hire Your Tutor',
      description: 'Select the best tutor, schedule sessions, and start learning with confidence.',
    },
  ]

  // Steps data for Tutors (3-step flow)
  const tutorSteps = [
    {
      step: 1,
      title: 'Create Profile',
      description: 'Register as a Tutor and verify your email or contact information.',
    },
    {
      step: 2,
      title: 'Complete Profile & Upload CV',
      description: 'Add your educational background, teaching experience, and certificates.',
    },
    {
      step: 3,
      title: 'Apply for Tuition Jobs',
      description: 'Browse available tuition posts matching your subject expertise and send applications.',
    },
  ]

  const currentSteps = activeTab === 'guardian' ? guardianSteps : tutorSteps

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">
        
        {/* Header */}
        <div className="how-it-works-header">
          <Badge variant="primary" icon="⚙️">
            Simple & Transparent
          </Badge>
          <h2>How TutorLink Works</h2>
          <p>Get started in just a few simple steps</p>
        </div>

        {/* Tab Buttons */}
        <div className="how-tabs-wrapper">
          <button
            className={`how-tab-btn ${activeTab === 'guardian' ? 'active' : ''}`}
            onClick={() => setActiveTab('guardian')}
          >
            👨‍👩‍👧 For Guardians
          </button>
          <button
            className={`how-tab-btn ${activeTab === 'tutor' ? 'active' : ''}`}
            onClick={() => setActiveTab('tutor')}
          >
            👨‍🏫 For Tutors
          </button>
        </div>

        {/* Step Cards Grid */}
        <div className={`steps-grid steps-grid-${currentSteps.length}`}>
          {currentSteps.map((s) => (
            <div key={s.step} className="step-card">
              <div className="step-number">{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default HowItWorks
