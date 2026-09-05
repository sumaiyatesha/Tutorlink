// JobCard.jsx — Tuition Job Card Component for TutorLink.
//
// Displays:
// 1. Subject/Level title & Job ID tag.
// 2. Relative posted time ("X hours ago").
// 3. Info grid: Subjects, Per Week, Tutoring Mode, Salary, Tutoring Time.
// 4. "View Details" button linking to /posts/:id.

import { Link } from 'react-router-dom'
import './JobCard.css'

function JobCard({ job }) {
  if (!job) return null

  // Format relative time or fallback
  function getRelativeTime(dateStr) {
    if (!dateStr) return 'Recently posted'
    const date = new Date(dateStr)
    const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60))
    if (isNaN(diffHours) || diffHours <= 0) return 'Just now'
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  }

  const jobIdFormatted = `JOB-${String(job.id || 1).padStart(4, '0')}`

  return (
    <div className="job-card">
      {/* Header Area */}
      <div className="job-card-header">
        <div className="job-title-group">
          <h3>{job.title || job.subject || 'Mathematics & Physics'}</h3>
          <div className="job-subtitle-info">
            <span className="job-id-tag">{jobIdFormatted}</span>
            <span>📍 {job.location || 'Dhaka, Bangladesh'}</span>
            {job.distance_km !== undefined && job.distance_km !== null && (
              <span className="job-id-tag" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                🚗 {job.distance_km} km away
              </span>
            )}
            <span className="job-time-relative">⏱️ {getRelativeTime(job.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="job-info-grid">
        <div className="job-info-item">
          <span className="job-info-label">Subject / Class</span>
          <span className="job-info-value">{job.subject || 'General Academic'}</span>
        </div>

        <div className="job-info-item">
          <span className="job-info-label">Per Week</span>
          <span className="job-info-value">{job.days_per_week ? `${job.days_per_week} Days/Wk` : '3 Days/Wk'}</span>
        </div>

        <div className="job-info-item">
          <span className="job-info-label">Tutoring Mode</span>
          <span className="job-info-value">{job.method || job.mode || 'In-Person'}</span>
        </div>

        <div className="job-info-item">
          <span className="job-info-label">Time / Duration</span>
          <span className="job-info-value">{job.preferred_time || '5:00 PM (1.5 hrs)'}</span>
        </div>

        <div className="job-info-item">
          <span className="job-info-label">Gender Pref</span>
          <span className="job-info-value">{job.preferred_tutor_gender || 'Any'}</span>
        </div>

        <div className="job-info-item">
          <span className="job-info-label">Status</span>
          <span className="job-info-value" style={{ color: '#10b981' }}>{job.status || 'Open'}</span>
        </div>
      </div>

      {/* Footer & CTA */}
      <div className="job-card-footer">
        <div className="job-salary-highlight">
          ৳ {job.salary ? `${job.salary}/mo` : '8,000/mo'}
        </div>

        <Link to={`/posts/${job.id}`} className="btn-view-job-details">
          View Details →
        </Link>
      </div>
    </div>
  )
}

export default JobCard
