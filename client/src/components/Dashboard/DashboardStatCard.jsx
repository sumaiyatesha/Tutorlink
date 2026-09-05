// DashboardStatCard.jsx — Reusable Stat Card Component.
//
// Supports value display, progress bar, subtext, or action link.

import './DashboardStatCard.css'

function DashboardStatCard({
  icon = '📊',
  title,
  value,
  subtitle,
  progress,
  actionText,
  onActionClick,
  actionHref,
}) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-top">
        <div className="dash-stat-icon-bg">{icon}</div>
        <div className="dash-stat-title-area">
          <span className="dash-stat-title">{title}</span>
          {value !== undefined && <span className="dash-stat-value">{value}</span>}
        </div>
      </div>

      {/* Progress Bar (if progress percentage provided) */}
      {progress !== undefined && (
        <div className="dash-progress-wrapper">
          <div className="dash-progress-bar-bg">
            <div
              className="dash-progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtitle text */}
      {subtitle && <p className="dash-stat-subtitle">{subtitle}</p>}

      {/* Action link or button */}
      {actionText && actionHref && (
        <a href={actionHref} className="dash-stat-action-link">
          {actionText} →
        </a>
      )}
      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="dash-stat-action-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {actionText} →
        </button>
      )}
    </div>
  )
}

export default DashboardStatCard
