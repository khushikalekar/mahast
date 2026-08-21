import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";
import { v4 as uuidv4 } from "uuid";

// GET /api/favourites
export async function GET(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const result = await db.execute({
    sql: `SELECT id, type, reference_id, label, created_at FROM favourites WHERE user_id = ? ORDER BY created_at DESC`,
    args: [auth.user.userId],
  });

  return NextResponse.json({ favourites: result.rows });
}

// POST /api/favourites
export async function POST(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { type, referenceId, label } = await req.json();
  if (!type || !referenceId) {
    return NextResponse.json({ error: "type and referenceId required" }, { status: 400 });
  }

  // Check not already saved
  const existing = await db.execute({
    sql: `SELECT id FROM favourites WHERE user_id = ? AND type = ? AND reference_id = ?`,
    args: [auth.user.userId, type, referenceId],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Already in favourites" }, { status: 409 });
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO favourites (id, user_id, type, reference_id, label) VALUES (?,?,?,?,?)`,
    args: [id, auth.user.userId, type, referenceId, label ?? null],
  });

  return NextResponse.json({ id }, { status: 201 });
}

// DELETE /api/favourites?type=&referenceId=
export async function DELETE(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const referenceId = searchParams.get("referenceId");

  await db.execute({
    sql: `DELETE FROM favourites WHERE user_id = ? AND type = ? AND reference_id = ?`,
    args: [auth.user.userId, type, referenceId],
  });

  return NextResponse.json({ success: true });
}
