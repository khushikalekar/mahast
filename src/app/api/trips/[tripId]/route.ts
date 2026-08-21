import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gpsProvider } from "@/lib/gps-provider";
import { ensureReady } from "@/lib/init";

// GET /api/trips/[tripId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  await ensureReady();
  const { tripId } = await params;

  const result = await db.execute({
    sql: `SELECT t.id, t.bus_id, t.route_id, t.scheduled_departure, t.scheduled_arrival,
                 t.actual_departure, t.actual_arrival, t.status, t.delay_minutes,
                 b.bus_number, b.registration_number, b.bus_type, b.capacity, b.amenities,
                 r.route_number, r.name as route_name, r.origin, r.destination,
                 r.distance_km, r.estimated_duration_min,
                 r.fare_ordinary, r.fare_semi_luxury, r.fare_luxury
          FROM trips t
          JOIN buses b ON t.bus_id = b.id
          JOIN routes r ON t.route_id = r.id
          WHERE t.id = ?`,
    args: [tripId],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const trip = result.rows[0];

  // Get stops for this route
  const stopsResult = await db.execute({
    sql: `SELECT rs.sequence_number, rs.distance_from_origin_km, rs.estimated_time_from_origin_min,
                 s.id as stop_id, s.name, s.name_mr, s.name_hi, s.latitude, s.longitude, s.city
          FROM route_stops rs
          JOIN stops s ON rs.stop_id = s.id
          WHERE rs.route_id = ?
          ORDER BY rs.sequence_number ASC`,
    args: [trip.route_id as string],
  });

  // Get GPS location
  const location = gpsProvider.getLocation(tripId);

  const fare = trip.bus_type === "luxury" ? trip.fare_luxury : trip.bus_type === "semi_luxury" ? trip.fare_semi_luxury : trip.fare_ordinary;

  return NextResponse.json({
    trip: {
      id: trip.id,
      busId: trip.bus_id,
      busNumber: trip.bus_number,
      registrationNumber: trip.registration_number,
      busType: trip.bus_type,
      capacity: trip.capacity,
      amenities: JSON.parse((trip.amenities as string) ?? "[]"),
      routeId: trip.route_id,
      routeNumber: trip.route_number,
      routeName: trip.route_name,
      origin: trip.origin,
      destination: trip.destination,
      distanceKm: trip.distance_km,
      estimatedDurationMin: trip.estimated_duration_min,
      fare,
      scheduledDeparture: trip.scheduled_departure,
      scheduledArrival: trip.scheduled_arrival,
      actualDeparture: trip.actual_departure,
      actualArrival: trip.actual_arrival,
      status: trip.status,
      delayMinutes: trip.delay_minutes ?? 0,
    },
    stops: stopsResult.rows.map((s) => ({
      stopId: s.stop_id,
      name: s.name,
      nameMr: s.name_mr,
      nameHi: s.name_hi,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      sequenceNumber: s.sequence_number,
      distanceFromOriginKm: s.distance_from_origin_km,
      estimatedTimeFromOriginMin: s.estimated_time_from_origin_min,
    })),
    location,
    isSimulated: true,
  });
}
