// ShowSelection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Cinema and showtime selection page — /select-show/:movieId
//
// What this page does:
//  1. Reads :movieId from the URL
//  2. Fetches all shows for that movie: GET /api/shows?movieId=:movieId
//  3. Groups shows by cinema name
//  4. Shows date filter tabs at the top
//  5. For each cinema, shows the available time slots for that date
//  6. Clicking a time slot navigates to /seats/:showId
//
// Data model:
//   A "show" = one screening = (movie + cinema + screen + date + time)
//   The API returns: show.id, show.cinema_name, show.screen_name,
//                    show.show_date, show.start_time, prices...
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function ShowSelection() {
  // Get movieId from URL: /select-show/5 → movieId = "5"
  const { movieId } = useParams()

  const [shows, setShows]       = useState([])    // all shows for this movie
  const [movie, setMovie]       = useState(null)  // movie info (title, poster)
  const [selectedDate, setSelectedDate] = useState('')  // currently selected date tab
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  // Fetch shows and movie info in parallel when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both simultaneously using Promise.all (faster than sequential)
        const [showsData, movieData] = await Promise.all([
          api(`/shows?movieId=${movieId}`),
          api(`/movies/${movieId}`)
        ])
        setShows(showsData)
        setMovie(movieData)

        // Auto-select the first available date
        if (showsData.length > 0) {
          setSelectedDate(showsData[0].show_date)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [movieId])

  // ── Derived data ───────────────────────────────────────────────────────────
  // Get all unique dates from the shows array (removes duplicates using Set)
  const allDates = [...new Set(shows.map(s => s.show_date))].sort()

  // Filter shows by the selected date
  const showsForDate = shows.filter(s => s.show_date === selectedDate)

  // Group shows by cinema name
  // Result: { "PVR Jaipur": [show1, show2], "INOX City": [show3] }
  const byCinema = showsForDate.reduce((acc, show) => {
    if (!acc[show.cinema_name]) acc[show.cinema_name] = []
    acc[show.cinema_name].push(show)
    return acc
  }, {})

  // ── Format a date string nicely ─────────────────────────────────────────
  // "2026-09-25" → "Fri, 25 Sep"
  function formatDate(dateStr) {
    return new Date(`${dateStr}T00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // ── Format time from 24hr to 12hr ───────────────────────────────────────
  // "19:30:00" → "7:30 PM"
  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12  = hour % 12 || 12  // convert 0 → 12, 13 → 1, etc.
    return `${h12}:${m} ${ampm}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading showtimes...</p>
      </div>
    )
  }

  if (error) return <p className="notice">⚠️ {error}</p>

  return (
    <>
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="breadcrumb">
        <Link to="/movies">Movies</Link>
        <span className="breadcrumb-sep">›</span>
        {movie && <Link to={`/movies/${movieId}`}>{movie.title}</Link>}
        <span className="breadcrumb-sep">›</span>
        <span>Select Show</span>
      </nav>

      {/* ── Page heading ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p className="eyebrow">Choose Your Show</p>
        <h1 className="page-title">
          {movie ? movie.title : 'Available Showtimes'}
        </h1>
        {movie && (
          <div className="meta">
            <span>⏱ {movie.duration} min</span>
            <span>·</span>
            <span>🌐 {movie.language}</span>
            <span>·</span>
            <span>🎭 {movie.genre}</span>
          </div>
        )}
      </div>

      {/* ── Date selection tabs ──────────────────────────────────────────── */}
      {/* Each date is a clickable pill button — selected date is highlighted */}
      <div className="date-tabs">
        {allDates.map(date => (
          <button
            key={date}
            className={`date-tab ${selectedDate === date ? 'active' : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      {/* ── No shows message ─────────────────────────────────────────────── */}
      {Object.keys(byCinema).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>No shows on this date</h3>
          <p>Try selecting a different date above.</p>
        </div>
      ) : (
        /* ── Cinema list ──────────────────────────────────────────────── */
        <div className="show-list">
          {Object.entries(byCinema).map(([cinemaName, cinemaShows]) => (
            <div className="show-card card" key={cinemaName}>
              {/* Cinema info on the left */}
              <div className="show-card-info">
                <h2>{cinemaName}</h2>
                <p>
                  {/* Show screen name(s) */}
                  {[...new Set(cinemaShows.map(s => s.screen_name))].join(', ')}
                  {' · '}
                  {/* Show city if available */}
                  {cinemaShows[0].city || ''}
                </p>
              </div>

              {/* Time slot buttons on the right */}
              <div className="show-times">
                {cinemaShows
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))  // sort by time
                  .map(show => (
                    <Link
                      key={show.id}
                      className="time-btn"
                      to={`/seats/${show.id}`}
                      title={`${cinemaName} · ${show.screen_name} · ₹${show.regular_price}`}
                    >
                      {formatTime(show.start_time)}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
