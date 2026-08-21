import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";
import { v4 as uuidv4 } from "uuid";

// POST /api/feedback
export async function POST(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { tripId, overallRating, cleanlinessRating, punctualityRating, busConditionRating, crowdingRating, safetyRating, comment } = await req.json();

  if (!tripId || !overallRating) {
    return NextResponse.json({ error: "tripId and overallRating required" }, { status: 400 });
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO feedback (id, user_id, trip_id, overall_rating, cleanliness_rating, punctuality_rating, bus_condition_rating, crowding_rating, safety_rating, comment)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [id, auth.user.userId, tripId, overallRating, cleanlinessRating ?? null, punctualityRating ?? null, busConditionRating ?? null, crowdingRating ?? null, safetyRating ?? null, comment ?? null],
  });

  return NextResponse.json({ id }, { status: 201 });
}

// GET /api/feedback — admin gets all, passenger gets their own
export async function GET(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  let result;
  if (auth.user.role === "admin") {
    result = await db.execute(`
      SELECT f.*, u.name as user_name, t.id as trip_id, b.bus_number, r.route_number
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN trips t ON f.trip_id = t.id
      LEFT JOIN buses b ON t.bus_id = b.id
      LEFT JOIN routes r ON t.route_id = r.id
      ORDER BY f.created_at DESC LIMIT 100
    `);
  } else {
    result = await db.execute({
      sql: `SELECT f.*, b.bus_number, r.route_number FROM feedback f
            LEFT JOIN trips t ON f.trip_id = t.id
            LEFT JOIN buses b ON t.bus_id = b.id
            LEFT JOIN routes r ON t.route_id = r.id
            WHERE f.user_id = ? ORDER BY f.created_at DESC`,
      args: [auth.user.userId],
    });
  }

  return NextResponse.json({ feedback: result.rows });
}
