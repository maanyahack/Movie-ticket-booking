import Razorpay from 'razorpay'
import QRCode from 'qrcode'
import pool from '../db/pool.js'
import { validPaymentSignature } from '../utils/paymentSignature.js'

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.'), { status: 503 })
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
}

const priceColumn = { REGULAR: 'regular_price', PREMIUM: 'premium_price', VIP: 'vip_price' }

export async function createOrder(req, res, next) {
  const { showId, seatIds } = req.body
  if (!showId || !Array.isArray(seatIds) || !seatIds.length) return res.status(400).json({ message: 'Show and seats are required' })
  let razorpay
  try { razorpay = getRazorpayClient() } catch (error) { return next(error) }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: locked } = await client.query('SELECT seat_id FROM seat_locks WHERE show_id=$1 AND user_id=$2 AND expires_at > NOW() AND seat_id = ANY($3::uuid[]) FOR UPDATE', [showId, req.user.id, seatIds])
    if (locked.length !== seatIds.length) throw Object.assign(new Error('Your seat lock expired. Please select seats again.'), { status: 409 })
    const { rows: prices } = await client.query('SELECT s.seat_type, sh.regular_price, sh.premium_price, sh.vip_price FROM seats s JOIN shows sh ON sh.id=$1 AND sh.screen_id=s.screen_id WHERE s.id = ANY($2::uuid[])', [showId, seatIds])
    if (prices.length !== seatIds.length) throw Object.assign(new Error('Invalid seats'), { status: 400 })
    const { rows: activeBooking } = await client.query(`SELECT b.id FROM bookings b
      JOIN booking_seat_locks bsl ON bsl.booking_id=b.id
      JOIN seat_locks sl ON sl.show_id=b.show_id AND sl.seat_id=bsl.seat_id
      WHERE b.user_id=$1 AND b.show_id=$2 AND b.status='PENDING' AND sl.user_id=$1 AND sl.expires_at > NOW()
      LIMIT 1`, [req.user.id, showId])
    if (activeBooking[0]) throw Object.assign(new Error('You already have an active checkout for these seats'), { status: 409 })
    const amount = prices.reduce((sum, seat) => sum + seat[priceColumn[seat.seat_type]], 0) + 40
    const { rows: [booking] } = await client.query("INSERT INTO bookings (user_id, show_id, status, total_amount) VALUES ($1,$2,'PENDING',$3) RETURNING id", [req.user.id, showId, amount])
    for (const seatId of seatIds) await client.query('INSERT INTO booking_seat_locks (booking_id, seat_id) VALUES ($1,$2)', [booking.id, seatId])
    const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: booking.id.slice(0, 32) })
    await client.query('INSERT INTO payments (booking_id, razorpay_order_id, amount) VALUES ($1,$2,$3)', [booking.id, order.id, amount])
    await client.query('COMMIT')
    res.status(201).json({ bookingId: booking.id, orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
}

export async function verifyPayment(req, res, next) {
  const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body
  try { getRazorpayClient() } catch (error) { return next(error) }
  if (!validPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) return res.status(400).json({ message: 'Payment signature verification failed' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [payment] } = await client.query('SELECT p.*, b.show_id, b.status FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.booking_id=$1 AND b.user_id=$2 FOR UPDATE', [bookingId, req.user.id])
    if (!payment || payment.razorpay_order_id !== razorpay_order_id) throw Object.assign(new Error('Payment does not match this booking'), { status: 400 })
    if (payment.status === 'CAPTURED') { await client.query('COMMIT'); return res.json({ bookingId, ticketQr: await QRCode.toDataURL(`CINEVERSE:${bookingId}`) }) }
    const { rows: locks } = await client.query(`SELECT sl.seat_id FROM seat_locks sl JOIN booking_seat_locks bsl ON bsl.seat_id=sl.seat_id
      WHERE bsl.booking_id=$1 AND sl.show_id=$2 AND sl.user_id=$3 AND sl.expires_at > NOW()`, [bookingId, payment.show_id, req.user.id])
    const { rows: expectedSeats } = await client.query('SELECT seat_id FROM booking_seat_locks WHERE booking_id=$1', [bookingId])
    if (!locks.length || locks.length !== expectedSeats.length) throw Object.assign(new Error('Seat lock expired before payment verification. Contact support if you were charged.'), { status: 409 })
    for (const lock of locks) await client.query('INSERT INTO booking_seats (booking_id, show_id, seat_id) VALUES ($1,$2,$3)', [bookingId, payment.show_id, lock.seat_id])
    await client.query("UPDATE bookings SET status='CONFIRMED' WHERE id=$1", [bookingId])
    await client.query("UPDATE payments SET razorpay_payment_id=$1, status='CAPTURED' WHERE booking_id=$2", [razorpay_payment_id, bookingId])
    await client.query('DELETE FROM seat_locks WHERE show_id=$1 AND user_id=$2 AND seat_id IN (SELECT seat_id FROM booking_seat_locks WHERE booking_id=$3)', [payment.show_id, req.user.id, bookingId])
    await client.query('DELETE FROM booking_seat_locks WHERE booking_id=$1', [bookingId])
    await client.query('COMMIT')
    res.json({ bookingId, ticketQr: await QRCode.toDataURL(`CINEVERSE:${bookingId}`) })
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') error.status = 409; next(error) } finally { client.release() }
}
