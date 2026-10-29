// DashboardChart.jsx — Reusable Chart Components for Tutor & Guardian Dashboards.
//
// Powered by Recharts:
// 1. ApplicationsBarChart — Renders a Bar Chart of application metrics.
// 2. ApplicationsPieChart — Renders a Donut/Pie Chart of accepted vs rejected or status ratios.
//
// Includes explicit viva comments explaining the data sources.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import './DashboardChart.css'

// Color palette matching TutorLink Purple Theme
const PURPLE_COLORS = ['#667eea', '#10b981', '#ef4444', '#f59e0b', '#764ba2']

/**
 * ApplicationsBarChart Component
 *
 * VIVA EXPLANATION:
 * This Bar Chart renders the breakdown of the tutor's applications: Applied (Pending), Accepted, and Rejected.
 * The data is calculated directly from GET /api/applications/ where application.tutor === current_user.
 */
export function ApplicationsBarChart({ data = [], title = 'Applications Breakdown', vivaNote }) {
  /* Data fed from real Application model counts (Applied/Pending, Accepted, Rejected) */
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-header">
        <h3>{title}</h3>
        {vivaNote && (
          <span className="dash-chart-viva-note">
            {vivaNote}
          </span>
        )}
      </div>

      <div className="dash-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Bar dataKey="count" fill="#667eea" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * ApplicationsPieChart (Donut Chart) Component
 *
 * This Donut Chart renders the ratio of Accepted vs Rejected applications.
 * If zero applications exist, it renders a zero baseline fallback cleanly without crashing.
 */
export function ApplicationsPieChart({ data = [], title = 'Accepted vs Rejected Ratio', vivaNote }) {
  /* Data ratio of Accepted vs Rejected applications for logged-in user */
  const chartData = data.length > 0 ? data : [
    { name: 'Accepted', value: 0 },
    { name: 'Rejected', value: 0 },
    { name: 'Pending', value: 0 },
  ]

  return (
    <div className="dash-chart-card">
      <div className="dash-chart-header">
        <h3>{title}</h3>
        {vivaNote && (
          <span className="dash-chart-viva-note">
            {vivaNote}
          </span>
        )}
      </div>

      <div className="dash-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              activeShape={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PURPLE_COLORS[index % PURPLE_COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
