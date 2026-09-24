import pool from '../db/pool.js'

export async function listMovies(req, res, next) {
  try {
    const { search = '', genre, language, status = 'NOW_SHOWING' } = req.query
    const filters = ['title ILIKE $1']; const values = [`%${search}%`]
    if (genre) { values.push(genre); filters.push(`genre = $${values.length}`) }
    if (language) { values.push(language); filters.push(`language = $${values.length}`) }
    if (status) { values.push(status); filters.push(`status = $${values.length}`) }
    const { rows } = await pool.query(`SELECT * FROM movies WHERE ${filters.join(' AND ')} ORDER BY release_date DESC`, values)
    res.json(rows)
  } catch (error) { next(error) }
}
export async function getMovie(req, res, next) { try { const { rows } = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]); if (!rows[0]) return res.status(404).json({ message: 'Movie not found' }); res.json(rows[0]) } catch (error) { next(error) } }
