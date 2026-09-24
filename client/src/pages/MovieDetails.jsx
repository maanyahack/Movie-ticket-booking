// MovieDetails.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Detailed view of a single movie — /movies/:id
//
// URL parameter: :id  →  useParams() extracts the movie ID from the URL.
// Example: /movies/3  →  id = "3"
//
// What this page does:
//  1. Reads the :id from the URL
//  2. Fetches that movie's data from GET /api/movies/:id
//  3. Displays poster, title, description, cast, rating, trailer
//  4. Shows a "Book Tickets" button that goes to /select-show/:id
//
// The "Book Tickets" button only appears if status is NOW_SHOWING.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'

// Helper: convert a YouTube watch URL to an embeddable URL
// e.g., "https://youtube.com/watch?v=ABC" → "https://youtube.com/embed/ABC"
function toEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const id = u.searchParams.get('v')  // get the "v" query param
    if (id) return `https://www.youtube.com/embed/${id}`
  } catch {
    // If the URL is invalid, return null
  }
  return null
}

export default function MovieDetails() {
  // useParams() reads :id from the route /movies/:id
  const { id } = useParams()

  const [movie, setMovie] = useState(null)  // null = not loaded yet
  const [error, setError] = useState('')

  // Fetch movie data when component mounts or when `id` changes
  useEffect(() => {
    api(`/movies/${id}`)
      .then(data => setMovie(data))
      .catch(err => setError(err.message))
  }, [id])  // re-run if URL changes (e.g., user navigates to another movie)

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <p className="notice">⚠️ {error}</p>
        <Link to="/movies" className="btn-outline">← Back to Movies</Link>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!movie) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading movie...</p>
      </div>
    )
  }

  // Convert trailer URL to YouTube embed format
  const embedUrl = toEmbedUrl(movie.trailer_url)

  // Check if booking is available (only for NOW_SHOWING movies)
  const canBook = movie.status === 'NOW_SHOWING'

  return (
    <article>

      {/* ── Breadcrumb navigation ─────────────────────────────────────── */}
      {/* Shows: Movies > Interstellar — helps user know where they are */}
      <nav className="breadcrumb">
        <Link to="/movies">Movies</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{movie.title}</span>
      </nav>

      {/* ── Two-column layout: poster + info ──────────────────────────── */}
      <div className="movie-detail">

        {/* ── LEFT COLUMN: Poster ─────────────────────────────────────── */}
        <div>
          <img
            className="movie-detail-poster"
            src={movie.poster_url || 'https://placehold.co/400x600/161929/ffffff?text=🎬'}
            alt={`${movie.title} poster`}
          />
        </div>

        {/* ── RIGHT COLUMN: Movie info ─────────────────────────────────── */}
        <div className="movie-detail-info">

          {/* Status label — "NOW SHOWING" or "COMING SOON" */}
          <p className="eyebrow">
            {movie.status.replace(/_/g, ' ')}
          </p>

          {/* Movie title */}
          <h1 className="page-title">{movie.title}</h1>

          {/* Rating badge — "★ 8.4" */}
          {movie.rating && (
            <div className="rating-badge">
              <span>★</span>
              <span>{movie.rating} / 10</span>
            </div>
          )}

          {/* Meta info: duration, language, genre */}
          <div className="meta">
            {movie.duration && <span>⏱ {movie.duration} min</span>}
            {movie.language && <span>🌐 {movie.language}</span>}
            {movie.genre    && <span>🎭 {movie.genre}</span>}
            {movie.release_date && (
              <span>📅 {new Date(movie.release_date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}</span>
            )}
          </div>

          {/* Movie description */}
          <p className="description">{movie.description}</p>

          {/* Director, Cast info rows */}
          <div className="movie-info-grid">
            {movie.director && (
              <div className="movie-info-row">
                <span className="movie-info-label">Director</span>
                <span className="movie-info-value">{movie.director}</span>
              </div>
            )}
            {movie.cast_members && (
              <div className="movie-info-row">
                <span className="movie-info-label">Cast</span>
                <span className="movie-info-value">{movie.cast_members}</span>
              </div>
            )}
          </div>

          {/* ── Book Tickets button ────────────────────────────────────── */}
          {canBook ? (
            <Link className="btn" to={`/select-show/${movie.id}`} style={{ fontSize: '16px', padding: '14px 28px' }}>
              🎟 Book Tickets
            </Link>
          ) : (
            /* Coming soon — disabled look */
            <button className="btn" disabled>
              Coming Soon
            </button>
          )}

          {/* ── Trailer section ────────────────────────────────────────── */}
          {/* Only show if a valid YouTube trailer URL exists */}
          {embedUrl && (
            <div style={{ marginTop: 36 }}>
              <p className="eyebrow" style={{ marginBottom: 12 }}>Official Trailer</p>
              <div className="trailer-wrap">
                {/*
                  iframe embeds the YouTube trailer directly in the page.
                  allow="..." gives it permission to use autoplay, fullscreen etc.
                */}
                <iframe
                  src={embedUrl}
                  title={`${movie.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </article>
  )
}
