// ProtectedRoute.jsx — Route guard component.
//
// This component protects pages from unauthorized access.
// It checks two things:
// 1. Is the user logged in? If not → redirect to /login.
// 2. Does the user have the required role for this page? If not → redirect to their own dashboard.

import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function ProtectedRoute({ children, allowedRole }) {
  // Get user info and loading status from AuthContext
  const { user, loading } = useAuth()

  // 1. While checking if the user is logged in (reading token from storage),
  // show a simple loading message so the page doesn't flicker.
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading TutorLink...</h2>
      </div>
    )
  }

  // 2. If user is NOT logged in, redirect them to the Login page.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. If user IS logged in but has the wrong role (e.g. guardian visiting /dashboard/admin),
  // redirect them to their own role's dashboard.
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/dashboard/${user.role}`} replace />
  }

  // 4. Everything is valid — render the requested dashboard page.
  return children
}

export default ProtectedRoute
