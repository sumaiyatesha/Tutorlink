// AdminAnalytics.jsx — Platform Analytics Dashboard with Recharts Visualizations for Admin.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { api } from '../../AuthContext'
import DashboardNav from '../../DashboardNav'
import './AdminAnalytics.css'

const POST_STATUS_COLORS = ['#3b82f6', '#10b981'] // Open: Blue, Closed: Green
const APP_STATUS_COLORS = ['#f59e0b', '#10b981', '#ef4444'] // Pending: Amber, Accepted: Green, Rejected: Red

function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/api/admin/analytics/').catch(() => null)
        if (res && res.data) {
          setData(res.data)
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <DashboardNav />
        <div className="loading-box">Loading platform analytics & charts...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-analytics-page">
        <DashboardNav />
        <div className="loading-box">Failed to load analytics data.</div>
      </div>
    )
  }

  // Prepare chart datasets
  const postStatusData = [
    { name: 'Open Posts', value: data.posts_open },
    { name: 'Closed Posts', value: data.posts_closed },
  ]

  const appStatusData = [
    { name: 'Pending', value: data.applications_pending },
    { name: 'Accepted', value: data.applications_accepted },
    { name: 'Rejected', value: data.applications_rejected },
  ]

  return (
    <div className="admin-analytics-page">
      <DashboardNav />

      <main className="admin-analytics-container">
        <div className="analytics-header">
          <div>
            <Link to="/dashboard/admin" className="back-link">← Back to Admin Dashboard</Link>
            <h1>Platform Analytics & Insights</h1>
            <p>Visualizing user acquisition, tuition post activity, and application conversions.</p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="analytics-summary-grid">
          <div className="summary-card">
            <h3>👥 Total Registered Users</h3>
            <div className="number-huge">{data.total_users}</div>
            <p>{data.total_guardians} Guardians • {data.total_tutors} Tutors</p>
          </div>

          <div className="summary-card">
            <h3>📌 Tuition Posts</h3>
            <div className="number-huge">{data.total_posts}</div>
            <p>{data.posts_open} Open • {data.posts_closed} Closed</p>
          </div>

          <div className="summary-card">
            <h3>📝 Applications Submitted</h3>
            <div className="number-huge">{data.total_applications}</div>
            <p>{data.applications_accepted} Accepted • {data.applications_pending} Pending</p>
          </div>

          <div className="summary-card">
            <h3>🛡️ Tutor Verification</h3>
            <div className="number-huge">{data.tutors_verified} / {data.total_tutors}</div>
            <p>{data.tutors_unverified} Awaiting Document Check</p>
          </div>
        </div>

        {/* Recharts Visualization Grid */}
        <div className="charts-grid">
          {/* Chart 1: Weekly Signups Bar Chart */}
          <div className="chart-card full-width-chart">
            <h3>📈 User Signups Trend (Last 8 Weeks)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.signups_per_week} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} Signups`, 'New Users']} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Post Status Pie Chart */}
          <div className="chart-card">
            <h3>📌 Tuition Post Status Breakdown</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={postStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {postStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={POST_STATUS_COLORS[index % POST_STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Application Status Pie Chart */}
          <div className="chart-card">
            <h3>📊 Application Status Breakdown</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={appStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={APP_STATUS_COLORS[index % APP_STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminAnalytics
