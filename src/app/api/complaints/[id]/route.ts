import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";

// PATCH /api/complaints/[id] — admin only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const { id } = await params;
  const { status, adminResponse } = await req.json();

  await db.execute({
    sql: `UPDATE complaints SET status = ?, admin_response = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [status, adminResponse ?? null, id],
  });

  return NextResponse.json({ success: true });
}
