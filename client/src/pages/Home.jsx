// Home.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The landing page of CineVerse.
//
// What this page does:
//  1. Shows a big hero banner with a CTA to browse movies
//  2. Fetches and displays "Now Showing" movies in a grid
//  3. Shows a loading spinner while data is being fetched
//  4. Shows a friendly error if the backend is unreachable
//
// Data flow:
//   React renders → useEffect fires → api('/movies?status=NOW_SHOWING') called
//   → Express handles GET /api/movies → PostgreSQL returns rows
//   → React receives data → setMovies() triggers re-render → grid appears
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Home() {
  // movies: array of movie objects from the database
  const [movies, setMovies] = useState([])

  // error: string message if the API call fails
  const [error, setError] = useState('')

  // loading: true while we're waiting for the API response
  const [loading, setLoading] = useState(true)

  // useEffect: runs after the component first renders (mounts)
  // The [] dependency array means "run this only once"
  useEffect(() => {
    async function fetchMovies() {
      try {
        // Call GET /api/movies?status=NOW_SHOWING
        // The api() function auto-adds the Authorization header if logged in
        const data = await api('/movies?status=NOW_SHOWING')
        setMovies(data)
      } catch (err) {
        // If backend is down or returns an error, show the message
        setError(err.message)
      } finally {
        // Always turn off loading, whether success or failure
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])  // [] = run only once when component mounts

  return (
    <div className="page">

      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      {/* A big full-width banner at the top of the page */}
      <section className="hero">
        <div className="hero-content">
          {/* Small label above the title */}
          <p className="eyebrow">🎬 The best way to book movie tickets</p>

          {/* Main heading — clamp() makes font size responsive */}
          <h1 className="hero-title">
            Your perfect
            <span>cinema night</span>
            starts here.
          </h1>

          {/* Subtitle description */}
          <p className="hero-subtitle">
            Browse now-showing movies, pick your cinema, choose your seat —
            and pay in seconds. No queues. No hassle.
          </p>

          {/* Call-to-action buttons */}
          <div className="hero-actions">
            {/* Primary CTA — takes user to movies page */}
            <Link to="/movies" className="btn">
              Browse Movies →
            </Link>

            {/* Secondary CTA — outline style */}
            <Link to="/register" className="btn-outline">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── NOW SHOWING SECTION ─────────────────────────────────────────── */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">In Cinemas Now</p>
          <h2 className="section-title" style={{ margin: 0 }}>Now Showing</h2>
        </div>
        {/* "See all" link to full movies page */}
        <Link to="/movies" className="btn-outline" style={{ flexShrink: 0 }}>
          See all movies
        </Link>
      </div>

      {/* Show error banner if API failed */}
      {error && (
        <p className="notice">
          ⚠️ Could not load movies — {error}. Make sure the backend server is running.
        </p>
      )}

      {/* Show spinner while loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading movies...</p>
        </div>
      ) : (
        /* Movie grid — shows up to 8 movies */
        <section className="movie-grid">
          {movies.slice(0, 8).map(movie => (
            // Each card is a <Link> so the whole card is clickable
            <Link
              key={movie.id}
              className="movie-card"
              to={`/movies/${movie.id}`}
            >
              {/* ── Movie poster image ── */}
              <div style={{ position: 'relative' }}>
                <img
                  src={movie.poster_url || 'https://placehold.co/400x600/161929/ffffff?text=🎬'}
                  alt={`${movie.title} poster`}
                  loading="lazy"   /* only loads image when it scrolls into view */
                />
                {/* "Now Showing" badge overlaid on poster */}
                <span className="movie-card-badge badge-showing">
                  Now Showing
                </span>
              </div>

              {/* ── Card info below the poster ── */}
              <div className="movie-card-content">
                <h2>{movie.title}</h2>
                <div className="movie-card-meta">
                  <span className="star-icon">★</span>
                  <span>{movie.rating || 'New'}</span>
                  <span>·</span>
                  <span>{movie.language}</span>
                </div>
                <span className="genre-tag">{movie.genre}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Show empty state if no movies are available */}
      {!loading && !error && movies.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>No movies showing right now</h3>
          <p>Check back soon — new movies are added regularly.</p>
          <Link to="/movies" className="btn">Browse All Movies</Link>
        </div>
      )}

    </div>
  )
}
