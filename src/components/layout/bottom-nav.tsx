"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MapPin, Heart, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const navItems = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/search", icon: Search, labelKey: "search" },
  { href: "/nearby", icon: MapPin, labelKey: "nearbyBuses" },
  { href: "/favourites", icon: Heart, labelKey: "favouriteRoutes" },
  { href: "/profile", icon: User, labelKey: "profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const lang = useAppStore((s) => s.language);

  return (
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        zIndex: 40,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
      }}
    >
      {navItems.map(({ href, icon: Icon, labelKey }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              textDecoration: "none",
              color: active ? "var(--color-primary)" : "var(--color-muted)",
              gap: 2,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span style={{ fontSize: "0.625rem", fontWeight: active ? 700 : 400 }}>
              {t(labelKey, lang)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
