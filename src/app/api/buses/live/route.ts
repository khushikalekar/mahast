import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gpsProvider, bootstrapGPS } from "@/lib/gps-provider";
import { ensureReady } from "@/lib/init";

// GET /api/buses/live — all active bus locations
export async function GET(req: NextRequest) {
  await ensureReady();

  const locations = gpsProvider.getAllLocations();

  // Enrich with bus/route info
  const enriched = await Promise.all(
    locations.map(async (loc) => {
      const trip = await db.execute({
        sql: `SELECT t.id, t.bus_id, t.route_id, t.status, t.delay_minutes,
                     b.bus_number, b.bus_type,
                     r.route_number, r.name as route_name, r.origin, r.destination
              FROM trips t
              JOIN buses b ON t.bus_id = b.id
              JOIN routes r ON t.route_id = r.id
              WHERE t.id = ?`,
        args: [loc.tripId],
      });
      const t = trip.rows[0];
      if (!t) return null;
      return { ...loc, busNumber: t.bus_number, busType: t.bus_type, routeNumber: t.route_number, routeName: t.route_name, origin: t.origin, destination: t.destination };
    })
  );

  return NextResponse.json({ locations: enriched.filter(Boolean), isSimulated: true });
}
