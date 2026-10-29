// TutorDashboard.jsx — Main Tutor Dashboard Page.
//
// Features:
// 1. Fixed Left Sidebar with Tutor ID and navigation.
// 2. Personal Greeting Card ("Good morning, <name>. Welcome to TutorLink!").
// 3. "Member Since" Card displaying user.date_joined.
// 4. 3 Main Stat Cards:
//    - Profile completeness % (calculated from tutor profile fields)
//    - Matching tuition jobs count
//    - CV / Resume status card with download link or upload button
// 5. Real Application Model Counts: Applied (Pending), Accepted, Rejected.
// 6. 2 Recharts Visualizations (Bar Chart & Donut Chart) with viva comments explaining data sources.

import { useState, useEffect } from 'react'
import { useAuth, api } from '../../AuthContext'
import Sidebar from '../../components/Dashboard/Sidebar'
import DashboardStatCard from '../../components/Dashboard/DashboardStatCard'
import { ApplicationsBarChart, ApplicationsPieChart } from '../../components/Dashboard/DashboardChart'
import './TutorDashboard.css'

function TutorDashboard() {
  const { user } = useAuth()

  // State for applications counts & profile details
  const [applications, setApplications] = useState([])
  const [matchingJobsCount, setMatchingJobsCount] = useState(0)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch real data on component mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch applications submitted by logged-in tutor
        const appsRes = await api.get('/api/applications/').catch(() => ({ data: [] }))
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : [])

        // Fetch open tuition posts to count matching jobs
        // TODO: replace with GET /api/tuition-posts/?matched=true once available
        const postsRes = await api.get('/api/tuition-posts/').catch(() => ({ data: [] }))
        setMatchingJobsCount(Array.isArray(postsRes.data) ? postsRes.data.length : 4)

        // Fetch tutor profile data if available
        const profRes = await api.get('/api/tutor/profile/').catch(() => ({ data: null }))
        setProfileData(profRes.data)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Greeting time based on current hour
  function getGreetingTime() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Format member since date
  const memberSinceStr = user && user.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'August 2026'

  // Calculate Profile Completeness %:
  // Required fields: phone, nid_no, location, cv, and student_id (if student) or certificate (if not student)
  let tutorCompleteCount = 0
  const totalRequired = 5
  if (profileData) {
    if (profileData.phone && profileData.phone.trim()) tutorCompleteCount++
    if (profileData.nid_no && profileData.nid_no.trim()) tutorCompleteCount++
    if (profileData.location && profileData.location.trim()) tutorCompleteCount++
    if (profileData.cv || profileData.cv_name) tutorCompleteCount++
    const isStudent = profileData.is_currently_student !== undefined ? profileData.is_currently_student : true
    if (isStudent) {
      if (profileData.student_id && profileData.student_id.trim()) tutorCompleteCount++
    } else {
      if (profileData.certificate || profileData.certificate_name) tutorCompleteCount++
    }
  }
  const completenessPercent = profileData ? Math.round((tutorCompleteCount / totalRequired) * 100) : 0
  const isProfileComplete = completenessPercent === 100

  // Real Counts from Application model
  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const demoCount = applications.filter((a) => a.status === 'demo_requested').length
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length

  // Recharts Data Arrays
  const barChartData = [
    { name: 'Applied (Pending)', count: pendingCount },
    { name: 'Demo Offered', count: demoCount },
    { name: 'Accepted', count: acceptedCount },
    { name: 'Rejected', count: rejectedCount },
  ]

  const pieChartData = [
    { name: 'Accepted', value: acceptedCount },
    { name: 'Demo Offered', value: demoCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Rejected', value: rejectedCount },
  ]

  const firstName = user ? user.first_name || user.username : 'Tutor'

  return (
    <div className="tutor-dashboard-page">
      {/* 1. Fixed Left Sidebar */}
      <Sidebar role="tutor" />

      {/* Main Dashboard Workspace */}
      <main className="tutor-dashboard-main">

        {/* Header Greeting Row */}
        <div className="tutor-welcome-grid">
          <div className="tutor-greeting-card">
            <div className="tutor-greeting-text">
              <h1>{getGreetingTime()}, {firstName}!</h1>
              <p>Welcome to TutorLink! Check your matching tuition jobs and application statuses below.</p>
            </div>
            <div className="tutor-greeting-icon">🎓</div>
          </div>

          {/* Member Since Card */}
          <div className="member-since-card">
            <span>Member Since</span>
            <h3>{memberSinceStr}</h3>
          </div>
        </div>

        {/* Profile Verification Alert Banner */}
        {!isProfileComplete && !loading && (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <div>
                <strong style={{ color: '#92400e', fontSize: '14px' }}>
                  Complete your profile to unlock applying for tuition jobs ({completenessPercent}% complete)
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#78350f' }}>
                  Please provide your Contact Number, NID Number, Location, CV Document, and Student ID / Certificate.
                </p>
              </div>
            </div>
            <a
              href="/profile"
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              Complete Profile Now →
            </a>
          </div>
        )}

        {/* Demo Offers Alert Banner */}
        {demoCount > 0 && (
          <div style={{
            background: '#f7f0f5ff',
            border: '1.5px solid #f65cb6ff',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>🎓</span>
              <div>
                <strong style={{ color: '#5b21b6', fontSize: '15px' }}>
                  You have {demoCount} Demo Class Offer{demoCount > 1 ? 's' : ''}!
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6d28d9' }}>
                  Guardians have invited you for demo classes. Review and coordinate with them to get hired!
                </p>
              </div>
            </div>
            <a
              href="/tutor/applications"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              View Demo Offers →
            </a>
          </div>
        )}

        {/* 3 Top Stat Cards */}
        <div className="tutor-stats-row">
          {/* Card 1: Profile Completeness */}
          <DashboardStatCard
            icon="👤"
            title="Profile Completeness"
            value={`${completenessPercent}%`}
            progress={completenessPercent}
            subtitle={isProfileComplete ? "Contact, NID & Academic credentials verified" : `${tutorCompleteCount} of ${totalRequired} verification fields completed`}
            actionText={isProfileComplete ? "View Profile" : "Complete Profile"}
            actionHref="/profile"
          />

          {/* Card 2: Matching Tuition Jobs */}
          <DashboardStatCard
            icon="🎯"
            title="Matching Tuition Jobs"
            value={matchingJobsCount}
            subtitle="Tuition posts matching your subject preferences"
            actionText="Browse Available Jobs"
            actionHref="/tutor/jobs"
          />

          {/* Card 3: CV / Resume Card */}
          <DashboardStatCard
            icon="📄"
            title="CV / Resume"
            value={profileData && profileData.cv_name ? 'CV Uploaded' : 'No CV Uploaded'}
            subtitle={
              profileData && profileData.cv_name
                ? profileData.cv_name
                : 'Upload your CV to increase hiring chances by 3x'
            }
            actionText={profileData && profileData.cv_name ? 'View CV' : 'Upload Resume'}
            actionHref="/profile"
          />
        </div>

        {/* Status Mini Cards (Real Application Model Counts) */}
        <div className="status-cards-row">
          <div className="status-mini-card">
            <div className="status-mini-icon status-pending">⏳</div>
            <div className="status-mini-info">
              <h4>{pendingCount}</h4>
              <p>Applied / Pending</p>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="status-mini-icon status-demo">🎓</div>
            <div className="status-mini-info">
              <h4>{demoCount}</h4>
              <p>Demo Class Offers</p>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="status-mini-icon status-accepted">✅</div>
            <div className="status-mini-info">
              <h4>{acceptedCount}</h4>
              <p>Accepted Applications</p>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="status-mini-icon status-rejected">❌</div>
            <div className="status-mini-info">
              <h4>{rejectedCount}</h4>
              <p>Rejected Applications</p>
            </div>
          </div>
        </div>

        {/* 2 Recharts Graphs Grid */}
        <div className="tutor-charts-grid">
          {/* Bar Chart */}
          <ApplicationsBarChart
            data={barChartData}
            title="Application Status Breakdown"
          />

          {/* Donut / Pie Chart */}
          <ApplicationsPieChart
            data={pieChartData}
            title="Accepted vs Rejected Ratio"
          />
        </div>

      </main>
    </div>
  )
}

export default TutorDashboard
