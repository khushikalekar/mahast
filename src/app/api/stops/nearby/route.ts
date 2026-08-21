import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/init";
import { distanceKm } from "@/lib/utils";

interface StopRow {
  id: string;
  name: string;
  name_mr: string;
  name_hi: string;
  latitude: number;
  longitude: number;
  city: string;
}

// GET /api/stops/nearby?lat=&lng=&radius=10
export async function GET(req: NextRequest) {
  await ensureReady();

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "18.5018");
  const lng = parseFloat(searchParams.get("lng") ?? "73.8636");
  const radius = parseFloat(searchParams.get("radius") ?? "15");

  const stopsResult = await db.execute(`SELECT id, name, name_mr, name_hi, latitude, longitude, city FROM stops`);

  const nearby = (stopsResult.rows as unknown as StopRow[])
    .map((s) => {
      const dist = distanceKm(lat, lng, s.latitude, s.longitude);
      return { ...s, distanceKm: Math.round(dist * 10) / 10 };
    })
    .filter((s) => s.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);

  const now = new Date().toISOString();

  // For each nearby stop, find upcoming buses
  const enriched = await Promise.all(
    nearby.map(async (stop) => {
      const busesResult = await db.execute({
        sql: `SELECT DISTINCT t.id as trip_id, b.bus_number, b.bus_type, r.route_number, r.name as route_name,
                     r.origin, r.destination, t.scheduled_departure, t.status, t.delay_minutes
              FROM route_stops rs
              JOIN trips t ON rs.route_id = t.route_id
              JOIN buses b ON t.bus_id = b.id
              JOIN routes r ON t.route_id = r.id
              WHERE rs.stop_id = ?
                AND t.status IN ('scheduled', 'in_progress')
                AND t.scheduled_departure >= ?
              ORDER BY t.scheduled_departure ASC
              LIMIT 4`,
        args: [stop.id, now],
      });

      return {
        stop: { id: stop.id, name: stop.name, nameMr: stop.name_mr, nameHi: stop.name_hi, city: stop.city, latitude: stop.latitude, longitude: stop.longitude },
        distanceKm: stop.distanceKm,
        buses: busesResult.rows.map((b) => ({
          tripId: b.trip_id as string,
          busNumber: b.bus_number as string,
          busType: b.bus_type as string,
          routeNumber: b.route_number as string,
          routeName: b.route_name as string,
          origin: b.origin as string,
          destination: b.destination as string,
          scheduledDeparture: b.scheduled_departure as string,
          status: b.status as string,
          delayMinutes: (b.delay_minutes as number) ?? 0,
        })),
      };
    })
  );

  return NextResponse.json({ nearbyStops: enriched, userLat: lat, userLng: lng });
}
