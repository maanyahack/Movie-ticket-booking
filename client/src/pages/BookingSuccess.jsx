// BookingSuccess.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Booking confirmation page — /booking-success/:bookingId
//
// This page is shown after a successful payment.
// It is a simple "success" screen with:
//  • Animated checkmark
//  • Booking reference ID
//  • Links to view the ticket or browse more movies
//
// The booking ID is read from the URL parameter (:bookingId).
// ─────────────────────────────────────────────────────────────────────────────

import { Link, useParams } from 'react-router-dom'

export default function BookingSuccess() {
  // Get the booking ID from the URL
  // /booking-success/abc123 → bookingId = "abc123"
  const { bookingId } = useParams()

  return (
    <div className="success-page">

      {/* ── Animated checkmark circle ──────────────────────────────────── */}
      {/* CSS animation "popIn" makes this scale from 0 to 1 on load */}
      <div className="success-icon">
        ✅
      </div>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <h1 className="success-title">Tickets Booked!</h1>
      <p className="success-subtitle">
        Your payment was successful and your seats are confirmed. 🎉
      </p>

      {/* ── Booking reference ID ─────────────────────────────────────── */}
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>
        Booking Reference
      </p>
      <div className="success-booking-id">
        {bookingId}
      </div>

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="success-actions">
        {/* Primary: View the full ticket with QR code */}
        <Link className="btn" to={`/bookings/${bookingId}`}>
          🎟 View Your Ticket
        </Link>

        {/* Secondary: Go to My Bookings page */}
        <Link className="btn-outline" to="/bookings">
          My Bookings
        </Link>
      </div>

      {/* ── Browse more movies ────────────────────────────────────────── */}
      <p style={{ marginTop: 32, fontSize: 14, color: 'var(--text-muted)' }}>
        Want to book more?{' '}
        <Link to="/movies" style={{ color: 'var(--accent)' }}>
          Browse all movies →
        </Link>
      </p>

    </div>
  )
}
