// EmptyState.jsx — Reusable Empty State component for TutorLink.
//
// Displayed when a list or search result has no data to display (e.g. no tutors found,
// no active applications, or empty search queries).
//
// Props:
// - icon: Emoji or icon character to represent the empty state (default: '🔍')
// - title: Heading text explaining the empty state (default: 'No Results Found')
// - message: Helpful subtext explaining what the user can do
// - actionLabel: Optional text for a primary action button
// - onAction: Optional click handler function for the action button

import './EmptyState.css'

function EmptyState({
  icon = '🔍',
  title = 'No Results Found',
  message = 'We could not find any matching items. Try adjusting your filters or search terms.',
  actionLabel,
  onAction,
}) {
  return (
    // Centered empty state container
    <div className="empty-state-container">
      {/* Icon visual display */}
      <div className="empty-state-icon">{icon}</div>

      {/* Main headline */}
      <h3 className="empty-state-title">{title}</h3>

      {/* Description text */}
      <p className="empty-state-message">{message}</p>

      {/* Render optional CTA button if actionLabel and onAction are provided */}
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
