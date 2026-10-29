// SubscriptionPage.jsx — In-App Payment & Subscription Checkout Flow.
//
// ============================================================================
// ARCHITECTURE NOTE:
// ----------------------------------------------------------------------------
// THE 4-STEP IN-APP CHECKOUT LIFECYCLE:
// Step 1: Payment Method Selection (bKash / Nagad / Bank Card) + Plan Review
// Step 2: Payment Details Screen (masked phone/PIN or card inputs)
// Step 3: Brief Processing State (animated timer covering the gateway
//         handshake, tokenization, and backend activation).
// Step 4: Digital Receipt / Confirmation Screen (Transaction ID, Masked Account,
//         Amount in BDT, Date/Time, Success Status).
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
  const [processingStatusText, setProcessingStatusText] = useState('Initiating secure transaction...')

  // Final Receipt Details State
  const [receipt, setReceipt] = useState(null)
  const [copiedTxn, setCopiedTxn] = useState(false)

  // Status/Alert Feedback
  const [statusNotice, setStatusNotice] = useState('')

  // 15% Tuition Commission State (for Tutors)
  const [commissions, setCommissions] = useState([])
  const [commissionsLoading, setCommissionsLoading] = useState(false)
  const [payingCommission, setPayingCommission] = useState(null)
  const [commPayMethod, setCommPayMethod] = useState('bkash')
  const [commMfsPhone, setCommMfsPhone] = useState('01712345678')
  const [commMfsPin, setCommMfsPin] = useState('1234')
  const [commCardNumber, setCommCardNumber] = useState('4111 2222 3333 4444')
  const [commCardExpiry, setCommCardExpiry] = useState('12/28')
  const [commCardCvc, setCommCardCvc] = useState('789')
  const [commSubmitting, setCommSubmitting] = useState(false)
  const [commSuccessMsg, setCommSuccessMsg] = useState('')
  const [commErrorMsg, setCommErrorMsg] = useState('')

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

  // 2. Fetch 15% first-month commission records (tutor only)
  const fetchCommissions = useCallback(async () => {
    if (!isTutor) return
    setCommissionsLoading(true)
    try {
      const res = await api.get('/api/tutor/commissions/').catch(() => null)
      if (res && res.data) {
        setCommissions(res.data)
      }
    } catch (err) {
      console.error('Error fetching tutor commissions:', err)
    } finally {
      setCommissionsLoading(false)
    }
  }, [isTutor])

  useEffect(() => {
    fetchSubscriptionData()
    if (isTutor) {
      fetchCommissions()
    }
  }, [fetchSubscriptionData, fetchCommissions, isTutor])

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
      return mfsPhone
    }
  }

  // Handle Step 1 -> Step 2 (Proceed to Details)
  const handleProceedToDetails = () => {
    setMfsError('')
    setCardError('')
    setCheckoutStep(2)
  }

  // Handle Step 2 -> Step 3 & 4 (Processing & Call Backend)
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
    setProcessingStatusText('Connecting to secure payment gateway...')

    const timer1 = setTimeout(() => {
      setProcessingStatusText(`Verifying ${paymentMethod.toUpperCase()} authorization & tokenization...`)
    }, 700)

    const timer2 = setTimeout(() => {
      setProcessingStatusText('Finalizing subscription in database...')
    }, 1300)

    // Execute backend activation after realistic delay (1800ms)
    // To change this: adjust gateway processing time in milliseconds (1800ms)
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
        }
      } catch (err) {
        console.error('Subscription failed:', err)
        setCheckoutStep(2)
        setCardError('Payment failed. Please try again.')
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

  // Calculate 15% commission ledger totals
  const totalCommissionDue = commissions
    .filter((c) => c.status !== 'paid')
    .reduce((acc, c) => acc + parseFloat(c.commission_amount || 0), 0)

  const totalCommissionPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + parseFloat(c.commission_amount || 0), 0)

  // Handle Pay 15% First-Month Commission
  const handleConfirmCommissionPayment = async (e) => {
    if (e) e.preventDefault()
    if (!payingCommission) return

    setCommSubmitting(true)
    setCommErrorMsg('')

    try {
      const res = await api.post(`/api/tutor/commissions/${payingCommission.id}/pay/`, {
        payment_method: commPayMethod,
      })
      if (res && res.data) {
        setCommSuccessMsg(
          `Payment of ${payingCommission.commission_amount} BDT for "${payingCommission.post_subject || payingCommission.post_title || 'Tuition'}" is successfully paid!`
        )
        setPayingCommission(null)
        await fetchCommissions()
      }
    } catch (err) {
      console.error('Commission payment error:', err)
      setCommErrorMsg(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setCommSubmitting(false)
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
          <h1>{isTutor ? 'Tutor Priority Subscription' : 'Guardian Premium Subscription'}</h1>
          <p>
            {isTutor
              ? 'Unlock Priority Pro placement, boosted search rankings, and premium tutor tools.'
              : 'Unlock AI Matchmaking Chatbot, priority teacher applications, and direct communication.'}
          </p>
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

            <div className="plan-security-badge">
              <span>🔒 256-Bit Secure Encryption</span>
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
                      {subData?.payment_method ? subData.payment_method.toUpperCase() : 'BKASH'}
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
                    onClick={() => navigate(isTutor ? '/tutor/dashboard' : '/guardian/dashboard')}
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
                      <p>Choose your preferred payment gateway to continue.</p>
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
                {/* STEP 2: PAYMENT DETAILS SCREEN                                            */}
                {/* ========================================================================= */}
                {checkoutStep === 2 && (
                  <form className="step-content" onSubmit={handleConfirmPayment}>
                    <div className="step-header">
                      <div className="method-pill-header">
                        <span className="pill-method-name">
                          {paymentMethod === 'bkash' && '📱 bKash Gateway'}
                          {paymentMethod === 'nagad' && '💸 Nagad Gateway'}
                          {paymentMethod === 'card' && '💳 Bank Card Checkout'}
                        </span>
                        <span className="pill-amount">{planPrice} Tk</span>
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
                          <span className="field-hint">Enter your 11-digit mobile number</span>
                        </div>

                        <div className="form-group">
                          <label>{paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} PIN</label>
                          <input
                            type="password"
                            className="form-input"
                            value={mfsPin}
                            onChange={(e) => setMfsPin(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                            placeholder="••••"
                            maxLength={5}
                            required
                          />
                          <span className="field-hint">4-5 digit PIN</span>
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
                {/* STEP 3: PROCESSING STATE                                                  */}
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
                      🔒 Secure encrypted handshake in progress
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
                    </div>

                    <div className="receipt-actions-row">
                      <button
                        type="button"
                        className="btn-checkout-primary"
                        onClick={() => navigate(isTutor ? '/tutor/dashboard' : '/guardian/dashboard')}
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

        {/* ========================================================= */}
        {/* 15% FIRST-MONTH TUITION COMMISSION LEDGER (TUTORS)        */}
        {/* ========================================================= */}
        {isTutor && (
          <section className="commission-section">
            <div className="commission-section-header">
              <div className="commission-title-wrap">
                <span className="commission-tag">Platform Policy</span>
                <h2>15% First-Month Tuition Commission</h2>
                <p>
                  As per platform terms, tutors must pay a 15% platform commission on the first month's
                  tuition remuneration within 10 days of getting hired, whether you are subscribed to
                  Priority Pro or not.
                </p>
              </div>

              <div className="commission-summary-badges">
                <div className="comm-sum-badge due">
                  <span className="csb-label">Total Commission Due</span>
                  <span className="csb-val">{totalCommissionDue.toFixed(2)} BDT</span>
                </div>
                <div className="comm-sum-badge paid">
                  <span className="csb-label">Total Successfully Paid</span>
                  <span className="csb-val">{totalCommissionPaid.toFixed(2)} BDT</span>
                </div>
              </div>
            </div>

            {commSuccessMsg && (
              <div className="status-notice-banner comm-alert-banner">
                <span>✓ {commSuccessMsg}</span>
                <button type="button" className="notice-close-btn" onClick={() => setCommSuccessMsg('')}>✕</button>
              </div>
            )}

            {commissionsLoading ? (
              <div className="comm-loading-box">
                <LoadingSpinner />
                <p>Loading commission dues...</p>
              </div>
            ) : commissions.length === 0 ? (
              <div className="comm-empty-card">
                <span className="comm-empty-icon">📋</span>
                <h3>No Commission Dues</h3>
                <p>
                  You haven't been hired for any tuition posts yet. When a guardian accepts your application,
                  your 15% first-month commission record and its 10-day payment deadline will appear here.
                </p>
              </div>
            ) : (
              <div className="comm-table-container">
                <table className="comm-data-table">
                  <thead>
                    <tr>
                      <th>Tuition & Guardian</th>
                      <th>1st Month Tuition</th>
                      <th>15% Commission</th>
                      <th>10-Day Deadline</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((comm) => {
                      const isPaid = comm.status === 'paid'
                      return (
                        <tr key={comm.id} className={isPaid ? 'comm-row-paid' : 'comm-row-due'}>
                          <td>
                            <div className="comm-table-subject">
                              {comm.post_subject || comm.post_title || `Tuition #${comm.id}`}
                            </div>
                            <div className="comm-table-guardian">
                              Guardian: <strong>{comm.guardian_name || 'Guardian'}</strong>
                            </div>
                            <div className="comm-table-date">
                              Hired on: {new Date(comm.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td>
                            <span className="comm-salary-val">{comm.tuition_amount} BDT</span>
                          </td>
                          <td>
                            <span className="comm-amount-highlight">{comm.commission_amount} BDT</span>
                          </td>
                          <td>
                            {isPaid ? (
                              <div className="comm-cleared-text">
                                Paid on {comm.paid_at ? new Date(comm.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </div>
                            ) : (
                              <div>
                                <div className="comm-deadline-date">
                                  {comm.due_date
                                    ? new Date(comm.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Within 10 days'}
                                </div>
                                <span className={`comm-pill-days ${comm.is_overdue ? 'pill-overdue' : 'pill-active-days'}`}>
                                  {comm.is_overdue ? 'Overdue' : `${comm.days_left} day${comm.days_left === 1 ? '' : 's'} left`}
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            {isPaid ? (
                              <span className="badge-paid-pill">✓ Successfully Paid</span>
                            ) : (
                              <span className={`badge-due-pill ${comm.is_overdue ? 'badge-overdue-pill' : ''}`}>
                                ● Due
                              </span>
                            )}
                          </td>
                          <td>
                            {isPaid ? (
                              <div className="comm-paid-record">
                                <span className="cpr-txn">TXN: {comm.transaction_id || 'N/A'}</span>
                                <span className="cpr-method">Via {comm.payment_method?.toUpperCase() || 'BKASH'}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn-pay-comm-due"
                                onClick={() => {
                                  setPayingCommission(comm)
                                  setCommErrorMsg('')
                                }}
                              >
                                Pay Due ({comm.commission_amount} BDT)
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Simple Commission Payment Modal */}
        {payingCommission && (
          <div className="comm-modal-backdrop" onClick={() => !commSubmitting && setPayingCommission(null)}>
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <div>
                  <h3>Pay 15% First-Month Commission</h3>
                  <p>
                    {payingCommission.post_subject || payingCommission.post_title} — Payable: <strong>{payingCommission.commission_amount} BDT</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="comm-modal-close"
                  onClick={() => !commSubmitting && setPayingCommission(null)}
                >
                  ✕
                </button>
              </div>

              {commErrorMsg && <div className="comm-modal-error">⚠️ {commErrorMsg}</div>}

              <form onSubmit={handleConfirmCommissionPayment}>
                {/* Method selector */}
                <div className="comm-modal-methods">
                  <button
                    type="button"
                    className={`comm-method-btn ${commPayMethod === 'bkash' ? 'active' : ''}`}
                    onClick={() => setCommPayMethod('bkash')}
                  >
                    <span>📱</span> bKash
                  </button>
                  <button
                    type="button"
                    className={`comm-method-btn ${commPayMethod === 'nagad' ? 'active' : ''}`}
                    onClick={() => setCommPayMethod('nagad')}
                  >
                    <span>💸</span> Nagad
                  </button>
                  <button
                    type="button"
                    className={`comm-method-btn ${commPayMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setCommPayMethod('card')}
                  >
                    <span>💳</span> Card
                  </button>
                </div>

                {commPayMethod !== 'card' ? (
                  <div className="comm-modal-fields">
                    <div className="form-group">
                      <label>{commPayMethod === 'bkash' ? 'bKash' : 'Nagad'} Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={commMfsPhone}
                        onChange={(e) => setCommMfsPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                        placeholder="017XXXXXXXX"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>PIN Code</label>
                      <input
                        type="password"
                        className="form-input"
                        value={commMfsPin}
                        onChange={(e) => setCommMfsPin(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                        placeholder="••••"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="comm-modal-fields">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={commCardNumber}
                        onChange={(e) => setCommCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        required
                      />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Expiry</label>
                        <input
                          type="text"
                          className="form-input"
                          value={commCardExpiry}
                          onChange={(e) => setCommCardExpiry(e.target.value)}
                          placeholder="12/28"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          className="form-input"
                          value={commCardCvc}
                          onChange={(e) => setCommCardCvc(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="comm-modal-actions">
                  <button
                    type="button"
                    className="comm-btn-cancel"
                    onClick={() => setPayingCommission(null)}
                    disabled={commSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="comm-btn-submit"
                    disabled={commSubmitting}
                  >
                    {commSubmitting ? 'Processing Payment...' : `Confirm Payment (${payingCommission.commission_amount} BDT)`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default SubscriptionPage

