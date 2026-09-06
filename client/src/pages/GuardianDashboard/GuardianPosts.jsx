// GuardianPosts.jsx — My Tuition Posts List View for Guardians.
//
// Features:
// 1. Calls GET /api/tuition-posts/?mine=true to fetch posts created by logged-in guardian.
// 2. Renders list of tuition posts with subject, location, salary, and status badge.
// 3. Edit button -> navigates to /guardian/posts/edit/:id.
// 4. Delete button -> prompts confirmation dialog, then calls DELETE /api/tuition-posts/:id/.
// 5. "+ Post New Requirement" CTA button.

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import './GuardianPosts.css'

function GuardianPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // AI Recommendation Modal State
  const [recommendModalOpen, setRecommendModalOpen] = useState(false)
  const [activePost, setActivePost] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loadingAi, setLoadingAi] = useState(false)
  const [aiError, setAiError] = useState('')

  // Handle Get AI Recommendations
  async function handleGetRecommendations(post) {
    setActivePost(post)
    setRecommendModalOpen(true)
    setLoadingAi(true)
    setAiError('')
    setRecommendations([])

    try {
      const res = await api.post(`/api/ai/recommend-tutors/${post.id}/`)
      if (res && res.data && res.data.recommendations) {
        setRecommendations(res.data.recommendations)
      } else {
        setAiError('No tutor recommendations generated. Try again later.')
      }
    } catch (err) {
      console.error('Error fetching AI tutor recommendations:', err)
      setAiError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to generate AI recommendations.'
      )
    } finally {
      setLoadingAi(false)
    }
  }

  // Fetch logged-in guardian's posts
  useEffect(() => {
    async function fetchMyPosts() {
      try {
        const response = await api.get('/api/tuition-posts/?mine=true')
        if (response && Array.isArray(response.data)) {
          setPosts(response.data)
        }
      } catch (err) {
        console.error('Error fetching guardian posts:', err)
        setError('Failed to load your tuition posts.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyPosts()
  }, [])

  // Handle Delete Post
  async function handleDelete(postId, title) {
    const confirmed = window.confirm(`Are you sure you want to delete post "${title}"?`)
    if (!confirmed) return

    try {
      await api.delete(`/api/tuition-posts/${postId}/`)
      // Remove deleted post from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('Failed to delete post. You can only delete your own posts.')
    }
  }

  return (
    <div className="guardian-posts-page">
      <Sidebar role="guardian" />

      <main className="guardian-posts-main">
        {/* Header Row */}
        <div className="guardian-posts-header">
          <div>
            <h1>My Tuition Posts</h1>
            <p>Manage all your posted tuition requirements, edit details, or delete posts.</p>
          </div>

          <Link to="/guardian/post-tuition" className="btn-create-post-header">
            ➕ Post New Tuition
          </Link>
        </div>

        {error && <div className="posts-error-banner">{error}</div>}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading your posts...</div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Tuition Posts Found"
            message="You have not created any tuition requirements yet. Post one now to reach top tutors!"
          />
        ) : (
          <div className="guardian-posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="guardian-post-card">
                <div className="guardian-post-card-top">
                  <div className="post-header-info">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Badge variant="primary">JOB-{String(post.id).padStart(4, '0')}</Badge>
                      <Badge variant={post.status === 'open' ? 'verified' : 'secondary'}>
                        {post.status || 'Open'}
                      </Badge>
                    </div>
                    <h3>{post.title || post.subject}</h3>
                    <p className="post-location">📍 {post.location}</p>
                  </div>

                  <div className="post-salary-tag">
                    ৳ {post.salary ? Number(post.salary).toLocaleString() : '8,000'}/mo
                  </div>
                </div>

                <div className="post-meta-details">
                  <span>📚 <strong>Subject:</strong> {post.subject}</span>
                  <span>🎓 <strong>Category:</strong> {post.category || 'General'}</span>
                  <span>📅 <strong>Days:</strong> {post.days_per_week || 3} Days/Wk</span>
                  <span>💻 <strong>Method:</strong> {post.method || 'In-Person'}</span>
                </div>

                <div className="guardian-post-actions">
                  <button
                    type="button"
                    style={{
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleGetRecommendations(post)}
                  >
                    ✨ AI Recommendations
                  </button>

                  <button
                    className="btn-edit-post"
                    onClick={() => navigate(`/guardian/posts/edit/${post.id}`)}
                  >
                    ✏️ Edit Post
                  </button>

                  <button
                    className="btn-delete-post"
                    onClick={() => handleDelete(post.id, post.title || post.subject)}
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Recommendations Modal */}
        {recommendModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✨ AI Tutor Recommendations
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Gemini AI ranked matches for <strong>{activePost?.title || activePost?.subject}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecommendModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {loadingAi ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>🤖</div>
                    <p style={{ fontWeight: 600, color: '#4f46e5' }}>Gemini is analyzing tutor profiles and ranking best fits...</p>
                  </div>
                ) : aiError ? (
                  <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '10px' }}>
                    ⚠️ {aiError}
                  </div>
                ) : recommendations.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>No tutor matches found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recommendations.map((rec, index) => (
                      <div
                        key={rec.tutor_id}
                        style={{
                          border: rec.is_subscribed ? '2px solid #c084fc' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: rec.is_subscribed ? '#faf5ff' : '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: index === 0 ? '#fbbf24' : '#e2e8f0',
                              fontWeight: 700,
                              fontSize: '13px',
                              color: index === 0 ? '#78350f' : '#475569',
                            }}>
                              #{index + 1}
                            </span>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{rec.username}</h4>
                            {rec.is_subscribed && (
                              <span style={{
                                backgroundColor: '#f3e8ff',
                                color: '#7e22ce',
                                border: '1px solid #d8b4fe',
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}>
                                ⭐ Priority Pro
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/tutors/${rec.tutor_id}`}
                            style={{
                              color: '#4f46e5',
                              fontSize: '13px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            View Profile →
                          </Link>
                        </div>

                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#475569' }}>
                          📍 {rec.location} | 📚 {rec.subjects}
                        </p>

                        {/* AI Match Explanation Box */}
                        <div style={{
                          marginTop: '10px',
                          backgroundColor: '#f8fafc',
                          borderLeft: '4px solid #4f46e5',
                          padding: '8px 12px',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '13px',
                          color: '#334155',
                        }}>
                          <strong>💡 AI Match Reason:</strong> {rec.match_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setRecommendModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default GuardianPosts
