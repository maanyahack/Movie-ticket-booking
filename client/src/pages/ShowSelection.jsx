import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'
export default function ShowSelection() {
  const { movieId } = useParams(); const [shows, setShows] = useState([]); const [cinema,setCinema]=useState(''); const [date,setDate]=useState(''); const [error, setError] = useState('')
  useEffect(() => { api(`/shows?movieId=${movieId}`).then(setShows).catch(e => setError(e.message)) }, [movieId])
  if (error) return <p className="notice">{error}</p>
  const cinemas=[...new Set(shows.map(s=>s.cinema_name))],dates=[...new Set(shows.map(s=>s.show_date))],visible=shows.filter(s=>(!cinema||s.cinema_name===cinema)&&(!date||s.show_date===date))
  return <><p className="eyebrow">CHOOSE YOUR SHOW</p><h1 className="page-title">Available showtimes</h1><div className="filters"><select value={cinema} onChange={e=>setCinema(e.target.value)}><option value="">All cinemas</option>{cinemas.map(x=><option key={x}>{x}</option>)}</select><select value={date} onChange={e=>setDate(e.target.value)}><option value="">All dates</option>{dates.map(x=><option key={x} value={x}>{new Date(`${x}T00:00`).toLocaleDateString()}</option>)}</select></div><div className="show-list">{visible.map(show => <div className="card show-card" key={show.id}><div><h2>{show.cinema_name}</h2><p className="tagline">{show.screen_name} · {new Date(`${show.show_date}T00:00`).toLocaleDateString()}</p></div><Link className="btn" to={`/seats/${show.id}`}>{show.start_time.slice(0, 5)}</Link></div>)}</div>{!visible.length && <p className="tagline">No shows match your filters.</p>}</>
}
