// Seats.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive seat selection page — /seats/:showId
//
// What this page does:
//  1. Fetches all seats for the show: GET /api/shows/:showId/seats
//  2. Groups seats by row_label (A, B, C...)
//  3. Shows an interactive color-coded seat grid
//  4. User clicks available seats to select/deselect them
//  5. Shows a booking summary with price calculation
//  6. On "Proceed to Checkout", calls POST /api/shows/:showId/lock
//     → This temporarily reserves the seats for 10 minutes in the database
//  7. Saves selected seat info to sessionStorage and navigates to /checkout
//
// Seat statuses (from backend):
//   AVAILABLE — user can select
//   BOOKED    — already confirmed by another user, cannot select
//   LOCKED    — temporarily reserved (another user at checkout), cannot select
//
// Seat types: REGULAR, PREMIUM, VIP (different prices per show)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Seats() {
  // Get showId from URL: /seats/12 → showId = "12"
  const { showId } = useParams()
  const navigate   = useNavigate()

  const [seats, setSeats]       = useState([])    // all seat objects for this show
  const [show, setShow]         = useState(null)  // show info (prices, time, movie name)
  const [selected, setSelected] = useState([])    // array of selected seat IDs
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [locking, setLocking]   = useState(false) // true while lock API is called

  // Fetch seat data when component mounts
  useEffect(() => {
    async function fetchSeats() {
      try {
        // Fetch seats and show info at the same time
        const [seatsData, showData] = await Promise.all([
          api(`/shows/${showId}/seats`),
          api(`/shows/${showId}`)
        ])
        setSeats(seatsData)
        setShow(showData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSeats()
  }, [showId])

  // ── Toggle seat selection ──────────────────────────────────────────────────
  // Called when user clicks a seat button
  function toggleSeat(seat) {
    // Ignore clicks on booked/locked seats
    if (seat.status !== 'AVAILABLE') return

    setSelected(current => {
      if (current.includes(seat.id)) {
        // If already selected → deselect (remove from array)
        return current.filter(id => id !== seat.id)
      } else {
        // If not selected → select (add to array)
        return [...current, seat.id]
      }
    })
  }

  // ── Calculate total price ─────────────────────────────────────────────────
  // Iterates over selected seats and sums up price based on seat_type
  function calculateTotal() {
    if (!show) return 0
    return selected.reduce((total, seatId) => {
      // Find the seat object by ID
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return total
      // Pick the right price based on seat type
      const price = seat.seat_type === 'VIP'     ? Number(show.vip_price) :
                    seat.seat_type === 'PREMIUM'  ? Number(show.premium_price) :
                                                    Number(show.regular_price)
      return total + price
    }, 0)
  }

  // Convenience fee (10% of subtotal, minimum ₹30)
  const subtotal = calculateTotal()
  const convenienceFee = Math.max(Math.round(subtotal * 0.1), selected.length > 0 ? 30 : 0)
  const total = subtotal + convenienceFee

  // ── Lock seats and proceed to checkout ────────────────────────────────────
  async function proceedToCheckout() {
    // Guard: user must be logged in
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    setLocking(true)
    setError('')

    try {
      // POST /api/shows/:showId/lock
      // Body: { seatIds: [1, 3, 7] }
      // Backend: checks availability → creates seat_lock records → returns success
      await api(`/shows/${showId}/lock`, {
        method: 'POST',
        body: JSON.stringify({ seatIds: selected })
      })

      // Save checkout data to sessionStorage so Checkout page can read it
      // We use sessionStorage (not localStorage) because this is temporary data
      // It auto-clears when the browser tab is closed
      const selectedSeatObjects = seats.filter(s => selected.includes(s.id))
      const checkoutData = {
        showId,
        seatIds: selected,
        // Human-readable labels: ["A3", "A4", "B2"]
        seatLabels: selectedSeatObjects.map(s => `${s.row_label}${s.seat_number}`),
        seatTypes:  selectedSeatObjects.map(s => s.seat_type),
        subtotal,
        convenienceFee,
        total,
        // Show info for the checkout summary
        movieTitle: show?.movie_title,
        cinemaName: show?.cinema_name,
        showDate:   show?.show_date,
        startTime:  show?.start_time
      }
      sessionStorage.setItem('checkout', JSON.stringify(checkoutData))

      // Navigate to the checkout page
      navigate('/checkout')
    } catch (err) {
      // If seats were just taken by someone else, show the error
      setError(err.message)
      // Refresh seat availability so user sees updated seat states
      const refreshed = await api(`/shows/${showId}/seats`).catch(() => seats)
      setSeats(refreshed)
      // Clear the selection (some seats may now be unavailable)
      setSelected([])
    } finally {
      setLocking(false)
    }
  }

  // ── Group seats by row ─────────────────────────────────────────────────────
  // Convert flat array to: { A: [seat1, seat2], B: [seat3, seat4], ... }
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = []
    acc[seat.row_label].push(seat)
    return acc
  }, {})

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort()

  // ── Determine CSS class for a seat ────────────────────────────────────────
  function seatClass(seat) {
    const classes = ['seat']
    // Add status class: available, booked, or locked
    if (selected.includes(seat.id)) {
      classes.push('selected')
    } else {
      classes.push(seat.status.toLowerCase())  // 'available', 'booked', 'locked'
    }
    // Add seat type class for different colors: premium, vip
    if (seat.seat_type !== 'REGULAR') {
      classes.push(seat.seat_type.toLowerCase())
    }
    return classes.join(' ')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading seats...</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p className="eyebrow">Seat Selection</p>
        <h1 className="page-title">
          {show?.movie_title || 'Pick your seats'}
        </h1>
        {show && (
          <div className="meta" style={{ justifyContent: 'center' }}>
            <span>🏟 {show.cinema_name}</span>
            <span>·</span>
            <span>📺 {show.screen_name}</span>
            <span>·</span>
            <span>📅 {new Date(`${show.show_date}T00:00`).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}</span>
            <span>·</span>
            <span>🕐 {show.start_time?.slice(0, 5)}</span>
          </div>
        )}
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && <p className="notice">⚠️ {error} — Please re-select seats.</p>}

      {/* ── Screen bar ──────────────────────────────────────────────────── */}
      {/* The "SCREEN" label at the top of the seat grid */}
      <div className="screen-bar">▬▬▬▬▬▬  SCREEN  ▬▬▬▬▬▬</div>

      {/* ── Seat grid ───────────────────────────────────────────────────── */}
      <div className="seat-grid">
        {sortedRows.map(rowLabel => {
          const rowSeats = seatsByRow[rowLabel].sort(
            (a, b) => a.seat_number - b.seat_number  // sort seats within row numerically
          )
          // Find the middle index to insert an aisle gap
          const midpoint = Math.ceil(rowSeats.length / 2)

          return (
            <div key={rowLabel} className="seat-row">
              {/* Row label: A, B, C... */}
              <span className="row-label">{rowLabel}</span>

              {/* Left half of seats */}
              {rowSeats.slice(0, midpoint).map(seat => (
                <button
                  key={seat.id}
                  className={seatClass(seat)}
                  onClick={() => toggleSeat(seat)}
                  disabled={seat.status !== 'AVAILABLE'}
                  title={`${rowLabel}${seat.seat_number} · ${seat.seat_type}`}
                  aria-label={`Row ${rowLabel} Seat ${seat.seat_number} — ${seat.status}`}
                >
                  {seat.seat_number}
                </button>
              ))}

              {/* Aisle gap in the middle */}
              <div className="seat-aisle" />

              {/* Right half of seats */}
              {rowSeats.slice(midpoint).map(seat => (
                <button
                  key={seat.id}
                  className={seatClass(seat)}
                  onClick={() => toggleSeat(seat)}
                  disabled={seat.status !== 'AVAILABLE'}
                  title={`${rowLabel}${seat.seat_number} · ${seat.seat_type}`}
                  aria-label={`Row ${rowLabel} Seat ${seat.seat_number} — ${seat.status}`}
                >
                  {seat.seat_number}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Seat legend ─────────────────────────────────────────────────── */}
      {/* Tells the user what each seat color means */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background:'#1a2e22', border:'1.5px solid #2d5a3d' }} />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background:'var(--accent)' }} />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background:'#1c1e2e', border:'1.5px solid #2a2f45' }} />
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background:'#2a1f0a', border:'1.5px solid #5a4010' }} />
          <span>Locked</span>
        </div>
        {/* Only show VIP legend if there are VIP seats */}
        {seats.some(s => s.seat_type === 'VIP') && (
          <div className="legend-item">
            <div className="legend-dot" style={{ background:'#1a1600', border:'1.5px solid #8a6a10' }} />
            <span>VIP</span>
          </div>
        )}
        {seats.some(s => s.seat_type === 'PREMIUM') && (
          <div className="legend-item">
            <div className="legend-dot" style={{ background:'#1a1428', border:'1.5px solid #7c5cbf' }} />
            <span>Premium</span>
          </div>
        )}
      </div>

      {/* ── Booking summary panel ────────────────────────────────────────── */}
      <div className="booking-summary">
        <h3>Booking Summary</h3>

        {/* Show selected seat labels or placeholder */}
        <div className="summary-row">
          <span>Selected Seats</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {selected.length > 0
              ? seats.filter(s => selected.includes(s.id)).map(s => `${s.row_label}${s.seat_number}`).join(', ')
              : 'None'}
          </span>
        </div>

        {/* Seat count and subtotal */}
        {selected.length > 0 && (
          <div className="summary-row">
            <span>{selected.length} ticket{selected.length > 1 ? 's' : ''}</span>
            <span>₹{subtotal}</span>
          </div>
        )}

        {/* Convenience fee */}
        {selected.length > 0 && (
          <div className="summary-row">
            <span>Convenience Fee</span>
            <span>₹{convenienceFee}</span>
          </div>
        )}

        <hr className="summary-divider" />

        {/* Total */}
        <div className="summary-row summary-total">
          <span>Total Amount</span>
          <span>₹{total}</span>
        </div>

        {/* Proceed to Checkout button */}
        <button
          className="btn"
          disabled={selected.length === 0 || locking}
          onClick={proceedToCheckout}
          style={{ width: '100%', marginTop: 16, padding: '14px', fontSize: '15px' }}
        >
          {locking ? 'Locking seats...' : `Proceed to Checkout →`}
        </button>

        {/* Helper text */}
        {selected.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>
            Click on available seats to select them
          </p>
        )}
      </div>
    </>
  )
}
