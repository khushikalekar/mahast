"use client";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { User, Settings, Bell, Globe, Moon, Sun, LogOut, LogIn, Star, Clock, Shield } from "lucide-react";
import Link from "next/link";

const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "mr" as const, label: "मराठी", flag: "🇮🇳" },
  { code: "hi" as const, label: "हिंदी", flag: "🇮🇳" },
];

export default function ProfilePage() {
  const { user, language, darkMode, toggleDarkMode, setLanguage, logout } = useAppStore();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      {/* User Card */}
      <div className="card" style={{ marginBottom: "1rem", textAlign: "center", padding: "1.5rem" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: user ? "#fff7ed" : "var(--color-surface)", border: "3px solid #f97316", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <User size={32} color="#f97316" />
        </div>
        {user ? (
          <>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>{user.name}</h2>
            <div style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: 8 }}>{user.email}</div>
            <span style={{ background: user.role === "admin" ? "#eff6ff" : "#f0fdf4", color: user.role === "admin" ? "#1e40af" : "#15803d", padding: "3px 12px", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 700, textTransform: "capitalize" }}>
              {user.role}
            </span>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>Not Logged In</h2>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Link href="/login" className="btn btn-primary btn-sm">{t("login", language)}</Link>
              <Link href="/register" className="btn btn-outline btn-sm">{t("register", language)}</Link>
            </div>
          </>
        )}
      </div>

      {/* Language */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={16} /> {t("language", language)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "2px solid", borderColor: language === l.code ? "#f97316" : "var(--color-border)", background: language === l.code ? "#fff7ed" : "transparent", cursor: "pointer", fontSize: "0.875rem", fontWeight: language === l.code ? 700 : 400, color: language === l.code ? "#f97316" : "var(--color-text)" }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Settings size={16} /> Appearance
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {darkMode ? <Moon size={18} color="var(--color-primary)" /> : <Sun size={18} color="#d97706" />}
            <span style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>{t("darkMode", language)}</span>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{ width: 44, height: 24, borderRadius: 12, background: darkMode ? "#f97316" : "#e2e8f0", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
          >
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: darkMode ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        {[
          { href: "/favourites", icon: <Star size={16} color="#d97706" />, label: t("favouriteRoutes", language) },
          { href: "/emergency", icon: <Shield size={16} color="#dc2626" />, label: t("emergency", language) },
          ...(user?.role === "admin" ? [{ href: "/admin", icon: <Settings size={16} color="#1e40af" />, label: t("adminDashboard", language) }] : []),
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--color-border)", textDecoration: "none", color: "var(--color-text)" }}>
            {icon}
            <span style={{ fontSize: "0.9rem" }}>{label}</span>
            <span style={{ marginLeft: "auto", color: "var(--color-muted)" }}>›</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      {user && (
        <button className="btn btn-outline" onClick={logout} style={{ width: "100%", color: "#dc2626", borderColor: "#fecaca" }}>
          <LogOut size={16} /> {t("logout", language)}
        </button>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-muted)", fontSize: "0.75rem" }}>
        MahaST v0.1 · Demo Prototype · Not real MSRTC data
      </div>
    </div>
  );
}
