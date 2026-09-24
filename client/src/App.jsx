// App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The ROOT component — the entry point of our React app.
//
// It does two things:
//  1. Renders the Navbar (shared on every page)
//  2. Defines the routing table using React Router <Routes>
//
// How routing works:
//   The user visits /movies → React Router looks at the path
//   → finds the Route with path="/movies" → renders <Movies /> component
//   → The page NEVER reloads — this is what makes it a SPA (Single Page App)
//
// Note on layout:
//   We moved the .page wrapper INTO each page component.
//   This gives individual pages control over their own top margin.
//   The Home page's hero needs to start right below the navbar (no padding).
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom'

// Shared components
import Navbar from './components/Navbar.jsx'

// Pages — each file exports one default component
import Home          from './pages/Home.jsx'
import Movies        from './pages/Movies.jsx'
import MovieDetails  from './pages/MovieDetails.jsx'
import Auth          from './pages/Auth.jsx'
import ShowSelection from './pages/ShowSelection.jsx'
import Seats         from './pages/Seats.jsx'
import Checkout      from './pages/Checkout.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import Bookings      from './pages/Bookings.jsx'
import Ticket        from './pages/Ticket.jsx'
import Admin         from './pages/Admin.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'

export default function App() {
  return (
    // React fragments (<>) let us return two elements (Navbar + main) without
    // wrapping them in an extra <div> that would affect CSS layout
    <>
      {/* Navbar is outside <Routes> so it shows on every page */}
      <Navbar />

      {/*
        <Routes> looks at the current URL and renders only the matching <Route>.
        Only ONE route renders at a time — the first one that matches the URL.
      */}
      <Routes>

        {/* Public pages — anyone can visit these */}
        <Route path="/"                      element={<Home />} />
        <Route path="/movies"                element={<main className="page"><Movies /></main>} />
        <Route path="/movies/:id"            element={<main className="page"><MovieDetails /></main>} />
        <Route path="/login"                 element={<Auth mode="login" />} />
        <Route path="/register"              element={<Auth mode="register" />} />
  <Route path="/forgot-password"        element={<ForgotPassword />} />
  <Route path="/reset-password"         element={<ResetPassword />} />

        {/* Booking flow — requires login (enforced in each page component) */}
        <Route path="/select-show/:movieId"  element={<main className="page"><ShowSelection /></main>} />
        <Route path="/seats/:showId"         element={<main className="page"><Seats /></main>} />
        <Route path="/checkout"              element={<main className="page"><Checkout /></main>} />
        <Route path="/booking-success/:bookingId" element={<main className="page"><BookingSuccess /></main>} />

        {/* User account pages */}
        <Route path="/bookings"              element={<main className="page"><Bookings /></main>} />
        <Route path="/bookings/:id"          element={<main className="page"><Ticket /></main>} />

        {/* Admin — route is accessible, but Admin.jsx redirects if not admin */}
        <Route path="/admin"                 element={<main className="page"><Admin /></main>} />

        {/*
          Catch-all: if no route matches, show a 404 message.
          The * wildcard matches any URL not matched above.
        */}
        <Route path="*" element={
          <main className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
            <h1 className="page-title">404 — Page Not Found</h1>
            <p className="tagline">The page you're looking for doesn't exist.</p>
            <a className="btn" href="/">Go Home</a>
          </main>
        } />
      </Routes>
    </>
  )
}
