import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api.js'
export default function Seats() {
  const { showId } = useParams(); const [seats, setSeats] = useState([]); const [selected, setSelected] = useState([]); const [error, setError] = useState(''); const navigate = useNavigate()
  useEffect(() => { api(`/shows/${showId}/seats`).then(setSeats).catch(e => setError(e.message)) }, [showId])
  function toggle(seat) { if (seat.status !== 'AVAILABLE') return; setSelected(current => current.includes(seat.id) ? current.filter(id => id !== seat.id) : [...current, seat.id]) }
  async function lock() { try { await api(`/shows/${showId}/lock`, { method: 'POST', body: JSON.stringify({ seatIds: selected }) }); sessionStorage.setItem('checkout', JSON.stringify({ showId, seatIds: selected, seatLabels: seats.filter(s => selected.includes(s.id)).map(s => `${s.row_label}${s.seat_number}`) })); navigate('/checkout') } catch (e) { if (e.message.includes('log in')) navigate('/login'); else setError(e.message) } }
  return <><p className="eyebrow">SELECT SEATS</p><h1 className="page-title">Pick your seats</h1>{error && <p className="notice">{error}</p>}<div className="screen">SCREEN</div><div className="seat-grid">{seats.map(seat => <button key={seat.id} onClick={() => toggle(seat)} className={`seat ${seat.status.toLowerCase()} ${selected.includes(seat.id) ? 'selected' : ''}`} disabled={seat.status !== 'AVAILABLE'}>{seat.row_label}{seat.seat_number}</button>)}</div><p className="tagline">Selected: {selected.length ? seats.filter(s => selected.includes(s.id)).map(s => `${s.row_label}${s.seat_number}`).join(', ') : 'None'}</p><button className="btn" disabled={!selected.length} onClick={lock}>Lock seats for checkout</button></>
}
