import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setResetLink('')
    try {
      const result = await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setMessage(result.message)
      if (result.resetLink) setResetLink(result.resetLink)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-logo">🎬</div>
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-subtitle">Enter your account email to continue.</p>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-field">
          <label className="form-label" htmlFor="reset-email">Email Address</label>
          <input id="reset-email" className="form-input" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
        </div>
        {error && <p className="form-error">⚠️ {error}</p>}
        {message && <p className="form-success">{message}</p>}
        {resetLink && <p className="reset-link"><Link to={`/reset-password?token=${encodeURIComponent(new URL(resetLink).searchParams.get('token') || '')}`}>Open password reset</Link></p>}
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>{loading ? 'Preparing reset...' : 'Send reset link'}</button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to login</Link></p>
    </section>
  )
}
