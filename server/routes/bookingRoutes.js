import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import QRCode from 'qrcode'
const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT b.*, m.title AS movie_title, m.poster_url, c.name AS cinema_name, sh.show_date, sh.start_time,
      COALESCE(array_agg(s.row_label || s.seat_number::text) FILTER (WHERE s.id IS NOT NULL), '{}') AS seats
      FROM bookings b JOIN shows sh ON sh.id=b.show_id JOIN movies m ON m.id=sh.movie_id JOIN cinemas c ON c.id=sh.cinema_id
      LEFT JOIN booking_seats bs ON bs.booking_id=b.id LEFT JOIN seats s ON s.id=bs.seat_id
      WHERE b.user_id=$1 GROUP BY b.id, m.title, m.poster_url, c.name, sh.show_date, sh.start_time ORDER BY b.created_at DESC`, [req.user.id])
    res.json(rows)
  } catch (error) { next(error) }
})
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT b.*, m.title AS movie_title, m.poster_url, c.name AS cinema_name, sc.name AS screen_name, sh.show_date, sh.start_time,
      array_agg(s.row_label || s.seat_number::text ORDER BY s.row_label, s.seat_number) AS seats
      FROM bookings b JOIN shows sh ON sh.id=b.show_id JOIN movies m ON m.id=sh.movie_id JOIN cinemas c ON c.id=sh.cinema_id JOIN screens sc ON sc.id=sh.screen_id
      JOIN booking_seats bs ON bs.booking_id=b.id JOIN seats s ON s.id=bs.seat_id
      WHERE b.id=$1 AND b.user_id=$2 GROUP BY b.id,m.title,m.poster_url,c.name,sc.name,sh.show_date,sh.start_time`, [req.params.id, req.user.id])
    if (!rows[0]) return res.status(404).json({ message: 'Booking not found' })
    res.json({ ...rows[0], ticket_qr: await QRCode.toDataURL(`CINEVERSE:${rows[0].id}`) })
  } catch (error) { next(error) }
})
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(`UPDATE bookings b SET status='CANCELLED' FROM shows sh
      WHERE b.id=$1 AND b.user_id=$2 AND b.status='CONFIRMED' AND sh.id=b.show_id
      AND (sh.show_date + sh.start_time) > NOW() RETURNING b.id`, [req.params.id, req.user.id])
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Only your upcoming confirmed bookings can be cancelled' }) }
    await client.query('DELETE FROM booking_seats WHERE booking_id=$1', [req.params.id])
    await client.query('DELETE FROM seat_locks WHERE show_id=(SELECT show_id FROM bookings WHERE id=$1) AND user_id=$2', [req.params.id, req.user.id])
    await client.query('COMMIT')
    res.json({ message: 'Booking cancelled. Refund handling can be added next.' })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
})
export default router
