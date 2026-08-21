import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";
import { v4 as uuidv4 } from "uuid";

// GET /api/admin/buses
export async function GET(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const result = await db.execute(`SELECT * FROM buses ORDER BY bus_number ASC`);
  return NextResponse.json({ buses: result.rows });
}

// POST /api/admin/buses
export async function POST(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const { busNumber, registrationNumber, busType, capacity } = await req.json();
  if (!busNumber || !registrationNumber) {
    return NextResponse.json({ error: "busNumber and registrationNumber required" }, { status: 400 });
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO buses (id, bus_number, registration_number, bus_type, capacity) VALUES (?,?,?,?,?)`,
    args: [id, busNumber, registrationNumber, busType ?? "ordinary", capacity ?? 52],
  });

  return NextResponse.json({ id }, { status: 201 });
}
