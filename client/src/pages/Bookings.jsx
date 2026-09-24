import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
export default function Bookings() { const [bookings, setBookings] = useState([]); const [error, setError] = useState(''); useEffect(() => { api('/bookings').then(setBookings).catch(e => setError(e.message)) }, []); return <><h1 className="page-title">My bookings</h1>{error && <p className="notice">{error}</p>}<div className="show-list">{bookings.map(b => <Link to={`/bookings/${b.id}`} className="card show-card" key={b.id}><div><h2>{b.movie_title}</h2><p className="tagline">{b.cinema_name} · {b.seats.join(', ')} · ₹{b.total_amount}</p></div><b>{b.status}</b></Link>)}</div></> }
