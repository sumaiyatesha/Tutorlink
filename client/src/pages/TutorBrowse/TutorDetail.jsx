// TutorDetail.jsx — Detailed Tutor Profile Page with Public Reviews & Conditional Review Form.

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import './TutorDetail.css'

function TutorDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isGuardian = user && user.role === 'guardian'

  const [tutor, setTutor] = useState(null)
  const [reviewsData, setReviewsData] = useState({ reviews: [], average_rating: null, review_count: 0 })
  const [loading, setLoading] = useState(true)
  const [togglingFav, setTogglingFav] = useState(false)

  // Review Form State
  const [ratingInput, setRatingInput] = useState(5)
  const [commentInput, setCommentInput] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewStatus, setReviewStatus] = useState('')

  useEffect(() => {
    async function fetchTutorDetails() {
      try {
        const [tutorRes, reviewsRes] = await Promise.all([
          api.get(`/api/tutors/${id}/`).catch(() => null),
          api.get(`/api/tutors/${id}/reviews/`).catch(() => null),
        ])

        if (tutorRes && tutorRes.data) {
          setTutor(tutorRes.data)
        }
        if (reviewsRes && reviewsRes.data) {
          setReviewsData(reviewsRes.data)
        }
      } catch (err) {
        console.error('Error fetching tutor details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTutorDetails()
  }, [id])

  async function handleToggleFavorite() {
    if (!isGuardian || !tutor) return
    setTogglingFav(true)

    try {
      if (tutor.is_favorited) {
        await api.delete(`/api/favorites/${tutor.tutor_id}/`)
        setTutor((prev) => ({ ...prev, is_favorited: false }))
      } else {
        await api.post(`/api/favorites/${tutor.tutor_id}/`)
        setTutor((prev) => ({ ...prev, is_favorited: true }))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setTogglingFav(false)
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!tutor) return

    setSubmittingReview(true)
    setReviewStatus('')

    try {
      const res = await api.post('/api/reviews/', {
        tutor: tutor.tutor_id,
        rating: ratingInput,
        comment: commentInput,
      })

      if (res && res.data) {
        setReviewStatus('✅ Review submitted successfully!')
        setCommentInput('')
        // Refresh reviews list
        const updatedReviews = await api.get(`/api/tutors/${id}/reviews/`).catch(() => null)
        if (updatedReviews && updatedReviews.data) {
          setReviewsData(updatedReviews.data)
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setReviewStatus(
        err.response && err.response.data && err.response.data.error
          ? `⚠️ ${err.response.data.error}`
          : '⚠️ Failed to submit review. Please try again.'
      )
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="tutor-detail-page">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading tutor profile...</div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="tutor-detail-page">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Tutor not found</h2>
          <Link to="/tutors" style={{ color: '#4f46e5', fontWeight: 600 }}>← Back to Browse Tutors</Link>
        </div>
      </div>
    )
  }

  const initial = tutor.username ? tutor.username.charAt(0).toUpperCase() : '👤'

  return (
    <div className="tutor-detail-page">
      <Navbar />

      <main className="tutor-detail-container">
        {/* Profile Card Header */}
        <div className="tutor-header-card">
          <div className="header-left">
            <div className="tutor-avatar-large">{initial}</div>
            <div className="header-info">
              <h1>{tutor.username}</h1>
              <p className="location-text">📍 Location: {tutor.location || 'Dhaka'}</p>
              
              <div className="rating-summary-row">
                {reviewsData.average_rating ? (
                  <span className="avg-rating-pill">
                    ⭐ {reviewsData.average_rating} ({reviewsData.review_count} {reviewsData.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                ) : (
                  <span className="no-reviews-pill">⭐ No reviews yet</span>
                )}

                {tutor.cv_url && (
                  <a
                    href={tutor.cv_url.startsWith('http') ? tutor.cv_url : `http://localhost:8000${tutor.cv_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cv-link-btn"
                  >
                    📄 View Verified Resume / CV ↗
                  </a>
                )}

                {(tutor.is_subscribed || tutor.is_priority) && (
                  <span className="avg-rating-pill" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe' }}>
                    ⭐ Priority Pro
                  </span>
                )}
              </div>
            </div>
          </div>

          {isGuardian && (
            <button
              type="button"
              className={`btn-fav-large ${tutor.is_favorited ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              disabled={togglingFav}
            >
              {tutor.is_favorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </button>
          )}
        </div>

        {/* Profile Info Details */}
        <div className="tutor-info-grid">
          <div className="info-box">
            <h3>📚 Subjects Expertise</h3>
            <p>{tutor.subjects || 'General Subjects'}</p>
          </div>

          <div className="info-box">
            <h3>🏫 Teaching Preferences</h3>
            <p>{tutor.teaching_preferences || 'Home Tutoring / Online'}</p>
          </div>

          {tutor.bio && (
            <div className="info-box full-width">
              <h3>📝 Bio & Overview</h3>
              <p>{tutor.bio}</p>
            </div>
          )}
        </div>

        {/* Reviews & Ratings Section */}
        <div className="reviews-section">
          <h2>Tutor Reviews & Ratings</h2>

          {/* Leave a Review Form (Visible only to hired guardians) */}
          <div className="review-form-box">
            <h3>✍️ Leave a Review</h3>
            {tutor.can_review ? (
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="form-group-inline">
                  <label>Star Rating:</label>
                  <select
                    value={ratingInput}
                    onChange={(e) => setRatingInput(Number(e.target.value))}
                    className="rating-select"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3 - Good)</option>
                    <option value={2}>⭐⭐ (2 - Fair)</option>
                    <option value={1}>⭐ (1 - Poor)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Feedback / Comment:</label>
                  <textarea
                    rows={3}
                    placeholder="Share your experience hiring this tutor..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    required
                    className="review-textarea"
                  />
                </div>

                {reviewStatus && (
                  <p className="review-status-msg">{reviewStatus}</p>
                )}

                <button type="submit" className="btn-submit-review" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="review-disabled-notice">
                <p>🔒 You can review this tutor after hiring them (once an application is accepted).</p>
              </div>
            )}
          </div>

          {/* Public Reviews List */}
          <div className="reviews-list">
            <h3>Recent Reviews ({reviewsData.reviews.length})</h3>
            {reviewsData.reviews.length === 0 ? (
              <p className="empty-reviews-text">No reviews have been written for this tutor yet.</p>
            ) : (
              reviewsData.reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="review-card-header">
                    <span className="reviewer-name">👤 {rev.reviewer_name}</span>
                    <span className="review-stars">{'⭐'.repeat(rev.rating)}</span>
                    <span className="review-date">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-comment">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default TutorDetail
