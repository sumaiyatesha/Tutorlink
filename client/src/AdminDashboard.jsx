// AdminDashboard.jsx — Dashboard for Admin users with real-time system metrics.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, api } from './AuthContext'
import DashboardNav from './DashboardNav'
import './Dashboard.css'
import './AdminDashboard.css'

function AdminDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/api/admin/analytics/').catch(() => null)
        if (res && res.data) {
          setMetrics(res.data)
        }
      } catch (err) {
        console.error('Error fetching admin analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <div className="dashboard-page-wrapper">
      {/* Top Navbar */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="dashboard-container">

        {/* Welcome Banner */}
        <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="welcome-tag admin-tag">System Administrator</span>
            <h1>Welcome, {user ? user.username : 'Admin'}!</h1>
            <p>TutorLink System Overview & Platform Administration</p>
          </div>

          <Link to="/admin/analytics" className="admin-link-btn" style={{ padding: '12px 20px', fontSize: '15px' }}>
            View Platform Analytics Charts →
          </Link>
        </div>

        {/* Analytics Summary Cards Grid */}
        {loading ? (
          <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
            Loading live platform metrics...
          </div>
        ) : (
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>

            {/* Metric 1: Total Users */}
            <div className="dash-card metric-card">
              <div className="metric-header">
                <span className="metric-icon">👥</span>
                <span className="metric-title">Total Registered Users</span>
              </div>
              <div className="metric-value">{metrics ? metrics.total_users : 0}</div>
              <p className="metric-subtext">
                {metrics ? `${metrics.total_guardians} Guardians • ${metrics.total_tutors} Tutors • ${metrics.total_admins} Admins` : ''}
              </p>
            </div>

            {/* Metric 2: Tutors Pending Verification */}
            <div className="dash-card metric-card">
              <div className="metric-header">
                <span className="metric-icon">⏳</span>
                <span className="metric-title">Unverified Tutor Profiles</span>
              </div>
              <div className="metric-value badge-warning">{metrics ? metrics.tutors_unverified : 0}</div>
              <p className="metric-subtext">
                {metrics ? `${metrics.tutors_verified} profiles verified` : ''}
              </p>
            </div>

            {/* Metric 3: Tuition Posts Overview */}
            <div className="dash-card metric-card">
              <div className="metric-header">
                <span className="metric-icon"></span>
                <span className="metric-title">Total Tuition Posts</span>
              </div>
              <div className="metric-value">{metrics ? metrics.total_posts : 0}</div>
              <p className="metric-subtext">
                {metrics ? `${metrics.posts_open} open • ${metrics.posts_closed} closed` : ''}
              </p>
            </div>

            {/* Metric 4: Total Applications */}
            <div className="dash-card metric-card">
              <div className="metric-header">
                <span className="metric-icon"></span>
                <span className="metric-title">Total Applications</span>
              </div>
              <div className="metric-value">{metrics ? metrics.total_applications : 0}</div>
              <p className="metric-subtext">
                {metrics ? `${metrics.applications_pending} pending • ${metrics.applications_accepted} accepted` : ''}
              </p>
            </div>



          </div>

        )}


        {/* Django Admin Console Banner & Link */}
        <div className="admin-console-box" style={{ marginTop: '30px' }}>
          <div className="admin-console-info">
            <span className="console-icon">⚙️</span>
            <div>
              <h3>Full User & Database Administration</h3>
              <p>
                Full administrative permissions (user roles, table management, password resets) are accessible directly via the Django Admin Panel.
              </p>
            </div>
          </div>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-link-btn"
          >
            Open Django Admin (localhost:8000/admin/) ↗
          </a>
        </div>

        {/* Footer Copyright */}
        <footer className="dashboard-footer-note">
          &copy; {new Date().getFullYear()} TutorLink by SumaiyaTesha. All rights reserved.
        </footer>

      </div>
    </div >
  )
}

export default AdminDashboard
