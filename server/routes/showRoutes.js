import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/authMiddleware.js'
const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { movieId, date } = req.query
    if (!movieId) return res.status(400).json({ message: 'movieId is required' })
    const { rows } = await pool.query(`SELECT s.*, c.name AS cinema_name, sc.name AS screen_name
      FROM shows s JOIN cinemas c ON c.id = s.cinema_id JOIN screens sc ON sc.id = s.screen_id
      WHERE s.movie_id = $1 AND ($2::date IS NULL OR s.show_date = $2::date) ORDER BY s.show_date, s.start_time`, [movieId, date || null])
    res.json(rows)
  } catch (error) { next(error) }
})

router.get('/:showId', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT sh.*, m.title AS movie_title,
      c.name AS cinema_name, sc.name AS screen_name
      FROM shows sh
      JOIN movies m ON m.id = sh.movie_id
      JOIN cinemas c ON c.id = sh.cinema_id
      JOIN screens sc ON sc.id = sh.screen_id
      WHERE sh.id = $1`, [req.params.showId])
    if (!rows[0]) return res.status(404).json({ message: 'Show not found' })
    res.json(rows[0])
  } catch (error) { next(error) }
})

router.get('/:showId/seats', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT s.id, s.row_label, s.seat_number, s.seat_type,
      CASE WHEN bs.id IS NOT NULL THEN 'BOOKED' WHEN sl.id IS NOT NULL THEN 'LOCKED' ELSE 'AVAILABLE' END AS status
      FROM seats s JOIN shows sh ON sh.screen_id = s.screen_id
      LEFT JOIN booking_seats bs ON bs.seat_id = s.id AND bs.show_id = sh.id
      LEFT JOIN seat_locks sl ON sl.seat_id = s.id AND sl.show_id = sh.id AND sl.expires_at > NOW()
      WHERE sh.id = $1 ORDER BY s.row_label, s.seat_number`, [req.params.showId])
    res.json(rows)
  } catch (error) { next(error) }
})
router.post('/:showId/lock', requireAuth, async (req, res, next) => {
  const { seatIds } = req.body
  if (!Array.isArray(seatIds) || !seatIds.length) return res.status(400).json({ message: 'Choose at least one seat' })
  if (new Set(seatIds).size !== seatIds.length) return res.status(400).json({ message: 'A seat can only be selected once' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM seat_locks WHERE expires_at <= NOW()')
    const { rows: show } = await client.query('SELECT screen_id FROM shows WHERE id=$1', [req.params.showId])
    if (!show[0]) throw Object.assign(new Error('Show not found'), { status: 404 })
    const { rows: validSeats } = await client.query('SELECT id FROM seats WHERE screen_id=$1 AND id = ANY($2::uuid[])', [show[0].screen_id, seatIds])
    if (validSeats.length !== seatIds.length) throw Object.assign(new Error('One or more seats do not belong to this show'), { status: 400 })
    for (const seatId of seatIds) {
      const booked = await client.query('SELECT 1 FROM booking_seats WHERE show_id=$1 AND seat_id=$2', [req.params.showId, seatId])
      if (booked.rowCount) throw Object.assign(new Error('One of these seats was just booked'), { status: 409 })
      await client.query("INSERT INTO seat_locks (user_id, show_id, seat_id, expires_at) VALUES ($1,$2,$3,NOW() + interval '10 minutes')", [req.user.id, req.params.showId, seatId])
    }
    await client.query('COMMIT'); res.status(201).json({ message: 'Seats locked for 10 minutes' })
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return res.status(409).json({ message: 'One of these seats is currently locked' }); next(error) } finally { client.release() }
})
export default router
