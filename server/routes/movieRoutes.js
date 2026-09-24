import { Router } from 'express'
import { getMovie, listMovies } from '../controllers/movieController.js'
const router = Router()
router.get('/', listMovies); router.get('/:id', getMovie)
export default router
