// Auth.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Handles BOTH Login and Register — the `mode` prop switches between them.
//
// Login flow:
//   User fills email + password
//   → POST /api/auth/login
//   → Backend verifies password with bcrypt
//   → Backend returns { token, user }
//   → We store token in localStorage
//   → Redirect to /movies
//
// Register flow:
//   User fills name + email + password
//   → POST /api/auth/register
//   → Backend hashes password with bcrypt, stores in DB
//   → Backend returns { token, user }  (auto-login after register)
//   → We store token in localStorage
//   → Redirect to /movies
//
// BUG FIX: Old code redirected register to /movies but didn't persist the
//           user state properly. Now we do window.location.href for a hard
//           reload so the Navbar re-reads localStorage and shows Logout button.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Auth({ mode }) {
  // `mode` is either "login" or "register" — passed from App.jsx routes
  const isRegister = mode === 'register'

  // Form state — holds the values of all inputs
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const [error, setError]   = useState('')    // error message to show user
  const [loading, setLoading] = useState(false) // true while API call is in progress

  // ── Handle form submission ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()  // prevent default browser form submission (page reload)
    setError('')         // clear any previous error
    setLoading(true)

    try {
      // Call the correct endpoint based on mode
      // POST /api/auth/register  or  POST /api/auth/login
      const endpoint = isRegister ? '/auth/register' : '/auth/login'

      const result = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(form)  // send form data as JSON
      })

      // Store the JWT token in localStorage
      // This token will be sent with every future protected API request
      localStorage.setItem('token', result.token)

      // Hard reload to home — this forces the Navbar to re-read localStorage
      // and show the correct logged-in state (Logout button instead of Login)
      window.location.href = '/movies'

    } catch (err) {
      // Show the error message from the backend (e.g., "Email already registered")
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Helper: update a single field in the form object ──────────────────────
  // Using spread operator: { ...form, [field]: value }
  // Example: setField('email', 'user@gmail.com')
  //   → form becomes { name: '', email: 'user@gmail.com', password: '' }
  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    // Center the card vertically on the page
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Logo / Icon ─────────────────────────────────────────────── */}
        <div className="auth-logo">🎬</div>

        {/* ── Title ───────────────────────────────────────────────────── */}
        <h1 className="auth-title">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="auth-subtitle">
          {isRegister
            ? 'Sign up to book movie tickets in seconds'
            : 'Log in to your CineVerse account'}
        </p>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Name field — only shown on Register */}
          {isRegister && (
            <div className="form-field">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                className="form-input"
                type="text"
                placeholder="John Doe"
                required
                autoComplete="name"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>
          )}

          {/* Email field */}
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
            />
          </div>

          {/* Password field */}
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder={isRegister ? 'Minimum 6 characters' : 'Enter your password'}
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={e => setField('password', e.target.value)}
            />
          </div>

          {/* Error message from API (e.g., wrong password) */}
          {error && <p className="form-error">⚠️ {error}</p>}

          {/* Submit button */}
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: 4 }}
          >
            {loading
              ? 'Please wait...'
              : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
        {!isRegister && <p className="auth-help"><Link to="/forgot-password">Forgot password?</Link></p>}

        {/* ── Switch between Login / Register ─────────────────────────── */}
        <p className="auth-switch">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Login' : 'Register for free'}
          </Link>
        </p>
      </div>
    </div>
  )
}
