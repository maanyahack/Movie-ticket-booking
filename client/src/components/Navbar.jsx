// Navbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This component is rendered ONCE in App.jsx and appears on EVERY page.
// It shows the brand logo, navigation links, and auth buttons.
//
// Key concepts used here:
//  • useNavigate()   — programmatic navigation (like pressing a back button)
//  • useLocation()   — tells us the current URL path (so we can highlight the active link)
//  • localStorage    — where we store the JWT token after login
//  • JWT decoding    — we read the "role" from the token to know if user is admin
// ─────────────────────────────────────────────────────────────────────────────

import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate  = useNavigate()   // lets us redirect programmatically
  const location  = useLocation()   // gives us the current URL, e.g. "/movies"

  // Check if the user has a token stored — this tells us if they're logged in
  const token    = localStorage.getItem('token')
  const loggedIn = Boolean(token)

  // Decode the JWT to get the user's role (USER or ADMIN)
  // A JWT looks like: header.payload.signature (3 parts split by ".")
  // The payload is base64-encoded JSON — atob() decodes it
  let isAdmin = false
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))  // decode the middle part
      isAdmin = payload.role === 'ADMIN'
    }
  } catch {
    // If token is malformed, treat user as not admin
    isAdmin = false
  }

  // Logout: remove the token from localStorage, then send user to home page
  function logout() {
    localStorage.removeItem('token')
    navigate('/')  // redirect to home
    // Force a re-render by reloading — because Navbar reads localStorage directly
    window.location.reload()
  }

  // Helper: adds 'active-link' class if the current path matches
  function navClass(path) {
    return location.pathname === path ? 'active-link' : ''
  }

  return (
    // <header> is the correct semantic HTML element for a page header / navbar
    <header className="navbar">

      {/* ── Brand logo ──────────────────────────────────────────── */}
      <Link to="/" className="navbar-brand">
        {/* The 🎬 emoji adds character — <span> makes "Cine" red */}
        🎬 <span>Cine</span>Verse
      </Link>

      {/* ── Navigation links ────────────────────────────────────── */}
      <nav className="navbar-links">

        {/* Link to browse all movies */}
        <Link to="/movies" className={navClass('/movies')}>
          Movies
        </Link>

        {/* Only show "My Bookings" if user is logged in */}
        {loggedIn && (
          <Link to="/bookings" className={navClass('/bookings')}>
            {/* Hide text on very small screens (CSS class hide-mobile) */}
            <span className="hide-mobile">My Bookings</span>
          </Link>
        )}

        {/* Only show "Admin" link if the user has ADMIN role */}
        {isAdmin && (
          <Link to="/admin" className={navClass('/admin')}>
            <span className="admin-badge">Admin</span>
          </Link>
        )}

        {/* ── Auth buttons ──────────────────────────────────────── */}
        {loggedIn ? (
          /* Logged in: show Logout button */
          <button className="nav-button" onClick={logout}>
            Logout
          </button>
        ) : (
          /* Not logged in: show Login link and Register CTA button */
          <>
            <Link to="/login" className={navClass('/login')}>
              Login
            </Link>
            <Link to="/register" className="btn navbar-cta">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
