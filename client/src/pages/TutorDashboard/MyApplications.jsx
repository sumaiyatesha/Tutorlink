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
    if (status === 'demo_requested') return 'warning'
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
                        {app.status === 'demo_requested'
                          ? '🎓 DEMO REQUESTED'
                          : `Status: ${app.status ? app.status.toUpperCase() : 'PENDING'}`}
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

                {(app.status === 'demo_requested' || app.status === 'accepted') && (
                  <div style={{
                    backgroundColor: app.status === 'accepted' ? '#f0fdf4' : '#f5f3ff',
                    border: `1.5px solid ${app.status === 'accepted' ? '#bbf7d0' : '#ddd6fe'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    margin: '12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '26px' }}>{app.status === 'accepted' ? '🎉' : '🎓'}</span>
                      <div>
                        <strong style={{ color: app.status === 'accepted' ? '#166534' : '#5b21b6', fontSize: '14px' }}>
                          {app.status === 'accepted' ? 'Hired & Accepted!' : 'Selected for Demo Class!'}
                        </strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: app.status === 'accepted' ? '#15803d' : '#6d28d9', lineHeight: 1.4 }}>
                          Guardian Cell: <strong style={{ letterSpacing: '0.5px' }}>📱 {app.guardian_phone || 'Contact on file'}</strong>
                        </p>
                      </div>
                    </div>
                    {app.guardian_phone && (
                      <a
                        href={`tel:${app.guardian_phone}`}
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          textDecoration: 'none'
                        }}
                      >
                        📞 Call Guardian
                      </a>
                    )}
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
