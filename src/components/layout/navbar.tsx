"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Bus, Bell, Moon, Sun, Globe, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  { code: "en" as const, label: "English" },
  { code: "mr" as const, label: "मराठी" },
  { code: "hi" as const, label: "हिंदी" },
];

export function Navbar() {
  const { user, language, darkMode, notifications, unreadCount, toggleDarkMode, setLanguage, logout, markAllRead } = useAppStore();
  const [showLang, setShowLang] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--color-primary)",
        borderBottom: "1px solid var(--color-primary-dark)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "white", textDecoration: "none" }}>
          <Bus size={22} />
          <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.5px" }}>
            {t("appName", language)}
          </span>
          <span style={{ fontSize: "0.7rem", opacity: 0.85, display: "none" }} className="md:inline">
            {t("appTagline", language)}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Language Picker */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowLang(!showLang); setShowNotif(false); }}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, color: "white", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8125rem" }}
            >
              <Globe size={16} />
              <span className="hidden md:inline">{LANGUAGES.find((l) => l.code === language)?.label}</span>
            </button>
            {showLang && (
              <div style={{ position: "absolute", top: "100%", right: 0, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", minWidth: 130, zIndex: 100 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setShowLang(false); }}
                    style={{ display: "block", width: "100%", padding: "8px 14px", background: language === l.code ? "var(--color-surface)" : "transparent", border: "none", cursor: "pointer", color: "var(--color-text)", textAlign: "left", fontSize: "0.875rem", fontWeight: language === l.code ? 600 : 400 }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode */}
          <button onClick={toggleDarkMode} style={{ padding: "6px 10px", borderRadius: 6, color: "white", background: "transparent", border: "none", cursor: "pointer" }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowNotif(!showNotif); if (unreadCount > 0) markAllRead(); }}
                style={{ padding: "6px 10px", borderRadius: 6, color: "white", background: "transparent", border: "none", cursor: "pointer", position: "relative" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 6, background: "#ef4444", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div style={{ position: "absolute", top: "100%", right: 0, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", width: 300, maxHeight: 350, overflowY: "auto", zIndex: 100 }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>
                    {t("notifications", language)}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--color-muted)", fontSize: "0.875rem" }}>No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", background: n.isRead ? "transparent" : "var(--color-surface)" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text)" }}>{n.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin link */}
          {user?.role === "admin" && (
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, color: "white", textDecoration: "none", fontSize: "0.8125rem" }}>
              <ShieldCheck size={16} />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          {/* Auth */}
          {user ? (
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, color: "white", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: "0.8125rem" }}>
              <LogOut size={16} />
              <span className="hidden md:inline">{t("logout", language)}</span>
            </button>
          ) : (
            <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, color: "white", background: "rgba(255,255,255,0.2)", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
              <LogIn size={16} />
              <span>{t("login", language)}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
