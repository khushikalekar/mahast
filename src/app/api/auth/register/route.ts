import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { ensureReady } from "@/lib/init";

export async function POST(req: NextRequest) {
  await ensureReady();
  const { name, email, password, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email.toLowerCase().trim()] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO users (id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, 'passenger', ?)",
    args: [id, name.trim(), email.toLowerCase().trim(), hash, phone ?? null],
  });

  const token = signToken({ userId: id, email: email.toLowerCase().trim(), role: "passenger" });

  return NextResponse.json({
    token,
    user: { id, name: name.trim(), email: email.toLowerCase().trim(), role: "passenger", preferredLanguage: "en" },
  }, { status: 201 });
}
