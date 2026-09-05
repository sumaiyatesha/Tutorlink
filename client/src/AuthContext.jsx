// AuthContext.jsx — Manages authentication state across the whole app.
//
// React Context lets us share data (like the logged-in user) with any
// component without passing it down through every level of props.
//
// This file creates:
//   1. An AuthContext that holds the user data and auth functions
//   2. An AuthProvider component that wraps the app and provides the context
//   3. A useAuth() hook that any component can call to access the context
//   4. An 'api' axios instance that automatically attaches the JWT token

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// --- Axios instance ---
// This is a pre-configured version of axios that always sends requests
// to our Django backend at http://localhost:8000.
// We also set up an "interceptor" that automatically adds the JWT token
// to every request's Authorization header.
const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// Request interceptor — reads access token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — automatically refreshes access token if expired (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refresh_token')
    ) {
      originalRequest._retry = true
      try {
        const res = await axios.post('http://localhost:8000/api/auth/refresh/', {
          refresh: localStorage.getItem('refresh_token'),
        })
        const newAccessToken = res.data.access
        localStorage.setItem('access_token', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    return Promise.reject(error)
  }
)

// --- Create the Context ---
// createContext() creates a "container" that can hold shared data.
// We pass null as the default value (it gets replaced by AuthProvider).
const AuthContext = createContext(null)

// --- AuthProvider component ---
// This wraps the entire app (in main.jsx) so every component can
// access the auth state.
function AuthProvider({ children }) {
  // 'user' holds the logged-in user's info (id, username, email, role).
  // It starts as null (not logged in).
  const [user, setUser] = useState(null)

  // 'loading' is true while we check if the user is already logged in.
  // This prevents the app from briefly showing the login page on refresh.
  const [loading, setLoading] = useState(true)

  // useEffect runs once when the app first loads.
  // It checks if there's a saved token in localStorage and, if so,
  // fetches the user's info from the backend.
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // We have a saved token — try to fetch the user's info.
      api.get('/api/auth/me/')
        .then((response) => {
          // Success: save the user data in state.
          setUser(response.data)
        })
        .catch((err) => {
          // Only clear tokens if backend explicitly returns 401/403 (expired/invalid token).
          // Do not clear tokens on temporary network errors.
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        })
        .finally(() => {
          // Whether it worked or not, we're done loading.
          setLoading(false)
        })
    } else {
      // No saved token — user is not logged in.
      setLoading(false)
    }
  }, []) // Empty array = only run once, when the component first mounts.

  // login() is called after a successful login API call.
  // It saves the tokens to localStorage and fetches the user info.
  async function login(accessToken, refreshToken) {
    // Save tokens so they survive page refreshes.
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)

    // Fetch the user's info (username, role, etc.) from /api/auth/me/.
    const response = await api.get('/api/auth/me/')
    setUser(response.data)
    return response.data // Return user data so caller can read user.role
  }

  // logout() clears everything and sends the user back to the login page.
  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // The 'value' object contains everything we want to share.
  // Any component that calls useAuth() will get access to these.
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

// --- useAuth hook ---
// A shortcut so components can write useAuth() instead of useContext(AuthContext).
function useAuth() {
  return useContext(AuthContext)
}

// Export everything other files need.
export { AuthProvider, useAuth, api }
