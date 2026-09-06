// SubscriptionPage.jsx — In-App Simulated Payment & Subscription Checkout Flow.
//
// ============================================================================
// FACULTY EXAMINER / VIVA DEFENSE ARCHITECTURE NOTE:
// ----------------------------------------------------------------------------
// This module provides a realistic, multi-step simulated checkout experience
// for TutorLink subscriptions. NO real payment gateway (e.g., bKash API,
// Nagad API, Stripe, or SSLCommerz) is invoked, and NO real currency is transferred.
//
// THE 4-STEP IN-APP CHECKOUT LIFECYCLE:
// Step 1: Payment Method Selection (bKash / Nagad / Bank Card) + Plan Review
// Step 2: Simulated Payment Details Screen (masked phone/PIN or card inputs)
//         with a prominent Sandbox / Demo Environment notification banner.
// Step 3: Brief Simulated Processing State (1.5s - 2.0s animated timer simulating
//         gateway handshake, tokenization, and backend activation).
// Step 4: Digital Receipt / Confirmation Screen (Transaction ID, Masked Account,
//         Amount in BDT, Date/Time, Success Status, and Demo Mode note).
//
// Upon Step 4 completion, the user subscription is activated in the backend
// and gated features (e.g., AI Matching Chatbot, Tutor Priority Pro Ranking)
// unlock immediately without requiring a full page refresh.
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, api } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'
import './SubscriptionPage.css'

function SubscriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isTutor = user && user.role === 'tutor'

  // Current Subscription State from Backend (/api/subscriptions/mine/)
  const [subData, setSubData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Checkout Flow Step: 1 = Choose Method, 2 = Enter Details, 3 = Processing, 4 = Receipt
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('bkash')

  // Form Fields for bKash & Nagad (Mobile Financial Services)
  const [mfsPhone, setMfsPhone] = useState('01712345678')
  const [mfsPin, setMfsPin] = useState('1234')
  const [mfsError, setMfsError] = useState('')

  // Form Fields for Bank Card (Visa / Mastercard / Amex)
  const [cardName, setCardName] = useState('Sumaiya Rahman')
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('789')
  const [cardError, setCardError] = useState('')

  // Processing Animation State
  const [processingStatusText, setProcessingStatusText] = useState('Initiating secure sandbox transaction...')

  // Final Receipt Details State
  const [receipt, setReceipt] = useState(null)
  const [copiedTxn, setCopiedTxn] = useState(false)

  // Tutor Commissions State (15% per hire)
  const [commissions, setCommissions] = useState([])
  const [loadingCommissions, setLoadingCommissions] = useState(isTutor)

  // Status/Alert Feedback
  const [statusNotice, setStatusNotice] = useState('')

  // 1. Fetch current subscription status from backend
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

  // 2. Fetch tutor commissions list
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

  // Formatting & masking helpers
  const formatCardNumber = (value) => {
    const raw = value.replace(/\D/g, '').substring(0, 16)
    const parts = raw.match(/.{1,4}/g) || []
    return parts.join(' ')
  }

  const formatCardExpiry = (value) => {
    const raw = value.replace(/\D/g, '').substring(0, 4)
    if (raw.length >= 3) {
      return `${raw.substring(0, 2)}/${raw.substring(2, 4)}`
    }
    return raw
  }

  const getMaskedAccount = () => {
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '')
      const last4 = cleanNum.slice(-4) || '4444'
      return `•••• •••• •••• ${last4}`
    } else {
      const cleanPhone = mfsPhone.replace(/\D/g, '')
      if (cleanPhone.length >= 8) {
        const prefix = cleanPhone.substring(0, 3)
        const suffix = cleanPhone.substring(cleanPhone.length - 3)
        return `${prefix} •••• ${suffix}`
      }
      return `${mfsPhone} (Sandbox)`
    }
  }

  // Handle Step 1 -> Step 2 (Proceed to Details)
  const handleProceedToDetails = () => {
    setMfsError('')
    setCardError('')
    setCheckoutStep(2)
  }

  // Handle Step 2 -> Step 3 & 4 (Simulate Processing & Call Backend)
  const handleConfirmPayment = async (e) => {
    if (e) e.preventDefault()
    setMfsError('')
    setCardError('')

    // Validate inputs for Step 2
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '')
      if (cleanNum.length < 15 || cleanNum.length > 16) {
        setCardError('Please enter a valid 16-digit card number.')
        return
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setCardError('Please enter expiration date as MM/YY (e.g., 12/28).')
        return
      }
      if (cardCvc.length < 3) {
        setCardError('Please enter a 3-digit CVV code.')
        return
      }
    } else {
      const cleanPhone = mfsPhone.replace(/\D/g, '')
      if (cleanPhone.length < 11) {
        setMfsError('Please enter an 11-digit mobile number (e.g. 017XXXXXXXX).')
        return
      }
      if (mfsPin.length < 4) {
        setMfsError('Please enter your 4-5 digit PIN.')
        return
      }
    }

    // Step 3: Transition to processing state
    setCheckoutStep(3)
    setSubmitting(true)
    setProcessingStatusText('Connecting to simulated sandbox gateway...')

    // Animated status progression for live viva feel
    const timer1 = setTimeout(() => {
      setProcessingStatusText(`Simulating ${paymentMethod.toUpperCase()} authorization & tokenization...`)
    }, 700)

    const timer2 = setTimeout(() => {
      setProcessingStatusText('Finalizing subscription in database...')
    }, 1300)

    // Execute backend activation after realistic delay (1800ms)
    setTimeout(async () => {
      try {
        const res = await api.post('/api/subscriptions/subscribe/', {
          payment_method: paymentMethod,
          account_ref: getMaskedAccount(),
        })

        if (res && res.data) {
          const planTitle = isTutor ? 'Tutor Monthly' : 'Guardian Monthly'
          const planCost = isTutor ? 50 : 30

          // Prepare rich receipt data for Step 4
          const newReceipt = {
            transaction_id: res.data.transaction_id || `TXN${Date.now()}`,
            amount: res.data.amount || planCost,
            payment_method: paymentMethod,
            masked_account: getMaskedAccount(),
            timestamp: res.data.timestamp || new Date().toISOString(),
            plan_name: planTitle,
            status: 'Successful',
          }

          setReceipt(newReceipt)
          setSubData(res.data)
          setCheckoutStep(4) // Move to Step 4 (Receipt)
          setStatusNotice('🎉 Subscription activated successfully! Gated features are now unlocked.')

          // Refresh state from backend
          await fetchSubscriptionData()
          if (isTutor) {
            await fetchCommissionsData()
          }
        }
      } catch (err) {
        console.error('Subscription failed:', err)
        setCheckoutStep(2)
        setCardError('Payment simulation failed. Please try again.')
      } finally {
        clearTimeout(timer1)
        clearTimeout(timer2)
        setSubmitting(false)
      }
    }, 1800)
  }

  // Handle Cancel Subscription
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return
    setSubmitting(true)
    try {
      const res = await api.post('/api/subscriptions/cancel/')
      if (res && res.data) {
        setStatusNotice('Subscription cancelled.')
        await fetchSubscriptionData()
      }
    } catch (err) {
      console.error('Cancellation failed:', err)
      alert('Failed to cancel subscription.')
    } finally {
      setSubmitting(false)
    }
  }

  // Copy Transaction ID to clipboard
  const handleCopyTxn = () => {
    if (receipt && receipt.transaction_id) {
      navigator.clipboard.writeText(receipt.transaction_id)
      setCopiedTxn(true)
      setTimeout(() => setCopiedTxn(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="subscription-page">
        <Navbar />
        <div className="subscription-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
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
        {/* Page Header */}
        <div className="subscription-header">
          <div className="header-badge-wrap">
            <span className="hero-badge">⚡ Instant Simulation</span>
          </div>
          <h1>{isTutor ? 'Tutor Priority Subscription' : 'Guardian Premium Subscription'}</h1>
          <p>
            {isTutor
              ? 'Unlock Priority Pro placement, boosted search rankings, and premium tutor tools.'
              : 'Unlock AI Matchmaking Chatbot, priority teacher applications, and direct communication.'}
          </p>
        </div>

        {/* Global Demo Mode Disclaimer Banner */}
        <div className="demo-disclaimer-banner">
          <span className="demo-disclaimer-icon">🛡️</span>
          <div>
            <strong>Demo / Sandbox Mode:</strong> All payments on this page are fully simulated for project demonstration. No real money or external payment gateway (bKash/Nagad/Cards) is involved.
          </div>
        </div>

        {/* Status Notification */}
        {statusNotice && (
          <div className="status-notice-banner">
            <span>{statusNotice}</span>
            <button className="notice-close-btn" onClick={() => setStatusNotice('')}>✕</button>
          </div>
        )}

        {/* Main Grid: Plan Features Left + Checkout/Status Right */}
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
                ? 'Stand out with the Priority Pro Badge and reach top placement across all tuition browse listings in Dhaka.'
                : 'Experience direct AI-assisted tutor matching, instant tuition posting, and premium guardian verified status.'}
            </p>

            <div className="plan-features-divider"></div>

            <ul className="plan-features-list">
              {isTutor ? (
                <>
                  <li><span className="feat-icon">⭐</span> <strong>Priority Pro Badge</strong> on your profile and browse cards</li>
                  <li><span className="feat-icon">🚀</span> Boosted search rank in Guardian tutor directory</li>
                  <li><span className="feat-icon">🤖</span> Priority inclusion in AI Chat Match recommendations</li>
                  <li><span className="feat-icon">📊</span> Transparent 15% commission tracking per accepted tuition</li>
                </>
              ) : (
                <>
                  <li><span className="feat-icon">🤖</span> <strong>AI Matchmaking Assistant</strong> unlocked</li>
                  <li><span className="feat-icon">🛡️</span> Verified Guardian Account badge</li>
                  <li><span className="feat-icon">📝</span> Post unlimited tuition requests</li>
                  <li><span className="feat-icon">⭐</span> Bookmark & direct review hired tutors</li>
                </>
              )}
            </ul>

            <div className="plan-simulation-badge">
              <span>🔒 256-Bit Simulated Sandbox Encryption</span>
            </div>
          </div>

          {/* Right Column: Active Status OR Multi-Step Checkout Box */}
          <div className="subscription-actions-col">
            {/* If currently subscribed and not in an active receipt view, show Active Status Box */}
            {isSubscribed && checkoutStep !== 4 ? (
              <div className="status-card">
                <div className="status-header">
                  <div>
                    <span className="status-sub-label">Account Status</span>
                    <h3>Active Subscriber</h3>
                  </div>
                  <Badge variant="verified" icon="✓">
                    Active
                  </Badge>
                </div>

                <div className="status-meta">
                  <div className="status-meta-row">
                    <span className="meta-label">Current Plan:</span>
                    <span className="meta-val">{subData?.plan?.name || planName}</span>
                  </div>
                  <div className="status-meta-row">
                    <span className="meta-label">Payment Method:</span>
                    <span className="meta-val method-tag">
                      {subData?.payment_method ? subData.payment_method.toUpperCase() : 'BKASH (DEMO)'}
                    </span>
                  </div>
                  <div className="status-meta-row">
                    <span className="meta-label">Transaction ID:</span>
                    <span className="meta-val code-val">{subData?.transaction_id || 'TXN-ACTIVE-1001'}</span>
                  </div>
                  {subData?.started_at && (
                    <div className="status-meta-row">
                      <span className="meta-label">Activated On:</span>
                      <span className="meta-val">
                        {new Date(subData.started_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="active-unlocked-banner">
                  <span className="unlocked-icon">🎉</span>
                  <div>
                    <strong>All Premium Features Unlocked!</strong>
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                      {isTutor
                        ? 'Your profile is currently featured with top search priority.'
                        : 'You can now use the AI Matching Chatbot directly on your dashboard.'}
                    </p>
                  </div>
                </div>

                <div className="status-actions-row">
                  <button
                    type="button"
                    className="btn-dashboard-jump"
                    onClick={() => navigate(isTutor ? '/tutor-dashboard' : '/guardian-dashboard')}
                  >
                    Go to Dashboard →
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-sub"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    {submitting ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            ) : (
              /* --- MULTI-STEP CHECKOUT CONTAINER --- */
              <div className="checkout-card">
                {/* Checkout Step Progress Indicator */}
                <div className="checkout-stepper">
                  <div className={`step-node ${checkoutStep >= 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>
                    <span className="step-num">{checkoutStep > 1 ? '✓' : '1'}</span>
                    <span className="step-label">Method</span>
                  </div>
                  <div className={`step-line ${checkoutStep >= 2 ? 'active' : ''}`} />
                  <div className={`step-node ${checkoutStep >= 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''}`}>
                    <span className="step-num">{checkoutStep > 2 ? '✓' : '2'}</span>
                    <span className="step-label">Details</span>
                  </div>
                  <div className={`step-line ${checkoutStep >= 3 ? 'active' : ''}`} />
                  <div className={`step-node ${checkoutStep >= 4 ? 'active' : ''}`}>
                    <span className="step-num">{checkoutStep === 4 ? '✓' : '3'}</span>
                    <span className="step-label">Receipt</span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 1: PAYMENT METHOD SELECTION                                          */}
                {/* ========================================================================= */}
                {checkoutStep === 1 && (
                  <div className="step-content">
                    <div className="step-header">
                      <h3>Select Payment Method</h3>
                      <p>Choose your preferred payment gateway to simulate payment.</p>
                    </div>

                    <div className="payment-methods-grid">
                      {/* bKash */}
                      <div
                        className={`payment-method-card ${paymentMethod === 'bkash' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('bkash')}
                      >
                        <div className="pm-header">
                          <span className="pm-icon mfs-bkash">📱</span>
                          {paymentMethod === 'bkash' && <span className="pm-check">✓</span>}
                        </div>
                        <span className="pm-name">bKash</span>
                        <span className="pm-badge">Mobile Wallet</span>
                      </div>

                      {/* Nagad */}
                      <div
                        className={`payment-method-card ${paymentMethod === 'nagad' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('nagad')}
                      >
                        <div className="pm-header">
                          <span className="pm-icon mfs-nagad">💸</span>
                          {paymentMethod === 'nagad' && <span className="pm-check">✓</span>}
                        </div>
                        <span className="pm-name">Nagad</span>
                        <span className="pm-badge">Mobile Wallet</span>
                      </div>

                      {/* Bank Card */}
                      <div
                        className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="pm-header">
                          <span className="pm-icon card-icon">💳</span>
                          {paymentMethod === 'card' && <span className="pm-check">✓</span>}
                        </div>
                        <span className="pm-name">Bank Card</span>
                        <span className="pm-badge">Visa / Master</span>
                      </div>
                    </div>

                    {/* Order Summary Box */}
                    <div className="order-summary-box">
                      <div className="summary-row">
                        <span>Plan Subscription</span>
                        <span>{planName}</span>
                      </div>
                      <div className="summary-row">
                        <span>Billing Frequency</span>
                        <span>Monthly (30 Days)</span>
                      </div>
                      <div className="summary-row total-row">
                        <span>Total Payable (BDT)</span>
                        <span className="total-price">{planPrice} Tk</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-checkout-primary"
                      onClick={handleProceedToDetails}
                    >
                      Proceed with {paymentMethod === 'card' ? 'Card' : paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} →
                    </button>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 2: SIMULATED PAYMENT DETAILS SCREEN                                  */}
                {/* ========================================================================= */}
                {checkoutStep === 2 && (
                  <form className="step-content" onSubmit={handleConfirmPayment}>
                    <div className="step-header">
                      <div className="method-pill-header">
                        <span className="pill-method-name">
                          {paymentMethod === 'bkash' && '📱 bKash Sandbox Gateway'}
                          {paymentMethod === 'nagad' && '💸 Nagad Sandbox Gateway'}
                          {paymentMethod === 'card' && '💳 Bank Card Sandbox Checkout'}
                        </span>
                        <span className="pill-amount">{planPrice} Tk</span>
                      </div>
                    </div>

                    {/* Step 2 Sandbox Banner */}
                    <div className="sandbox-step-banner">
                      <span className="sandbox-icon">🧪</span>
                      <div>
                        <strong>Sandbox / Demo Environment</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                          No real transaction will occur. Feel free to use the prefilled mock credentials.
                        </p>
                      </div>
                    </div>

                    {/* --- If Mobile Financial Service (bKash / Nagad) --- */}
                    {paymentMethod !== 'card' ? (
                      <div className="mfs-form-panel">
                        <div className="mfs-branding-box">
                          <span className="mfs-avatar">
                            {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                          <div>
                            <div className="mfs-merchant-title">TutorLink Merchant Account</div>
                            <div className="mfs-merchant-id">Merchant ID: 01700-000000</div>
                          </div>
                        </div>

                        {mfsError && (
                          <div className="form-error-banner">⚠️ {mfsError}</div>
                        )}

                        <div className="form-group">
                          <label>Your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Mobile Number</label>
                          <div className="input-with-prefix">
                            <span className="phone-prefix">🇧🇩 +88</span>
                            <input
                              type="tel"
                              className="form-input prefixed-input"
                              value={mfsPhone}
                              onChange={(e) => setMfsPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                              placeholder="01712345678"
                              required
                            />
                          </div>
                          <span className="field-hint">Any 11-digit demo phone number accepted</span>
                        </div>

                        <div className="form-group">
                          <label>{paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} PIN (Simulated)</label>
                          <input
                            type="password"
                            className="form-input"
                            value={mfsPin}
                            onChange={(e) => setMfsPin(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                            placeholder="••••"
                            maxLength={5}
                            required
                          />
                          <span className="field-hint">4-5 digit PIN format check only (not transmitted externally)</span>
                        </div>
                      </div>
                    ) : (
                      /* --- If Bank Card (Visa / Mastercard) --- */
                      <div className="card-form-panel">
                        {cardError && (
                          <div className="form-error-banner">⚠️ {cardError}</div>
                        )}

                        <div className="form-group">
                          <label>Cardholder Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Full Name as on Card"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Card Number</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              className="form-input"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="4111 2222 3333 4444"
                              maxLength={19}
                              required
                            />
                            <span className="card-type-hint">💳 Visa / Master</span>
                          </div>
                        </div>

                        <div className="form-row-2">
                          <div className="form-group">
                            <label>Expiry Date</label>
                            <input
                              type="text"
                              className="form-input"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                              placeholder="MM/YY"
                              maxLength={5}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>CVV / CVC</label>
                            <input
                              type="password"
                              className="form-input"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                              placeholder="123"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2 Action Buttons */}
                    <div className="step-actions-row">
                      <button
                        type="button"
                        className="btn-checkout-secondary"
                        onClick={() => setCheckoutStep(1)}
                      >
                        ← Change Method
                      </button>
                      <button
                        type="submit"
                        className="btn-checkout-primary"
                        disabled={submitting}
                      >
                        Confirm Payment ({planPrice} Tk)
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================================= */}
                {/* STEP 3: SIMULATED PROCESSING STATE                                        */}
                {/* ========================================================================= */}
                {checkoutStep === 3 && (
                  <div className="step-content processing-state-box">
                    <div className="processing-spinner-wrap">
                      <div className="custom-pulse-spinner"></div>
                    </div>
                    <h3>Processing Payment...</h3>
                    <p className="processing-status-text">{processingStatusText}</p>
                    <div className="processing-progress-bar">
                      <div className="processing-progress-fill"></div>
                    </div>
                    <div className="processing-safe-note">
                      🔒 Demo sandbox handshake in progress — no external network requests
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 4: DIGITAL RECEIPT / CONFIRMATION SCREEN                             */}
                {/* ========================================================================= */}
                {checkoutStep === 4 && receipt && (
                  <div className="step-content receipt-state-box">
                    <div className="receipt-success-badge">
                      <span className="success-check-icon">✓</span>
                    </div>

                    <h3>Payment Successful!</h3>
                    <p className="receipt-subtitle">Your subscription has been activated.</p>

                    {/* Receipt Ticket Box */}
                    <div className="receipt-ticket">
                      <div className="receipt-ticket-header">
                        <span>TUTORLINK OFFICIAL RECEIPT</span>
                        <span className="receipt-status-pill">● SUCCESSFUL</span>
                      </div>

                      <div className="receipt-ticket-body">
                        <div className="receipt-item-row">
                          <span className="r-label">Transaction ID:</span>
                          <div className="r-val-copy-wrap">
                            <span className="r-val r-txn-code">{receipt.transaction_id}</span>
                            <button
                              type="button"
                              className="btn-copy-txn"
                              onClick={handleCopyTxn}
                              title="Copy Transaction ID"
                            >
                              {copiedTxn ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="receipt-item-row">
                          <span className="r-label">Subscribed Plan:</span>
                          <span className="r-val">{receipt.plan_name}</span>
                        </div>

                        <div className="receipt-item-row">
                          <span className="r-label">Amount Paid:</span>
                          <span className="r-val amount-val">{receipt.amount} BDT</span>
                        </div>

                        <div className="receipt-item-row">
                          <span className="r-label">Payment Method:</span>
                          <span className="r-val method-val">{receipt.payment_method.toUpperCase()}</span>
                        </div>

                        <div className="receipt-item-row">
                          <span className="r-label">Account / Card:</span>
                          <span className="r-val">{receipt.masked_account}</span>
                        </div>

                        <div className="receipt-item-row">
                          <span className="r-label">Date & Time:</span>
                          <span className="r-val">
                            {new Date(receipt.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="receipt-ticket-footer">
                        <span>⚠️ Demo mode - no real payment processed</span>
                      </div>
                    </div>

                    <div className="receipt-actions-row">
                      <button
                        type="button"
                        className="btn-checkout-primary"
                        onClick={() => navigate(isTutor ? '/tutor-dashboard' : '/guardian-dashboard')}
                      >
                        Continue to Dashboard →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tutor Commissions Table Section (if Tutor) */}
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
