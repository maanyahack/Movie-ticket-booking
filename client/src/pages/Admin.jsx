// Admin.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard — /admin
//
// This is a single-page admin panel with tab-based navigation.
// All admin API calls go to /api/admin/... routes which are protected
// by both authMiddleware (must be logged in) AND adminMiddleware (must be ADMIN role).
//
// Tabs:
//   Dashboard  — statistics overview
//   Movies     — add/edit/delete movies
//   Cinemas    — add/edit cinemas
//   Screens    — add screens to cinemas
//   Shows      — create shows (movie + screen + date + time + price)
//   Bookings   — view all bookings
//   Users      — view all users
//
// How tab switching works:
//   setTab('movies') → useEffect sees [tab] changed → calls load() → fetches /admin/movies
//   → setData(result) → renders Table component with new data
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'

// Initial empty movie form state
const EMPTY_MOVIE = {
  title: '', description: '', poster_url: '', trailer_url: '',
  genre: 'Drama', language: 'Hindi', duration: 120,
  release_date: '', rating: 7, director: '', cast_members: '',
  status: 'NOW_SHOWING'
}

export default function Admin() {
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────────────────────────────
  const [tab, setTab]         = useState('dashboard') // active tab
  const [data, setData]       = useState([])          // table rows for current tab
  const [stats, setStats]     = useState(null)        // dashboard stats
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Movie form state
  const [movie, setMovie]     = useState(EMPTY_MOVIE)
  const [editingId, setEditingId] = useState(null)    // null = adding, id = editing

  // Generic form state (for cinemas, screens, shows)
  const [form, setForm]       = useState({})

  // ── Auth check ────────────────────────────────────────────────────────────
  // On mount, verify the user is an ADMIN. If not, redirect away.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') { navigate('/'); return }
    } catch {
      navigate('/login')
    }
  }, [navigate])

  // ── API endpoint map ───────────────────────────────────────────────────────
  // Maps each tab name to its backend endpoint
  const endpoints = {
    movies:   '/admin/movies',
    cinemas:  '/admin/cinemas',
    screens:  '/admin/screens',
    shows:    '/admin/shows',
    bookings: '/admin/bookings',
    users:    '/admin/users',
  }

  // ── Load data for the active tab ───────────────────────────────────────────
  async function loadTab(name = tab) {
    setError('')
    setSuccess('')
    try {
      if (name === 'dashboard') {
        // Fetch aggregate statistics
        const s = await api('/admin/stats')
        setStats(s)
      } else {
        // Fetch rows for the tab (movies, cinemas, etc.)
        const rows = await api(endpoints[name])
        setData(rows)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Re-fetch whenever the user switches tabs
  useEffect(() => { loadTab() }, [tab])

  // ── Movie CRUD ─────────────────────────────────────────────────────────────
  async function saveMovie(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        // PUT = update existing movie
        await api(`/admin/movies/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(movie)
        })
        setSuccess('Movie updated successfully!')
      } else {
        // POST = create new movie
        await api('/admin/movies', {
          method: 'POST',
          body: JSON.stringify(movie)
        })
        setSuccess('Movie added successfully!')
      }
      // Reset form and refresh table
      setMovie(EMPTY_MOVIE)
      setEditingId(null)
      loadTab('movies')
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteMovie(id) {
    if (!window.confirm('Delete this movie permanently?')) return
    try {
      await api(`/admin/movies/${id}`, { method: 'DELETE' })
      setSuccess('Movie deleted.')
      loadTab('movies')
    } catch (err) {
      setError(err.message)
    }
  }

  // Start editing a movie — populate the form with that movie's data
  function startEditMovie(row) {
    setMovie({ ...EMPTY_MOVIE, ...row })
    setEditingId(row.id)
    // Scroll to the form so user can see it
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Generic CRUD (for cinemas, screens, shows) ────────────────────────────
  async function saveForm(e, resource) {
    e.preventDefault()
    setError('')
    try {
      const isEditing = Boolean(form.id)
      await api(isEditing ? `/admin/${resource}/${form.id}` : `/admin/${resource}`, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(form)
      })
      setSuccess(`${resource.slice(0, -1)} saved!`)
      setForm({})
      loadTab(resource)
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteRow(resource, id) {
    if (!window.confirm(`Delete this ${resource.slice(0, -1)}?`)) return
    try {
      await api(`/admin/${resource}/${id}`, { method: 'DELETE' })
      setSuccess('Deleted successfully.')
      loadTab(resource)
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Stat colors — each stat card gets a different accent color ────────────
  const statColors = {
    movies: 'stat-accent', cinemas: 'stat-green',
    shows: 'stat-gold', bookings: 'stat-blue', users: 'stat-green', revenue: 'stat-accent'
  }

  const statIcons = {
    movies: '🎬', cinemas: '🏟', shows: '📅', bookings: '🎟', users: '👥', revenue: '💰'
  }

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p className="eyebrow">Administration</p>
        <h1 className="page-title">CineVerse Dashboard</h1>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <nav className="admin-tabs">
        {['dashboard', 'movies', 'cinemas', 'screens', 'shows', 'bookings', 'users'].map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); setError(''); setSuccess('') }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {/* ── Error / Success banners ──────────────────────────────────────── */}
      {error   && <p className="notice">{error}</p>}
      {success && <p className="notice-success">✅ {success}</p>}

      {/* ════════════════════════════════════════════════════════════════
          DASHBOARD TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && stats && (
        <>
          <div className="stats-grid">
            {Object.entries(stats).map(([key, value]) => (
              <div className="stat-card" key={key}>
                {/* Icon */}
                <span style={{ fontSize: 24 }}>{statIcons[key] || '📊'}</span>
                {/* Big number */}
                <span className={`stat-number ${statColors[key] || ''}`}>
                  {key === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : value}
                </span>
                {/* Label */}
                <span className="stat-label">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MOVIES TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'movies' && (
        <>
          {/* Add / Edit movie form */}
          <div className="admin-section-title">
            {editingId ? '✏️ Edit Movie' : '➕ Add New Movie'}
            {editingId && (
              <button className="btn-outline btn-sm" onClick={() => { setMovie(EMPTY_MOVIE); setEditingId(null) }}>
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={saveMovie}>
            <div className="admin-form card" style={{ marginBottom: 24 }}>

              {/* Two-column grid of fields */}
              <AdminField label="Title" required>
                <input className="admin-input" required value={movie.title}
                  onChange={e => setMovie({ ...movie, title: e.target.value })} />
              </AdminField>

              <AdminField label="Director">
                <input className="admin-input" value={movie.director || ''}
                  onChange={e => setMovie({ ...movie, director: e.target.value })} />
              </AdminField>

              <AdminField label="Genre">
                <select className="admin-input" value={movie.genre}
                  onChange={e => setMovie({ ...movie, genre: e.target.value })}>
                  {['Action','Drama','Comedy','Sci-Fi','Thriller','Horror','Romance','Adventure','Animation'].map(g => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Language">
                <select className="admin-input" value={movie.language}
                  onChange={e => setMovie({ ...movie, language: e.target.value })}>
                  {['Hindi','English','Tamil','Telugu','Kannada','Malayalam'].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Duration (minutes)">
                <input className="admin-input" type="number" value={movie.duration}
                  onChange={e => setMovie({ ...movie, duration: e.target.value })} />
              </AdminField>

              <AdminField label="Rating (1-10)">
                <input className="admin-input" type="number" step="0.1" min="0" max="10"
                  value={movie.rating}
                  onChange={e => setMovie({ ...movie, rating: e.target.value })} />
              </AdminField>

              <AdminField label="Release Date">
                <input className="admin-input" type="date" value={movie.release_date || ''}
                  onChange={e => setMovie({ ...movie, release_date: e.target.value })} />
              </AdminField>

              <AdminField label="Status">
                <select className="admin-input" value={movie.status}
                  onChange={e => setMovie({ ...movie, status: e.target.value })}>
                  <option value="NOW_SHOWING">Now Showing</option>
                  <option value="COMING_SOON">Coming Soon</option>
                  <option value="ENDED">Ended</option>
                </select>
              </AdminField>

              <AdminField label="Poster URL" style={{ gridColumn: '1 / -1' }}>
                <input className="admin-input" type="url" placeholder="https://..."
                  value={movie.poster_url || ''}
                  onChange={e => setMovie({ ...movie, poster_url: e.target.value })} />
              </AdminField>

              <AdminField label="Trailer URL (YouTube)" style={{ gridColumn: '1 / -1' }}>
                <input className="admin-input" type="url" placeholder="https://youtube.com/watch?v=..."
                  value={movie.trailer_url || ''}
                  onChange={e => setMovie({ ...movie, trailer_url: e.target.value })} />
              </AdminField>

              <AdminField label="Cast Members" style={{ gridColumn: '1 / -1' }}>
                <input className="admin-input" placeholder="Actor 1, Actor 2, Actor 3"
                  value={movie.cast_members || ''}
                  onChange={e => setMovie({ ...movie, cast_members: e.target.value })} />
              </AdminField>

              <AdminField label="Description" style={{ gridColumn: '1 / -1' }}>
                <textarea className="admin-input admin-textarea" required
                  value={movie.description}
                  onChange={e => setMovie({ ...movie, description: e.target.value })} />
              </AdminField>

            </div>

            <button className="btn" type="submit" style={{ marginBottom: 32 }}>
              {editingId ? '💾 Save Changes' : '➕ Add Movie'}
            </button>
          </form>

          {/* Movies table */}
          <div className="admin-section-title">All Movies</div>
          <AdminTable
            rows={data}
            onEdit={startEditMovie}
            onDelete={deleteMovie}
          />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CINEMAS TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'cinemas' && (
        <>
          <div className="admin-section-title">➕ Add Cinema</div>
          <form onSubmit={e => saveForm(e, 'cinemas')}>
            <div className="admin-form card" style={{ marginBottom: 24 }}>
              <AdminField label="Cinema Name" required>
                <input className="admin-input" required value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </AdminField>
              <AdminField label="City" required>
                <input className="admin-input" required value={form.city || ''}
                  onChange={e => setForm({ ...form, city: e.target.value })} />
              </AdminField>
              <AdminField label="Address">
                <input className="admin-input" value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </AdminField>
              <AdminField label="Phone">
                <input className="admin-input" type="tel" value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </AdminField>
            </div>
            <button className="btn" type="submit" style={{ marginBottom: 32 }}>
              Add Cinema
            </button>
          </form>
          <div className="admin-section-title">All Cinemas</div>
          <AdminTable rows={data} onEdit={row => setForm(row)} onDelete={id => deleteRow('cinemas', id)} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SCREENS TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'screens' && (
        <>
          <div className="admin-section-title">➕ Add Screen</div>
          <form onSubmit={e => saveForm(e, 'screens')}>
            <div className="admin-form card" style={{ marginBottom: 24 }}>
              <AdminField label="Cinema ID" required>
                <input className="admin-input" required type="number" value={form.cinema_id || ''}
                  placeholder="Enter Cinema ID from the Cinemas tab"
                  onChange={e => setForm({ ...form, cinema_id: e.target.value })} />
              </AdminField>
              <AdminField label="Screen Name" required>
                <input className="admin-input" required value={form.name || ''}
                  placeholder="Screen 1, Screen 2..."
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </AdminField>
              <AdminField label="Total Seats">
                <input className="admin-input" type="number" value={form.total_seats || ''}
                  placeholder="100"
                  onChange={e => setForm({ ...form, total_seats: e.target.value })} />
              </AdminField>
            </div>
            <button className="btn" type="submit" style={{ marginBottom: 32 }}>
              Add Screen
            </button>
          </form>
          <div className="admin-section-title">All Screens</div>
          <AdminTable rows={data} onDelete={id => deleteRow('screens', id)} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SHOWS TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'shows' && (
        <>
          <div className="admin-section-title">➕ Create Show</div>
          <form onSubmit={e => saveForm(e, 'shows')}>
            <div className="admin-form card" style={{ marginBottom: 24 }}>
              <AdminField label="Movie ID" required>
                <input className="admin-input" required type="number" value={form.movie_id || ''}
                  placeholder="Movie ID from Movies tab"
                  onChange={e => setForm({ ...form, movie_id: e.target.value })} />
              </AdminField>
              <AdminField label="Screen ID" required>
                <input className="admin-input" required type="number" value={form.screen_id || ''}
                  placeholder="Screen ID from Screens tab"
                  onChange={e => setForm({ ...form, screen_id: e.target.value })} />
              </AdminField>
              <AdminField label="Show Date" required>
                <input className="admin-input" required type="date" value={form.show_date || ''}
                  onChange={e => setForm({ ...form, show_date: e.target.value })} />
              </AdminField>
              <AdminField label="Start Time" required>
                <input className="admin-input" required type="time" value={form.start_time || ''}
                  onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </AdminField>
              <AdminField label="End Time" required>
                <input className="admin-input" required type="time" value={form.end_time || ''}
                  onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </AdminField>
              <AdminField label="Regular Price (₹)" required>
                <input className="admin-input" required type="number" value={form.regular_price || ''}
                  placeholder="200"
                  onChange={e => setForm({ ...form, regular_price: e.target.value })} />
              </AdminField>
              <AdminField label="Premium Price (₹)">
                <input className="admin-input" type="number" value={form.premium_price || ''}
                  placeholder="350"
                  onChange={e => setForm({ ...form, premium_price: e.target.value })} />
              </AdminField>
              <AdminField label="VIP Price (₹)">
                <input className="admin-input" type="number" value={form.vip_price || ''}
                  placeholder="500"
                  onChange={e => setForm({ ...form, vip_price: e.target.value })} />
              </AdminField>
            </div>
            <button className="btn" type="submit" style={{ marginBottom: 32 }}>
              Create Show
            </button>
          </form>
          <div className="admin-section-title">All Shows</div>
          <AdminTable rows={data} onDelete={id => deleteRow('shows', id)} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          BOOKINGS & USERS TABS — read-only tables
      ════════════════════════════════════════════════════════════════ */}
      {['bookings', 'users'].includes(tab) && (
        <>
          <div className="admin-section-title">
            {tab === 'bookings' ? '🎟 All Bookings' : '👥 All Users'}
          </div>
          <AdminTable rows={data} />
        </>
      )}
    </>
  )
}

// ── AdminField: reusable labeled form field wrapper ─────────────────────────
// Props: label (string), required (bool), style (object), children (the input)
function AdminField({ label, children, style }) {
  return (
    <div className="admin-field" style={style}>
      <label>{label}</label>
      {children}
    </div>
  )
}

// ── AdminTable: reusable data table ─────────────────────────────────────────
// Props:
//   rows     — array of objects to display
//   onEdit   — callback when Edit is clicked (optional)
//   onDelete — callback when Delete is clicked (optional)
function AdminTable({ rows, onEdit, onDelete }) {
  // Empty state
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <h3>No records yet</h3>
        <p>Add your first one using the form above.</p>
      </div>
    )
  }

  // Get column names — filter out big/sensitive fields we don't want to show
  const hidden = ['id', 'poster_url', 'trailer_url', 'description', 'password_hash', 'ticket_qr']
  const keys = Object.keys(rows[0]).filter(k => !hidden.includes(k))

  return (
    <div className="table-wrap" style={{ marginBottom: 40 }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            {keys.map(k => (
              <th key={k}>{k.replace(/_/g, ' ')}</th>
            ))}
            {/* Only show Action column if onEdit or onDelete are provided */}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              {/* ID column */}
              <td style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 11 }}>
                {String(row.id).slice(0, 8)}...
              </td>
              {/* Data columns */}
              {keys.map(k => (
                <td key={k}>
                  {/* If the value is an array (e.g., seats), join with commas */}
                  {Array.isArray(row[k])
                    ? row[k].join(', ')
                    : String(row[k] ?? '—').slice(0, 60)  /* truncate long values */
                  }
                </td>
              ))}
              {/* Action buttons */}
              {(onEdit || onDelete) && (
                <td>
                  {onEdit   && <button className="edit-btn"  onClick={() => onEdit(row)}>Edit</button>}
                  {onDelete && <button className="danger"    onClick={() => onDelete(row.id)}>Delete</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
