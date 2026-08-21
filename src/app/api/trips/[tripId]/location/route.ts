import { NextRequest, NextResponse } from "next/server";
import { gpsProvider } from "@/lib/gps-provider";
import { ensureReady } from "@/lib/init";

// GET /api/trips/[tripId]/location — real-time GPS location for a single trip
export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  await ensureReady();
  const { tripId } = await params;

  const location = gpsProvider.getLocation(tripId);
  if (!location) {
    return NextResponse.json({ error: "Location not available" }, { status: 404 });
  }

  return NextResponse.json({ location, isSimulated: true });
}
