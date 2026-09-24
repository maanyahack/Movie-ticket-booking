import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
function loadRazorpay() { return new Promise(resolve => { if (window.Razorpay) return resolve(true); const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script) }) }
export default function Checkout() {
  const navigate = useNavigate(); const checkout = JSON.parse(sessionStorage.getItem('checkout') || 'null'); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  if (!checkout) return <p className="notice">No locked seats found. Choose seats first.</p>
  async function pay() { try { setLoading(true); const order = await api('/payments/create-order', { method: 'POST', body: JSON.stringify(checkout) }); if (!(await loadRazorpay())) throw new Error('Could not load Razorpay')
    new window.Razorpay({ key: order.key, amount: order.amount, currency: order.currency, name: 'CineVerse', description: 'Movie ticket booking', order_id: order.orderId, handler: async response => { try { const result = await api('/payments/verify', { method: 'POST', body: JSON.stringify({ bookingId: order.bookingId, ...response }) }); sessionStorage.removeItem('checkout'); sessionStorage.setItem('ticketQr', result.ticketQr); navigate(`/booking-success/${result.bookingId}`) } catch (e) { setError(e.message); setLoading(false) } }, modal: { ondismiss: () => setLoading(false) }, theme: { color: '#ff4d6d' } }).open()
  } catch (e) { setError(e.message); setLoading(false) } }
  return <section className="checkout card"><p className="eyebrow">CHECKOUT</p><h1 className="page-title">Confirm your booking</h1><p className="tagline">{checkout.seatLabels.join(', ')} · A ₹40 convenience fee is added at payment.</p>{error && <p className="notice">{error}</p>}<button className="btn" onClick={pay} disabled={loading}>{loading ? 'Creating secure order…' : 'Pay securely with Razorpay'}</button></section>
}
