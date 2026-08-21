"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { formatTime, formatDuration, getBusTypeLabel, getStatusLabel } from "@/lib/utils";
import { Bus, Clock, MapPin, Zap, AlertTriangle, Bell, Share2, ChevronRight, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const LiveMap = dynamic(() => import("@/components/live-map").then((m) => m.LiveMap), { ssr: false, loading: () => <div style={{ height: 350, background: "var(--color-surface)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>Loading map...</div> });

interface TripData {
  trip: {
    id: string; busNumber: string; busType: string; routeNumber: string; routeName: string;
    origin: string; destination: string; scheduledDeparture: string; scheduledArrival: string;
    status: string; delayMinutes: number; durationMin: number; fare: number; distanceKm: number;
  };
  stops: { stopId: string; name: string; latitude: number; longitude: number; sequenceNumber: number; estimatedTimeFromOriginMin: number; distanceFromOriginKm: number }[];
  location: { latitude: number; longitude: number; speedKmh: number; heading: number; nextStopId: string | null; nextStopName: string | null; etaToNextStopMin: number; distanceToNextStopKm: number; progressPercent: number; isSimulated: boolean; } | null;
}

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language, addNotification } = useAppStore();
  const [data, setData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertStop, setAlertStop] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/trips/${tripId}`);
      setData(res.data);
    } catch { setLoading(false); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    if (!data?.location || !alertStop) return;
    const { nextStopId, etaToNextStopMin } = data.location;
    if (nextStopId === alertStop && etaToNextStopMin <= 5) {
      setShowAlert(true);
      addNotification({ id: Date.now().toString(), type: "stop_alert", title: "Prepare to get down!", message: `Your stop is approaching — ${etaToNextStopMin} minutes away`, isRead: false, createdAt: new Date().toISOString() });
    }
  }, [data?.location?.nextStopId, data?.location?.etaToNextStopMin]);

  const shareJourney = async () => {
    try {
      const res = await axios.post("/api/journey-share", { tripId });
      const url = `${window.location.origin}${res.data.url}`;
      await navigator.clipboard.writeText(url);
      addNotification({ id: Date.now().toString(), type: "share", title: "Journey Shared!", message: `Link copied: ${url}`, isRead: false, createdAt: new Date().toISOString() });
    } catch { alert("Share code copied! (clipboard unavailable in this browser)"); }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>Loading trip details...</div>;
  if (!data) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>Trip not found.</div>;

  const { trip, stops, location } = data;
  const arr = new Date(new Date(trip.scheduledArrival).getTime() + trip.delayMinutes * 60000);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1rem" }}>
      {/* Don't Miss My Stop Alert */}
      {showAlert && (
        <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: 12, padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={28} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "#dc2626" }}>{t("preparing", language)}</div>
            <div style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: 2 }}>
              Your stop is {data.location?.etaToNextStopMin} minutes away
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: "1.25rem" }}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Bus size={20} color="#f97316" />
              <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--color-text)" }}>{trip.busNumber}</span>
              <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                {getBusTypeLabel(trip.busType)}
              </span>
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>{trip.routeNumber} · {trip.routeName}</div>
          </div>
          <div>
            <span className={`badge badge-${trip.delayMinutes > 0 ? "warning" : trip.status === "in_progress" ? "success" : "neutral"}`}>
              {trip.delayMinutes > 0 ? `Delayed ${trip.delayMinutes}m` : getStatusLabel(trip.status)}
            </span>
          </div>
        </div>

        {/* Journey timeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>{formatTime(trip.scheduledDeparture)}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>{trip.origin}</div>
          </div>
          <div style={{ flex: 1, padding: "0 8px" }}>
            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: 4 }}>
              {formatDuration(trip.durationMin)} · {trip.distanceKm} km
            </div>
            <div style={{ height: 3, background: "#e2e8f0", borderRadius: 2, position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#f97316", width: `${location?.progressPercent ?? 0}%`, borderRadius: 2, transition: "width 0.5s" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>{formatTime(arr.toISOString())}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>{trip.destination}</div>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div style={{ marginBottom: "1rem" }}>
        <LiveMap stops={stops} location={location} height={350} />
      </div>

      {/* Live Status Card */}
      {location && (
        <div className="card" style={{ marginBottom: "1rem", background: "linear-gradient(135deg, #fff7ed, #fed7aa)", border: "1px solid #fdba74" }}>
          <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#9a3412", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={16} /> Live Status (Simulated GPS)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c2410c" }}>{location.speedKmh.toFixed(0)}</div>
              <div style={{ fontSize: "0.75rem", color: "#9a3412" }}>km/h</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c2410c" }}>{location.etaToNextStopMin}</div>
              <div style={{ fontSize: "0.75rem", color: "#9a3412" }}>min to next stop</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c2410c" }}>{location.distanceToNextStopKm.toFixed(1)}</div>
              <div style={{ fontSize: "0.75rem", color: "#9a3412" }}>km to next</div>
            </div>
          </div>
          {location.nextStopName && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.6)", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Navigation size={14} color="#c2410c" />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#9a3412" }}>Next: {location.nextStopName}</span>
            </div>
          )}
        </div>
      )}

      {/* Don't Miss My Stop */}
      <div className="card" style={{ marginBottom: "1rem", border: "1px solid #fde68a" }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={16} color="#d97706" /> {t("dontMissBus", language)}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: 10 }}>
          Select your destination stop and get an alert when approaching
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {stops.map((stop) => (
            <button
              key={stop.stopId}
              onClick={() => setAlertStop(alertStop === stop.stopId ? null : stop.stopId)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "1.5px solid", cursor: "pointer", fontSize: "0.8125rem",
                borderColor: alertStop === stop.stopId ? "#d97706" : "var(--color-border)",
                background: alertStop === stop.stopId ? "#fef3c7" : "transparent",
                color: alertStop === stop.stopId ? "#92400e" : "var(--color-muted)",
                fontWeight: alertStop === stop.stopId ? 700 : 400,
              }}
            >
              {alertStop === stop.stopId ? "🔔 " : ""}{stop.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stops Timeline */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: 12 }}>
          {t("stops", language)} ({stops.length})
        </div>
        {stops.map((stop, idx) => {
          const isNext = location?.nextStopId === stop.stopId;
          const isPast = location && (location.progressPercent / 100) * stops.length > idx;
          return (
            <div key={stop.stopId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: idx < stops.length - 1 ? "1px solid var(--color-border)" : "none", opacity: isPast && !isNext ? 0.5 : 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: isNext ? "#f97316" : isPast ? "#16a34a" : "#e2e8f0", border: `2px solid ${isNext ? "#f97316" : isPast ? "#16a34a" : "#e2e8f0"}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: isNext ? 700 : 500, color: isNext ? "#f97316" : "var(--color-text)", fontSize: "0.875rem" }}>
                  {stop.name}
                  {isNext && <span style={{ marginLeft: 6, fontSize: "0.75rem", background: "#fff7ed", color: "#f97316", padding: "1px 6px", borderRadius: 4 }}>Next Stop</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {formatDuration(stop.estimatedTimeFromOriginMin)} · {stop.distanceFromOriginKm} km
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={shareJourney} className="btn btn-outline btn-sm">
          <Share2 size={14} /> {t("shareJourney", language)}
        </button>
        <Link href={`/complaints/new?tripId=${tripId}`} className="btn btn-outline btn-sm">
          <AlertTriangle size={14} /> {t("reportProblem", language)}
        </Link>
        <Link href={`/feedback/new?tripId=${tripId}`} className="btn btn-outline btn-sm">
          ⭐ {t("feedback", language)}
        </Link>
      </div>
    </div>
  );
}
