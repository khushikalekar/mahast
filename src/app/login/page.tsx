"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import axios from "axios";
import { Bus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { language, setUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      setUser(res.data.user, res.data.token);
      router.push(res.data.user.role === "admin" ? "/admin" : "/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? msg : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Bus size={28} color="#f97316" />
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
            {t("appName", language)}
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", margin: 0 }}>
            {t("login", language)} to your account
          </p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
              {t("email", language)}
            </label>
            <input
              type="email"
              className="input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 20, position: "relative" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
              {t("password", language)}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Logging in..." : t("login", language)}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            {t("register", language)}
          </Link>
        </div>

        {/* Demo credentials */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px", marginTop: "1.25rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--color-text)" }}>Demo Credentials</div>
          <div style={{ marginBottom: 4 }}>
            <strong>Passenger:</strong> passenger@mahast.demo / passenger123
          </div>
          <div>
            <strong>Admin:</strong> admin@mahast.demo / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
