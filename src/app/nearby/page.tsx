"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { formatTime } from "@/lib/utils";
import { MapPin, Bus, Navigation, Loader } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const LiveMap = dynamic(() => import("@/components/live-map").then((m) => m.LiveMap), { ssr: false, loading: () => <div style={{ height: 280, background: "var(--color-surface)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>Loading map...</div> });

interface NearbyStop {
  stop: { id: string; name: string; nameMr: string; nameHi: string; city: string; latitude: number; longitude: number };
  distanceKm: number;
  buses: { tripId: string; busNumber: string; busType: string; routeNumber: string; origin: string; destination: string; scheduledDeparture: string; status: string; delayMinutes: number }[];
}

const FALLBACK_LOCATIONS = [
  { name: "Pune (Swargate)", lat: 18.5018, lng: 73.8636 },
  { name: "Ahmednagar", lat: 19.0948, lng: 74.7480 },
  { name: "Nashik", lat: 20.0059, lng: 73.7898 },
  { name: "Mumbai (Dadar)", lat: 19.0176, lng: 72.8562 },
];

export default function NearbyPage() {
  const { language } = useAppStore();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedFallback, setSelectedFallback] = useState<number | null>(null);

  const fetchNearby = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/stops/nearby?lat=${lat}&lng=${lng}&radius=20`);
      setNearbyStops(res.data.nearbyStops ?? []);
    } catch { setNearbyStops([]); }
    setLoading(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); fetchNearby(pos.coords.latitude, pos.coords.longitude); },
      () => { setLocationError("Location access denied. Please select a demo location below."); setLoading(false); }
    );
  };

  const useFallback = (idx: number) => {
    setSelectedFallback(idx);
    const loc = FALLBACK_LOCATIONS[idx];
    setUserLat(loc.lat);
    setUserLng(loc.lng);
    setLocationError("");
    fetchNearby(loc.lat, loc.lng);
  };

  useEffect(() => { detectLocation(); }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={20} color="#f97316" /> {t("nearbyBuses", language)}
      </h1>

      {/* Location picker */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            {userLat ? (
              <span style={{ fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 600 }}>
                📍 {userLat.toFixed(4)}, {userLng?.toFixed(4)} {FALLBACK_LOCATIONS[selectedFallback ?? -1] ? `(${FALLBACK_LOCATIONS[selectedFallback!].name})` : "(Your location)"}
              </span>
            ) : (
              <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Location not detected yet</span>
            )}
          </div>
          <button className="btn btn-outline btn-sm" onClick={detectLocation}>
            <Navigation size={14} /> Detect
          </button>
        </div>
        {locationError && (
          <div style={{ fontSize: "0.8125rem", color: "#d97706", marginBottom: 8 }}>{locationError}</div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FALLBACK_LOCATIONS.map((loc, i) => (
            <button
              key={i}
              onClick={() => useFallback(i)}
              style={{ padding: "4px 12px", borderRadius: 20, border: "1.5px solid", borderColor: selectedFallback === i ? "#f97316" : "var(--color-border)", background: selectedFallback === i ? "#fff7ed" : "transparent", color: selectedFallback === i ? "#f97316" : "var(--color-muted)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      {userLat && userLng && (
        <div style={{ marginBottom: "1rem" }}>
          <LiveMap
            stops={nearbyStops.map((ns) => ({ stopId: ns.stop.id, name: ns.stop.name, latitude: ns.stop.latitude, longitude: ns.stop.longitude, sequenceNumber: 0 }))}
            location={null}
            userLat={userLat}
            userLng={userLng}
            height={280}
          />
        </div>
      )}

      {/* Stops list */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
          Finding nearby buses...
        </div>
      )}

      {!loading && nearbyStops.length === 0 && userLat && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>
          No stops found within 20 km of this location. Try a different location.
        </div>
      )}

      {!loading && nearbyStops.map((ns) => (
        <div key={ns.stop.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color="#1e40af" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>{ns.stop.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{ns.stop.city}</div>
              </div>
            </div>
            <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 10px", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 700 }}>
              {ns.distanceKm} km
            </span>
          </div>

          {ns.buses.length === 0 ? (
            <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", padding: "8px 0" }}>No upcoming buses today</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ns.buses.map((b) => (
                <div key={b.tripId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-bg)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                  <Bus size={16} color="#f97316" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>{b.busNumber}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginLeft: 8 }}>{b.origin} → {b.destination}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>{formatTime(b.scheduledDeparture)}</div>
                    <div style={{ fontSize: "0.7rem", color: b.delayMinutes > 0 ? "#d97706" : "#16a34a" }}>
                      {b.delayMinutes > 0 ? `+${b.delayMinutes}m delay` : "On time"}
                    </div>
                  </div>
                  <Link href={`/trip/${b.tripId}`} className="btn btn-primary btn-sm">Track</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
