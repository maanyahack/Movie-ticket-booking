import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import movieRoutes from './routes/movieRoutes.js'
import showRoutes from './routes/showRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import cinemaRoutes from './routes/cinemaRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))
app.get('/api/health', (_req, res) => res.json({ message: 'CineVerse API is running' }))
app.use('/api/auth', authRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/shows', showRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/cinemas', cinemaRoutes)
app.use('/api/admin', adminRoutes)
app.use(notFound)
app.use(errorHandler)

app.listen(process.env.PORT || 5000, () => console.log(`API running on port ${process.env.PORT || 5000}`))
