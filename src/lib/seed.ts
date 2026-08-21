/**
 * Seed the database with realistic Maharashtra demo data.
 * All data is clearly marked as demo/simulated.
 */
import { db } from "./db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const DEMO_STOPS: Record<string, { id: string; name: string; name_mr: string; name_hi: string; lat: number; lng: number; city: string }> = {
  ahmednagar: { id: "stop-ahmednagar", name: "Ahmednagar ST Stand", name_mr: "अहमदनगर एसटी स्टँड", name_hi: "अहमदनगर एसटी स्टैंड", lat: 19.0948, lng: 74.7480, city: "Ahmednagar" },
  shrirampur: { id: "stop-shrirampur", name: "Shrirampur", name_mr: "श्रीरामपूर", name_hi: "श्रीरामपुर", lat: 19.6228, lng: 74.6627, city: "Shrirampur" },
  sangamner: { id: "stop-sangamner", name: "Sangamner", name_mr: "संगमनेर", name_hi: "संगमनेर", lat: 19.5765, lng: 74.2099, city: "Sangamner" },
  alephata: { id: "stop-alephata", name: "Alephata", name_mr: "आळेफाटा", name_hi: "आलेफाटा", lat: 19.1700, lng: 73.9800, city: "Alephata" },
  chakan: { id: "stop-chakan", name: "Chakan", name_mr: "चाकण", name_hi: "चाकण", lat: 18.7608, lng: 73.8605, city: "Chakan" },
  pune: { id: "stop-pune", name: "Pune Swargate ST Stand", name_mr: "पुणे स्वारगेट एसटी स्टँड", name_hi: "पुणे स्वारगेट एसटी स्टैंड", lat: 18.5018, lng: 73.8636, city: "Pune" },
  nashik: { id: "stop-nashik", name: "Nashik CBS", name_mr: "नाशिक सीबीएस", name_hi: "नासिक सीबीएस", lat: 20.0059, lng: 73.7898, city: "Nashik" },
  igatpuri: { id: "stop-igatpuri", name: "Igatpuri", name_mr: "इगतपुरी", name_hi: "इगतपुरी", lat: 19.6961, lng: 73.5603, city: "Igatpuri" },
  kasara: { id: "stop-kasara", name: "Kasara", name_mr: "कसारा", name_hi: "कसारा", lat: 19.5500, lng: 73.3200, city: "Kasara" },
  kalyan: { id: "stop-kalyan", name: "Kalyan ST Stand", name_mr: "कल्याण एसटी स्टँड", name_hi: "कल्याण एसटी स्टैंड", lat: 19.2403, lng: 73.1305, city: "Kalyan" },
  mumbai: { id: "stop-mumbai", name: "Mumbai Dadar ST Stand", name_mr: "मुंबई दादर एसटी स्टँड", name_hi: "मुंबई दादर एसटी स्टैंड", lat: 19.0176, lng: 72.8562, city: "Mumbai" },
  shirdi: { id: "stop-shirdi", name: "Shirdi", name_mr: "शिर्डी", name_hi: "शिर्डी", lat: 19.7659, lng: 74.4773, city: "Shirdi" },
  kopargaon: { id: "stop-kopargaon", name: "Kopargaon", name_mr: "कोपरगाव", name_hi: "कोपरगाव", lat: 19.8775, lng: 74.4773, city: "Kopargaon" },
  sinnar: { id: "stop-sinnar", name: "Sinnar", name_mr: "सिन्नर", name_hi: "सिन्नर", lat: 19.8464, lng: 74.0011, city: "Sinnar" },
  pimpri: { id: "stop-pimpri", name: "Pimpri-Chinchwad", name_mr: "पिंपरी-चिंचवड", name_hi: "पिंपरी-चिंचवड", lat: 18.6279, lng: 73.8009, city: "Pimpri" },
  lonavala: { id: "stop-lonavala", name: "Lonavala", name_mr: "लोणावळा", name_hi: "लोनावला", lat: 18.7481, lng: 73.4072, city: "Lonavala" },
  khopoli: { id: "stop-khopoli", name: "Khopoli", name_mr: "खोपोली", name_hi: "खोपोली", lat: 18.7852, lng: 73.3434, city: "Khopoli" },
  panvel: { id: "stop-panvel", name: "Panvel ST Stand", name_mr: "पनवेल एसटी स्टँड", name_hi: "पनवेल एसटी स्टैंड", lat: 18.9894, lng: 73.1175, city: "Panvel" },
};

