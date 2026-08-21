"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Heart, Bus, MapPin, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Favourite {
  id: string;
  type: string;
  reference_id: string;
  label: string | null;
  created_at: string;
}

export default function FavouritesPage() {
  const { language, token, user } = useAppStore();
  const [favs, setFavs] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavs = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get("/api/favourites", { headers: { Authorization: `Bearer ${token}` } });
      setFavs(res.data.favourites ?? []);
    } catch { setFavs([]); }
    setLoading(false);
  };

  const removeFav = async (fav: Favourite) => {
    try {
      await axios.delete(`/api/favourites?type=${fav.type}&referenceId=${fav.reference_id}`, { headers: { Authorization: `Bearer ${token}` } });
      setFavs((prev) => prev.filter((f) => f.id !== fav.id));
    } catch {}
  };

  useEffect(() => { fetchFavs(); }, [token]);

  if (!user) return (
    <div style={{ maxWidth: 500, margin: "3rem auto", padding: "1rem", textAlign: "center" }}>
      <Heart size={48} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
      <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)", marginBottom: 8 }}>Please log in</div>
      <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>Log in to save your favourite routes and buses.</p>
      <Link href="/login" className="btn btn-primary">Log In</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <Heart size={20} color="#d97706" fill="#d97706" /> {t("favouriteRoutes", language)}
      </h1>

      {loading && <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading...</div>}

      {!loading && favs.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Heart size={48} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>{t("noFavourites", language)}</div>
          <div style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: 16 }}>
            Search for buses and tap the ★ icon to add to favourites
          </div>
          <Link href="/search" className="btn btn-primary">Search Buses</Link>
        </div>
      )}

      {!loading && favs.map((fav) => (
        <div key={fav.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: fav.type === "route" ? "#fff7ed" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {fav.type === "route" ? <ArrowRight size={20} color="#f97316" /> : <Bus size={20} color="#1e40af" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text)" }}>
              {fav.label ?? fav.reference_id}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2, textTransform: "capitalize" }}>
              {fav.type}
            </div>
          </div>
          {fav.type === "trip" && (
            <Link href={`/trip/${fav.reference_id}`} className="btn btn-primary btn-sm">Track</Link>
          )}
          <button onClick={() => removeFav(fav)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-muted)" }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
