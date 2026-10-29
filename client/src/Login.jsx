// Login.jsx — The login page for TutorLink.
//
// This component shows a form where users enter their username and password.
// When submitted, it sends the data to the Django backend to get JWT tokens.
// On success, it stores the tokens and redirects to the dashboard.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, api } from './AuthContext'
import './Login.css'

function Login() {
  // useState creates a piece of data that React can track and update.
  // When the user types in an input, we update these values.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Error message displayed below the form if login fails.
  const [error, setError] = useState('')

  // Get the login function from our AuthContext.
  const { login } = useAuth()

  // useNavigate lets us redirect to another page after login.
  const navigate = useNavigate()

  // This function runs when the user clicks the Submit button.
  // It sends the username and password to the backend API.
  async function handleSubmit(event) {
    event.preventDefault() // Stop the page from refreshing.
    setError('')           // Clear any previous error message.

    try {
      // Send a POST request to the Django login endpoint.
      // The backend returns { "access": "...", "refresh": "..." }.
      const response = await api.post('/api/auth/login/', {
        username,
        password,
      })

      // Save the tokens and fetch user info via AuthContext.
      const user = await login(response.data.access, response.data.refresh)

      // Redirect based on the user's role:
      if (user && user.role) {
        navigate(`/dashboard/${user.role}`)
      } else {
        navigate('/login')
      }
    } catch (err) {
      // If the backend returned an error (e.g. wrong password),
      // show the error message to the user.
      if (err.response && err.response.data) {
        // SimpleJWT returns errors like { "detail": "No active account found..." }
        const data = err.response.data
        setError(data.detail || 'Login failed. Please check your credentials.')
      } else {
        setError('Could not connect to the server.')
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header with title and subtitle */}
        <div className="login-header">
          <span className="login-badge">Welcome back</span>
          <h1>TutorLink</h1>
          <p className="login-subtitle">Connect with tutors and start learning</p>
        </div>

        {/* The form element wraps all inputs and the submit button */}
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Error message — only shown when 'error' is not empty */}
          {error && <p className="login-error">{error}</p>}

          {/* Submit button - type="submit" triggers handleSubmit when clicked */}
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        {/* Register link for new users — uses React Router's Link */}
        <p className="register-row">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-link">
            Register
          </Link>
        </p>

        <p className="login-footer">TutorLink by SumaiyaTesha — Your learning journey starts here</p>
      </div>
    </div>
  )
}

export default Login
