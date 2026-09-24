import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import MovieDetails from './pages/MovieDetails.jsx'
import Auth from './pages/Auth.jsx'
import ShowSelection from './pages/ShowSelection.jsx'
import Seats from './pages/Seats.jsx'
import Checkout from './pages/Checkout.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import Bookings from './pages/Bookings.jsx'
import Ticket from './pages/Ticket.jsx'
import Admin from './pages/Admin.jsx'

// App.jsx = the routing table of our app.
// Each <Route> maps a URL path to a page component.
// More routes get added here as we build more pages.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/select-show/:movieId" element={<ShowSelection />} />
          <Route path="/seats/:showId" element={<Seats />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<Ticket />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  )
}
