"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  user_name: string | null;
  bus_number: string | null;
  route_number: string | null;
}

export default function AdminComplaintsPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("resolved");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    fetchComplaints();
  }, [user, token]);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("/api/complaints", { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(res.data.complaints ?? []);
    } catch {}
    setLoading(false);
  };

  const resolve = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axios.patch(`/api/complaints/${selected.id}`, { status, adminResponse: response }, { headers: { Authorization: `Bearer ${token}` } });
      setSelected(null);
      await fetchComplaints();
    } catch {}
    setSubmitting(false);
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={20} color="#d97706" /> Complaints Management
      </h1>

      {selected && (
        <div className="card" style={{ marginBottom: "1rem", border: "2px solid #f97316" }}>
          <h3 style={{ margin: "0 0 10px", color: "var(--color-text)" }}>Respond to Complaint</h3>
          <div style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: 8 }}>
            <strong>Category:</strong> {selected.category} · <strong>From:</strong> {selected.user_name ?? "Anonymous"}
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--color-text)", marginBottom: 12, background: "var(--color-surface)", padding: "10px", borderRadius: 8 }}>
            {selected.description}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="resolved">Resolved</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <textarea className="input" style={{ minHeight: 80, resize: "vertical", marginBottom: 10 }} placeholder="Response (optional)..." value={response} onChange={(e) => setResponse(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={resolve} disabled={submitting}><CheckCircle size={14} /> {submitting ? "Saving..." : "Submit Response"}</button>
            <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading...</div> : (
        <div>
          {complaints.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>No complaints yet.</div>}
          {complaints.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>{c.category}</span>
                  <span className={`badge badge-${c.status === "resolved" ? "success" : c.status === "open" ? "error" : "warning"}`}>{c.status}</span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: 4 }}>
                  {c.user_name ?? "Anonymous"} · {c.bus_number ?? "-"} · {new Date(c.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text)", marginBottom: c.admin_response ? 4 : 0 }}>{c.description}</div>
                {c.admin_response && <div style={{ fontSize: "0.8125rem", color: "#15803d", background: "#f0fdf4", padding: "6px 10px", borderRadius: 6, marginTop: 4 }}>Response: {c.admin_response}</div>}
              </div>
              {c.status === "open" && (
                <button onClick={() => { setSelected(c); setResponse(""); setStatus("resolved"); }} className="btn btn-outline btn-sm">Respond</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
