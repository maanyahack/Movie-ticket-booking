import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Please log in first' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next() }
  catch { return res.status(401).json({ message: 'Your login has expired' }) }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' })
  next()
}
