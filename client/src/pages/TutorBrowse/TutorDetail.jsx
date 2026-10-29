// TutorDetail.jsx — Detailed Tutor Profile Page with Public Reviews & Conditional Review Form.

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import './TutorDetail.css'

function TutorDetail() {
  // Grabs the tutor's ID from the URL (e.g. /tutors/5)
  const { id } = useParams()
  // Currently logged-in user, from the shared AuthContext
  const { user } = useAuth()
  // True only if the logged-in user is a guardian (kept here but not
  // actually used below — the review form's visibility is instead driven
  // by tutor.can_review, which the backend calculates)
  const isGuardian = user && user.role === 'guardian'

  // The tutor's profile data (null until the API responds)
  const [tutor, setTutor] = useState(null)
  // Reviews + rating summary for this tutor, with sensible empty defaults
  const [reviewsData, setReviewsData] = useState({ reviews: [], average_rating: null, review_count: 0 })
  // Whether the initial page data is still being fetched
  const [loading, setLoading] = useState(true)

  // --- Review Form State ---
  const [ratingInput, setRatingInput] = useState(5)       // star rating selected by the guardian, defaults to 5
  const [commentInput, setCommentInput] = useState('')     // free-text review comment
  const [submittingReview, setSubmittingReview] = useState(false) // disables the button while the POST is in flight
  const [reviewStatus, setReviewStatus] = useState('')     // success/error message shown after submitting

  // Runs on mount, and again if the tutor ID in the URL changes
  useEffect(() => {
    async function fetchTutorDetails() {
      try {
        // Fetch the tutor's profile and their reviews at the same time,
        // instead of one after another, to load faster
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/api/tutors/${id}/`).catch(() => null),
          api.get(`/api/tutors/${id}/reviews/`).catch(() => null),
        ])

        if (profileRes && profileRes.data) {
          setTutor(profileRes.data)
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

  // Handles submitting a new review for this tutor
  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!tutor) return // safety check in case tutor data hasn't loaded yet

    setSubmittingReview(true)
    setReviewStatus('')

    try {
      // POST the new review — backend checks that this guardian actually
      // hired this tutor before before allowing it (see tutor.can_review below)
      const res = await api.post('/api/reviews/', {
        tutor: tutor.tutor_id,
        rating: ratingInput,
        comment: commentInput,
      })

      if (res && res.data) {
        setReviewStatus('✅ Review submitted successfully!')
        setCommentInput('') // clear the textarea after a successful submit

        // Re-fetch the reviews list so the new review shows up immediately
        const updatedReviews = await api.get(`/api/tutors/${id}/reviews/`).catch(() => null)
        if (updatedReviews && updatedReviews.data) {
          setReviewsData(updatedReviews.data)
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      // Show the backend's specific error message if there is one,
      // otherwise fall back to a generic failure message
      setReviewStatus(
        err.response && err.response.data && err.response.data.error
          ? `⚠️ ${err.response.data.error}`
          : '⚠️ Failed to submit review. Please try again.'
      )
    } finally {
      setSubmittingReview(false)
    }
  }

  // --- Early returns for loading / not-found states ---

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

  // Avatar fallback: first letter of username, or a person emoji if no username
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
                {/* Star rating pill if reviews exist, otherwise a "no reviews" pill */}
                {reviewsData.average_rating ? (
                  <span className="avg-rating-pill">
                    ⭐ {reviewsData.average_rating} ({reviewsData.review_count} {reviewsData.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                ) : (
                  <span className="no-reviews-pill">⭐ No reviews yet</span>
                )}

                {/* CV link — only shown if the tutor has uploaded one.
                    Handles both absolute URLs and relative Django media paths. */}
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

                {/* Priority Pro badge for subscribed tutors, reusing the same pill style with inline overrides */}
                {(tutor.is_subscribed || tutor.is_priority) && (
                  <span className="avg-rating-pill" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe' }}>
                    ⭐ Priority Pro
                  </span>
                )}

                {/* Academic Status Badge */}
                {tutor.is_currently_student !== undefined && (
                  <span className="avg-rating-pill" style={{ backgroundColor: tutor.is_currently_student ? '#f0fdf4' : '#f8fafc', color: tutor.is_currently_student ? '#166534' : '#334155', borderColor: tutor.is_currently_student ? '#bbf7d0' : '#cbd5e1' }}>
                    {tutor.is_currently_student ? `🎓 Current Student${tutor.student_id ? ` (ID: ${tutor.student_id})` : ''}` : '🎓 Graduated'}
                  </span>
                )}

                {/* Last Institution Certificate Link */}
                {!tutor.is_currently_student && tutor.certificate_url && (
                  <a
                    href={tutor.certificate_url.startsWith('http') ? tutor.certificate_url : `http://localhost:8000${tutor.certificate_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cv-link-btn"
                    style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}
                  >
                    📜 View Verified Certificate ↗
                  </a>
                )}
              </div>
            </div>
          </div>
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

          {/* Bio box only renders if the tutor actually wrote one */}
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

          {/* Leave a Review Form — backend decides eligibility via tutor.can_review
              (true only if this guardian has an accepted application with this tutor) */}
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

                {/* Success/error message shown after attempting to submit */}
                {reviewStatus && (
                  <p className="review-status-msg">{reviewStatus}</p>
                )}

                <button type="submit" className="btn-submit-review" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              // Shown instead of the form when this guardian hasn't hired this tutor yet
              <div className="review-disabled-notice">
                <p>🔒 You can review this tutor after hiring them (once an application is accepted).</p>
              </div>
            )}
          </div>

          {/* Public list of all reviews left for this tutor */}
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