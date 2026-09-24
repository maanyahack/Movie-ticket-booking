export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }) }
export function errorHandler(error, _req, res, _next) {
  console.error(error)
  if (error.code === '23505') return res.status(409).json({ message: 'That record already exists or the seat was just taken' })
  if (error.code === '23503') return res.status(400).json({ message: 'This record is still used by another record' })
  const status = error.status || 500
  res.status(status).json({ message: status >= 500 && status !== 503 ? 'Internal server error' : error.message || 'Request failed' })
}
