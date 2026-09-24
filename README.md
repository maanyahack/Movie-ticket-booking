# 🎬 Movie Ticket Booking

A full-stack **movie ticket booking** web app — browse movies, pick a cinema and showtime, select seats, pay, and get a QR-coded ticket. (Inspired by BookMyShow's core flow; our own design and code.)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), JavaScript, React Router, plain CSS, fetch() |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Supabase), accessed with the `pg` package + raw SQL |
| Auth | JWT + bcrypt (hand-rolled, no Supabase Auth) |
| Payments | Razorpay (test mode) |
| Tickets | QR codes via the `qrcode` package |

## Project Structure

```
movie-booking/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── context/
│       ├── utils/
│       └── ...
├── server/          # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── db/
│   ├── utils/
│   └── server.js
├── .gitignore
└── README.md
```

## Run locally

```bash
# Backend
cd server
cp .env.example .env        # then fill in real values
npm install
# Run server/db/schema.sql in Supabase SQL Editor, then add demo data:
npm run seed
npm run dev

# Frontend (after Step 2)
cd client
npm install
npm run dev
```

## Build Progress

- [x] Step 1 — Project skeleton (folders, .gitignore, env template)
- [x] Step 2 — React frontend setup (Vite + React Router + dev proxy)
- [x] Step 3 — Express backend setup
- [x] Step 4–7 — PostgreSQL connection, schema, demo data, movie API
- [x] Step 8–11 — React catalogue, movie details, registration and login
- [x] Step 12–18 — Show/seat read APIs and race-safe 10-minute seat locks
- [ ] Step 19 onward — checkout, Razorpay verification, tickets, bookings, admin, security, deployment

## What happens when a seat is locked

React sends selected seat IDs to `POST /api/shows/:showId/lock`. Express starts a PostgreSQL transaction, clears expired locks, checks that no confirmed booking owns a seat, and inserts the locks. The `UNIQUE(show_id, seat_id)` database constraint is the final safeguard: if two people request the same seat, only one insert can succeed. The later payment-confirmation endpoint must use the same transaction and the `booking_seats` unique constraint before marking a booking confirmed.
