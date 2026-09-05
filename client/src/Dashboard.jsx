// Dashboard.jsx — Redirects users to their specific role dashboard.
//
// When a user accesses /dashboard, this component checks their role
// and redirects them to:
//   - /dashboard/guardian (if guardian)
//   - /dashboard/tutor (if tutor)
//   - /dashboard/admin (if admin)

import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/dashboard/${user.role}`} replace />
}

export default Dashboard