export async function seedDatabase() {
  // Check if already seeded
  const existing = await db.execute("SELECT COUNT(*) as count FROM buses");
  if ((existing.rows[0] as unknown as { count: number }).count > 0) return;

  console.log("[Seed] Seeding demo data...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const passengerHash = await bcrypt.hash("passenger123", 10);
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    args: ["user-admin", "Admin User", "admin@mahast.demo", adminHash, "admin"],
  });
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    args: ["user-passenger", "Demo Passenger", "passenger@mahast.demo", passengerHash, "passenger"],
  });

  // Stops
  for (const stop of Object.values(DEMO_STOPS)) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO stops (id, name, name_mr, name_hi, latitude, longitude, city) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [stop.id, stop.name, stop.name_mr, stop.name_hi, stop.lat, stop.lng, stop.city],
    });
  }

  // Buses
  const buses = [
    { id: "bus-MH12-AB-1234", num: "MH-12-AB-1234", reg: "MH12AB1234", type: "ordinary", cap: 52 },
    { id: "bus-MH12-CD-5678", num: "MH-12-CD-5678", reg: "MH12CD5678", type: "semi_luxury", cap: 42 },
    { id: "bus-MH14-EF-9012", num: "MH-14-EF-9012", reg: "MH14EF9012", type: "luxury", cap: 32 },
    { id: "bus-MH04-GH-3456", num: "MH-04-GH-3456", reg: "MH04GH3456", type: "ordinary", cap: 52 },
    { id: "bus-MH04-IJ-7890", num: "MH-04-IJ-7890", reg: "MH04IJ7890", type: "semi_luxury", cap: 42 },
    { id: "bus-MH15-KL-1111", num: "MH-15-KL-1111", reg: "MH15KL1111", type: "ordinary", cap: 52 },
    { id: "bus-MH12-MN-2222", num: "MH-12-MN-2222", reg: "MH12MN2222", type: "luxury", cap: 32 },
    { id: "bus-MH14-OP-3333", num: "MH-14-OP-3333", reg: "MH14OP3333", type: "ordinary", cap: 52 },
  ];
  for (const b of buses) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO buses (id, bus_number, registration_number, bus_type, capacity) VALUES (?, ?, ?, ?, ?)`,
      args: [b.id, b.num, b.reg, b.type, b.cap],
    });
  }

  // Routes
  const routes = [
    {
      id: "route-ANG-PNQ",
      num: "ANG-PNQ-01",
      name: "Ahmednagar – Pune (Via Sangamner)",
      origin: "Ahmednagar",
      destination: "Pune",
      dist: 120,
      dur: 180,
      fare_o: 180,
      fare_sl: 270,
      fare_l: 360,
      stops: ["ahmednagar", "shrirampur", "sangamner", "alephata", "chakan", "pimpri", "pune"],
      times: [0, 25, 55, 90, 130, 155, 180],
      dists: [0, 22, 50, 78, 100, 112, 120],
    },
    {
      id: "route-PNQ-ANG",
      num: "PNQ-ANG-01",
      name: "Pune – Ahmednagar (Via Sangamner)",
      origin: "Pune",
      destination: "Ahmednagar",
      dist: 120,
      dur: 180,
      fare_o: 180,
      fare_sl: 270,
      fare_l: 360,
      stops: ["pune", "pimpri", "chakan", "alephata", "sangamner", "shrirampur", "ahmednagar"],
      times: [0, 25, 50, 80, 110, 145, 180],
      dists: [0, 8, 20, 42, 70, 98, 120],
    },
    {
      id: "route-PNQ-NSK",
      num: "PNQ-NSK-01",
      name: "Pune – Nashik (Via Sinnar)",
      origin: "Pune",
      destination: "Nashik",
      dist: 210,
      dur: 270,
      fare_o: 290,
      fare_sl: 420,
      fare_l: 580,
      stops: ["pune", "alephata", "sangamner", "sinnar", "nashik"],
      times: [0, 70, 120, 230, 270],
      dists: [0, 60, 110, 180, 210],
    },
    {
      id: "route-NSK-PNQ",
      num: "NSK-PNQ-01",
      name: "Nashik – Pune (Via Sinnar)",
      origin: "Nashik",
      destination: "Pune",
      dist: 210,
      dur: 270,
      fare_o: 290,
      fare_sl: 420,
      fare_l: 580,
      stops: ["nashik", "sinnar", "sangamner", "alephata", "pune"],
      times: [0, 40, 90, 150, 270],
      dists: [0, 30, 80, 130, 210],
    },
    {
      id: "route-MUM-PNQ",
      num: "MUM-PNQ-01",
      name: "Mumbai – Pune (Expressway)",
      origin: "Mumbai",
      destination: "Pune",
      dist: 148,
      dur: 195,
      fare_o: 240,
      fare_sl: 350,
      fare_l: 490,
      stops: ["mumbai", "panvel", "khopoli", "lonavala", "pimpri", "pune"],
      times: [0, 35, 70, 110, 165, 195],
      dists: [0, 30, 58, 93, 132, 148],
    },
    {
      id: "route-ANG-SRD",
      num: "ANG-SRD-01",
      name: "Ahmednagar – Shirdi",
      origin: "Ahmednagar",
      destination: "Shirdi",
      dist: 85,
      dur: 120,
      fare_o: 130,
      fare_sl: 190,
      fare_l: 260,
      stops: ["ahmednagar", "kopargaon", "shirdi"],
      times: [0, 60, 120],
      dists: [0, 55, 85],
    },
  ];

  for (const r of routes) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO routes (id, route_number, name, origin, destination, distance_km, estimated_duration_min, fare_ordinary, fare_semi_luxury, fare_luxury) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [r.id, r.num, r.name, r.origin, r.destination, r.dist, r.dur, r.fare_o, r.fare_sl, r.fare_l],
    });

    for (let i = 0; i < r.stops.length; i++) {
      const stopKey = r.stops[i];
      const stopId = DEMO_STOPS[stopKey]?.id;
      if (!stopId) continue;
      await db.execute({
        sql: `INSERT OR IGNORE INTO route_stops (id, route_id, stop_id, sequence_number, distance_from_origin_km, estimated_time_from_origin_min) VALUES (?,?,?,?,?,?)`,
        args: [uuidv4(), r.id, stopId, i + 1, r.dists[i], r.times[i]],
      });
    }
  }

  // Scheduled trips (today + tomorrow)
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const schedules = [
    { busId: "bus-MH12-AB-1234", routeId: "route-ANG-PNQ", depHour: 6, depMin: 0 },
    { busId: "bus-MH12-CD-5678", routeId: "route-ANG-PNQ", depHour: 9, depMin: 30 },
    { busId: "bus-MH14-EF-9012", routeId: "route-ANG-PNQ", depHour: 14, depMin: 0 },
    { busId: "bus-MH04-GH-3456", routeId: "route-PNQ-ANG", depHour: 7, depMin: 0 },
    { busId: "bus-MH04-IJ-7890", routeId: "route-PNQ-ANG", depHour: 11, depMin: 0 },
    { busId: "bus-MH15-KL-1111", routeId: "route-PNQ-NSK", depHour: 8, depMin: 0 },
    { busId: "bus-MH12-MN-2222", routeId: "route-MUM-PNQ", depHour: 7, depMin: 30 },
    { busId: "bus-MH14-OP-3333", routeId: "route-ANG-SRD", depHour: 10, depMin: 0 },
    { busId: "bus-MH12-AB-1234", routeId: "route-PNQ-ANG", depHour: 16, depMin: 0 },
    { busId: "bus-MH12-CD-5678", routeId: "route-NSK-PNQ", depHour: 8, depMin: 0 },
  ];

  for (const sched of schedules) {
    const route = routes.find((r) => r.id === sched.routeId)!;
    const dep = new Date(`${todayStr}T${String(sched.depHour).padStart(2, "0")}:${String(sched.depMin).padStart(2, "0")}:00`);
    const arr = new Date(dep.getTime() + route.dur * 60 * 1000);

    // Determine status
    const diffMin = (dep.getTime() - now.getTime()) / 60000;
    let status = "scheduled";
    if (diffMin < -route.dur) status = "completed";
    else if (diffMin < 0) status = "in_progress";
    const delayMin = status === "in_progress" ? (Math.random() > 0.6 ? Math.floor(Math.random() * 20) : 0) : 0;

    const tripId = `trip-${sched.busId}-${sched.routeId}-${todayStr}-${sched.depHour}`;
    await db.execute({
      sql: `INSERT OR IGNORE INTO trips (id, bus_id, route_id, scheduled_departure, scheduled_arrival, status, delay_minutes) VALUES (?,?,?,?,?,?,?)`,
      args: [tripId, sched.busId, sched.routeId, dep.toISOString(), arr.toISOString(), status, delayMin],
    });
  }

  console.log("[Seed] Demo data seeded successfully.");
}
