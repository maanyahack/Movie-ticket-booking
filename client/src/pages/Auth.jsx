import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Auth({ mode }) {
  const register = mode === 'register'; const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const navigate = useNavigate()
  async function submit(e) { e.preventDefault(); try { const result = await api(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) }); localStorage.setItem('token', result.token); navigate('/movies') } catch (err) { setError(err.message) } }
  return <section className="auth-card card"><p className="eyebrow">CINEVERSE ACCOUNT</p><h1 className="page-title">{register ? 'Create your account' : 'Welcome back'}</h1><form onSubmit={submit}>{register && <label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}<label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="form-error">{error}</p>}<button className="btn">{register ? 'Register' : 'Login'}</button></form><p className="tagline">{register ? 'Already have an account? ' : 'New here? '}<Link to={register ? '/login' : '/register'}>{register ? 'Login' : 'Register'}</Link></p></section>
}
