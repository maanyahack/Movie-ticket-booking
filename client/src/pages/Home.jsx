import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

// Home page — our first real route. For now a placeholder;
// it will show "now showing" movies once the movie API exists (Step 8+).
export default function Home() {
  const [movies, setMovies] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api('/movies?status=NOW_SHOWING').then(setMovies).catch(e => setError(e.message)) }, [])
  return (
    <div>
      <p className="eyebrow">MOVIE NIGHTS, SORTED</p>
      <h1 className="page-title">Find your next cinema night.</h1>
      <p className="tagline">
        Book movie tickets in a few clicks — pick your cinema, your show, and
        your seat.
      </p>
      <Link to="/movies" className="btn">
        Browse Movies
      </Link>
      <h2 className="section-title">Now showing</h2>
      {error && <p className="notice">{error}</p>}
      <section className="movie-grid">
        {movies.slice(0, 4).map(movie => <Link className="movie-card" to={`/movies/${movie.id}`} key={movie.id}>
          <img src={movie.poster_url || 'https://placehold.co/400x600/181c2f/ffffff?text=CineVerse'} alt={`${movie.title} poster`} />
          <div className="movie-card-content"><h2>{movie.title}</h2><p>★ {movie.rating || 'New'} · {movie.language}</p></div>
        </Link>)}
      </section>
    </div>
  )
}
