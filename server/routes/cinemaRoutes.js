import { Router } from 'express'
import pool from '../db/pool.js'
const router = Router()
router.get('/', async (_req, res, next) => { try { const { rows } = await pool.query('SELECT * FROM cinemas ORDER BY name'); res.json(rows) } catch (e) { next(e) } })
export default router
