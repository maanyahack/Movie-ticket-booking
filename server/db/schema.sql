CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE movie_status AS ENUM ('NOW_SHOWING', 'COMING_SOON', 'ENDED');
CREATE TYPE seat_kind AS ENUM ('REGULAR', 'PREMIUM', 'VIP');

CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'USER', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE movies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT NOT NULL, poster_url TEXT, trailer_url TEXT, genre TEXT NOT NULL, language TEXT NOT NULL, duration INTEGER NOT NULL, release_date DATE, rating NUMERIC(2,1), director TEXT, cast_members TEXT, status movie_status NOT NULL DEFAULT 'NOW_SHOWING');
CREATE TABLE cinemas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, city TEXT NOT NULL, address TEXT);
CREATE TABLE screens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE, name TEXT NOT NULL);
CREATE TABLE seats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE, row_label TEXT NOT NULL, seat_number INTEGER NOT NULL, seat_type seat_kind NOT NULL DEFAULT 'REGULAR', UNIQUE(screen_id, row_label, seat_number));
CREATE TABLE shows (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), movie_id UUID NOT NULL REFERENCES movies(id), cinema_id UUID NOT NULL REFERENCES cinemas(id), screen_id UUID NOT NULL REFERENCES screens(id), show_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, regular_price INTEGER NOT NULL, premium_price INTEGER NOT NULL, vip_price INTEGER NOT NULL);
CREATE TABLE bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), show_id UUID NOT NULL REFERENCES shows(id), status TEXT NOT NULL DEFAULT 'PENDING', total_amount INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE booking_seats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE, show_id UUID NOT NULL REFERENCES shows(id), seat_id UUID NOT NULL REFERENCES seats(id), UNIQUE(show_id, seat_id));
CREATE TABLE payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id), razorpay_order_id TEXT UNIQUE, razorpay_payment_id TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'CREATED', amount INTEGER NOT NULL);
CREATE TABLE seat_locks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), show_id UUID NOT NULL REFERENCES shows(id), seat_id UUID NOT NULL REFERENCES seats(id), expires_at TIMESTAMPTZ NOT NULL, UNIQUE(show_id, seat_id));
-- Stores the exact seats that belong to a pending payment. This prevents a later
-- lock by the same user from accidentally being confirmed with an older order.
CREATE TABLE booking_seat_locks (booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE, seat_id UUID NOT NULL REFERENCES seats(id), PRIMARY KEY (booking_id, seat_id));
