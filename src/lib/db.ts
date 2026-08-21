/**
 * Database layer using LibSQL (SQLite-compatible, runs in-process).
 * To migrate to a remote Turso database, change the url to your Turso URL
 * and set the authToken from environment variables.
 */
import { createClient } from "@libsql/client";
import path from "path";

const dbPath = path.join(process.cwd(), "mahast.db");

export const db = createClient({
  url: `file:${dbPath}`,
});

export async function initializeDatabase() {
  // Users
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'passenger',
      phone TEXT,
      preferred_language TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Buses
  await db.execute(`
    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      bus_number TEXT UNIQUE NOT NULL,
      registration_number TEXT UNIQUE NOT NULL,
      bus_type TEXT NOT NULL DEFAULT 'ordinary',
      capacity INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'active',
      amenities TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Routes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance_km REAL NOT NULL DEFAULT 0,
      estimated_duration_min INTEGER NOT NULL DEFAULT 0,
      fare_ordinary REAL DEFAULT 0,
      fare_semi_luxury REAL DEFAULT 0,
      fare_luxury REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Stops
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_mr TEXT,
      name_hi TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      city TEXT NOT NULL,
      state TEXT DEFAULT 'Maharashtra',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Route stops (ordered stops on a route)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS route_stops (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      stop_id TEXT NOT NULL REFERENCES stops(id),
      sequence_number INTEGER NOT NULL,
      distance_from_origin_km REAL DEFAULT 0,
      estimated_time_from_origin_min INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Route coordinates (polyline)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS route_coordinates (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    )
  `);

  // Trips (scheduled bus runs)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL REFERENCES buses(id),
      route_id TEXT NOT NULL REFERENCES routes(id),
      scheduled_departure TEXT NOT NULL,
      scheduled_arrival TEXT NOT NULL,
      actual_departure TEXT,
      actual_arrival TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      delay_minutes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Bus locations (GPS snapshots)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bus_locations (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES trips(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed_kmh REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      next_stop_id TEXT REFERENCES stops(id),
      distance_to_next_stop_km REAL DEFAULT 0,
      eta_to_next_stop_min INTEGER DEFAULT 0,
      recorded_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Favourites
  await db.execute(`
    CREATE TABLE IF NOT EXISTS favourites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      label TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Notifications
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      trip_id TEXT REFERENCES trips(id),
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Complaints / problem reports
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      trip_id TEXT REFERENCES trips(id),
      bus_id TEXT REFERENCES buses(id),
      route_id TEXT REFERENCES routes(id),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Feedback / ratings
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      trip_id TEXT NOT NULL REFERENCES trips(id),
      overall_rating INTEGER NOT NULL,
      cleanliness_rating INTEGER,
      punctuality_rating INTEGER,
      bus_condition_rating INTEGER,
      crowding_rating INTEGER,
      safety_rating INTEGER,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Journey shares
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journey_shares (
      id TEXT PRIMARY KEY,
      share_code TEXT UNIQUE NOT NULL,
      trip_id TEXT NOT NULL REFERENCES trips(id),
      user_id TEXT REFERENCES users(id),
      destination_stop_id TEXT REFERENCES stops(id),
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Recent searches
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recent_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      searched_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_bus_locations_trip ON bus_locations(trip_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourites(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)`);
}
