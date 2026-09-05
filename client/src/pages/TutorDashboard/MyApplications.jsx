// MyApplications.jsx — Tutor Applications Page.
//
// Features:
// 1. Fetches applications submitted by logged-in tutor from GET /api/applications/.
// 2. Displays post subject, title, guardian location, salary, distance_km, cover note, and applied date.
// 3. Status badge styling matching purple palette (pending: grey, accepted: green, rejected: red).
// 4. EmptyState component fallback if no applications submitted yet.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import './MyApplications.css'

function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await api.get('/api/applications/')
        if (response && Array.isArray(response.data)) {
          setApplications(response.data)
        }
      } catch (err) {
        console.error('Error fetching tutor applications:', err)
        setError('Failed to load your applications.')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  // Helper for badge variant based on status
  function getBadgeVariant(status) {
    if (status === 'accepted') return 'verified'
    if (status === 'rejected') return 'danger'
    return 'secondary' // pending = grey
  }

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return 'Recently'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="my-applications-page">
      <Sidebar role="tutor" />

      <main className="my-applications-main">
        <div className="my-applications-header">
          <h1>My Job Applications</h1>
          <p>Track the status of your submitted tuition applications and guardian responses.</p>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading applications...</div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon="💼"
            title="No Applications Submitted Yet"
            message="Explore available tuition jobs and apply to start connecting with guardians!"
          />
        ) : (
          <div className="applications-list-container">
            {applications.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-card-header">
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <Badge variant="primary">Application #{app.id}</Badge>
                      <Badge variant={getBadgeVariant(app.status)}>
                        Status: {app.status ? app.status.toUpperCase() : 'PENDING'}
                      </Badge>
                      {app.distance_km !== undefined && app.distance_km !== null && (
                        <Badge variant="verified">🚗 {app.distance_km} km away</Badge>
                      )}
                    </div>
                    <h3>{app.post_title || app.post_subject || `Tuition Post #${app.post}`}</h3>
                    <p className="app-location">📍 {app.post_location || 'Dhaka, Bangladesh'}</p>
                  </div>

                  <div className="app-date-tag">
                    Applied on {formatDate(app.created_at)}
                  </div>
                </div>

                {app.cover_note && (
                  <div className="app-cover-note-box">
                    <span className="cover-note-label">Cover Note Sent:</span>
                    <p className="cover-note-text">"{app.cover_note}"</p>
                  </div>
                )}

                <div className="application-card-footer">
                  <div className="app-salary-info">
                    Monthly Salary: <strong>৳ {app.post_salary ? Number(app.post_salary).toLocaleString() : '8,000'}/mo</strong>
                  </div>

                  <Link to={`/posts/${app.post}`} className="btn-view-job-link">
                    View Job Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyApplications
