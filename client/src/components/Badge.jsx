// Badge.jsx — Reusable Pill Badge component for TutorLink.
//
// Displays status tags such as "Verified", "Open", "Pending", or "Guardian".
//
// Props:
// - children: The text label or node inside the badge
// - variant: Color theme variant ('primary', 'verified', 'open', 'pending', 'success', 'warning', 'danger', 'neutral')
// - icon: Optional leading emoji/icon character (e.g. '✓')

import './Badge.css'

function Badge({ children, variant = 'primary', icon }) {
  // Construct CSS class name from variant
  const badgeClass = `badge-pill badge-${variant}`

  return (
    <span className={badgeClass}>
      {/* Optional leading icon */}
      {icon && <span className="badge-icon">{icon}</span>}

      {/* Badge text */}
      {children}
    </span>
  )
}

export default Badge
