import { Router } from 'express'
import { createOrder, verifyPayment } from '../controllers/paymentController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
const router = Router()
router.post('/create-order', requireAuth, createOrder)
router.post('/verify', requireAuth, verifyPayment)
export default router
