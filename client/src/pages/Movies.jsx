// Movies.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The full movie listing page — /movies
//
// Features:
//  • Search movies by title (debounced — waits 300ms after typing stops)
//  • Filter by genre, language, and status
//  • Responsive card grid
//
// Debouncing explained:
//   Without debounce: every single keystroke fires an API call.
//   With debounce:    we wait until the user STOPS typing for 300ms,
//                     then fire ONE call. This reduces server load.
//   We achieve this using setTimeout + clearTimeout in useEffect.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Movies() {
  const [movies, setMovies]     = useState([])    // array of movie objects
  const [search, setSearch]     = useState('')    // text in the search box
  const [genre, setGenre]       = useState('')    // selected genre filter
  const [language, setLanguage] = useState('')    // selected language filter
  const [status, setStatus]     = useState('NOW_SHOWING')  // status filter
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  // ── Debounced search ──────────────────────────────────────────────────────
  // This useEffect re-runs whenever search, genre, language, or status changes.
  // It waits 300ms before making the API call (debounce).
  useEffect(() => {
    setLoading(true)

    // Set a 300ms timer — if any filter changes before 300ms, this timer gets cancelled
    const timer = setTimeout(async () => {
      try {
        // Build query string from all current filter values
        // encodeURIComponent() makes special characters URL-safe (e.g. spaces → %20)
        const query = new URLSearchParams({
          search,
          genre,
          language,
          status
        }).toString()

        const data = await api(`/movies?${query}`)
        setMovies(data)
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 300)  // wait 300ms

    // Cleanup: if filters change before 300ms is up, cancel the previous timer
    return () => clearTimeout(timer)
  }, [search, genre, language, status])  // re-run when any of these change

  return (
    <>
      {/* ── Page heading ──────────────────────────────────────────────── */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">In Theatres & Coming Soon</p>
          <h1 className="page-title">Movies</h1>
        </div>

        {/* Search bar — wraps the input with a search icon */}
        <div className="search-wrap">
          {/* Search icon (SVG) */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search movies..."
            value={search}
            // Update search state on every keystroke — the debounce is in useEffect
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Filter dropdowns ──────────────────────────────────────────── */}
      <div className="filters">

        {/* Genre filter */}
        <select
          className="filter-select"
          value={genre}
          onChange={e => setGenre(e.target.value)}
        >
          <option value="">All genres</option>
          <option>Action</option>
          <option>Drama</option>
          <option>Comedy</option>
          <option>Sci-Fi</option>
          <option>Thriller</option>
          <option>Horror</option>
          <option>Romance</option>
          <option>Adventure</option>
          <option>Animation</option>
        </select>

        {/* Language filter */}
        <select
          className="filter-select"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          <option>Hindi</option>
          <option>English</option>
          <option>Tamil</option>
          <option>Telugu</option>
          <option>Kannada</option>
          <option>Malayalam</option>
        </select>

        {/* Status filter */}
        <select
          className="filter-select"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="NOW_SHOWING">Now Showing</option>
          <option value="COMING_SOON">Coming Soon</option>
          <option value="">All</option>
        </select>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <p className="notice">
          ⚠️ {error} — Make sure the backend is running at port 5000.
        </p>
      )}

      {/* ── Loading spinner ───────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading movies...</p>
        </div>
      ) : (
        /* ── Movie grid ─────────────────────────────────────────────── */
        <section className="movie-grid">
          {movies.map(movie => (
            <Link
              key={movie.id}
              className="movie-card"
              to={`/movies/${movie.id}`}
            >
              {/* Poster with status badge */}
              <div style={{ position: 'relative' }}>
                <img
                  src={movie.poster_url || 'https://placehold.co/400x600/161929/ffffff?text=🎬'}
                  alt={`${movie.title} poster`}
                  loading="lazy"
                />
                {/* Badge changes color based on status */}
                <span className={`movie-card-badge ${
                  movie.status === 'NOW_SHOWING' ? 'badge-showing' : 'badge-soon'
                }`}>
                  {movie.status === 'NOW_SHOWING' ? 'Now Showing' : 'Coming Soon'}
                </span>
              </div>

              {/* Card text */}
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

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {/* Only show if: loading is done, no error, and array is empty */}
      {!loading && !error && movies.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No movies found</h3>
          <p>Try adjusting your search or filters to find something.</p>
        </div>
      )}
    </>
  )
}
