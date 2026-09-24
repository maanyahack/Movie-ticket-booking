import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const token = searchParams.get('token') || ''

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return <section className="auth-card"><h1 className="auth-title">Invalid reset link</h1><p className="form-error">This link is missing its reset token.</p><p className="auth-switch"><Link to="/forgot-password">Request a new link</Link></p></section>

  return (
    <section className="auth-card">
      <div className="auth-logo">🎬</div>
      <h1 className="auth-title">Create a new password</h1>
      <p className="auth-subtitle">Choose a password with at least 6 characters.</p>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-field">
          <label className="form-label" htmlFor="new-password">New Password</label>
          <input id="new-password" className="form-input" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
          <input id="confirm-password" className="form-input" type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} />
        </div>
        {error && <p className="form-error">⚠️ {error}</p>}
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>{loading ? 'Updating password...' : 'Update password'}</button>
      </form>
    </section>
  )
}
