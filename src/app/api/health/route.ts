import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

let initialized = false;

export async function GET(req: NextRequest) {
  if (!initialized) {
    await initializeDatabase();
    await seedDatabase();
    initialized = true;
  }
  return NextResponse.json({ status: "ok", message: "MahaST API running", demo: true });
}
