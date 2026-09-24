// Ticket.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full ticket view page — /bookings/:id
//
// What this page does:
//  1. Fetches the booking: GET /api/bookings/:id
//  2. Shows the complete ticket card (like a real movie ticket)
//  3. Shows the QR code
//  4. Has a "Cancel Booking" button (only if status is CONFIRMED)
//
// The ticket design:
//   • Header: movie poster + title + status
//   • Body: grid of info (cinema, date, seats, amount)
//   • Dashed perforated line
//   • QR code section
//
// Cancellation flow:
//   POST /api/bookings/:id/cancel
//   → Backend validates (e.g., must be before showtime)
//   → Returns success
//   → UI updates status to CANCELLED locally (no need to re-fetch)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Ticket() {
  // Get booking ID from URL: /bookings/abc123 → id = "abc123"
  const { id } = useParams()

  const [ticket, setTicket]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  // Fetch booking data when component mounts or id changes
  useEffect(() => {
    api(`/bookings/${id}`)
      .then(data => setTicket(data))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // ── Cancel booking ─────────────────────────────────────────────────────────
  async function cancelBooking() {
    // window.confirm shows a native browser confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This cannot be undone.'
    )
    if (!confirmed) return

    setCancelling(true)
    try {
      // POST /api/bookings/:id/cancel
      // Backend checks: user owns this booking, show hasn't started yet, etc.
      await api(`/bookings/${id}/cancel`, { method: 'POST' })

      // Update the local state — no need to re-fetch the whole ticket
      setTicket(prev => ({ ...prev, status: 'CANCELLED' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  // ── Format date ─────────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    return new Date(`${dateStr}T00:00`).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  // ── Format time ─────────────────────────────────────────────────────────────
  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // ── Status class ─────────────────────────────────────────────────────────────
  function statusClass(status) {
    switch (status) {
      case 'CONFIRMED':  return 'status-badge status-confirmed'
      case 'CANCELLED':  return 'status-badge status-cancelled'
      default:           return 'status-badge status-pending'
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading your ticket...</p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <p className="notice">⚠️ {error}</p>
        <Link to="/bookings" className="btn-outline">← Back to My Bookings</Link>
      </div>
    )
  }

  return (
    <div className="ticket-page">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="breadcrumb" style={{ marginBottom: 24 }}>
        <Link to="/bookings">My Bookings</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Ticket</span>
      </nav>

      <p className="eyebrow">Your Movie Ticket</p>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {ticket.movie_title}
      </h1>

      {/* ── Ticket Card ─────────────────────────────────────────────────── */}
      <div className="ticket-card">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="ticket-header">
          {/* Small movie poster */}
          <img
            className="ticket-poster"
            src={ticket.poster_url || 'https://placehold.co/160x224/161929/ffffff?text=🎬'}
            alt={`${ticket.movie_title} poster`}
          />

          {/* Movie title + status */}
          <div>
            <p className="eyebrow">Movie Ticket</p>
            <h2 className="ticket-movie-title">{ticket.movie_title}</h2>
            {/* Status badge */}
            <span className={statusClass(ticket.status)}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* ── Body: ticket info grid ──────────────────────────────────── */}
        <div className="ticket-body">

          {/* Cinema */}
          <div className="ticket-field">
            <span className="ticket-field-label">Cinema</span>
            <span className="ticket-field-value">{ticket.cinema_name}</span>
          </div>

          {/* Screen */}
          <div className="ticket-field">
            <span className="ticket-field-label">Screen</span>
            <span className="ticket-field-value">{ticket.screen_name}</span>
          </div>

          {/* Date */}
          <div className="ticket-field">
            <span className="ticket-field-label">Date</span>
            <span className="ticket-field-value">{formatDate(ticket.show_date)}</span>
          </div>

          {/* Time */}
          <div className="ticket-field">
            <span className="ticket-field-label">Show Time</span>
            <span className="ticket-field-value">{formatTime(ticket.start_time)}</span>
          </div>

          {/* Seats */}
          <div className="ticket-field">
            <span className="ticket-field-label">Seats</span>
            <span className="ticket-field-value">
              {Array.isArray(ticket.seats) ? ticket.seats.join(', ') : ticket.seats}
            </span>
          </div>

          {/* Total amount */}
          <div className="ticket-field">
            <span className="ticket-field-label">Amount Paid</span>
            <span className="ticket-field-value" style={{ color: 'var(--accent)', fontSize: 18 }}>
              ₹{ticket.total_amount}
            </span>
          </div>

        </div>

        {/* ── Perforated line ────────────────────────────────────────── */}
        {/* This dashed border looks like a real ticket tear line */}
        <hr className="ticket-perforated" />

        {/* ── QR Code section ────────────────────────────────────────── */}
        <div className="ticket-qr-section">
          {/* QR code image — backend generated it using the qrcode package */}
          {ticket.ticket_qr ? (
            <div className="ticket-qr">
              <img src={ticket.ticket_qr} alt="Ticket QR code" />
            </div>
          ) : (
            <div className="ticket-qr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                QR not available
              </span>
            </div>
          )}

          {/* Booking ID + instructions */}
          <div>
            <p className="ticket-field-label" style={{ marginBottom: 6 }}>Booking ID</p>
            <p className="ticket-booking-id">{ticket.id}</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10, maxWidth: '30ch' }}>
              Show this QR code at the cinema entrance. Valid for entry only once.
            </p>
          </div>
        </div>

      </div>

      {/* ── Error message ──────────────────────────────────────────────── */}
      {error && <p className="notice" style={{ marginTop: 16 }}>⚠️ {error}</p>}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/bookings" className="btn-outline">← All Bookings</Link>

        {/* Cancel button — only shown for CONFIRMED bookings */}
        {ticket.status === 'CONFIRMED' && (
          <button
            className="btn-danger"
            onClick={cancelBooking}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : '✕ Cancel Booking'}
          </button>
        )}
      </div>

      {/* Note about cancellation */}
      {ticket.status === 'CONFIRMED' && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
          ℹ️ Cancellations may be subject to fees. Refund timelines depend on your bank.
        </p>
      )}
    </div>
  )
}
