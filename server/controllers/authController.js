import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

function tokenFor(user) { return jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' }) }
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email, and a 6-character password are required' })
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role', [name, email.toLowerCase(), hash])
    res.status(201).json({ user: rows[0], token: tokenFor(rows[0]) })
  } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'An account with that email already exists' }); next(error) }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email?.toLowerCase()])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ message: 'Incorrect email or password' })
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: tokenFor(user) })
  } catch (error) { next(error) }
}
export async function me(req, res, next) { try { const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]); res.json(rows[0]) } catch (error) { next(error) } }
