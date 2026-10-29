/// BrowseTutors.jsx — Public & Guardian Tutor Directory Page with Search, Filter & Rating Summaries.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import './BrowseTutors.css'

function BrowseTutors() {
  // Holds the full list of tutors fetched from the backend
  const [tutors, setTutors] = useState([])
  // Holds whatever the user has typed into the search box
  const [search, setSearch] = useState('')
  // Tracks whether the initial API call is still in progress, so we can show a loading message
  const [loading, setLoading] = useState(true)

  // Runs once when the page first loads (empty dependency array = run only on mount)
  useEffect(() => {
    async function fetchTutors() {
      try {
        // Public endpoint — returns all tutors (verified/browsable list)
        // .catch(() => null) prevents a network error from throwing and crashing this block
        const res = await api.get('/api/tutors/').catch(() => null)
        // Only update state if we actually got a valid array back
        if (res && Array.isArray(res.data)) {
          setTutors(res.data)
        }
      } catch (err) {
        // Fallback safety net in case something else throws unexpectedly
        console.error('Error fetching tutors:', err)
      } finally {
        // Either way, stop showing the loading state once the request settles
        setLoading(false)
      }
    }

    fetchTutors()
  }, [])

  // Client-side filtering: runs on every render, checking the search term
  // against username, subjects, and location (case-insensitive)
  const filteredTutors = tutors.filter((t) => {
    const q = search.toLowerCase()
    return (
      (t.username && t.username.toLowerCase().includes(q)) ||
      (t.subjects && t.subjects.toLowerCase().includes(q)) ||
      (t.location && t.location.toLowerCase().includes(q))
    )
  })

  return (
    <div className="browse-tutors-page">
      <Navbar />

      <main className="browse-tutors-container">
        <div className="browse-tutors-header">
          <h1>Browse Verified Tutors</h1>
          <p>Find qualified home and online tutors in your area with verified ratings and reviews.</p>
          
          {/* Search input — updates `search` state on every keystroke, which re-triggers the filter above */}
          <div className="search-bar-box">
            <input
              type="text"
              placeholder="Search by tutor name, subject (likePhysics), or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tutor-search-input"
            />
          </div>
        </div>

        {/* Three possible states: loading, no results, or the actual grid of tutor cards */}
        {loading ? (
          <div className="loading-state">Loading tutors...</div>
        ) : filteredTutors.length === 0 ? (
          <div className="empty-tutors-state">
            <h3>No tutors found matching "{search}"</h3>
          </div>
        ) : (
          <div className="tutors-grid">
            {filteredTutors.map((tutor) => {
              // Avatar fallback: first letter of username, or a person emoji if no username
              const initial = tutor.username ? tutor.username.charAt(0).toUpperCase() : '👤'
              return (
                <div key={tutor.id} className="tutor-card">
                  {/* --- Card header: avatar, name (links to full profile), location --- */}
                  <div className="tutor-card-header">
                    <div className="tutor-avatar">{initial}</div>
                    <div className="tutor-title-info">
                      <h3>
                        <Link to={`/tutors/${tutor.tutor_id}`} className="tutor-name-link">
                          {tutor.username}
                        </Link>
                      </h3>
                      <p className="tutor-location">📍 {tutor.location || 'Dhaka'}</p>
                    </div>
                  </div>

                  {/* --- Card body: subjects, optional bio, rating + badges --- */}
                  <div className="tutor-card-body">
                    <p className="tutor-subjects">📚 {tutor.subjects || 'General Subjects'}</p>
                    {tutor.bio && <p className="tutor-bio">{tutor.bio}</p>}

                    <div className="tutor-rating-row">
                      {/* Show star rating + review count if the tutor has reviews, otherwise a "New Tutor" label */}
                      {tutor.average_rating ? (
                        <span className="rating-badge">
                          ⭐ {tutor.average_rating} ({tutor.review_count} {tutor.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                      ) : (
                        <span className="no-rating-label">⭐ New Tutor (No reviews yet)</span>
                      )}
                      
                      {/* Badge shown only if the tutor has uploaded a CV */}
                      {tutor.cv_name && (
                        <Badge variant="verified">📄 CV Uploaded</Badge>
                      )}

                      {/* Badge shown for subscribed tutors — ties into the priority-boost subscription logic */}
                      {(tutor.is_subscribed || tutor.is_priority) && (
                        <Badge variant="primary" icon="⭐">Priority Pro</Badge>
                      )}
                    </div>
                  </div>

                  {/* --- Card footer: link through to the tutor's full profile & reviews page --- */}
                  <div className="tutor-card-footer">
                    <Link to={`/tutors/${tutor.tutor_id}`} className="btn-view-profile">
                      View Full Profile & Reviews →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default BrowseTutors