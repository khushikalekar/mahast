import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/init";

export async function GET(req: NextRequest) {
  await ensureReady();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const type = searchParams.get("type");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  // Find routes matching from/to (case-insensitive partial match)
  const routeResult = await db.execute({
    sql: `SELECT r.id, r.route_number, r.name, r.origin, r.destination, r.distance_km,
               r.estimated_duration_min, r.fare_ordinary, r.fare_semi_luxury, r.fare_luxury, r.status
          FROM routes r
          WHERE (LOWER(r.origin) LIKE ? OR LOWER(r.origin) LIKE ?)
            AND (LOWER(r.destination) LIKE ? OR LOWER(r.destination) LIKE ?)
            AND r.status = 'active'`,
    args: [`%${from.toLowerCase()}%`, `%${from.toLowerCase()}%`, `%${to.toLowerCase()}%`, `%${to.toLowerCase()}%`],
  });

  if (routeResult.rows.length === 0) {
    return NextResponse.json({ buses: [] });
  }

  const routeIds = routeResult.rows.map((r) => r.id as string);
  const dateStr = date ?? new Date().toISOString().split("T")[0];

  // Build trips query
  const placeholders = routeIds.map(() => "?").join(",");
  const tripsResult = await db.execute({
    sql: `SELECT t.id, t.bus_id, t.route_id, t.scheduled_departure, t.scheduled_arrival,
               t.status, t.delay_minutes,
               b.bus_number, b.bus_type, b.capacity,
               r.route_number, r.name as route_name, r.origin, r.destination,
               r.fare_ordinary, r.fare_semi_luxury, r.fare_luxury, r.estimated_duration_min
          FROM trips t
          JOIN buses b ON t.bus_id = b.id
          JOIN routes r ON t.route_id = r.id
          WHERE t.route_id IN (${placeholders})
            AND DATE(t.scheduled_departure) = ?
            ${type ? "AND b.bus_type = ?" : ""}
          ORDER BY t.scheduled_departure ASC`,
    args: type ? [...routeIds, dateStr, type] : [...routeIds, dateStr],
  });

  const buses = tripsResult.rows.map((row) => ({
    tripId: row.id,
    busId: row.bus_id,
    busNumber: row.bus_number,
    busType: row.bus_type,
    routeId: row.route_id,
    routeNumber: row.route_number,
    routeName: row.route_name,
    origin: row.origin,
    destination: row.destination,
    scheduledDeparture: row.scheduled_departure,
    scheduledArrival: row.scheduled_arrival,
    durationMin: row.estimated_duration_min,
    status: row.status,
    delayMinutes: row.delay_minutes ?? 0,
    fare: row.bus_type === "luxury" ? row.fare_luxury : row.bus_type === "semi_luxury" ? row.fare_semi_luxury : row.fare_ordinary,
    capacity: row.capacity,
  }));

  return NextResponse.json({ buses, total: buses.length });
}
