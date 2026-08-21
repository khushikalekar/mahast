"use client";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Search, MapPin, Navigation, Star, Clock, Zap, MessageCircle, Shield, ArrowRight, Bus, RefreshCw } from "lucide-react";

const POPULAR_CITIES = ["Ahmednagar", "Pune", "Nashik", "Mumbai", "Shirdi", "Sangamner", "Lonavala"];

const QUICK_ROUTES = [
  { from: "Ahmednagar", to: "Pune", icon: "🚍" },
  { from: "Pune", to: "Nashik", icon: "🚌" },
  { from: "Mumbai", to: "Pune", icon: "🚍" },
  { from: "Ahmednagar", to: "Shirdi", icon: "🛕" },
];

export default function HomePage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);

  const handleFromChange = (v: string) => {
    setFrom(v);
    setFromSuggestions(v.length > 0 ? POPULAR_CITIES.filter((c) => c.toLowerCase().startsWith(v.toLowerCase())) : []);
  };
  const handleToChange = (v: string) => {
    setTo(v);
    setToSuggestions(v.length > 0 ? POPULAR_CITIES.filter((c) => c.toLowerCase().startsWith(v.toLowerCase())) : []);
  };

  const handleSearch = useCallback(() => {
    if (!from || !to) return;
    router.push(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
  }, [from, to, date, router]);

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)", borderRadius: "0 0 24px 24px", padding: "2rem 1.5rem 2.5rem", marginBottom: "1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <Bus size={28} color="white" />
            <h1 style={{ color: "white", margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>
              {t("appName", language)}
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "0.9375rem" }}>
            {t("appTagline", language)}
          </p>
        </div>

        {/* Search Form */}
        <div style={{ background: "white", borderRadius: 16, padding: "1.25rem", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, marginBottom: 12, alignItems: "flex-end" }}>
            {/* From */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("searchFrom", language)}
              </label>
              <div style={{ position: "relative" }}>
                <MapPin size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#f97316" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder={t("searchPlaceholder", language)}
                  value={from}
                  onChange={(e) => handleFromChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && to && handleSearch()}
                />
              </div>
              {fromSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 20 }}>
                  {fromSuggestions.map((s) => (
                    <button key={s} onClick={() => { setFrom(s); setFromSuggestions([]); }} style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap button */}
            <button onClick={handleSwap} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
              <RefreshCw size={15} color="#6b7280" />
            </button>

            {/* To */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("searchTo", language)}
              </label>
              <div style={{ position: "relative" }}>
                <Navigation size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#1e40af" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder={t("searchPlaceholder", language)}
                  value={to}
                  onChange={(e) => handleToChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && from && handleSearch()}
                />
              </div>
              {toSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 20 }}>
                  {toSuggestions.map((s) => (
                    <button key={s} onClick={() => { setTo(s); setToSuggestions([]); }} style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("searchDate", language)}
              </label>
              <input
                type="date"
                className="input"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSearch}
                disabled={!from || !to}
                style={{ whiteSpace: "nowrap" }}
              >
                <Search size={18} />
                {t("searchBuses", language)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { href: "/nearby", icon: <MapPin size={22} color="#f97316" />, label: t("nearbyBuses", language), bg: "#fff7ed" },
          { href: "/live", icon: <Zap size={22} color="#1e40af" />, label: t("liveTracking", language), bg: "#eff6ff" },
          { href: "/favourites", icon: <Star size={22} color="#d97706" />, label: t("favouriteRoutes", language), bg: "#fffbeb" },
          { href: "/ai", icon: <MessageCircle size={22} color="#16a34a" />, label: t("aiAssistant", language), bg: "#f0fdf4" },
        ].map(({ href, icon, label, bg }) => (
          <Link
            key={href}
            href={href}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, borderRadius: 12, padding: "14px 8px", textDecoration: "none", gap: 6, border: "1px solid var(--color-border)" }}
          >
            {icon}
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text)", textAlign: "center", lineHeight: 1.2 }}>
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Popular Routes */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-text)" }}>
          Popular Routes
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {QUICK_ROUTES.map(({ from: f, to: tto, icon }) => (
            <button
              key={`${f}-${tto}`}
              onClick={() => router.push(`/search?from=${encodeURIComponent(f)}&to=${encodeURIComponent(tto)}&date=${date}`)}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: "1px solid var(--color-border)", textAlign: "left", background: "var(--color-surface)" }}
            >
              <span style={{ fontSize: "1.5rem" }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>
                  {f} → {tto}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2 }}>
                  Tap to search today's buses
                </div>
              </div>
              <ArrowRight size={16} color="var(--color-muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* Emergency + Safety */}
      <div className="card" style={{ background: "#fef2f2", border: "1px solid #fecaca", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={20} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: "#dc2626", fontSize: "0.9375rem" }}>
                {t("emergency", language)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#b91c1c" }}>SOS, Report accident, Safety issues</div>
            </div>
          </div>
          <Link
            href="/emergency"
            className="btn btn-danger btn-sm"
          >
            {t("sosButton", language)}
          </Link>
        </div>
      </div>

      {/* AI Assistant Teaser */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#15803d", fontSize: "0.9375rem" }}>
              {t("aiAssistant", language)}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#166534", marginTop: 2 }}>
              Ask me anything about buses, routes, or travel times
            </div>
            <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: 4, fontStyle: "italic" }}>
              "मला अहमदनगरहून पुण्याला जायचं आहे." • "Which bus to Shirdi?"
            </div>
          </div>
          <Link href="/ai" className="btn btn-sm" style={{ background: "#16a34a", color: "white" }}>
            Ask AI
          </Link>
        </div>
      </div>
    </div>
  );
}
