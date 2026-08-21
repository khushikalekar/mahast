import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";

// PATCH /api/admin/buses/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const { id } = await params;
  const { busType, capacity, status } = await req.json();

  await db.execute({
    sql: `UPDATE buses SET bus_type = COALESCE(?, bus_type), capacity = COALESCE(?, capacity), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?`,
    args: [busType ?? null, capacity ?? null, status ?? null, id],
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/buses/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const { id } = await params;
  await db.execute({ sql: `UPDATE buses SET status = 'inactive' WHERE id = ?`, args: [id] });

  return NextResponse.json({ success: true });
}
