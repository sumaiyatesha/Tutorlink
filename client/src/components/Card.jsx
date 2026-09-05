// Card.jsx — Generic reusable Card component for TutorLink.
//
// This component provides a clean card container used for displaying
// tutor profiles, tuition posts, dashboard widgets, and features.
//
// Props:
// - title: Optional heading text for the card
// - subtitle: Optional secondary text below title
// - icon: Optional icon or emoji to display next to title
// - children: The main content inside the card body
// - footer: Optional content or action buttons at the bottom
// - hoverable: Boolean to enable hover elevation effect
// - onClick: Optional click handler function
// - className: Optional custom CSS class name

import './Card.css'

function Card({
  title,
  subtitle,
  icon,
  children,
  footer,
  hoverable = false,
  onClick,
  className = '',
}) {
  // Determine CSS classes based on props
  const clickableClass = onClick ? 'clickable' : ''
  const hoverClass = hoverable ? 'hoverable' : ''
  const combinedClasses = `card-wrapper ${clickableClass} ${hoverClass} ${className}`.trim()

  return (
    // Outer card container div
    <div className={combinedClasses} onClick={onClick}>

      {/* Render header section only if title, subtitle, or icon is provided */}
      {(title || subtitle || icon) && (
        <div className="card-header">
          {/* Render icon if provided */}
          {icon && <span className="card-header-icon">{icon}</span>}

          {/* Title and subtitle container */}
          <div className="card-header-text">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Main card body where children elements are rendered */}
      <div className="card-body">{children}</div>

      {/* Render footer section only if footer prop is provided */}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

export default Card
