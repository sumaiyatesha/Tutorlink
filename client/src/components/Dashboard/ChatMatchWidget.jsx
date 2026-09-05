// ChatMatchWidget.jsx — AI Matching Assistant Chat Widget with Active Subscription Gating.
//
// Features:
// 1. Gated Access: Enforces active subscription check. Non-subscribed users see a locked CTA.
// 2. Natural Language Input: Accepts free-form queries (e.g. "Weekend Physics tutor under 6000 BDT in Uttara").
// 3. Google Gemini Intent Extraction & Match Reasoning via POST /api/ai/chat-match/.
// 4. Role-Adaptive Results: Renders candidate tutors for Guardians and tuition jobs for Tutors with AI Match Reasons.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Badge from '../Badge'
import JobCard from './JobCard'
import './ChatMatchWidget.css'

function ChatMatchWidget() {
  const { user } = useAuth()
  const isGuardian = user && user.role === 'guardian'
  const isTutor = user && user.role === 'tutor'

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [checkingSub, setCheckingSub] = useState(true)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extractedFilters, setExtractedFilters] = useState(null)
  const [results, setResults] = useState(null)

  // Suggestion chips
  const guardianSuggestions = [
    'Physics teacher for weekends under 6000 taka in Uttara',
    'Class 9-10 Higher Math tutor in Dhanmondi',
    'English medium female tutor for Class 8',
  ]

  const tutorSuggestions = [
    'Class 10 Physics tuition jobs in Uttara with 8000+ salary',
    'Weekend Higher Math jobs in Dhaka',
    'English medium tuition jobs near Dhanmondi',
  ]

  const sampleChips = isTutor ? tutorSuggestions : guardianSuggestions

  // 1. Check user subscription status
  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await api.get('/api/subscriptions/mine/').catch(() => null)
        if (res && res.data && res.data.is_subscribed) {
          setIsSubscribed(true)
        } else {
          setIsSubscribed(false)
        }
      } catch (err) {
        console.error('Subscription check error:', err)
        setIsSubscribed(false)
      } finally {
        setCheckingSub(false)
      }
    }

    checkSubscription()
  }, [])

  // 2. Handle AI Chat Match Query
  async function handleSearch(searchQuery) {
    const q = searchQuery || query
    if (!q || !q.trim()) return

    setLoading(true)
    setError('')
    setExtractedFilters(null)

    try {
      const res = await api.post('/api/ai/chat-match/', { query: q })
      if (res && res.data) {
        setExtractedFilters(res.data.extracted_filters || null)
        setResults(res.data.results || [])
      }
    } catch (err) {
      console.error('AI chat match error:', err)
      if (err.response && err.response.status === 403) {
        setIsSubscribed(false)
        setError('Active subscription required to access the AI Matching Assistant.')
      } else {
        setError('Failed to process AI search request. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSearch()
  }

  // Render Loading state while checking subscription
  if (checkingSub) {
    return (
      <div className="chat-match-widget-container">
        <div className="chat-match-loading-sub">
          <p>Verifying subscription status...</p>
        </div>
      </div>
    )
  }

  // --- LOCKED / UPSELL STATE (FOR NON-SUBSCRIBED USERS) ---
  if (!isSubscribed) {
    return (
      <div className="chat-match-widget-container">
        <div className="chat-match-locked-card">
          <div className="locked-icon-wrapper">🔒</div>
          <h2>AI Matching Assistant is Locked</h2>
          <p className="locked-description">
            Describe your ideal tuition or tutor in natural English and let Google Gemini find
            the perfect match with personalized rationales.
          </p>
          <div className="locked-perks">
            <span>✨ Conversational search powered by Gemini AI</span>
            <span>⚡ Automatic day, budget & location filtering</span>
            <span>🎯 Instant verified match explanations</span>
          </div>
          <Link to="/subscription" className="btn-unlock-sub">
            ⭐ Subscribe to Unlock AI Matching Assistant →
          </Link>
        </div>
      </div>
    )
  }

  // --- ACTIVE SUBSCRIBED STATE ---
  return (
    <div className="chat-match-widget-container">
      {/* Assistant Header Banner */}
      <div className="chat-match-header">
        <div className="header-badge-row">
          <Badge variant="primary">Active Subscriber Feature</Badge>
          <span className="model-tag">⚡ Powered by Gemini Flash</span>
        </div>
        <h2>🤖 AI Matching Assistant</h2>
        <p>
          {isTutor
            ? 'Describe what kind of tuition jobs you are looking for in plain English.'
            : 'Describe your tuition requirement in plain English and let Gemini find the best matching verified tutors.'}
        </p>
      </div>

      {/* Query Input Box */}
      <form onSubmit={handleSubmit} className="chat-match-form">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-match-input"
            placeholder={
              isTutor
                ? "e.g. 'Class 10 Physics tuition jobs in Uttara with 8000+ salary'"
                : "e.g. 'I need a Physics teacher for weekends, budget under 6000 taka in Uttara'"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-chat-ask"
            disabled={loading || !query.trim()}
          >
            {loading ? '🤖 Thinking...' : 'Ask AI ✦'}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="chat-suggestions-row">
          <span className="suggestions-label">Try asking:</span>
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-chip"
              onClick={() => {
                setQuery(chip)
                handleSearch(chip)
              }}
              disabled={loading}
            >
              💡 {chip}
            </button>
          ))}
        </div>
      </form>

      {/* Error Message */}
      {error && <div className="chat-match-error-banner">{error}</div>}

      {/* Extracted Filters Summary */}
      {extractedFilters && (
        <div className="extracted-filters-banner">
          <strong>🎯 AI Extracted Filters:</strong>
          <div className="filter-tags-list">
            {extractedFilters.subject && (
              <span className="filter-tag">📚 Subject: {extractedFilters.subject}</span>
            )}
            {extractedFilters.days && extractedFilters.days.length > 0 && (
              <span className="filter-tag">📅 Days: {extractedFilters.days.join(', ')}</span>
            )}
            {extractedFilters.budget && (
              <span className="filter-tag">💰 {isTutor ? 'Min Ask' : 'Max Budget'}: {extractedFilters.budget} BDT</span>
            )}
            {extractedFilters.location && (
              <span className="filter-tag">📍 Location: {extractedFilters.location}</span>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {results !== null && (
        <div className="chat-match-results-area">
          <div className="results-header-count">
            <h3>Matching Results ({results.length})</h3>
            <span className="priority-hint">⭐ Priority Pro subscribers boosted first</span>
          </div>

          {results.length === 0 ? (
            <div className="no-matches-box">
              <p>No exact matches found for your query. Try broadening your days or budget parameters.</p>
            </div>
          ) : (
            <div className="chat-results-grid">
              {results.map((item, idx) => {
                // If result is a Tutor Profile (for Guardian)
                if (isGuardian || item.username) {
                  const initial = item.username ? item.username.charAt(0).toUpperCase() : '👤'
                  return (
                    <div key={item.id || idx} className="ai-match-card-wrapper">
                      <div className="tutor-card match-tutor-card">
                        <div className="tutor-card-header">
                          <div className="tutor-avatar">{initial}</div>
                          <div className="tutor-title-info">
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <h3>
                                <Link to={`/tutors/${item.tutor_id || item.id}`} className="tutor-name-link">
                                  {item.username}
                                </Link>
                              </h3>
                              {item.is_subscribed && (
                                <Badge variant="primary">⭐ Priority Pro</Badge>
                              )}
                            </div>
                            <p className="tutor-location">📍 {item.location || 'Dhaka'}</p>
                          </div>
                          {item.distance_km !== null && item.distance_km !== undefined && (
                            <span className="distance-badge">🚗 {item.distance_km} km</span>
                          )}
                        </div>

                        <div className="tutor-card-body">
                          <p><strong>Subjects:</strong> {item.subjects || 'General Academic'}</p>
                          {item.expected_salary && (
                            <p><strong>Expected Rate:</strong> ৳ {item.expected_salary}/month</p>
                          )}
                          {item.available_days && item.available_days.length > 0 && (
                            <p><strong>Available:</strong> {item.available_days.join(', ')}</p>
                          )}
                        </div>

                        {/* AI Match Reason Highlight Box */}
                        <div className="ai-reason-box">
                          <span className="ai-reason-label">💡 AI Match Reason</span>
                          <p>{item.match_reason || 'Strong subject expertise matching your requirement.'}</p>
                        </div>

                        <div className="tutor-card-footer">
                          <Link to={`/tutors/${item.tutor_id || item.id}`} className="btn-view-profile">
                            View Full Profile →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                }

                // If result is a Tuition Post (for Tutor)
                return (
                  <div key={item.id || idx} className="ai-match-card-wrapper">
                    <JobCard job={item} />
                    {/* AI Match Reason Highlight Box */}
                    <div className="ai-reason-box job-match-reason">
                      <span className="ai-reason-label">💡 AI Match Reason</span>
                      <p>{item.match_reason || 'Directly matches your tutoring preferences.'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatMatchWidget
