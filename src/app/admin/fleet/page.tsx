"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Zap, Clock, MapPin } from "lucide-react";

const LiveMap = dynamic(() => import("@/components/live-map").then((m) => m.LiveMap), { ssr: false, loading: () => <div style={{ height: 420, background: "var(--color-surface)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading fleet map...</div> });

interface BusLocEnriched {
  tripId: string;
  busNumber: string;
  busType: string;
  routeName: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  delayMinutes: number;
  status: string;
  progressPercent: number;
  nextStopName: string | null;
  etaToNextStopMin: number;
}

export default function AdminFleetPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [locations, setLocations] = useState<BusLocEnriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    const fetch = async () => {
      try {
        const res = await axios.get("/api/buses/live", { headers: { Authorization: `Bearer ${token}` } });
        setLocations(res.data.locations ?? []);
      } catch {}
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 8000);
    return () => clearInterval(interval);
  }, [user, token]);

  if (!user || user.role !== "admin") return null;

  const mapStops = locations.map((l) => ({ stopId: l.tripId, name: l.busNumber, latitude: l.latitude, longitude: l.longitude, sequenceNumber: 0 }));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={20} color="#f97316" /> Live Fleet Monitor
        </h1>
        <span style={{ fontSize: "0.75rem", background: "#f0fdf4", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
          {locations.length} Active Buses
        </span>
        <span style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
          🔴 Simulated GPS
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, alignItems: "start" }}>
        <LiveMap stops={mapStops} location={null} height={480} />

        <div>
          {loading ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading...</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto" }}>
              {locations.map((loc) => (
                <div key={loc.tripId} className="card" style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>{loc.busNumber}</span>
                    <span className={`badge badge-${loc.delayMinutes > 0 ? "warning" : "success"}`} style={{ fontSize: "0.7rem" }}>
                      {loc.delayMinutes > 0 ? `+${loc.delayMinutes}m` : "On Time"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: 4 }}>{loc.routeName}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text)" }}><Zap size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {loc.speedKmh.toFixed(0)} km/h</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text)" }}><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {loc.etaToNextStopMin}min</span>
                  </div>
                  <div style={{ height: 3, background: "#e2e8f0", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#f97316", width: `${loc.progressPercent}%`, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              {locations.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)", fontSize: "0.875rem" }}>No active buses currently tracked.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
