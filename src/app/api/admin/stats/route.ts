import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { ensureReady } from "@/lib/init";

// GET /api/admin/stats — admin only
export async function GET(req: NextRequest) {
  await ensureReady();
  const auth = requireAuth(req, "admin");
  if ("status" in auth) return auth;

  const [totalBuses, activeBuses, onTimeBuses, delayedBuses, completedTrips, openComplaints, totalFeedback, avgRating] = await Promise.all([
    db.execute(`SELECT COUNT(*) as count FROM buses`),
    db.execute(`SELECT COUNT(*) as count FROM buses WHERE status = 'active'`),
    db.execute(`SELECT COUNT(*) as count FROM trips WHERE status = 'in_progress' AND delay_minutes = 0`),
    db.execute(`SELECT COUNT(*) as count FROM trips WHERE status = 'in_progress' AND delay_minutes > 0`),
    db.execute(`SELECT COUNT(*) as count FROM trips WHERE status = 'completed'`),
    db.execute(`SELECT COUNT(*) as count FROM complaints WHERE status = 'open'`),
    db.execute(`SELECT COUNT(*) as count FROM feedback`),
    db.execute(`SELECT AVG(overall_rating) as avg FROM feedback`),
  ]);

  const routes = await db.execute(`
    SELECT r.route_number, r.name, r.origin, r.destination, COUNT(t.id) as trip_count
    FROM routes r
    LEFT JOIN trips t ON r.id = t.route_id
    GROUP BY r.id ORDER BY trip_count DESC LIMIT 10
  `);

  const complaints = await db.execute(`
    SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC
  `);

  const ratings = await db.execute(`
    SELECT DATE(created_at) as date, AVG(overall_rating) as avg_rating, COUNT(*) as count
    FROM feedback GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14
  `);

  const g = (r: { rows: unknown[] }) => (r.rows[0] as unknown as Record<string, number>).count ?? 0;
  return NextResponse.json({
    stats: {
      totalBuses: g(totalBuses),
      activeBuses: g(activeBuses),
      onTimeBuses: g(onTimeBuses),
      delayedBuses: g(delayedBuses),
      completedTrips: g(completedTrips),
      openComplaints: g(openComplaints),
      totalFeedback: g(totalFeedback),
      avgRating: Math.round(((avgRating.rows[0] as unknown as { avg: number | null }).avg ?? 0) * 10) / 10,
    },
    popularRoutes: routes.rows,
    complaintCategories: complaints.rows,
    ratingsTrend: ratings.rows,
  });
}
