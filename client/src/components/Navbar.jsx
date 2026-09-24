import { Link, useNavigate } from 'react-router-dom'

// Shared navbar shown on every page (rendered once in App.jsx).
// <Link> instead of <a> = navigate without a full page reload.
export default function Navbar() {
  const navigate = useNavigate()
  const loggedIn = Boolean(localStorage.getItem('token'))
  const token = localStorage.getItem('token')
  let isAdmin = false
  try { isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'ADMIN' : false } catch { isAdmin = false }
  function logout() { localStorage.removeItem('token'); navigate('/') }
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        🎬 CineVerse
      </Link>
      <nav className="navbar-links">
        <Link to="/movies">Movies</Link>
        <Link to="/bookings">My Bookings</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
        {loggedIn ? <button className="nav-button" onClick={logout}>Logout</button> : <><Link to="/login">Login</Link><Link to="/register" className="btn navbar-cta">Register</Link></>}
      </nav>
    </header>
  )
}
