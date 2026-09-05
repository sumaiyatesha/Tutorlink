// BrowseTutors.jsx — Public & Guardian Tutor Directory Page with Favorite Toggles & Rating Summaries.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import './BrowseTutors.css'

function BrowseTutors() {
  const { user } = useAuth()
  const isGuardian = user && user.role === 'guardian'

  const [tutors, setTutors] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    async function fetchTutors() {
      try {
        const res = await api.get('/api/tutors/').catch(() => null)
        if (res && Array.isArray(res.data)) {
          setTutors(res.data)
        }
      } catch (err) {
        console.error('Error fetching tutors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTutors()
  }, [])

  async function handleToggleFavorite(tutorId, currentFavorited) {
    if (!isGuardian) return
    setTogglingId(tutorId)

    try {
      if (currentFavorited) {
        await api.delete(`/api/favorites/${tutorId}/`)
      } else {
        await api.post(`/api/favorites/${tutorId}/`)
      }
      setTutors((prev) =>
        prev.map((t) => (t.tutor_id === tutorId ? { ...t, is_favorited: !currentFavorited } : t))
      )
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setTogglingId(null)
    }
  }

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
          
          <div className="search-bar-box">
            <input
              type="text"
              placeholder="Search by tutor name, subject (e.g. Physics), or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tutor-search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading tutors...</div>
        ) : filteredTutors.length === 0 ? (
          <div className="empty-tutors-state">
            <h3>No tutors found matching "{search}"</h3>
          </div>
        ) : (
          <div className="tutors-grid">
            {filteredTutors.map((tutor) => {
              const initial = tutor.username ? tutor.username.charAt(0).toUpperCase() : '👤'
              return (
                <div key={tutor.id} className="tutor-card">
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

                    {isGuardian && (
                      <button
                        type="button"
                        className={`btn-fav-heart ${tutor.is_favorited ? 'active' : ''}`}
                        title={tutor.is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                        onClick={() => handleToggleFavorite(tutor.tutor_id, tutor.is_favorited)}
                        disabled={togglingId === tutor.tutor_id}
                      >
                        {tutor.is_favorited ? '❤️' : '🤍'}
                      </button>
                    )}
                  </div>

                  <div className="tutor-card-body">
                    <p className="tutor-subjects">📚 {tutor.subjects || 'General Subjects'}</p>
                    {tutor.bio && <p className="tutor-bio">{tutor.bio}</p>}

                    <div className="tutor-rating-row">
                      {tutor.average_rating ? (
                        <span className="rating-badge">
                          ⭐ {tutor.average_rating} ({tutor.review_count} {tutor.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                      ) : (
                        <span className="no-rating-label">⭐ New Tutor (No reviews yet)</span>
                      )}
                      
                      {tutor.cv_name && (
                        <Badge variant="verified">📄 CV Uploaded</Badge>
                      )}

                      {(tutor.is_subscribed || tutor.is_priority) && (
                        <Badge variant="primary" icon="⭐">Priority Pro</Badge>
                      )}
                    </div>
                  </div>

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
