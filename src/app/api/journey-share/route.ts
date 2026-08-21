import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";
import { v4 as uuidv4 } from "uuid";

// POST /api/journey-share
export async function POST(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { tripId, destinationStopId } = await req.json();
  if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });

  const shareCode = uuidv4().split("-")[0].toUpperCase(); // Short code e.g. "A1B2C3D4"
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO journey_shares (id, share_code, trip_id, user_id, destination_stop_id, expires_at) VALUES (?,?,?,?,?,?)`,
    args: [id, shareCode, tripId, auth.user.userId, destinationStopId ?? null, expiresAt],
  });

  return NextResponse.json({ shareCode, url: `/share/${shareCode}`, expiresAt });
}

// GET /api/journey-share?code=
export async function GET(req: NextRequest) {
  await ensureReady();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const result = await db.execute({
    sql: `SELECT js.*, t.bus_id, t.route_id, t.scheduled_departure, t.status, t.delay_minutes,
                 b.bus_number, b.bus_type, r.route_number, r.name as route_name, r.origin, r.destination,
                 s.name as dest_stop_name
          FROM journey_shares js
          JOIN trips t ON js.trip_id = t.id
          JOIN buses b ON t.bus_id = b.id
          JOIN routes r ON t.route_id = r.id
          LEFT JOIN stops s ON js.destination_stop_id = s.id
          WHERE js.share_code = ? AND js.expires_at > datetime('now')`,
    args: [code],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 });
  }

  return NextResponse.json({ share: result.rows[0] });
}
