// TutorDashboard.jsx — Dashboard for Tutor users.
//
// Shows:
// 1. Top Navigation Bar (DashboardNav)
// 2. Welcome Banner for the Tutor
// 3. Overview cards: My Profile, My Applications, Notifications

import { useAuth } from './AuthContext'
import DashboardNav from './DashboardNav'
import './Dashboard.css'

function TutorDashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-page-wrapper">
      {/* Top Navbar */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="dashboard-container">
        
        {/* Welcome Banner */}
        <div className="dashboard-welcome">
          <span className="welcome-tag tutor-tag">Tutor Portal</span>
          <h1>Welcome, {user ? user.username : 'Tutor'}!</h1>
          <p>Track your job applications, student requests, and profile completeness.</p>
        </div>

        {/* Dashboard Grid Cards */}
        <div className="dashboard-grid">

          {/* Card 1: My Profile */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-icon">👤</span>
              <h3>My Profile</h3>
            </div>
            <div className="dash-card-body">
              <div className="profile-progress-box">
                <span className="progress-label">Profile Status: <strong>80% Complete</strong></span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '80%' }}></div>
                </div>
              </div>
              <p className="placeholder-subtext">
                Add your subjects, qualifications, and teaching location to attract more guardians.
              </p>
            </div>
            <div className="dash-card-footer">
              <button className="dash-action-btn">Edit Profile</button>
            </div>
          </div>

          {/* Card 2: My Applications */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-icon">📄</span>
              <h3>My Applications</h3>
            </div>
            <div className="dash-card-body">
              <p className="empty-text">No active applications submitted yet</p>
              <p className="placeholder-subtext">
                Search available tuition posts and submit your application to start tutoring.
              </p>
            </div>
            <div className="dash-card-footer">
              <button className="dash-action-btn secondary">Browse Tuition Posts</button>
            </div>
          </div>

          {/* Card 3: Notifications */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-icon">🔔</span>
              <h3>Notifications</h3>
            </div>
            <div className="dash-card-body">
              <p className="empty-text">No notifications yet</p>
              <p className="placeholder-subtext">
                You will receive alerts when a guardian accepts your application or sends a direct message.
              </p>
            </div>
            <div className="dash-card-footer">
              <span className="footer-status">All caught up</span>
            </div>
          </div>

        </div>

        {/* Footer Copyright */}
        <footer className="dashboard-footer-note">
          &copy; {new Date().getFullYear()} TutorLink by SumaiyaTesha. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default TutorDashboard
