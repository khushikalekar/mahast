"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { formatTime } from "@/lib/utils";
import { Bus, MapPin, Clock, Share2 } from "lucide-react";
import Link from "next/link";

export default function SharePage() {
  const { code } = useParams<{ code: string }>();
  const [share, setShare] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/journey-share?code=${code}`);
        setShare(res.data.share);
      } catch { setError("This share link has expired or is invalid."); }
      setLoading(false);
    };
    fetch();
  }, [code]);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>Loading journey...</div>;
  if (error) return (
    <div style={{ maxWidth: 500, margin: "3rem auto", padding: "1rem", textAlign: "center" }}>
      <Share2 size={48} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
      <h2 style={{ color: "var(--color-text)" }}>Link Expired</h2>
      <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>{error}</p>
      <Link href="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: "1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Share2 size={32} color="#f97316" style={{ margin: "0 auto 8px" }} />
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)" }}>Shared Journey</h1>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>Share code: <strong>{code}</strong></div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Bus size={20} color="#f97316" />
          <div>
            <div style={{ fontWeight: 700, color: "var(--color-text)" }}>{share?.bus_number as string}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{share?.route_name as string}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>FROM</div>
            <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{share?.origin as string}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>TO</div>
            <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{share?.destination as string}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>DEPARTURE</div>
            <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{formatTime(share?.scheduled_departure as string)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>STATUS</div>
            <span className="badge badge-success">{share?.status as string}</span>
          </div>
        </div>
        {!!share?.dest_stop_name && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff7ed", borderRadius: 8 }}>
            <div style={{ fontSize: "0.8125rem", color: "#9a3412", fontWeight: 600 }}>
              <MapPin size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Passenger&apos;s destination: {String(share.dest_stop_name)}
            </div>
          </div>
        )}
        <Link href={`/trip/${String(share?.trip_id ?? "")}`} className="btn btn-primary" style={{ marginTop: 14, width: "100%", justifyContent: "center" }}>
          Track This Bus Live
        </Link>
      </div>
    </div>
  );
}
