"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { formatTime, formatDuration, getBusTypeLabel, getStatusLabel } from "@/lib/utils";
import { Search, Filter, Clock, Star, Zap, MapPin, ChevronRight, Bus, AlertCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface BusResult {
  tripId: string;
  busId: string;
  busNumber: string;
  busType: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  durationMin: number;
  status: string;
  delayMinutes: number;
  fare: number;
  capacity: number;
}

function StatusBadge({ status, delay }: { status: string; delay: number }) {
  const label = delay > 0 ? `Delayed ${delay}m` : getStatusLabel(status);
  const cls = delay > 0 ? "badge badge-warning" : status === "in_progress" ? "badge badge-success" : "badge badge-neutral";
  return <span className={cls}>{label}</span>;
}

function BusCard({ bus, lang, isFav, onFav }: { bus: BusResult; lang: string; isFav: boolean; onFav: () => void }) {
  const dep = formatTime(bus.scheduledDeparture);
  const arr = formatTime(new Date(new Date(bus.scheduledArrival).getTime() + bus.delayMinutes * 60000).toISOString());
  const dur = formatDuration(bus.durationMin);
  const typeColors: Record<string, string> = { ordinary: "#64748b", semi_luxury: "#7c3aed", luxury: "#b45309" };

  return (
    <div className="card" style={{ marginBottom: 10, transition: "box-shadow 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bus size={20} color="#f97316" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
              {bus.busNumber}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: typeColors[bus.busType] ?? "#64748b", background: "#f1f5f9", padding: "1px 7px", borderRadius: 4 }}>
                {getBusTypeLabel(bus.busType)}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{bus.routeNumber}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={bus.status} delay={bus.delayMinutes} />
          <button onClick={onFav} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Star size={18} fill={isFav ? "#d97706" : "none"} stroke={isFav ? "#d97706" : "var(--color-muted)"} />
          </button>
        </div>
      </div>

      {/* Times */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)" }}>{dep}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{bus.origin}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: 4 }}>{dur}</div>
          <div style={{ height: 2, background: "#e2e8f0", width: "100%", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--color-bg)", padding: "0 4px" }}>
              <ChevronRight size={12} color="var(--color-muted)" />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)" }}>{arr}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{bus.destination}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#16a34a" }}>
          ₹{bus.fare}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/trip/${bus.tripId}`}
            className="btn btn-outline btn-sm"
          >
            Details
          </Link>
          <Link
            href={`/live/${bus.tripId}`}
            className="btn btn-primary btn-sm"
          >
            <Zap size={14} /> Track
          </Link>
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, token, addNotification } = useAppStore();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? new Date().toISOString().split("T")[0]);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"departure" | "fare" | "duration">("departure");
  const [buses, setBuses] = useState<BusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  const doSearch = async () => {
    if (!from || !to) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ from, to, date });
      if (filterType !== "all") params.set("type", filterType);
      const res = await axios.get(`/api/buses/search?${params}`);
      setBuses(res.data.buses ?? []);
    } catch {
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (from && to) doSearch();
  }, []);

  const sorted = [...buses].sort((a, b) => {
    if (sortBy === "fare") return a.fare - b.fare;
    if (sortBy === "duration") return a.durationMin - b.durationMin;
    return new Date(a.scheduledDeparture).getTime() - new Date(b.scheduledDeparture).getTime();
  });

  const toggleFav = (tripId: string) => {
    const next = new Set(favourites);
    if (next.has(tripId)) next.delete(tripId);
    else next.add(tripId);
    setFavourites(next);
    addNotification({ id: Date.now().toString(), type: "info", title: next.has(tripId) ? "Added to favourites" : "Removed from favourites", message: `Trip ${tripId.slice(-8)}`, isRead: false, createdAt: new Date().toISOString() });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1rem" }}>
      {/* Search bar */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>FROM</label>
            <input className="input" placeholder="Origin city" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>TO</label>
            <input className="input" placeholder="Destination city" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={doSearch} disabled={!from || !to}>
            <Search size={16} /> {t("searchBuses", language)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All Buses" },
          { key: "ordinary", label: t("ordinary", language) },
          { key: "semi_luxury", label: t("semiLuxury", language) },
          { key: "luxury", label: t("luxury", language) },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid", borderColor: filterType === key ? "var(--color-primary)" : "var(--color-border)", background: filterType === key ? "#fff7ed" : "transparent", color: filterType === key ? "var(--color-primary)" : "var(--color-muted)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {(["departure", "fare", "duration"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{ padding: "5px 12px", borderRadius: 20, border: "1.5px solid", borderColor: sortBy === s ? "#1e40af" : "var(--color-border)", background: sortBy === s ? "#eff6ff" : "transparent", color: sortBy === s ? "#1e40af" : "var(--color-muted)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
            >
              {s === "departure" ? "Time" : s === "fare" ? t("cheapest", language) : t("fastest", language)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          {t("loading", language)}
        </div>
      )}

      {!loading && searched && sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Bus size={48} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>{t("noResults", language)}</div>
          <div style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>
            Try different cities or a different date. Available routes: Ahmednagar↔Pune, Pune↔Nashik, Mumbai→Pune, Ahmednagar→Shirdi
          </div>
        </div>
      )}

      {!loading && sorted.map((bus) => (
        <BusCard
          key={bus.tripId}
          bus={bus}
          lang={language}
          isFav={favourites.has(bus.tripId)}
          onFav={() => toggleFav(bus.tripId)}
        />
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
