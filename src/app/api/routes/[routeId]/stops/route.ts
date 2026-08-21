import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/init";

// GET /api/routes/[routeId]/stops
export async function GET(req: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  await ensureReady();
  const { routeId } = await params;

  const result = await db.execute({
    sql: `SELECT rs.sequence_number, rs.distance_from_origin_km, rs.estimated_time_from_origin_min,
                 s.id, s.name, s.name_mr, s.name_hi, s.latitude, s.longitude, s.city
          FROM route_stops rs
          JOIN stops s ON rs.stop_id = s.id
          WHERE rs.route_id = ?
          ORDER BY rs.sequence_number ASC`,
    args: [routeId],
  });

  return NextResponse.json({ stops: result.rows });
}
