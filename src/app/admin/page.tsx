"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bus, MapPin, AlertTriangle, Star, BarChart2, Settings, Clock, CheckCircle, TrendingDown, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Stats {
  totalBuses: number;
  activeBuses: number;
  onTimeBuses: number;
  delayedBuses: number;
  completedTrips: number;
  openComplaints: number;
  totalFeedback: number;
  avgRating: number;
}

const COLORS = ["#f97316", "#1e40af", "#16a34a", "#dc2626", "#7c3aed", "#d97706"];

const NAV = [
  { href: "/admin", label: "Overview", icon: BarChart2 },
  { href: "/admin/buses", label: "Buses", icon: Bus },
  { href: "/admin/fleet", label: "Live Fleet", icon: MapPin },
  { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/admin/feedback", label: "Feedback", icon: Star },
];

function StatCard({ label, value, icon, bg, color }: { label: string; value: string | number; icon: React.ReactNode; bg: string; color: string }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [routes, setRoutes] = useState<{ route_number: string; name: string; trip_count: number }[]>([]);
  const [complaints, setComplaints] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
        setStats(res.data.stats);
        setRoutes(res.data.popularRoutes ?? []);
        setComplaints(res.data.complaintCategories ?? []);
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, [user, token]);

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: "var(--color-surface)", borderRight: "1px solid var(--color-border)", padding: "1rem 0", flexShrink: 0, display: "none" }} className="md:block">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", textDecoration: "none", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            <Icon size={16} color="var(--color-muted)" /> {label}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: "1.25rem", overflowX: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Admin Dashboard</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {NAV.slice(1).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="btn btn-outline btn-sm">
                <Icon size={14} /> {label}
              </Link>
            ))}
          </div>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>Loading...</div> : (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.25rem" }}>
              <StatCard label="Total Buses" value={stats?.totalBuses ?? 0} icon={<Bus size={22} color="#f97316" />} bg="#fff7ed" color="#c2410c" />
              <StatCard label="Active Buses" value={stats?.activeBuses ?? 0} icon={<CheckCircle size={22} color="#16a34a" />} bg="#f0fdf4" color="#15803d" />
              <StatCard label="On Time" value={stats?.onTimeBuses ?? 0} icon={<Clock size={22} color="#1e40af" />} bg="#eff6ff" color="#1d4ed8" />
              <StatCard label="Delayed" value={stats?.delayedBuses ?? 0} icon={<TrendingDown size={22} color="#dc2626" />} bg="#fef2f2" color="#b91c1c" />
              <StatCard label="Completed Trips" value={stats?.completedTrips ?? 0} icon={<CheckCircle size={22} color="#16a34a" />} bg="#f0fdf4" color="#15803d" />
              <StatCard label="Open Complaints" value={stats?.openComplaints ?? 0} icon={<AlertTriangle size={22} color="#d97706" />} bg="#fffbeb" color="#92400e" />
              <StatCard label="Total Feedback" value={stats?.totalFeedback ?? 0} icon={<Star size={22} color="#d97706" />} bg="#fffbeb" color="#92400e" />
              <StatCard label="Avg Rating" value={`${stats?.avgRating ?? 0}/5`} icon={<Star size={22} color="#d97706" fill="#d97706" />} bg="#fffbeb" color="#92400e" />
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div className="card">
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Most Used Routes</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={routes.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="route_number" fontSize={11} tick={{ fill: "var(--color-muted)" }} />
                    <YAxis fontSize={11} tick={{ fill: "var(--color-muted)" }} />
                    <Tooltip />
                    <Bar dataKey="trip_count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Complaints by Type</h3>
                {complaints.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={complaints} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                        {complaints.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)", fontSize: "0.875rem" }}>
                    No complaints yet
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
