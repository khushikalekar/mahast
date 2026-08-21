import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";
import { v4 as uuidv4 } from "uuid";

// GET /api/complaints
export async function GET(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  let result;
  if (auth.user.role === "admin") {
    result = await db.execute(`
      SELECT c.*, u.name as user_name, b.bus_number, r.route_number
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN buses b ON c.bus_id = b.id
      LEFT JOIN routes r ON c.route_id = r.id
      ORDER BY c.created_at DESC LIMIT 100
    `);
  } else {
    result = await db.execute({
      sql: `SELECT c.*, b.bus_number, r.route_number FROM complaints c
            LEFT JOIN buses b ON c.bus_id = b.id
            LEFT JOIN routes r ON c.route_id = r.id
            WHERE c.user_id = ? ORDER BY c.created_at DESC`,
      args: [auth.user.userId],
    });
  }

  return NextResponse.json({ complaints: result.rows });
}

// POST /api/complaints
export async function POST(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { category, description, tripId, busId, routeId, latitude, longitude } = await req.json();
  if (!category || !description) {
    return NextResponse.json({ error: "Category and description required" }, { status: 400 });
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO complaints (id, user_id, category, description, trip_id, bus_id, route_id, latitude, longitude) VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [id, auth.user.userId, category, description, tripId ?? null, busId ?? null, routeId ?? null, latitude ?? null, longitude ?? null],
  });

  return NextResponse.json({ id }, { status: 201 });
}
