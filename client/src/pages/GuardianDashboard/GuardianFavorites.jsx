// GuardianFavorites.jsx — Guardian Favorited Tutors Management Page.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Badge from '../../components/Badge'
import './GuardianFavorites.css'

function GuardianFavorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await api.get('/api/favorites/').catch(() => null)
        if (res && Array.isArray(res.data)) {
          setFavorites(res.data)
        }
      } catch (err) {
        console.error('Error loading favorites:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  async function handleRemoveFavorite(tutorId) {
    setRemovingId(tutorId)
    try {
      await api.delete(`/api/favorites/${tutorId}/`)
      setFavorites((prev) => prev.filter((t) => t.tutor_id !== tutorId))
    } catch (err) {
      console.error('Error removing favorite:', err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="favorites-page">
      <Sidebar role="guardian" />

      <main className="favorites-main">
        <div className="favorites-header">
          <h1>My Favorite Tutors</h1>
          <p>Bookmarked tutors you have saved for current or upcoming tuition posts.</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading your favorite tutors...</div>
        ) : favorites.length === 0 ? (
          <div className="favorites-empty-box">
            <h3>⭐ No favorite tutors saved yet</h3>
            <p>Browse tutors and click the heart icon on any tutor card to save them to your favorites list.</p>
            <Link to="/tutors" className="btn-browse-tutors">
              Browse Tutors Directory →
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((tutor) => {
              const initial = tutor.username ? tutor.username.charAt(0).toUpperCase() : '👤'
              return (
                <div key={tutor.id} className="fav-tutor-card">
                  <div className="card-top">
                    <div className="tutor-avatar">{initial}</div>
                    <div className="tutor-info">
                      <h3>
                        <Link to={`/tutors/${tutor.tutor_id}`} className="tutor-link">
                          {tutor.username}
                        </Link>
                      </h3>
                      <p className="tutor-location">📍 {tutor.location || 'Dhaka'}</p>
                    </div>

                    <button
                      type="button"
                      className="btn-remove-fav"
                      title="Remove from favorites"
                      onClick={() => handleRemoveFavorite(tutor.tutor_id)}
                      disabled={removingId === tutor.tutor_id}
                    >
                      ❌ Remove
                    </button>
                  </div>

                  <div className="card-mid">
                    <p className="subjects-text">📚 {tutor.subjects || 'General Subjects'}</p>
                    {tutor.bio && <p className="bio-text">{tutor.bio}</p>}

                    <div className="meta-row">
                      {tutor.average_rating ? (
                        <span className="rating-tag">⭐ {tutor.average_rating} ({tutor.review_count})</span>
                      ) : (
                        <span className="new-tag">⭐ New Tutor</span>
                      )}

                      {tutor.cv_name && <Badge variant="verified">📄 CV Available</Badge>}
                    </div>
                  </div>

                  <div className="card-bot">
                    <Link to={`/tutors/${tutor.tutor_id}`} className="btn-profile-link">
                      View Profile & Reviews →
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

export default GuardianFavorites
