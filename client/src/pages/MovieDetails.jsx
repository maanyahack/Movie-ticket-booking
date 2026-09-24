import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function MovieDetails() {
  const { id } = useParams(); const [movie, setMovie] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api(`/movies/${id}`).then(setMovie).catch(e => setError(e.message)) }, [id])
  if (error) return <p className="notice">{error}</p>; if (!movie) return <p className="tagline">Loading movie...</p>
  return <article className="movie-detail"><img src={movie.poster_url || 'https://placehold.co/400x600/181c2f/ffffff?text=CineVerse'} alt={`${movie.title} poster`} /><div><p className="eyebrow">{movie.status.replace('_', ' ')}</p><h1 className="page-title">{movie.title}</h1><p className="meta">★ {movie.rating || 'New'} · {movie.duration} min · {movie.language} · {movie.genre}</p><p className="description">{movie.description}</p><p><b>Director:</b> {movie.director || 'To be announced'}</p><p><b>Cast:</b> {movie.cast_members || 'To be announced'}</p><Link className="btn book-button" to={`/select-show/${movie.id}`}>Book tickets</Link></div></article>
}
