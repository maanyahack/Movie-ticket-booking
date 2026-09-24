import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL even when this Express server runs locally.
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
})
export default pool
