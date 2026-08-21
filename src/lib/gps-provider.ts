/**
 * GPS Provider Abstraction Layer
 * ================================
 * This module defines the contract for bus location data.
 *
 * Currently uses a SimulatedGPSProvider that moves buses along predefined routes.
 * To integrate a real MSRTC GPS/API feed:
 *  1. Create a new class implementing GPSProvider
 *  2. Set NEXT_PUBLIC_GPS_PROVIDER=real in .env
 *  3. Replace SimulatedGPSProvider with your implementation
 *
 * The rest of the application only consumes GPSProvider and BusLocation —
 * it never talks to the underlying data source directly.
 */

export interface BusLocation {
  tripId: string;
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  nextStopId: string | null;
  nextStopName: string | null;
  distanceToNextStopKm: number;
  etaToNextStopMin: number;
  delayMinutes: number;
  status: "on_time" | "delayed" | "early";
  progressPercent: number;
  recordedAt: string;
  isSimulated: true; // Always true for demo; will be false with real GPS
}

export interface GPSProvider {
  /** Get current location for a specific trip */
  getLocation(tripId: string): BusLocation | null;
  /** Get locations for all active trips */
  getAllLocations(): BusLocation[];
  /** Start the location simulation/polling loop */
  start(): void;
  /** Stop the simulation/polling loop */
  stop(): void;
}

// ─── Simulated GPS Provider ────────────────────────────────────────────────

import { DEMO_STOPS } from "./seed";

interface RouteConfig {
  routeId: string;
  stopKeys: string[];
  times: number[]; // minutes from origin
  dists: number[]; // km from origin
  totalDuration: number;
}

const ROUTE_CONFIGS: RouteConfig[] = [
  {
    routeId: "route-ANG-PNQ",
    stopKeys: ["ahmednagar", "shrirampur", "sangamner", "alephata", "chakan", "pimpri", "pune"],
    times: [0, 25, 55, 90, 130, 155, 180],
    dists: [0, 22, 50, 78, 100, 112, 120],
    totalDuration: 180,
  },
  {
    routeId: "route-PNQ-ANG",
    stopKeys: ["pune", "pimpri", "chakan", "alephata", "sangamner", "shrirampur", "ahmednagar"],
    times: [0, 25, 50, 80, 110, 145, 180],
    dists: [0, 8, 20, 42, 70, 98, 120],
    totalDuration: 180,
  },
  {
    routeId: "route-PNQ-NSK",
    stopKeys: ["pune", "alephata", "sangamner", "sinnar", "nashik"],
    times: [0, 70, 120, 230, 270],
    dists: [0, 60, 110, 180, 210],
    totalDuration: 270,
  },
  {
    routeId: "route-NSK-PNQ",
    stopKeys: ["nashik", "sinnar", "sangamner", "alephata", "pune"],
    times: [0, 40, 90, 150, 270],
    dists: [0, 30, 80, 130, 210],
    totalDuration: 270,
  },
  {
    routeId: "route-MUM-PNQ",
    stopKeys: ["mumbai", "panvel", "khopoli", "lonavala", "pimpri", "pune"],
    times: [0, 35, 70, 110, 165, 195],
    dists: [0, 30, 58, 93, 132, 148],
    totalDuration: 195,
  },
  {
    routeId: "route-ANG-SRD",
    stopKeys: ["ahmednagar", "kopargaon", "shirdi"],
    times: [0, 60, 120],
    dists: [0, 55, 85],
    totalDuration: 120,
  },
];

interface SimulatedTrip {
  tripId: string;
  busId: string;
  routeId: string;
  departureTime: Date;
  delayMinutes: number;
  routeConfig: RouteConfig;
}

