// Checkout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Payment checkout page — /checkout
//
// What this page does:
//  1. Reads locked seat info from sessionStorage (saved by Seats.jsx)
//  2. Shows a 10-minute countdown timer (display only — backend controls real expiry)
//  3. On "Pay Now":
//     a. Calls POST /api/payments/create-order → gets a Razorpay order_id
//     b. Opens the Razorpay payment popup
//     c. On payment success: calls POST /api/payments/verify (backend verifies signature)
//     d. On success: navigates to /booking-success/:bookingId
//     e. On failure/cancel: shows error, keeps user on this page
//
// IMPORTANT: The timer here is ONLY for display.
//   The real lock expiry is stored in the database (seat_locks.locked_until).
//   Even if the user's browser freezes, the backend knows when the lock expires.
//
// Razorpay flow:
//   create-order → get order_id → open Razorpay popup → user pays →
//   Razorpay calls handler with payment_id, order_id, signature →
//   we send these 3 values to our backend for verification →
//   backend verifies using HMAC-SHA256 → if valid, confirms booking
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'

// Load Razorpay's JavaScript SDK dynamically (only when needed)
// This avoids loading a heavy script on pages that don't use it
function loadRazorpayScript() {
  return new Promise(resolve => {
    // If already loaded, resolve immediately
    if (window.Razorpay) return resolve(true)

    // Create a <script> tag and append it to <body>
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)   // script loaded successfully
    script.onerror = () => resolve(false)  // script failed to load
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const navigate = useNavigate()

  // Read checkout data from sessionStorage
  // Seats.jsx saves this before navigating here
  const checkout = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('checkout') || 'null')
    } catch {
      return null
    }
  })()

  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // ── Countdown timer ────────────────────────────────────────────────────────
  // The seats are locked for 10 minutes. We show a countdown to the user.
  // REMINDER: this is display only — the database has the real expiry time.

  const LOCK_DURATION = 10 * 60  // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(LOCK_DURATION)
  const timerRef = useRef(null)  // useRef stores the timer ID without causing re-renders

  useEffect(() => {
    // Start a countdown that ticks every second
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)  // stop when it reaches 0
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup: clear the interval when component unmounts (user navigates away)
    return () => clearInterval(timerRef.current)
  }, [])

  // Format seconds as MM:SS (e.g., 543 → "09:03")
  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  // Timer is "urgent" (red) when less than 2 minutes remain
  const isUrgent = timeLeft < 120

  // ── Guard: no checkout data ───────────────────────────────────────────────
  if (!checkout) {
    return (
      <div className="checkout-wrap">
        <div className="notice">
          ⚠️ No seats found. Please go back and select seats first.
        </div>
        <Link to="/movies" className="btn-outline" style={{ marginTop: 12 }}>
          ← Browse Movies
        </Link>
      </div>
    )
  }

  // ── Guard: timer expired ──────────────────────────────────────────────────
  if (timeLeft === 0) {
    return (
      <div className="checkout-wrap">
        <div className="notice">
          ⏰ Your seat lock has expired. Please select seats again.
        </div>
        <Link to="/movies" className="btn" style={{ marginTop: 12 }}>
          Start Over
        </Link>
      </div>
    )
  }

  // ── Handle payment ────────────────────────────────────────────────────────
  async function handlePayment() {
    setError('')
    setLoading(true)

    try {
      // STEP 1: Create a Razorpay order on our backend
      // Our backend: verifies seat locks → calls Razorpay API → returns order_id
      const order = await api('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(checkout)
      })
      // `order` contains: { orderId, amount, currency, key, bookingId }

      // STEP 2: Load Razorpay script if not already loaded
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay. Check your internet connection.')
      }

      // STEP 3: Open the Razorpay payment popup
      new window.Razorpay({
        key:         order.key,        // Razorpay public key (safe to expose)
        amount:      order.amount,     // amount in paise (₹440 = 44000 paise)
        currency:    order.currency,   // "INR"
        name:        'CineVerse',
        description: `${checkout.movieTitle} — ${checkout.seatLabels.join(', ')}`,
        order_id:    order.orderId,    // from Razorpay API
        theme:       { color: '#e63946' },  // match our brand color

        // STEP 4: This function is called when payment SUCCEEDS
        handler: async (response) => {
          try {
            // STEP 5: Verify payment on our backend (CRITICAL)
            // We send the 3 Razorpay values to backend for cryptographic verification
            // Backend: verifies HMAC signature → confirms booking → returns bookingId
            const result = await api('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                bookingId:           order.bookingId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature
              })
            })

            // STEP 6: Clean up and navigate to success page
            sessionStorage.removeItem('checkout')
            // Save QR code for the success page
            if (result.ticketQr) {
              sessionStorage.setItem('ticketQr', result.ticketQr)
            }

            navigate(`/booking-success/${result.bookingId}`)

          } catch (verifyErr) {
            setError(`Payment verification failed: ${verifyErr.message}`)
            setLoading(false)
          }
        },

        // Called when user clicks the X or closes the popup
        modal: {
          ondismiss: () => {
            setLoading(false)  // re-enable the pay button
          }
        }
      }).open()

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="checkout-wrap">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="breadcrumb" style={{ marginBottom: 24 }}>
        <Link to="/movies">Movies</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Checkout</span>
      </nav>

      <div className="checkout-card">
        <p className="eyebrow">Secure Checkout</p>
        <h1 className="page-title" style={{ fontSize: 24, marginBottom: 20 }}>
          Confirm Your Booking
        </h1>

        {/* ── Countdown timer ─────────────────────────────────────────── */}
        <div className={`countdown ${isUrgent ? 'urgent' : ''}`}>
          <span>⏰</span>
          <span>Seats reserved for: {formatTime(timeLeft)}</span>
        </div>

        {/* ── Booking details card ─────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '20px',
          marginBottom: 24
        }}>
          {/* Movie & show info */}
          {checkout.movieTitle && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                {checkout.movieTitle}
              </p>
              {checkout.cinemaName && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  🏟 {checkout.cinemaName}
                  {checkout.showDate && ` · 📅 ${new Date(`${checkout.showDate}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  {checkout.startTime && ` · 🕐 ${checkout.startTime.slice(0, 5)}`}
                </p>
              )}
            </div>
          )}

          <hr className="summary-divider" />

          {/* Selected seats */}
          <div className="summary-row">
            <span>Seats</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {checkout.seatLabels.join(', ')}
            </span>
          </div>

          {/* Subtotal */}
          <div className="summary-row">
            <span>{checkout.seatLabels.length} ticket{checkout.seatLabels.length > 1 ? 's' : ''}</span>
            <span>₹{checkout.subtotal}</span>
          </div>

          {/* Convenience fee */}
          <div className="summary-row">
            <span>Convenience Fee</span>
            <span>₹{checkout.convenienceFee}</span>
          </div>

          <hr className="summary-divider" />

          {/* Total */}
          <div className="summary-row summary-total">
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>₹{checkout.total}</span>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && <p className="notice">⚠️ {error}</p>}

        {/* ── Pay button ──────────────────────────────────────────────── */}
        <button
          className="btn"
          onClick={handlePayment}
          disabled={loading}
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
        >
          {loading ? '⏳ Opening payment...' : `🔒 Pay ₹${checkout.total} with Razorpay`}
        </button>

        {/* Security note */}
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
          🔐 100% secure payment · Powered by Razorpay
        </p>
      </div>
    </div>
  )
}
