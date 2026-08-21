"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Bus, Plus, Pencil, Trash2, X } from "lucide-react";

interface BusRecord { id: string; bus_number: string; registration_number: string; bus_type: string; capacity: number; status: string; }

export default function AdminBusesPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBus, setEditBus] = useState<BusRecord | null>(null);
  const [form, setForm] = useState({ busNumber: "", registrationNumber: "", busType: "ordinary", capacity: "52" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    fetchBuses();
  }, [user, token]);

  const fetchBuses = async () => {
    try {
      const res = await axios.get("/api/admin/buses", { headers: { Authorization: `Bearer ${token}` } });
      setBuses(res.data.buses ?? []);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editBus) {
        await axios.patch(`/api/admin/buses/${editBus.id}`, { busType: form.busType, capacity: parseInt(form.capacity) }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("/api/admin/buses", { ...form, capacity: parseInt(form.capacity) }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowForm(false);
      setEditBus(null);
      setForm({ busNumber: "", registrationNumber: "", busType: "ordinary", capacity: "52" });
      await fetchBuses();
    } catch {}
    setSubmitting(false);
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this bus?")) return;
    try {
      await axios.delete(`/api/admin/buses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBuses();
    } catch {}
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Bus size={20} color="#f97316" /> Bus Management
        </h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditBus(null); setForm({ busNumber: "", registrationNumber: "", busType: "ordinary", capacity: "52" }); }}>
          <Plus size={14} /> Add Bus
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: "var(--color-text)" }}>{editBus ? "Edit Bus" : "Add New Bus"}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
              {!editBus && <>
                <div><label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Bus Number</label><input className="input" value={form.busNumber} onChange={(e) => setForm((f) => ({ ...f, busNumber: e.target.value }))} required /></div>
                <div><label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Registration</label><input className="input" value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} required /></div>
              </>}
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                <select className="input" value={form.busType} onChange={(e) => setForm((f) => ({ ...f, busType: e.target.value }))}>
                  <option value="ordinary">Ordinary</option>
                  <option value="semi_luxury">Semi-Luxury</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div><label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Capacity</label><input type="number" className="input" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} min={1} max={100} required /></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : editBus ? "Update Bus" : "Add Bus"}</button>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>Loading...</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface)" }}>
                {["Bus Number", "Registration", "Type", "Capacity", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr key={bus.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--color-text)", fontSize: "0.875rem" }}>{bus.bus_number}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-muted)", fontSize: "0.875rem" }}>{bus.registration_number}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, background: bus.bus_type === "luxury" ? "#fffbeb" : bus.bus_type === "semi_luxury" ? "#f5f3ff" : "#f1f5f9", color: bus.bus_type === "luxury" ? "#92400e" : bus.bus_type === "semi_luxury" ? "#6d28d9" : "#475569", padding: "2px 8px", borderRadius: 4 }}>
                      {bus.bus_type.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--color-text)", fontSize: "0.875rem" }}>{bus.capacity}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className={`badge badge-${bus.status === "active" ? "success" : "neutral"}`}>{bus.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditBus(bus); setForm({ busNumber: bus.bus_number, registrationNumber: bus.registration_number, busType: bus.bus_type, capacity: String(bus.capacity) }); setShowForm(true); }} className="btn btn-outline btn-sm"><Pencil size={12} /></button>
                      <button onClick={() => deactivate(bus.id)} className="btn btn-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