class SimulatedGPSProvider implements GPSProvider {
  private locations = new Map<string, BusLocation>();
  private trips: SimulatedTrip[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  async initialize(activeTripData: { tripId: string; busId: string; routeId: string; scheduledDeparture: string; delayMinutes: number }[]) {
    this.trips = activeTripData
      .map((t) => {
        const config = ROUTE_CONFIGS.find((r) => r.routeId === t.routeId);
        if (!config) return null;
        return {
          tripId: t.tripId,
          busId: t.busId,
          routeId: t.routeId,
          departureTime: new Date(t.scheduledDeparture),
          delayMinutes: t.delayMinutes,
          routeConfig: config,
        } as SimulatedTrip;
      })
      .filter(Boolean) as SimulatedTrip[];

    this.updateAll();
    this.initialized = true;
  }

  private interpolate(trip: SimulatedTrip): BusLocation | null {
    const now = new Date();
    const elapsedMin = (now.getTime() - trip.departureTime.getTime()) / 60000 - trip.delayMinutes;

    if (elapsedMin < 0) {
      // Bus not departed yet
      const firstStop = DEMO_STOPS[trip.routeConfig.stopKeys[0]];
      if (!firstStop) return null;
      return this.buildLocation(trip, firstStop.lat, firstStop.lng, 0, 0, 0);
    }

    const { times, stopKeys, dists, totalDuration } = trip.routeConfig;
    const progress = Math.min(elapsedMin / totalDuration, 1);

    if (progress >= 1) {
      const lastStop = DEMO_STOPS[stopKeys[stopKeys.length - 1]];
      if (!lastStop) return null;
      return this.buildLocation(trip, lastStop.lat, lastStop.lng, 100, 0, 0);
    }

    // Find which segment we're in
    let segIdx = 0;
    for (let i = 0; i < times.length - 1; i++) {
      if (elapsedMin >= times[i] && elapsedMin < times[i + 1]) {
        segIdx = i;
        break;
      }
    }

    const fromKey = stopKeys[segIdx];
    const toKey = stopKeys[segIdx + 1];
    const fromStop = DEMO_STOPS[fromKey];
    const toStop = DEMO_STOPS[toKey];
    if (!fromStop || !toStop) return null;

    const segElapsed = elapsedMin - times[segIdx];
    const segDuration = times[segIdx + 1] - times[segIdx];
    const segProgress = segDuration > 0 ? segElapsed / segDuration : 0;

    // Add slight jitter for realism
    const jitter = (Math.random() - 0.5) * 0.0003;
    const lat = fromStop.lat + (toStop.lat - fromStop.lat) * segProgress + jitter;
    const lng = fromStop.lng + (toStop.lng - fromStop.lng) * segProgress + jitter;

    const distToNext = ((1 - segProgress) * (dists[segIdx + 1] - dists[segIdx]));
    const etaToNext = Math.round((1 - segProgress) * segDuration);
    const progPct = (progress * 100);

    // Simulate speed 40–65 km/h
    const segDistKm = dists[segIdx + 1] - dists[segIdx];
    const speedKmh = segDuration > 0 ? (segDistKm / (segDuration / 60)) * (0.85 + Math.random() * 0.3) : 0;

    const nextStopData = DEMO_STOPS[toKey];

    return {
      tripId: trip.tripId,
      busId: trip.busId,
      routeId: trip.routeId,
      latitude: lat,
      longitude: lng,
      speedKmh: Math.min(Math.max(speedKmh, 0), 100),
      heading: Math.atan2(toStop.lng - fromStop.lng, toStop.lat - fromStop.lat) * (180 / Math.PI),
      nextStopId: `stop-${toKey}`,
      nextStopName: nextStopData?.name ?? null,
      distanceToNextStopKm: Math.max(0, distToNext),
      etaToNextStopMin: Math.max(0, etaToNext),
      delayMinutes: trip.delayMinutes,
      status: trip.delayMinutes === 0 ? "on_time" : trip.delayMinutes < 0 ? "early" : "delayed",
      progressPercent: progPct,
      recordedAt: now.toISOString(),
      isSimulated: true,
    };
  }

  private buildLocation(trip: SimulatedTrip, lat: number, lng: number, progress: number, distToNext: number, etaToNext: number): BusLocation {
    return {
      tripId: trip.tripId,
      busId: trip.busId,
      routeId: trip.routeId,
      latitude: lat,
      longitude: lng,
      speedKmh: 0,
      heading: 0,
      nextStopId: null,
      nextStopName: null,
      distanceToNextStopKm: distToNext,
      etaToNextStopMin: etaToNext,
      delayMinutes: trip.delayMinutes,
      status: trip.delayMinutes === 0 ? "on_time" : "delayed",
      progressPercent: progress,
      recordedAt: new Date().toISOString(),
      isSimulated: true,
    };
  }

  private updateAll() {
    for (const trip of this.trips) {
      const loc = this.interpolate(trip);
      if (loc) this.locations.set(trip.tripId, loc);
    }
  }

  getLocation(tripId: string): BusLocation | null {
    return this.locations.get(tripId) ?? null;
  }

  getAllLocations(): BusLocation[] {
    return Array.from(this.locations.values());
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.updateAll(), 5000); // Update every 5s
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get isReady() {
    return this.initialized;
  }
}

// Singleton GPS provider instance
export const gpsProvider = new SimulatedGPSProvider();

/** Bootstrap GPS on first API call (lazy init) */
let gpsBootstrapped = false;
export async function bootstrapGPS() {
  if (gpsBootstrapped) return;
  gpsBootstrapped = true;
  try {
    const { db } = await import("./db");
    const result = await db.execute(`
      SELECT t.id as trip_id, t.bus_id, t.route_id, t.scheduled_departure, t.delay_minutes
      FROM trips t
      WHERE t.status IN ('scheduled', 'in_progress')
    `);
    const trips = result.rows.map((r) => ({
      tripId: r.trip_id as string,
      busId: r.bus_id as string,
      routeId: r.route_id as string,
      scheduledDeparture: r.scheduled_departure as string,
      delayMinutes: (r.delay_minutes as number) ?? 0,
    }));
    await gpsProvider.initialize(trips);
    gpsProvider.start();
    console.log(`[GPS] Simulated GPS started for ${trips.length} trips`);
  } catch (err) {
    console.error("[GPS] Bootstrap failed:", err);
  }
}
