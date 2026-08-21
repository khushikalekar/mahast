"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Bus Breakdown",
  "Excessive Delay",
  "Overcrowding",
  "Dirty Bus",
  "Route Issue",
  "Driver/Conductor Issue",
  "Safety Issue",
  "Other",
];

function ComplaintForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, token, user } = useAppStore();
  const tripId = searchParams.get("tripId") ?? "";
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ marginBottom: 12 }}>Please log in to report a problem.</div>
      <Link href="/login" className="btn btn-primary">Log In</Link>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) { setError("Please fill all fields"); return; }
    setLoading(true);
    try {
      await axios.post("/api/complaints", { category, description, tripId: tripId || undefined }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
      <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)", marginBottom: 8 }}>Report Submitted</div>
      <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>Thank you for your feedback. We'll look into this.</p>
      <Link href="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ maxWidth: 540, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={20} color="#f97316" /> {t("reportProblem", language)}
      </h1>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>}

      {tripId && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.875rem", color: "var(--color-muted)" }}>Reporting for trip: <strong>{tripId.slice(-12)}</strong></div>}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>Category *</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <button type="button" key={cat} onClick={() => setCategory(cat)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid", borderColor: category === cat ? "#f97316" : "var(--color-border)", background: category === cat ? "#fff7ed" : "transparent", color: category === cat ? "#f97316" : "var(--color-muted)", fontSize: "0.8125rem", fontWeight: category === cat ? 700 : 400, cursor: "pointer", textAlign: "left" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Description *</label>
        <textarea
          className="input"
          style={{ minHeight: 120, resize: "vertical" }}
          placeholder="Describe the issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

export default function ComplaintsNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <ComplaintForm />
    </Suspense>
  );
}
