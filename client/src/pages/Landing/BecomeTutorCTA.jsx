// BecomeTutorCTA.jsx — Call to action banner encouraging tutors to sign up.
//
// Features a highlighted gradient banner and direct link to /register?role=tutor.

import { Link } from 'react-router-dom'
import './BecomeTutorCTA.css'

function BecomeTutorCTA() {
  return (
    <section className="become-tutor-banner">
      <div className="become-tutor-container">
        <div className="become-tutor-card">
          
          <div className="become-tutor-content">
            <h2>Want to become a Tutor?</h2>
            <p>
              Apply for tuition jobs, set your preferred subjects and schedules, and grow your teaching career with TutorLink.
            </p>
          </div>

          <Link to="/register?role=tutor" className="btn-become-tutor">
            Sign Up as Tutor
          </Link>

        </div>
      </div>
    </section>
  )
}

export default BecomeTutorCTA
