import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";

// GET /api/routes
export async function GET(req: NextRequest) {
  await ensureReady();
  const result = await db.execute(`SELECT * FROM routes ORDER BY route_number ASC`);
  return NextResponse.json({ routes: result.rows });
}
