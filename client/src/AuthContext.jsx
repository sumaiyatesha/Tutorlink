// client/src/AuthContext.jsx
// Manages global user authentication state, JWT tokens, and API requests across React.

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// -------------------------------------------------------------
// 1. Pre-Configured Axios Instance
// -------------------------------------------------------------
// Automatically attaches JWT Bearer token to all requests sent to Django backend.
const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// Request Interceptor: Automatically injects JWT Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor: If a request fails with 401 (token expired), auto-refreshes token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Check if error is 401 Unauthorized and request hasn't been retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refresh_token')
    ) {
      originalRequest._retry = true
      try {
        // Request a new access token using the refresh token
        const res = await axios.post('http://localhost:8000/api/auth/refresh/', {
          refresh: localStorage.getItem('refresh_token'),
        })
        const newAccessToken = res.data.access
        localStorage.setItem('access_token', newAccessToken)
        
        // Update header and retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        // If refresh fails, clear tokens so user logs in again
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    return Promise.reject(error)
  }
)

// -------------------------------------------------------------
// 2. Auth Context Creation
// -------------------------------------------------------------
const AuthContext = createContext(null)

// -------------------------------------------------------------
// 3. Auth Provider Component
// -------------------------------------------------------------
function AuthProvider({ children }) {
  // 'user' stores user profile { id, username, email, role } or null if logged out
  const [user, setUser] = useState(null)
  
  // 'loading' is true while checking existing login token on page refresh
  const [loading, setLoading] = useState(true)

  // On initial page load: check if saved token exists and validate with backend
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/api/auth/me/')
        .then((response) => {
          setUser(response.data)
        })
        .catch((err) => {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  // Login handler: stores tokens and retrieves user profile
  async function login(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)

    const response = await api.get('/api/auth/me/')
    setUser(response.data)
    return response.data
  }

  // Logout handler: clears stored tokens and resets user state
  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to access authentication context in any component
function useAuth() {
  return useContext(AuthContext)
}

export { AuthProvider, useAuth, api }
