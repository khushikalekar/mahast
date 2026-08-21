"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

interface FeedbackRecord {
  id: string;
  overall_rating: number;
  cleanliness_rating: number | null;
  punctuality_rating: number | null;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  bus_number: string | null;
  route_number: string | null;
}

function Stars({ n }: { n: number }) {
  return <span>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < n ? "#d97706" : "none"} stroke={i < n ? "#d97706" : "#e2e8f0"} style={{ display: "inline" }} />)}</span>;
}

export default function AdminFeedbackPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    const fetch = async () => {
      try {
        const res = await axios.get("/api/feedback", { headers: { Authorization: `Bearer ${token}` } });
        setFeedback(res.data.feedback ?? []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user, token]);

  if (!user || user.role !== "admin") return null;

  const avg = feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length).toFixed(1) : "–";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Star size={20} color="#d97706" fill="#d97706" /> Passenger Feedback
        </h1>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "4px 14px", borderRadius: 20, fontSize: "0.875rem", fontWeight: 700, color: "#92400e" }}>
          Average: {avg}/5
        </div>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading...</div> : (
        <div>
          {feedback.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>No feedback yet.</div>}
          {feedback.map((f) => (
            <div key={f.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Stars n={f.overall_rating} />
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>{f.overall_rating}/5</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {f.user_name ?? "Anonymous"} · {f.bus_number ?? "–"} · {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
              {(f.cleanliness_rating || f.punctuality_rating) && (
                <div style={{ display: "flex", gap: 12, fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: 6 }}>
                  {f.cleanliness_rating && <span>Cleanliness: {f.cleanliness_rating}/5</span>}
                  {f.punctuality_rating && <span>Punctuality: {f.punctuality_rating}/5</span>}
                </div>
              )}
              {f.comment && <div style={{ fontSize: "0.875rem", color: "var(--color-text)", fontStyle: "italic" }}>"{f.comment}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
