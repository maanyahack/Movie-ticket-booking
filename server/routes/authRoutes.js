import { Router } from 'express'
import { login, me, register, requestPasswordReset, resetPassword } from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
const router = Router()
router.post('/register', register); router.post('/login', login); router.post('/forgot-password', requestPasswordReset); router.post('/reset-password', resetPassword); router.get('/me', requireAuth, me)
export default router
