// SubscriptionPage.jsx — Role-Aware Mock Subscription & Tutor Commission Dashboard.
//
// Features for Viva Defense:
// 1. Role-aware view: Guardian Monthly (30 Tk/mo) vs Tutor Monthly (50 Tk/mo).
// 2. Demo mode disclaimer banner highlighting mock payment nature.
// 3. Payment method selection (bKash / Nagad / Card) with mock card form fields.
// 4. Current subscription status badge with Cancel option when active.
// 5. Automatic state refresh (re-fetching /api/subscriptions/mine/) on subscribe/cancel.
// 6. Tutor "My Commissions" section displaying 15% per-hire obligations automatically tracked upon hire.

import { useState, useEffect, useCallback } from 'react'
import { useAuth, api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'
import './SubscriptionPage.css'

function SubscriptionPage() {
  const { user } = useAuth()
  const isTutor = user && user.role === 'tutor'

  // Subscription state
  const [subData, setSubData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('bkash')

  // Feedback alerts
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Mock Card Form State
  const [cardName, setCardName] = useState('John Doe')
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [cardError, setCardError] = useState('')

  // Commissions state (for Tutors)
  const [commissions, setCommissions] = useState([])
  const [loadingCommissions, setLoadingCommissions] = useState(isTutor)

  // Fetch current subscription status from backend
  const fetchSubscriptionData = useCallback(async () => {
    try {
      const res = await api.get('/api/subscriptions/mine/').catch(() => null)
      if (res && res.data) {
        setSubData(res.data)
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch tutor commissions
  const fetchCommissionsData = useCallback(async () => {
    if (!isTutor) return
    try {
      const res = await api.get('/api/tutor/commissions/').catch(() => null)
      if (res && Array.isArray(res.data)) {
        setCommissions(res.data)
      }
    } catch (err) {
      console.error('Error fetching tutor commissions:', err)
    } finally {
      setLoadingCommissions(false)
    }
  }, [isTutor])

  useEffect(() => {
    fetchSubscriptionData()
    fetchCommissionsData()
  }, [fetchSubscriptionData, fetchCommissionsData])

  // Handle Subscribe Action
  async function handleSubscribe(e) {
    e.preventDefault()
    setCardError('')
    setErrorMessage('')
    setSuccessMessage('')

    // Validate mock card input if Card payment method selected
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '')
      if (cleanNum.length < 12 || cleanNum.length > 19) {
        setCardError('Please enter a valid 16-digit card number.')
        return
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setCardError('Please enter expiration date in MM/YY format (e.g. 12/28).')
        return
      }
      if (cardCvc.length < 3) {
        setCardError('Please enter a 3-digit CVC code.')
        return
      }
    }

    setSubmitting(true)
    const mockTxnId = `MOCK-TXN-${Math.floor(100000 + Math.random() * 900000)}`

    try {
      const res = await api.post('/api/subscriptions/subscribe/', {
        payment_method: paymentMethod,
        transaction_id: mockTxnId,
      })

      if (res && res.data) {
        // Update local state directly with returned payload
        setSubData(res.data)
        setSuccessMessage('🎉 Subscription activated successfully! Your account is now Active.')

        // Re-fetch from server to guarantee fresh state
        await fetchSubscriptionData()

        if (isTutor) {
          await fetchCommissionsData()
        }
      }
    } catch (err) {
      console.error('Subscription failed:', err)
      const errorMsg =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Subscription request failed. Please check backend connection.'
      setErrorMessage(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Cancel Subscription Action
  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await api.post('/api/subscriptions/cancel/')
      if (res && res.data) {
        setSuccessMessage('Subscription cancelled.')
        await fetchSubscriptionData()
      }
    } catch (err) {
      console.error('Cancellation failed:', err)
      setErrorMessage('Failed to cancel subscription. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="subscription-page">
        <Navbar />
        <div className="subscription-container" style={{ textAlign: 'center', paddingTop: '64px' }}>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  const isSubscribed = Boolean(subData && (subData.is_subscribed || subData.status === 'active'))
  const planName = isTutor ? 'Tutor Monthly' : 'Guardian Monthly'
  const planPrice = isTutor ? '50' : '30'

  return (
    <div className="subscription-page">
      <Navbar />

      <main className="subscription-container">
        {/* Page Title & Subtitle */}
        <div className="subscription-header">
          <h1>{isTutor ? 'Tutor Subscription & Commissions' : 'Guardian Subscription Plan'}</h1>
          <p>
            {isTutor
              ? 'Unlock Priority Pro status to appear first in tutor directory search results.'
              : 'Subscribe to enjoy premium guardian benefits and direct tutor messaging.'}
          </p>
        </div>

        {/* Demo Mode Disclaimer Banner */}
        <div className="demo-disclaimer-banner">
          <span className="demo-disclaimer-icon">⚠️</span>
          <div>
            <strong>Demo Mode Active:</strong> No real payment gateway is integrated and no real money is processed. All transactions are simulated for demonstration purposes.
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Main Grid */}
        <div className="subscription-grid">
          {/* Left Column: Plan Feature Card */}
          <div className="plan-hero-card">
            <span className="plan-role-badge">{user ? user.role : 'Member'} Plan</span>
            <h2 className="plan-title">{planName}</h2>
            
            <div className="plan-price-row">
              <span className="plan-currency">Tk</span>
              <span className="plan-amount">{planPrice}</span>
              <span className="plan-period">/ month</span>
            </div>

            <p className="plan-description">
              {isTutor
                ? 'Stand out to guardians with a Verified Priority badge and top-tier search placement across all tuition browse listings.'
                : 'Manage tuition requirements smoothly with full platform support and priority guardian matching.'}
            </p>

            <ul className="plan-features-list">
              {isTutor ? (
                <>
                  <li>✨ <strong>Priority Pro Badge</strong> on profile and search cards</li>
                  <li>🚀 Boosted search ranking in Guardian tutor directory</li>
                  <li>📊 Direct commission tracking (15% per accepted job)</li>
                  <li>💬 Priority support and status alerts</li>
                </>
              ) : (
                <>
                  <li>🛡️ Verified Guardian Status</li>
                  <li>📝 Post unlimited tuition requirements</li>
                  <li>⭐ Bookmark and review hired tutors</li>
                  <li>💬 Priority support</li>
                </>
              )}
            </ul>
          </div>

          {/* Right Column: Status Card or Payment Form */}
          <div className="subscription-actions-col">
            {/* Subscription Status Box */}
            <div className="status-card">
              <div className="status-header">
                <h3>Subscription Status</h3>
                <Badge
                  variant={isSubscribed ? 'verified' : subData?.status === 'cancelled' ? 'danger' : 'neutral'}
                  icon={isSubscribed ? '✓' : 'ℹ'}
                >
                  {isSubscribed ? 'Active Subscriber' : subData?.status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                </Badge>
              </div>

              {isSubscribed ? (
                <div className="status-meta">
                  <p><strong>Current Plan:</strong> {subData?.plan?.name || planName}</p>
                  <p><strong>Payment Method:</strong> {subData?.payment_method?.toUpperCase() || 'BKASH'}</p>
                  <p><strong>Transaction Ref:</strong> {subData?.transaction_id || 'MOCK-TXN-1001'}</p>
                  {subData?.started_at && (
                    <p>
                      <strong>Subscribed On:</strong>{' '}
                      {new Date(subData.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn-cancel-sub"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    {submitting ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  You do not currently have an active subscription. Choose a payment method below to subscribe.
                </p>
              )}
            </div>

            {/* Payment Section (if not active) */}
            {!isSubscribed && (
              <div className="payment-section">
                <h3>Choose Payment Method</h3>

                <div className="payment-methods-grid">
                  <div
                    className={`payment-method-card ${paymentMethod === 'bkash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('bkash')}
                  >
                    <span className="pm-icon">📱</span>
                    <span className="pm-name">bKash</span>
                  </div>

                  <div
                    className={`payment-method-card ${paymentMethod === 'nagad' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('nagad')}
                  >
                    <span className="pm-icon">💸</span>
                    <span className="pm-name">Nagad</span>
                  </div>

                  <div
                    className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <span className="pm-icon">💳</span>
                    <span className="pm-name">Card</span>
                  </div>
                </div>

                <form onSubmit={handleSubscribe}>
                  {/* Mock Card Form Fields */}
                  {paymentMethod === 'card' ? (
                    <div className="mock-card-form">
                      {cardError && (
                        <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '600' }}>
                          {cardError}
                        </div>
                      )}
                      <div className="form-group">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Name on card"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Card Number (Mock)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          required
                        />
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            className="form-input"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVC</label>
                          <input
                            type="text"
                            className="form-input"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
                      <p><strong>Mobile Wallet Demo Instructions:</strong></p>
                      <p>Send <strong>{planPrice} Tk</strong> to Merchant Number <strong>01700-000000</strong> ({paymentMethod.toUpperCase()}).</p>
                      <p>A mock transaction ID will be auto-generated upon clicking Subscribe below.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-subscribe-now"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : `Subscribe Now (${planPrice} Tk/mo)`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Tutor Commissions Table Section */}
        {isTutor && (
          <section className="commissions-section">
            <div className="commissions-section-header">
              <h2>My Tuition Commissions (15% Per Hire)</h2>
              <p>
                When a guardian accepts your application for a tuition post, a 15% platform commission obligation is automatically logged here. This is tracked separately from your flat monthly subscription.
              </p>
            </div>

            <div className="commissions-table-wrapper">
              {loadingCommissions ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <LoadingSpinner />
                </div>
              ) : commissions.length === 0 ? (
                <div className="empty-commissions-box">
                  <p>📁 No commission records found yet.</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    When a guardian hires you by accepting your application, your 15% commission record will appear here.
                  </p>
                </div>
              ) : (
                <table className="commissions-table">
                  <thead>
                    <tr>
                      <th>Post Title</th>
                      <th>Subject</th>
                      <th>Tuition Salary</th>
                      <th>15% Owed</th>
                      <th>Status</th>
                      <th>Date Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((comm) => (
                      <tr key={comm.id}>
                        <td><strong>{comm.post_title || `Tuition #${comm.application}`}</strong></td>
                        <td>{comm.post_subject || 'General'}</td>
                        <td>{comm.tuition_amount} Tk</td>
                        <td><strong style={{ color: '#4f46e5' }}>{comm.commission_amount} Tk</strong></td>
                        <td>
                          <Badge variant={comm.status === 'paid' ? 'verified' : 'pending'}>
                            {comm.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          {new Date(comm.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default SubscriptionPage
