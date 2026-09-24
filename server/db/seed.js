import 'dotenv/config'
import pool from './pool.js'

const movies = [
  ['Midnight Orbit', 'A resourceful pilot makes one final journey beyond Earth to bring her stranded crew home.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', 'Sci-Fi', 'English', 148, '2026-09-12', 8.4, 'Aisha Menon', 'Maya Rao, Arjun Khanna'],
  ['The Last Frame', 'A young photographer uncovers a secret hidden inside a decades-old portrait.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80', 'Thriller', 'Hindi', 126, '2026-09-19', 7.8, 'Kabir Shah', 'Rhea Kapoor, Vihaan Roy'],
  ['Monsoon Melody', 'Two strangers find friendship, music, and a second chance during one unforgettable rainy season.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80', 'Romance', 'Hindi', 132, '2026-09-05', 8.1, 'Neha Iyer', 'Tara Sen, Aditya Bose']
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const movieIds = []
    for (const movie of movies) {
      const { rows } = await client.query(`INSERT INTO movies (title, description, poster_url, genre, language, duration, release_date, rating, director, cast_members) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING id`, movie)
      if (rows[0]) movieIds.push(rows[0].id)
    }
    const { rows: existing } = await client.query('SELECT id FROM cinemas LIMIT 1')
    let cinemaId = existing[0]?.id
    if (!cinemaId) {
      ({ rows: [{ id: cinemaId }] } = await client.query("INSERT INTO cinemas (name, city, address) VALUES ('CineVerse Plaza', 'Jaipur', 'MI Road, Jaipur') RETURNING id"))
      const { rows: [{ id: screenId }] } = await client.query("INSERT INTO screens (cinema_id, name) VALUES ($1, 'Screen 1') RETURNING id", [cinemaId])
      for (const row of ['A', 'B', 'C', 'D', 'E']) for (let number = 1; number <= 8; number++) await client.query('INSERT INTO seats (screen_id, row_label, seat_number, seat_type) VALUES ($1,$2,$3,$4)', [screenId, row, number, row === 'A' ? 'VIP' : row === 'B' ? 'PREMIUM' : 'REGULAR'])
      const { rows: allMovies } = await client.query('SELECT id FROM movies')
      for (const movie of allMovies) for (const start of ['10:30', '14:30', '19:30']) await client.query("INSERT INTO shows (movie_id, cinema_id, screen_id, show_date, start_time, end_time, regular_price, premium_price, vip_price) VALUES ($1,$2,$3,CURRENT_DATE,$4,($4::time + interval '2 hours 30 minutes'),220,300,400)", [movie.id, cinemaId, screenId, start])
    }
    await client.query('COMMIT'); console.log('Sample movies, cinema, seats, and shows added.')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release(); await pool.end() }
}
seed().catch(error => { console.error(error); process.exit(1) })
