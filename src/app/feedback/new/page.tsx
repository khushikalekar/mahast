"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import Link from "next/link";

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", padding: 2 }}>
            {star <= value ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackForm() {
  const searchParams = useSearchParams();
  const { language, token, user } = useAppStore();
  const tripId = searchParams.get("tripId") ?? "";
  const [ratings, setRatings] = useState({ overall: 0, cleanliness: 0, punctuality: 0, busCondition: 0, crowding: 0, safety: 0 });
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!user) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ marginBottom: 12 }}>Please log in to submit feedback.</div>
      <Link href="/login" className="btn btn-primary">Log In</Link>
    </div>
  );

  if (!tripId) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>No trip specified. Go to a trip page and tap "Feedback".</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratings.overall === 0) { setError("Please give an overall rating"); return; }
    setLoading(true);
    try {
      await axios.post("/api/feedback", {
        tripId,
        overallRating: ratings.overall,
        cleanlinessRating: ratings.cleanliness || undefined,
        punctualityRating: ratings.punctuality || undefined,
        busConditionRating: ratings.busCondition || undefined,
        crowdingRating: ratings.crowding || undefined,
        safetyRating: ratings.safety || undefined,
        comment: comment || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>⭐</div>
      <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)", marginBottom: 8 }}>Thank you for your feedback!</div>
      <Link href="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ maxWidth: 540, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "1rem" }}>
        ⭐ {t("feedback", language)}
      </h1>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>}

      <StarRating label={`${t("overallRating", language)} *`} value={ratings.overall} onChange={(v) => setRatings((r) => ({ ...r, overall: v }))} />
      <StarRating label={t("cleanliness", language)} value={ratings.cleanliness} onChange={(v) => setRatings((r) => ({ ...r, cleanliness: v }))} />
      <StarRating label={t("punctuality", language)} value={ratings.punctuality} onChange={(v) => setRatings((r) => ({ ...r, punctuality: v }))} />
      <StarRating label={t("busCondition", language)} value={ratings.busCondition} onChange={(v) => setRatings((r) => ({ ...r, busCondition: v }))} />
      <StarRating label={t("crowding", language)} value={ratings.crowding} onChange={(v) => setRatings((r) => ({ ...r, crowding: v }))} />
      <StarRating label={t("safety", language)} value={ratings.safety} onChange={(v) => setRatings((r) => ({ ...r, safety: v }))} />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Additional Comments (optional)</label>
        <textarea
          className="input"
          style={{ minHeight: 100, resize: "vertical" }}
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Submitting..." : t("submitFeedback", language)}
      </button>
    </form>
  );
}

export default function FeedbackNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <FeedbackForm />
    </Suspense>
  );
}
