// GuardianDashboard.jsx — Dashboard for Guardian users.
//
// Shows:
// 1. Top Navigation Bar (DashboardNav)
// 2. Welcome Banner for the Guardian
// 3. Overview cards: My Tuition Posts, Notifications

import { useAuth } from './AuthContext'
import DashboardNav from './DashboardNav'
import './Dashboard.css'

function GuardianDashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-page-wrapper">
      {/* Top Navbar */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="dashboard-container">
        
        {/* Welcome Banner */}
        <div className="dashboard-welcome">
          <span className="welcome-tag">Guardian Portal</span>
          <h1>Welcome, {user ? user.username : 'Guardian'}!</h1>
          <p>Manage your tuition requirements, saved tutors, and active requests.</p>
        </div>

        {/* Dashboard Grid Cards */}
        <div className="dashboard-grid">

          {/* Card 1: My Tuition Posts */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-icon">📝</span>
              <h3>My Tuition Posts</h3>
            </div>
            <div className="dash-card-body">
              <p className="empty-text">No posts yet</p>
              <p className="placeholder-subtext">
                When you post a tuition requirement, applications from verified tutors will appear here.
              </p>
            </div>
            <div className="dash-card-footer">
              <button className="dash-action-btn">+ Create New Post</button>
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
                You will receive updates when tutors apply to your tuition posts.
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

export default GuardianDashboard
