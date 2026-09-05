// GuardianApplicants.jsx — Applicants List View for Guardian Dashboard.
//
// Features:
// 1. Lists tutor applications for guardian's posts.
// 2. Displays applicant tutor's distance_km from the tuition post if available.
// 3. Accept/Reject status update controls.

import { useState, useEffect } from 'react'
import { api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Badge from '../../components/Badge'
import './GuardianApplicants.css'

function GuardianApplicants() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const [updatingId, setUpdatingId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    async function fetchApplicants() {
      try {
        const response = await api.get('/api/applications/').catch(() => ({ data: [] }))
        if (response && Array.isArray(response.data)) {
          setApplications(response.data)
        } else {
          setApplications([])
        }
      } catch (err) {
        console.error('Error loading applicants:', err)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }

    fetchApplicants()
  }, [])

  async function handleUpdateStatus(appId, newStatus) {
    setUpdatingId(appId)
    setActionError('')
    try {
      const response = await api.patch(`/api/applications/${appId}/`, { status: newStatus })
      if (response && response.data) {
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: response.data.status } : app))
        )
      }
    } catch (err) {
      console.error('Error updating application status:', err)
      setActionError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to update application status. Please try again.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="applicants-page">
      <Sidebar role="guardian" />

      <main className="applicants-main">
        <div className="applicants-header">
          <h1>Tutor Applications Received</h1>
          <p>Review applications from verified tutors and compare their distance from your post location.</p>
        </div>

        {actionError && (
          <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '14px' }}>
            ⚠️ {actionError}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px dashed #cbd5e1',
            padding: '50px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📝</span>
            <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              No Applications Received Yet
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto', color: '#64748b' }}>
              When verified tutors apply for your tuition requirements, their applications and distance details will appear here.
            </p>
          </div>
        ) : (
          <div className="applicants-list-grid">
            {applications.map((app) => {
              const initial = app.tutor_name ? app.tutor_name.charAt(0).toUpperCase() : '👤'
              return (
                <div key={app.id} className="applicant-card">
                  <div className="applicant-info-left">
                    <div className="applicant-avatar">{initial}</div>
                    <div className="applicant-details">
                      <h3>{app.tutor_name}</h3>
                      <p>✉️ {app.tutor_email} | 📚 {app.tutor_subjects || 'General Subjects'}</p>
                      <p style={{ marginTop: '6px', fontStyle: 'italic', color: '#475569' }}>
                        "{app.cover_note}"
                      </p>

                      <div className="applicant-tags-row">
                        <Badge variant={app.status === 'accepted' ? 'verified' : app.status === 'rejected' ? 'danger' : 'primary'}>
                          Status: {app.status}
                        </Badge>

                        {app.distance_km !== undefined && app.distance_km !== null && (
                          <Badge variant="verified">
                            🚗 {app.distance_km} km from post location
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="applicant-actions">
                    {app.status === 'pending' && (
                      <>
                        <button
                          className="btn-accept"
                          disabled={updatingId === app.id}
                          onClick={() => handleUpdateStatus(app.id, 'accepted')}
                        >
                          {updatingId === app.id ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          className="btn-reject"
                          disabled={updatingId === app.id}
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        >
                          {updatingId === app.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </>
                    )}
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

export default GuardianApplicants
