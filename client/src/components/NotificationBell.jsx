// NotificationBell.jsx — Interactive Notification Bell Component with Unread Badge & Dropdown.
//
// Features:
// 1. Fetches notifications from GET /api/notifications/ for logged in user.
// 2. Displays red unread count badge on bell icon (e.g. 🔔 2).
// 3. Toggleable dropdown menu showing notification list (newest first, unread highlighted).
// 4. Click notification to mark as read via PUT /api/notifications/<id>/read/.
// 5. Automatic periodic refresh every 15 seconds.

import { useState, useEffect, useRef } from 'react'
import { api } from '../AuthContext'
import './NotificationBell.css'

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Fetch notifications
  async function fetchNotifications() {
    try {
      const res = await api.get('/api/notifications/').catch(() => null)
      if (res && Array.isArray(res.data)) {
        setNotifications(res.data)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 15 seconds for fresh notifications
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark single notification as read
  async function handleMarkAsRead(notifId, isRead) {
    if (isRead) return // Already read

    try {
      const res = await api.put(`/api/notifications/${notifId}/read/`)
      if (res && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
        )
      }
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        className="nav-notification-bell"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        type="button"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <span className="unread-count-pill">{unreadCount} Unread</span>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                >
                  <div className="notif-content">
                    <span className="notif-dot" />
                    <p className="notif-message">{notif.message}</p>
                  </div>
                  <span className="notif-time">
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
