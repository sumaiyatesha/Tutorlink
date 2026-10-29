// JobDetail.jsx — Job Detail Page with 3-Column Student Info Grid & Action Panel.
//
// Features:
// 1. Left: "Student Information" card displaying TuitionPost fields in a 3-column grid.
// 2. Right: Action panel with "Apply Now" (POST /api/applications/), "Bookmark", and "Get Direction" buttons.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import Navbar from '../Landing/Navbar'
import Badge from '../../components/Badge'
import './JobDetail.css'

function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [message, setMessage] = useState('')

  // Fetch single tuition post detail from API or fallback
  useEffect(() => {
    async function fetchJobDetail() {
      try {
        const response = await api.get(`/api/tuition-posts/${id}/`).catch(() => null)
        if (response && response.data) {
          setJob(response.data)
        } else {
          // Fallback sample post
          setJob({
            id: id || 1,
            title: 'Class 10 Physics & Higher Math Tutor Needed',
            subject: 'Physics & Higher Math',
            category: 'Class 9-10 (SSC)',
            course: 'English Medium / National Curriculum',
            location: 'Uttara Sector 7, Dhaka',
            days_per_week: 3,
            preferred_time: '6:00 PM',
            duration: '1.5 Hours',
            method: 'In-Person (Home Tutoring)',
            salary: 8500,
            students: '1 Student',
            preferred_tutor_gender: 'Male preferred',
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('Error loading job detail:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetail()
  }, [id])

  // Submit Application handler (calls POST /api/applications/)
  async function handleApply() {
    if (!user) {
      navigate('/login')
      return
    }
    setApplying(true)
    setMessage('')

    try {
      await api.post('/api/applications/', {
        post: id,
        cover_note: 'I am interested in this tuition job and have relevant experience.',
      })
      setApplied(true)
      setMessage('✅ Application submitted successfully!')
    } catch (err) {
      console.error('Application error:', err)
      const errorMsg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Failed to submit application. Please ensure your profile (Contact No, NID No, Student ID/Certificate, Location) is complete.'
      setMessage(`⚠️ ${errorMsg}`)
    } finally {
      setApplying(false)
    }
  }

  // Bookmark handler
  // TODO: Wire up bookmark favorite endpoint once backend endpoint exists
  function handleBookmark() {
    setBookmarked((prev) => !prev)
  }

  // Fetch user profile coordinates for directions
  const [userCoords, setUserCoords] = useState(null)
  useEffect(() => {
    if (user) {
      const ep = user.role === 'tutor' ? '/api/tutor/profile/' : '/api/guardian/profile/'
      api.get(ep).then((res) => {
        if (res.data && res.data.latitude !== undefined && res.data.latitude !== null) {
          setUserCoords({ lat: res.data.latitude, lng: res.data.longitude })
        }
      }).catch(() => null)
    }
  }, [user])

  // Get Direction handler — opens Google Maps directions URL in new tab
  function handleGetDirection() {
    // 1. Determine destination (tuition post location coordinates or address text)
    let destQuery = ''
    if (job && job.latitude !== null && job.latitude !== undefined && job.longitude !== null && job.longitude !== undefined) {
      destQuery = `${job.latitude},${job.longitude}`
    } else if (job && job.location) {
      destQuery = encodeURIComponent(`${job.location}, Bangladesh`)
    } else if (job && job.title) {
      destQuery = encodeURIComponent(`${job.title}, Bangladesh`)
    }

    if (!destQuery) {
      alert('Tuition post location information is not available.')
      return
    }

    // 2. Determine origin (user profile coordinates if set; if not, Google Maps will use current device location)
    let originQuery = ''
    if (userCoords && userCoords.lat !== null && userCoords.lat !== undefined && userCoords.lng !== null && userCoords.lng !== undefined) {
      originQuery = `&origin=${userCoords.lat},${userCoords.lng}`
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}${originQuery}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading job details...</div>
  }

  const isTutorLoggedIn = user && user.role === 'tutor'
  const appStatus = job?.my_application_status
  const isDemoOrAccepted = isTutorLoggedIn && (appStatus === 'demo_requested' || appStatus === 'accepted')
  const isPending = Boolean(applied || appStatus === 'pending')

  return (
    <div className={`job-detail-page ${isTutorLoggedIn ? 'with-sidebar-layout' : 'with-navbar-layout'}`}>
      {isTutorLoggedIn ? <Sidebar role="tutor" /> : <Navbar />}

      <main className={`job-detail-main ${isTutorLoggedIn ? 'with-sidebar' : 'full-width'}`}>
        
        {/* Main Grid */}
        <div className="job-detail-grid">
          
          {/* Left Column: Student Information Card */}
          <div className="student-info-card">
            <div className="student-info-header">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant="primary">Job ID: JOB-{String(job.id).padStart(4, '0')}</Badge>
                {job.distance_km !== undefined && job.distance_km !== null && (
                  <Badge variant="success">🚗 {job.distance_km} km away</Badge>
                )}
              </div>
              <h2>{job.title || job.subject}</h2>
              <p>📍 {job.location || 'Dhaka, Bangladesh'}</p>
              {job.description && (
                <p style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.6', color: '#334155', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                  {job.description}
                </p>
              )}
            </div>

            {/* 3-Column Icon + Label + Value Grid */}
            <div className="detail-3col-grid">
              {job.category && (
                <div className="detail-grid-item">
                  <div className="detail-item-icon">🎓</div>
                  <div className="detail-item-content">
                    <span className="detail-item-label">Category</span>
                    <span className="detail-item-value">{job.category}</span>
                  </div>
                </div>
              )}

              {job.course && (
                <div className="detail-grid-item">
                  <div className="detail-item-icon">📚</div>
                  <div className="detail-item-content">
                    <span className="detail-item-label">Course / Level</span>
                    <span className="detail-item-value">{job.course}</span>
                  </div>
                </div>
              )}

              <div className="detail-grid-item">
                <div className="detail-item-icon">📐</div>
                <div className="detail-item-content">
                  <span className="detail-item-label">Subject</span>
                  <span className="detail-item-value">{job.subject || 'General'}</span>
                </div>
              </div>

              <div className="detail-grid-item">
                <div className="detail-item-icon">📅</div>
                <div className="detail-item-content">
                  <span className="detail-item-label">Days / Per Week</span>
                  <span className="detail-item-value">{job.days_per_week ? `${job.days_per_week} Days/Week` : '3 Days/Wk'}</span>
                </div>
              </div>

              <div className="detail-grid-item">
                <div className="detail-item-icon">⏰</div>
                <div className="detail-item-content">
                  <span className="detail-item-label">Tutoring Time</span>
                  <span className="detail-item-value">{job.preferred_time || 'Flexible'}</span>
                </div>
              </div>

              <div className="detail-grid-item">
                <div className="detail-item-icon">⌛</div>
                <div className="detail-item-content">
                  <span className="detail-item-label">Duration</span>
                  <span className="detail-item-value">{job.duration || '1.5 Hours'}</span>
                </div>
              </div>

              <div className="detail-grid-item">
                <div className="detail-item-icon">💻</div>
                <div className="detail-item-content">
                  <span className="detail-item-label">Tutoring Method</span>
                  <span className="detail-item-value">{job.method || 'In-Person'}</span>
                </div>
              </div>

              {job.students && (
                <div className="detail-grid-item">
                  <div className="detail-item-icon">👥</div>
                  <div className="detail-item-content">
                    <span className="detail-item-label">Students</span>
                    <span className="detail-item-value">{job.students}</span>
                  </div>
                </div>
              )}

              {job.preferred_tutor_gender && (
                <div className="detail-grid-item">
                  <div className="detail-item-icon">👤</div>
                  <div className="detail-item-content">
                    <span className="detail-item-label">Gender Pref</span>
                    <span className="detail-item-value">{job.preferred_tutor_gender}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Action Panel */}
          <div className="action-panel-card">
            <h3 className="action-panel-title">Tuition Salary</h3>
            
            <div className="action-salary-banner">
              <span>Offered Monthly Remuneration</span>
              <div className="action-salary-amount">
                ৳ {job.salary ? `${job.salary}/mo` : '8,000/mo'}
              </div>
            </div>

            {/* When tutor has Demo Offer or is Accepted: Show ONLY Guardian Cell No & Directions */}
            {isDemoOrAccepted ? (
              <div className="guardian-contact-panel">
                <div className={`contact-status-banner ${appStatus === 'accepted' ? 'accepted' : 'demo'}`}>
                  <span className="cs-icon">{appStatus === 'accepted' ? '🎉' : '🎓'}</span>
                  <div>
                    <strong>
                      {appStatus === 'accepted' ? 'You are Hired & Accepted!' : 'Selected for Demo Class!'}
                    </strong>
                    <p>
                      {appStatus === 'accepted'
                        ? 'Congratulations! Call the guardian to confirm tuition schedule and start date.'
                        : 'The guardian has requested a demo class. Call the guardian to schedule your demo class.'}
                    </p>
                  </div>
                </div>

                <div className="guardian-cell-card">
                  <span className="cell-card-label">Guardian Contact Number</span>
                  <div className="cell-card-number">
                    📱 {job.guardian_phone || 'Cell on file'}
                  </div>
                  {job.guardian_phone && (
                    <a href={`tel:${job.guardian_phone}`} className="btn-call-guardian">
                      📞 Call Guardian
                    </a>
                  )}
                </div>

                {/* Get Direction Button */}
                <button className="btn-get-direction" onClick={handleGetDirection}>
                  📍 Get Direction
                </button>
              </div>
            ) : (
              /* When not yet selected for demo/accepted: Show standard Apply, Bookmark, Directions */
              <>
                {message && (
                  <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                    {message}
                  </div>
                )}

                {/* Apply Button */}
                <button
                  className="btn-apply-now"
                  onClick={handleApply}
                  disabled={applying || isPending}
                >
                  {isPending ? '✓ Application Submitted' : applying ? 'Submitting...' : 'Apply Now'}
                </button>

                

                {/* Get Direction Button */}
                <button className="btn-get-direction" onClick={handleGetDirection}>
                  📍 Get Direction
                </button>
              </>
            )}
          </div>

        </div>

      </main>
    </div>
  )
}

export default JobDetail
