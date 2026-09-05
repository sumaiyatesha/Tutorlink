// Register.jsx — Registration page for TutorLink.
//
// New users fill in their details and choose whether they are a
// Guardian or a Tutor. On success, they are redirected to the login page.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from './AuthContext'
import './Register.css'

function Register() {
  // Form field values — each one is tracked by React using useState.
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // The role defaults to 'guardian'. The toggle switches it to 'tutor'.
  const [role, setRole] = useState('guardian')

  // Error message shown below the form if something goes wrong.
  const [error, setError] = useState('')

  // Success message shown briefly before redirecting to login.
  const [success, setSuccess] = useState('')

  // useNavigate lets us redirect the user to another page programmatically.
  const navigate = useNavigate()

  // This function runs when the form is submitted.
  async function handleSubmit(event) {
    event.preventDefault() // Stop the page from refreshing.

    // Clear any previous messages.
    setError('')
    setSuccess('')

    // Check that the two password fields match.
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      // Send the registration data to the Django backend.
      await api.post('/api/auth/register/', {
        username,
        email,
        password,
        role,
      })

      // Registration successful — show a message, then redirect to login.
      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => {
        navigate('/login') // Go to the login page after 1.5 seconds.
      }, 1500)
    } catch (err) {
      // If the backend returned an error, show it to the user.
      // DRF returns errors like { "username": ["A user with that username already exists."] }
      if (err.response && err.response.data) {
        // Get the first error message from the response.
        const data = err.response.data
        const firstKey = Object.keys(data)[0]
        const message = Array.isArray(data[firstKey])
          ? data[firstKey][0]    // DRF returns errors as arrays
          : data[firstKey]       // Sometimes it's a plain string
        setError(message || 'Registration failed. Please try again.')
      } else {
        setError('Could not connect to the server.')
      }
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <span className="register-badge">Create Account</span>
          <h1>TutorLink</h1>
          <p className="register-subtitle">Join as a Guardian or Tutor</p>
        </div>

        {/* Role toggle — switches between Guardian and Tutor */}
        <div className="role-toggle">
          <button
            type="button"
            className={`role-button ${role === 'guardian' ? 'active' : ''}`}
            onClick={() => setRole('guardian')}
          >
            🛡️ Guardian
          </button>
          <button
            type="button"
            className={`role-button ${role === 'tutor' ? 'active' : ''}`}
            onClick={() => setRole('tutor')}
          >
            📚 Tutor
          </button>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              required
            />
          </div>

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
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
              placeholder="Create a password (min 8 characters)"
              required
              minLength={8}
            />
          </div>

          {/* Confirm password field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          {/* Error message — only shown when 'error' is not empty */}
          {error && <p className="error-message">{error}</p>}

          {/* Success message — only shown when 'success' is not empty */}
          {success && <p className="success-message">{success}</p>}

          {/* Submit button */}
          <button type="submit" className="register-button">
            Create Account
          </button>
        </form>

        {/* Link back to the login page */}
        <p className="login-link-row">
          Already have an account?{' '}
          <Link to="/login" className="text-link">
            Sign In
          </Link>
        </p>

        <p className="register-footer">TutorLink by SumaiyaTesha — Your learning journey starts here</p>
      </div>
    </div>
  )
}

export default Register
