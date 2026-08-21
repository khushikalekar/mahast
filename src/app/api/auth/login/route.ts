import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { ensureReady } from "@/lib/init";

export async function POST(req: NextRequest) {
  await ensureReady();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "SELECT id, name, email, password_hash, role, preferred_language FROM users WHERE email = ?",
    args: [email.toLowerCase().trim()],
  });

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ userId: user.id as string, email: user.email as string, role: user.role as "passenger" | "admin" });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferred_language ?? "en",
    },
  });
}
