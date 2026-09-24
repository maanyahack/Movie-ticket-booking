// Bookings.jsx
// ─────────────────────────────────────────────────────────────────────────────
// My Bookings page — /bookings
// Shows all bookings for the currently logged-in user.
//
// Data flow:
//   React mounts → useEffect → GET /api/bookings (with JWT token in header)
//   → Backend reads userId from JWT → queries DB for that user's bookings
//   → Returns array of booking objects with movie title, seats, etc.
//   → React renders a card for each booking
//
// Clicking a booking card → navigates to /bookings/:id (Ticket page)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)
  const navigate                = useNavigate()

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    async function fetchBookings() {
      try {
        // GET /api/bookings — protected route, requires Authorization header
        // The api() function automatically adds the Bearer token from localStorage
        const data = await api('/bookings')
        setBookings(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [navigate])

  // ── Format date nicely ────────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(`${dateStr}T00:00`).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  // ── Format time from 24hr to 12hr ─────────────────────────────────────────
  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // ── Status badge CSS class ────────────────────────────────────────────────
  function statusClass(status) {
    switch (status) {
      case 'CONFIRMED':  return 'status-badge status-confirmed'
      case 'CANCELLED':  return 'status-badge status-cancelled'
      default:           return 'status-badge status-pending'
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading your bookings...</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow">Your Account</p>
        <h1 className="page-title">My Bookings</h1>
        <p className="tagline">All your movie ticket bookings in one place.</p>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && <p className="notice">⚠️ {error}</p>}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!error && bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>No bookings yet</h3>
          <p>
            You haven't booked any tickets yet. Browse movies and book your first show!
          </p>
          <Link to="/movies" className="btn">Browse Movies</Link>
        </div>
      )}

      {/* ── Bookings list ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bookings.map(booking => (
          // The whole card is a link — clicking anywhere opens the ticket
          <Link
            key={booking.id}
            to={`/bookings/${booking.id}`}
            className="booking-card"
          >
            {/* Small movie poster thumbnail */}
            <img
              className="booking-poster"
              src={booking.poster_url || 'https://placehold.co/100x140/161929/ffffff?text=🎬'}
              alt={`${booking.movie_title} poster`}
            />

            {/* Booking info */}
            <div className="booking-info">
              {/* Movie title */}
              <div className="booking-title">{booking.movie_title}</div>

              {/* Cinema, date, time */}
              <div className="booking-meta">
                🏟 {booking.cinema_name}
                {booking.show_date && (
                  <> · 📅 {formatDate(booking.show_date)}</>
                )}
                {booking.start_time && (
                  <> · 🕐 {formatTime(booking.start_time)}</>
                )}
              </div>

              {/* Seats */}
              <div className="booking-meta" style={{ marginTop: 4 }}>
                🎟 Seats: {Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}
                {' · '}💰 ₹{booking.total_amount}
              </div>
            </div>

            {/* Status badge */}
            <span className={statusClass(booking.status)}>
              {booking.status}
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
