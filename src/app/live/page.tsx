"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { Bus, MapPin, Clock, Navigation } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/live-map").then((m) => m.LiveMap), { ssr: false, loading: () => <div style={{ height: 300, background: "var(--color-surface)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading map...</div> });

interface LiveBus {
  tripId: string;
  busNumber: string;
  busType: string;
  routeName: string;
  origin: string;
  destination: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  delayMinutes: number;
  status: string;
  progressPercent: number;
  nextStopName: string | null;
  etaToNextStopMin: number;
}

export default function LivePage() {
  const { language } = useAppStore();
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const res = await axios.get("/api/buses/live");
      setBuses(res.data.locations ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 8000);
    return () => clearInterval(interval);
  }, []);

  const mapStops = buses.map((b) => ({ stopId: b.tripId, name: b.busNumber, latitude: b.latitude, longitude: b.longitude, sequenceNumber: 0 }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Navigation size={20} color="#f97316" /> Live Bus Tracking
        </h1>
        <span style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
          🔴 Simulated GPS Data
        </span>
      </div>

      {/* Map */}
      <div style={{ marginBottom: "1rem" }}>
        <LiveMap stops={mapStops} location={null} height={350} />
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.75rem" }}>
        Active Buses ({buses.length})
      </h2>

      {loading && <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading live data...</div>}

      {!loading && buses.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>
          No buses are currently active. Buses are active during their scheduled trip times.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {buses.map((bus) => (
          <div key={bus.tripId} className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bus size={18} color="#f97316" />
                <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>{bus.busNumber}</span>
              </div>
              <span className={`badge badge-${bus.delayMinutes > 0 ? "warning" : "success"}`}>
                {bus.delayMinutes > 0 ? `+${bus.delayMinutes}m` : "On Time"}
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: 6 }}>{bus.origin} → {bus.destination}</div>
            <div style={{ display: "flex", gap: 12, fontSize: "0.8125rem", color: "var(--color-text)", marginBottom: 8 }}>
              <span>🏎️ {bus.speedKmh.toFixed(0)} km/h</span>
              <span>⏱️ {bus.etaToNextStopMin}min to next stop</span>
            </div>
            {bus.nextStopName && (
              <div style={{ fontSize: "0.8125rem", color: "#f97316", marginBottom: 8 }}>
                <MapPin size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Next: {bus.nextStopName}
              </div>
            )}
            <div style={{ height: 3, background: "#e2e8f0", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#f97316", width: `${bus.progressPercent}%`, borderRadius: 2 }} />
            </div>
            <Link href={`/trip/${bus.tripId}`} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              View Details & Track
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
