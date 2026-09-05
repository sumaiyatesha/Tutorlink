// LoadingSpinner.jsx — Reusable Loading Spinner component for TutorLink.
//
// Displays a smooth CSS spinning indicator when fetching data from the API
// or waiting for an asynchronous action to complete.
//
// Props:
// - message: Optional text string to show under the spinner (e.g. "Loading tutors...")
// - size: Size variant ('small', 'medium', 'large') - defaults to 'medium'
// - fullPage: Boolean to center the spinner across the viewport height

import './LoadingSpinner.css'

function LoadingSpinner({ message = 'Loading...', size = 'medium', fullPage = false }) {
  // Build CSS container class based on props
  const containerClass = `spinner-container spinner-${size} ${fullPage ? 'full-page' : ''}`.trim()

  return (
    // Centered spinner container
    <div className={containerClass}>
      {/* Animated spinning circular ring */}
      <div className="spinner-ring" />

      {/* Display descriptive message if provided */}
      {message && <p className="spinner-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
